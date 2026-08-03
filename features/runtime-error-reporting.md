# Runtime Error Reporting

> The app automatically captures run-time errors (server + browser) and saves them to a
> dedicated folder — **`runtime-errors/`** — so issues are easy to find and fix manually.

**Status:** New (this cycle).

## Folder layout

```
runtime-errors/
  README.md                    ← how to use it (committed)
  server/<YYYY-MM-DD>.jsonl    ← server-side errors (git-ignored)
  client/<YYYY-MM-DD>.jsonl    ← browser errors (git-ignored)
```

Each `.jsonl` line is one error as JSON:
`{ kind, at, message, stack, url?, method?, path?, userId?, userAgent?, extra? }`.

## What is captured

| Source | Where captured | How |
|--------|----------------|-----|
| **Server** | `server/_core/errorReporter.ts` | Express error middleware (final handler) · tRPC `onError` (only `INTERNAL_SERVER_ERROR` / `PARSE_ERROR` / unknown — not 4xx noise) · `process.on("uncaughtException")` and `"unhandledRejection"` |
| **Client** | `client/src/lib/runtimeErrorReporter.ts` + `main.tsx` | `window.onerror` and `unhandledrejection` → `POST /api/runtime-error` (fire-and-forget, `keepalive`) → server writes the file |

## Why it's reliable

- Reporting is **fire-and-forget** and wrapped in try/catch — it can never break the app.
- Expected errors (validation, auth) are intentionally **not** logged; only real failures.
- Timestamps + stack + route/user context make each entry self-contained for manual fixes.

## How to use it

1. Reproduce the bug while the app runs.
2. Open `runtime-errors/server/<date>.jsonl` (or `client/…`) — newest entries at the end.
3. Each line tells you the message, stack, route (`path`/`url`), and user, so you can
   jump straight to the fault.
4. Fix and re-run; new errors append to the same day's file.

## Files
| Concern | File |
|---------|------|
| Server reporter + write logic | `server/_core/errorReporter.ts` |
| Hooks (Express / tRPC / process) | `server/_core/app.ts`, `server/_core/index.ts` |
| Client reporter + endpoint | `client/src/lib/runtimeErrorReporter.ts`, `server/_core/app.ts` (`POST /api/runtime-error`) |
| Docs + gitignore | `runtime-errors/README.md`, `.gitignore` |

## Notes
- Log files are git-ignored; only `runtime-errors/README.md` is committed.
- On serverless hosts (Vercel) filesystem writes may not persist — intended for local /
  long-running deploys.
