/**
 * Build-time SSG: render marketing routes into dist/public/<route>/index.html
 * and write sitemap.xml. Run after `vite build`.
 *
 * Full SSR is intentionally not used — this is static snapshots only.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "vite";
import react from "@vitejs/plugin-react";
import { getAllResumeExampleRoutes } from "../client/src/lib/resumeExamples.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST_PUBLIC = path.join(ROOT, "dist", "public");
const SSR_OUT = path.join(ROOT, "dist", "ssr");
const SITE = "https://hexacv.hexastacksolutions.com";

const STATIC_ROUTES: Array<{ path: string; title: string; description: string }> = [
  {
    path: "/",
    title: "HexaCv — Grounded Resume AI for Gulf & India Jobs | Honest ATS Format",
    description:
      "Resume builder for UAE, Saudi, and India roles that rewrites from your real experience — no invented metrics. ATS-friendly PDFs with fact-traceable AI.",
  },
  {
    path: "/pricing",
    title: "Pricing — HexaCv",
    description: "Free, Pro, and Enterprise plans for grounded resume AI built for Gulf and India hiring.",
  },
  {
    path: "/terms",
    title: "Terms of Service — HexaCv",
    description: "HexaCv terms of service.",
  },
  {
    path: "/privacy",
    title: "Privacy Policy — HexaCv",
    description: "How HexaCv handles your resume data and account information.",
  },
  {
    path: "/refund",
    title: "Refund Policy — HexaCv",
    description: "HexaCv refund policy.",
  },
  {
    path: "/cookies",
    title: "Cookie Policy — HexaCv",
    description: "HexaCv cookie policy.",
  },
];

function exampleMeta(country: string, role: string) {
  const prettyRole = role
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const countryNames: Record<string, string> = {
    ae: "UAE",
    sa: "Saudi Arabia",
    in: "India",
  };
  const cName = countryNames[country] || country.toUpperCase();
  return {
    path: `/resume-examples/${country}/${role}`,
    title: `${prettyRole} Resume Example for ${cName} — HexaCv`,
    description: `ATS notes and grounded resume examples for ${prettyRole} roles in ${cName}. Build from your real experience with HexaCv.`,
  };
}

async function buildSsrBundle() {
  await build({
    configFile: false,
    root: path.join(ROOT, "client"),
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.join(ROOT, "client", "src"),
        "@shared": path.join(ROOT, "shared"),
        "@assets": path.join(ROOT, "attached_assets"),
      },
    },
    build: {
      ssr: path.join(ROOT, "client", "src", "prerender-entry.tsx"),
      outDir: SSR_OUT,
      emptyOutDir: true,
      rollupOptions: {
        output: {
          entryFileNames: "prerender-entry.js",
          format: "esm",
        },
      },
    },
    logLevel: "warn",
  });
}

function injectHtml(
  template: string,
  opts: { body: string; title: string; description: string; canonical: string }
) {
  let html = template;
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(opts.title)}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${escapeAttr(opts.description)}" />`
  );
  html = html.replace(
    /<meta name="title" content="[^"]*"\s*\/?>/i,
    `<meta name="title" content="${escapeAttr(opts.title)}" />`
  );
  html = html.replace(
    /<link rel="canonical" href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${escapeAttr(opts.canonical)}" />`
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${escapeAttr(opts.canonical)}" />`
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${escapeAttr(opts.title)}" />`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${escapeAttr(opts.description)}" />`
  );
  // Inject SSR body into #root (SPA will hydrate over it)
  if (html.includes('<div id="root"></div>')) {
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root">${opts.body}</div>`
    );
  } else if (html.includes('<div id="root">')) {
    html = html.replace(
      /<div id="root">[\s\S]*?<\/div>/,
      `<div id="root">${opts.body}</div>`
    );
  }
  return html;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(s: string) {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

function writeRouteHtml(routePath: string, html: string) {
  const clean = routePath === "/" ? "" : routePath.replace(/^\//, "");
  const dir = clean ? path.join(DIST_PUBLIC, clean) : DIST_PUBLIC;
  fs.mkdirSync(dir, { recursive: true });
  // For "/", overwrite the SPA index; for nested routes write nested index.html
  const file = path.join(dir, "index.html");
  fs.writeFileSync(file, html, "utf-8");
  console.log(`  prerendered ${routePath} → ${path.relative(ROOT, file)}`);
}

function writeSitemap(paths: string[]) {
  const urls = paths
    .map(
      (p) => `  <url>
    <loc>${SITE}${p === "/" ? "/" : p}</loc>
    <changefreq>weekly</changefreq>
  </url>`
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  fs.writeFileSync(path.join(DIST_PUBLIC, "sitemap.xml"), xml, "utf-8");
  console.log("  wrote sitemap.xml");
}

async function main() {
  if (!fs.existsSync(path.join(DIST_PUBLIC, "index.html"))) {
    console.error("dist/public/index.html missing — run vite build first");
    process.exit(1);
  }

  console.log("[prerender] building SSR bundle…");
  await buildSsrBundle();

  const entryPath = path.join(SSR_OUT, "prerender-entry.js");
  const mod = await import(pathToFileURL(entryPath).href);
  const render = mod.render as (url: string) => string;

  const template = fs.readFileSync(path.join(DIST_PUBLIC, "index.html"), "utf-8");

  const exampleRoutes = getAllResumeExampleRoutes().map((r) =>
    exampleMeta(r.country, r.role)
  );
  const allRoutes = [...STATIC_ROUTES, ...exampleRoutes];

  console.log(`[prerender] rendering ${allRoutes.length} routes…`);
  for (const route of allRoutes) {
    let body = "";
    try {
      body = render(route.path);
    } catch (err) {
      console.warn(`  warn: SSR failed for ${route.path}, writing meta-only shell`, err);
      body = `<main><h1>${escapeHtml(route.title)}</h1><p>${escapeHtml(route.description)}</p></main>`;
    }
    const canonical = `${SITE}${route.path === "/" ? "/" : route.path}`;
    const html = injectHtml(template, {
      body,
      title: route.title,
      description: route.description,
      canonical,
    });
    writeRouteHtml(route.path, html);
  }

  writeSitemap(allRoutes.map((r) => r.path));
  console.log("[prerender] done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
