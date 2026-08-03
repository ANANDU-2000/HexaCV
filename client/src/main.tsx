import { trpc } from "./lib/trpc";
import { UNAUTHED_ERR_MSG } from "../../shared/const";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import { purgeLegacyMockUsers } from "./lib/localStorageDb";
import "./index.css";

if (typeof window !== "undefined") {
  purgeLegacyMockUsers();
}

// Register Service Worker for PWA support on all pages in production, or unregister in dev to prevent cache issues
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((success) => {
          if (success) {
            console.log("Unregistered stale service worker in development:", registration.scope);
          }
        });
      }
      if (typeof caches !== "undefined") {
        caches.keys().then((keys) => {
          keys.forEach((key) => caches.delete(key));
        });
      }
    });
  } else {
    const registerSW = () => {
      navigator.serviceWorker
        .register("/service-worker.js", { scope: "/" })
        .then((registration) => {
          console.log("PWA Service Worker registered successfully:", registration.scope);
        })
        .catch((error) => {
          console.error("PWA Service Worker registration failed:", error);
        });
    };

    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
    }
  }
}


// Dynamic analytics loader
const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
const analyticsWebsiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;
if (analyticsEndpoint && analyticsWebsiteId) {
  const script = document.createElement("script");
  script.defer = true;
  script.src = `${analyticsEndpoint}/umami`;
  script.setAttribute("data-website-id", analyticsWebsiteId);
  document.head.appendChild(script);
}

const queryClient = new QueryClient();

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    const msg = (error as any)?.message || "";
    if (msg.includes("Failed to fetch") || msg === UNAUTHED_ERR_MSG) {
      console.warn("[API Query Warning]", msg);
    } else {
      console.error("[API Query Error]", error);
    }
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    const msg = (error as any)?.message || "";
    if (msg.includes("Failed to fetch") || msg === UNAUTHED_ERR_MSG) {
      console.warn("[API Mutation Warning]", msg);
    } else {
      console.error("[API Mutation Error]", error);
    }
  }
});

const apiBase = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "";
const trpcUrl = apiBase ? `${apiBase}/api/trpc` : "/api/trpc";

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: trpcUrl,
      transformer: superjson,
      headers() {
        const isLoggedOut = localStorage.getItem("hexacv_logged_out") === "true";
        if (isLoggedOut) {
          return { "x-local-user-logout": "true" };
        }
        let openId = "";
        try {
          const raw = localStorage.getItem("hexacv_current_user");
          if (raw) {
            const parsed = JSON.parse(raw);
            openId = parsed?.openId || "";
          }
        } catch (e) {}
        return openId ? { "x-local-user-openid": openId } : {};
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
