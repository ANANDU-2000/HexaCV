# Next coding task after config stack

Config / GitHub / Vercel checklist is done. **Do not start Clerk or Razorpay code migration yet.**

Next ordered product task from [`TASK_PROMPTS.md`](./TASK_PROMPTS.md):

## A2 — Usage logging

- Create `server/usageTracker.ts`
- Add `usage_logs` table in `drizzle/schema.ts`
- Call tracker from `server/aiSuggestions.ts` after each provider call

Paste the **A2** block from `TASK_PROMPTS.md` into a fresh Cursor chat.
