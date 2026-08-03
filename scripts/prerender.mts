/**
 * Prerender (SSG) — renders the marketing routes to static HTML in dist/public.
 *
 * Loads the app through Vite's SSR module loader (`ssrLoadModule`) so JSX, the
 * `@/` alias, and `import.meta.env` are handled exactly like in the client build.
 * Each route is rendered via `client/src/prerender-entry.tsx` (wouter ssrPath +
 * stubbed tRPC, no network), injected into `<div id="root">` of the built
 * `index.html`, with per-page title/description/canonical overrides.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import {
  getAllResumeExampleRoutes,
  getResumeExample,
} from "../client/src/lib/resumeExamples";

const SITE_URL = "https://hexacv.hexastacksolutions.com";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist", "public");

const ROOT_MARKER = '<div id="root"></div>';

interface RouteSpec {
  path: string;
  title?: string;
  description?: string;
}

/** Static marketing routes (auth/app routes are excluded — no SEO value, client-only). */
const STATIC_ROUTES: RouteSpec[] = [
  { path: "/" },
  {
    path: "/pricing",
    title: "Pricing — ₹99 per resume build, first free | HexaCv",
    description:
      "HexaCv pricing: your first resume build is free, then ₹99 per resume. Bundles from ₹249. No subscription.",
  },
  { path: "/terms", title: "Terms of Service | HexaCv" },
  { path: "/privacy", title: "Privacy Policy | HexaCv" },
  { path: "/refund", title: "Refund Policy | HexaCv" },
  { path: "/cookies", title: "Cookie Policy | HexaCv" },
];

function buildRouteList(): RouteSpec[] {
  const routes = [...STATIC_ROUTES];
  for (const r of getAllResumeExampleRoutes()) {
    const example = getResumeExample(r.country, r.role);
    if (!example) continue;
    routes.push({
      path: r.path,
      title: `${example.job.title} resume for ${example.countryName} | HexaCv`,
      description: `ATS-friendly ${example.job.title} resume example for ${example.countryName} — grounded rewrites from your real experience, no invented metrics. Build yours free.`,
    });
  }
  return routes;
}

/** Replace per-page title/description/canonical in the template. */
function injectMeta(
  template: string,
  { title, description, path: routePath }: RouteSpec
): string {
  let page = template;
  if (title) {
    page = page.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
    page = page.replace(
      /<meta name="title" content="[^"]*" \/>/,
      `<meta name="title" content="${title}" />`
    );
    page = page.replace(
      /<meta property="og:title" content="[^"]*" \/>/,
      `<meta property="og:title" content="${title}" />`
    );
  }
  if (description) {
    page = page.replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${description}" />`
    );
    page = page.replace(
      /<meta property="og:description" content="[^"]*" \/>/,
      `<meta property="og:description" content="${description}" />`
    );
  }
  if (routePath && routePath !== "/") {
    page = page.replace(
      /<link rel="canonical" href="[^"]*" \/>/,
      `<link rel="canonical" href="${SITE_URL}${routePath}" />`
    );
  }
  return page;
}

function outFileName(routePath: string): string {
  if (routePath === "/") return "index.html";
  return `${routePath.replace(/^\//, "").replace(/\//g, "__")}.html`;
}

async function main(): Promise<void> {
  await mkdir(DIST, { recursive: true });
  const template = await readFile(path.join(DIST, "index.html"), "utf8");

  // Load the app through Vite so JSX, aliases, and import.meta.env are handled.
  const server = await createServer({
    root: ROOT,
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: "error",
  });
  try {
    const { render } = (await server.ssrLoadModule(
      "/client/src/prerender-entry.tsx"
    )) as { render: (url: string) => string };

    const routes = buildRouteList();
    for (const route of routes) {
      const html = render(route.path);
      let page = template.replace(ROOT_MARKER, `<div id="root">${html}</div>`);
      page = injectMeta(page, route);
      const out = outFileName(route.path);
      await writeFile(path.join(DIST, out), page);
      console.log(`[prerender] ${route.path} -> ${out} (${page.length} bytes)`);
    }
    console.log(`[prerender] done — ${routes.length} pages`);
  } finally {
    await server.close();
  }
}

main().catch((err) => {
  console.error("[prerender] failed:", err);
  process.exit(1);
});
