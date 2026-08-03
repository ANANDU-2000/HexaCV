/**
 * Runtime error reporting — appends errors to the `runtime-errors/` folder so
 * they can be reviewed and fixed manually. Writing must never throw or break the app.
 *
 * Layout:
 *   runtime-errors/server/<YYYY-MM-DD>.jsonl   — server-side errors (Express, tRPC, process)
 *   runtime-errors/client/<YYYY-MM-DD>.jsonl   — client errors reported via /api/runtime-error
 */
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ERRORS_DIR = path.join(ROOT, "runtime-errors");

function todayStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type ErrorEntry = {
  kind: "server" | "client";
  at: string;
  message: string;
  stack?: string;
  url?: string;
  method?: string;
  path?: string;
  userAgent?: string;
  userId?: number | string | null;
  extra?: unknown;
};

async function writeEntry(entry: ErrorEntry): Promise<void> {
  try {
    const dir = path.join(ERRORS_DIR, entry.kind);
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, `${todayStamp()}.jsonl`);
    await appendFile(file, JSON.stringify(entry) + "\n", "utf8");
  } catch (err) {
    console.warn("[errorReporter] failed to write error log:", err);
  }
}

export function reportServerError(input: {
  message: string;
  stack?: string;
  method?: string;
  path?: string;
  userId?: number | string | null;
  extra?: unknown;
}): void {
  void writeEntry({
    kind: "server",
    at: new Date().toISOString(),
    message: input.message || "Unknown server error",
    stack: input.stack,
    method: input.method,
    path: input.path,
    userId: input.userId ?? null,
    extra: input.extra,
  });
}

export function reportClientError(input: {
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
}): void {
  void writeEntry({
    kind: "client",
    at: new Date().toISOString(),
    message: input.message || "Unknown client error",
    stack: input.stack,
    url: input.url,
    userAgent: input.userAgent,
  });
}
