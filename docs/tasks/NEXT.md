# Next coding task after G1–G3 + F5

G1–G3 legal placeholder pages, Pricing page, footer/billing legal links, F5 admin refund, and G2 evaluation opt-out are done.

**Ops:** Before live charges, set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` on the host (never commit). Webhook: `/api/webhooks/razorpay`. Apply SQL migrations including `drizzle/g2_evaluation_opt_out.sql` if not already applied.

**Do not start Clerk.** Still no Polish stage.

## Next — R1 referral model decision (human) or H/R2 gate

Not a coding task until you pick referral model:
- (a) reward on friend's **signup** + 24h + one resume action, or
- (b) reward on friend's **payment** + same anti-abuse gate

Then paste **R2** from [`TASK_PROMPTS.md`](./TASK_PROMPTS.md).

**Deferred (do not skip ahead without updating this file):** I marketing/blog, D Clerk, K QA matrix, Polish AI stage, G4 Razorpay KYC paperwork (human — live `/terms` `/privacy` `/refund` URLs).

Living checklist: [`BACKLOG_CHECKLIST.md`](./BACKLOG_CHECKLIST.md).
