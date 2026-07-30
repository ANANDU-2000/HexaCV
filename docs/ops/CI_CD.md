# HexaCV — CI_CD.md (GitHub Workflow, Reviewed + Extended)
Prepared for: Anandu / HexaStack Solutions
`.github/workflows/deploy.yml` already exists and already does the
core right thing (typecheck → test → build/push Docker image, gated
to `main`/`master`). This file reviews what's there and adds what's
missing — it does not propose throwing it away.

---

## 1. What's already correct (keep as-is)

```yaml
# .github/workflows/deploy.yml — current, verified
name: HexaCv CI/CD Pipeline
on:
  push: { branches: [main, master, development] }
  pull_request: { branches: [main, master, development] }

jobs:
  test-and-check:        # tsc --noEmit, then vitest run — good baseline
  build-and-deploy:       # needs: test-and-check, only on main/master,
                           # builds+pushes a Docker image via buildx
```

This is a reasonable small-team pipeline already. The gaps below are
additive, not a rewrite.

## 2. Gaps to close

### 2.1 No staging environment / no environment separation
Right now every push to `main` builds and pushes `hexastack/hexacv:latest`
— there's no distinction between "deployed to staging for review" and
"deployed to production." Add:
```yaml
  deploy-staging:
    needs: test-and-check
    if: github.ref == 'refs/heads/development'
    # same build-and-push steps, tag: hexastack/hexacv:staging
  deploy-production:
    needs: test-and-check
    if: github.ref == 'refs/heads/main'
    environment: production   # enables GitHub's environment
                               # protection rules — required
                               # reviewers before prod deploy
    # existing build-and-push steps, tag: hexastack/hexacv:latest
```
Use `development` as the integration branch, `main` as
production-only — matches the branches already listed in the
workflow's trigger, they're just not differentiated downstream yet.

### 2.2 No database migration step
`drizzle-kit generate && drizzle-kit migrate` (the existing
`db:push` script) isn't run anywhere in CI — a deploy currently
assumes the DB schema is already correct, which is fragile the
moment a PR adds a table (every V6 phase adds tables). Add a
migration step before the deploy job, against a real migration
target, not the dev DB:
```yaml
  migrate:
    needs: test-and-check
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install --no-frozen-lockfile
      - run: pnpm run db:push
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
  build-and-deploy:
    needs: migrate   # was: needs: test-and-check — now waits for
                      # a successful migration too
```

### 2.3 No secret/env validation before deploy
Given `.env.example` lists ~15 provider keys plus DB/JWT secrets,
a deploy with a missing production secret currently fails silently
at runtime rather than in CI. Add a lightweight check job:
```yaml
  validate-env:
    needs: test-and-check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check required production secrets are set
        run: |
          for var in DATABASE_URL JWT_SECRET STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET; do
            if [ -z "${!var}" ]; then echo "Missing $var"; exit 1; fi
          done
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
          STRIPE_WEBHOOK_SECRET: ${{ secrets.STRIPE_WEBHOOK_SECRET }}
```
This directly protects against the `stripeWebhook.ts` dev-mode
fallback (see `docs/architecture/ARCHITECTURE.md` §5) silently activating in
production because `STRIPE_WEBHOOK_SECRET` wasn't actually set.

### 2.4 No automatic rollback / health check after deploy
Add a simple post-deploy smoke check (hit a health endpoint, fail
the workflow — and ideally re-tag the previous image as `latest` —
if it doesn't return 200 within a timeout):
```yaml
  smoke-test:
    needs: build-and-deploy
    runs-on: ubuntu-latest
    steps:
      - name: Hit health endpoint
        run: |
          for i in {1..10}; do
            curl -sf https://<your-prod-domain>/api/health && exit 0
            sleep 5
          done
          exit 1
```
This assumes a `/api/health` route exists — if it doesn't yet,
adding one (a trivial Express route returning 200 + DB ping) is a
5-minute task and the prerequisite for this job actually meaning
anything.

### 2.5 No branch protection rules documented
Not a workflow file change — a GitHub repo settings task: require
`test-and-check` to pass before merge to `main`/`development`,
require at least one review, disallow force-push to `main`. Document
this in `docs/ops/CI_CD.md` so it's recoverable if repo settings are
ever reset, since settings don't live in version control themselves.

## 3. Full target workflow shape (job graph)

```
push/PR
  ├── test-and-check (typecheck + vitest)         ← existing
  │     ├── validate-env (secrets present)          new, parallel
  │     ├── migrate (main only)                     new
  │     │     └── build-and-deploy (existing logic,
  │     │           split staging/production)       modified
  │     │           └── smoke-test                  new
```

## 4. What NOT to add yet
- Full blue/green or canary deploys — single-Docker-image deploy is
  fine at current scale; revisit only once there's real concurrent
  production traffic (same "don't build for a scale you don't have"
  principle as V3 §9.6).
- A separate CD tool (ArgoCD, Spinnaker) — GitHub Actions + Docker
  is sufficient for a solo/small-team project; adding a second
  deploy system is its own maintenance burden with no current payoff.

---

## Cursor scope-lock notes
- Scope: `.github/workflows/deploy.yml` only, plus one new
  `server/routes/health.ts` (or equivalent) if §2.4's health
  endpoint doesn't already exist — check first.
- Every new job above needs its GitHub Environment/secret actually
  configured in repo settings before the workflow will pass — a
  workflow referencing `secrets.PRODUCTION_DATABASE_URL` that isn't
  set in GitHub will fail loudly, which is correct (fail loud, not
  silent), but confirm it's set before merging so CI isn't red on
  main for an unrelated reason.
