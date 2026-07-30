/**
 * Vercel serverless entry — Express API only.
 * Static SPA is served from `dist/public` via vercel.json outputDirectory.
 *
 * Project: prj_ZLUzdW0OdMAQt8iXFBQ7jbPmmwCY · domain hexacv.online
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createApp } from "../server/_core/app";

const app = createApp({ serveClient: false });

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as any, res as any);
}
