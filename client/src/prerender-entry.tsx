/**
 * Build-time prerender entry — marketing routes only.
 * Renders App behind wouter SSR path + stubbed tRPC (no network).
 */
import React from "react";
import { renderToString } from "react-dom/server";
import { Router } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";
import App from "./App";

function ensureLocalStorageStub() {
  if (typeof globalThis.localStorage !== "undefined") return;
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size;
    },
  };
}

export function render(url: string): string {
  ensureLocalStorageStub();

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });

  // Stub link: never hits the network during SSG
  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: "http://ssg.invalid/api/trpc",
        transformer: superjson,
        fetch: async () =>
          new Response(JSON.stringify([{ result: { data: { json: null } } }]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      }),
    ],
  });

  const path = url.split("?")[0] || "/";

  return renderToString(
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Router ssrPath={path}>
          <App />
        </Router>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
