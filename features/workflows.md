# End-to-End Workflows

Complete user journeys through HexaCV. Each workflow links to the feature files that
implement it. Status reflects the current implementation.

---

## Flow A — The "Ghosted" Job Seeker (New User)

**Goal:** convert an uploaded resume into an ATS-ready, target-tailored resume and pay for it.

```mermaid
flowchart TD
    A[Landing page: Stop being ghosted] --> B{Entry method}
    B -->|Upload Existing PDF/Word| C[ParseLoader extraction window<br/>5 animated steps]
    B -->|Start fresh / Paste text| P[Paste experience<br/>floating-label box]
    B -->|Import from LinkedIn| L[Flow B]
    C --> D[Draft saved<br/>sessionStorage]
    P --> D
    D --> E[/builder/target<br/>Who are you applying to?/]
    E --> F[Pick region: India / Gulf]
    F --> G[Enter target role + optional JD]
    G --> H{Authenticated?}
    H -->|Guest| I[Sign in to build → login<br/>redirects back]
    I --> H
    H -->|Signed in, credit| J[Build my resume — free]
    H -->|Signed in, no credit| K[Confirm & Pay screen<br/>₹99 · trust signals]
    K --> K2[Razorpay checkout]
    K2 --> J
    J --> M[AI pipeline loader<br/>extract→target→rewrite→validate→polish]
    M --> N[/builder/ai/ editor split-screen/]
    N --> O[Contextual editor<br/>click preview section]
    O --> Q[Review & Export]
    Q --> R[Download PDF + Word]
```

**Steps**
1. **Landing** — pain-point headline, real resume preview, entry cards
   ([landing.md](landing.md)).
2. **Upload** → **ParseLoader** extraction window (min ~1.6s, 5 steps), draft saved to
   sessionStorage ([upload-and-extraction.md](upload-and-extraction.md)).
3. **Target** — region, target role (suggestions), optional JD
   ([targeting.md](targeting.md)).
4. **Sign in at the build step** — guests are routed to login; sign-in returns to
   targeting ([auth-and-guest.md](auth-and-guest.md)).
5. **Pay** — free first build (credit) or **Confirm & Pay** ₹99 via Razorpay
   ([billing-credits.md](billing-credits.md)).
6. **AI build** — phased PipelineLoader, grounded generation
   ([ai-pipeline.md](ai-pipeline.md), [grounding-validation.md](grounding-validation.md)).
7. **Review & edit** — split-screen editor + **contextual editor** slide-out
   ([resume-editor.md](resume-editor.md), [contextual-editor.md](contextual-editor.md)).
8. **Export** — PDF + Word ([export.md](export.md)).

---

## Flow B — The LinkedIn Importer

**Goal:** import profile text, structure + rewrite it for a target role, and export.

```mermaid
flowchart TD
    A[Landing: Import from LinkedIn card] --> B[/builder/linkedin/]
    B --> C[Paste LinkedIn profile text]
    C --> D[Add target profile<br/>role · market · experience · JD]
    D --> E[Create resume from import]
    E --> F[Editor: AI rewrite summary/bullets<br/>contextual editor]
    F --> G[Add missing skill → Skills section]
    G --> H[Review & Export → PDF + Word]
```

**Steps**
1. Landing **LinkedIn card** → `/builder/linkedin`
   ([landing.md](landing.md)).
2. Paste the profile into `ResumeLinkedInImporter`
   (builder mode, [resume-editor.md](resume-editor.md)).
3. Set a target profile via the `TargetPanel` (market + role + JD).
4. The AI structures and rewrites the text for the role
   ([ai-pipeline.md](ai-pipeline.md)).
5. Edit in the wizard or the **contextual editor** (click "Skills" in the preview → add
   skills inline).
6. Export ([export.md](export.md)).

---

## Guest-mode workflow

**Goal:** use the whole funnel without an account; sign in only at the build/payment step.

```mermaid
flowchart TD
    A[Guest on landing] --> B[Upload / paste]
    B --> C[Review parsed draft]
    C --> D[Target role form — allowed as guest]
    D --> E{Click build}
    E -->|Guest| F[Sign in → converts guest drafts]
    E -->|Signed in| G[Build + pay]
    G --> H[Drafts saved to cloud]
```

**Rules (NEW fix)**
- `guestHref` never routes a guest to an auth-gated page (`/dashboard/*`, `/admin`,
  `/url`) — prevents the login loop ([auth-and-guest.md](auth-and-guest.md)).
- Guests store up to **3 resumes** locally (`hexacv_local_resumes`); sign-in migrates
  them via `syncGuestDataToCloud`.
- The guest can fill the targeting form; "Sign in to build your resume" is the gate.

---

## Billing & credits workflow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant S as Server
    participant R as Razorpay
    U->>C: Buy build / pack (1,3,5,10)
    C->>S: createCheckoutSession(tier)
    S->>R: create order (server-set amount)
    R-->>S: order id
    S-->>C: keyId + orderId
    U->>R: Razorpay Checkout
    R-->>C: payment + signature
    C->>S: verifyRazorpayPayment
    S->>S: verify signature → mark verified
    S->>S: grant N credits (idempotent)
    Note over S: webhook /api/webhooks/razorpay also fulfills
    S-->>C: ok → balance refreshed
```

**Key invariants** — server owns prices & credit grants; grants are idempotent per order;
no credit used if a build fails ([billing-credits.md](billing-credits.md)).

---

## AI pipeline workflow

```mermaid
flowchart LR
    A[startBuild] --> B[generateFullResume]
    B --> C[extract] --> D[target] --> E[rewrite]
    E --> F[validate / grounding] --> G[polish] --> H[done]
    F -.failed.-> I[release credit + retry]
    H --> J[/builder/ai/ editor/]
```

Loader surfaces each stage in real time; `buildStatus` is polled every second
([ai-pipeline.md](ai-pipeline.md)).

---

## Flow reference map

| Workflow | Entry | Key route | Exit |
|----------|-------|-----------|------|
| Flow A (upload) | Landing upload card | `/builder/target` | Download |
| Flow B (LinkedIn) | Landing LinkedIn card | `/builder/linkedin` | Download |
| Guest | any entry | `/builder/*` | sign-in at build |
| Payment | Confirm & Pay / BillingPortal | `/dashboard/billing` | credits added |
| Export | Editor "Review & Export" | editor | PDF + Word |
