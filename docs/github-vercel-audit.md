# GitHub Actions + Vercel Audit (Stability Plan)

## Scope

This audit reviews the current CI/CD workflows and deployment guardrails to identify likely causes of failing GitHub Actions and Vercel builds, then proposes a concrete path to consistent green runs.

Reviewed files:
- `.github/workflows/ci.yml`
- `.github/workflows/preview-db.yml`
- `.github/workflows/migrate.yml`
- `.github/workflows/staging-db.yml`
- `.github/workflows/cleanup-preview-db.yml`
- `scripts/check-env.mjs`
- `scripts/neon/create-branch.mjs`
- `scripts/neon/get-connection-urls.mjs`
- `vercel.json`

## Findings (likely root causes)

### 1) Preview workflow does not guard for missing Neon secrets

`preview-db.yml` checks for Vercel secrets but does **not** check for Neon secrets before attempting to create/fetch Neon branches and DB URLs. On fork PRs (or any context where repository secrets are unavailable), this will fail early and mark the job red.

Impact:
- Frequent red PR checks for external contributors.
- Signal noise; hides real failures.

### 2) Preview workflow currently runs only on PR open/sync/reopen, not manual recovery path

When Neon endpoint propagation is delayed, retries are bounded and can still fail. There is no lightweight fallback path in this workflow (other than rerun entire job).

Impact:
- Intermittent flakes from external API consistency windows.
- Re-runs required even when app code is fine.

### 3) Staging/migrate workflows are tightly coupled to secrets and external Neon API availability

`migrate.yml` and `staging-db.yml` depend on Neon API and branch endpoint readiness. Although there are retries, failures can still happen due to:
- secret rotation/drift,
- transient Neon API or endpoint provisioning delays,
- branch quota limits.

Impact:
- Main-branch deploy signal can be blocked by infra/transient conditions.

### 4) `check-env` is strict in deploy contexts and requires `CRON_SECRET` when `vercel.json` has crons

`scripts/check-env.mjs` treats deploy context as `VERCEL=1` or `CI=true`, requires `AUTH_SECRET` and `DATABASE_URL`, optionally `DIRECT_URL`, and always requires `CRON_SECRET` when crons exist in `vercel.json`.

Impact:
- Vercel build will fail if `CRON_SECRET` or DB/auth vars are missing in the target environment.
- This is desirable for safety, but often the practical reason for “mysterious” red deploys.

### 5) Build succeeds even when database is unreachable during static generation (warning noise)

Local build reproduced Prisma “Can't reach database server” errors during page data generation, but process still exited `0`. This can create confusion during audits because logs look severe while the build passes.

Impact:
- Harder triage: teams may misclassify warning logs as root cause.

## Reproduction checks run locally

- `pnpm install --frozen-lockfile` ✅
- `pnpm lint` ✅ (warnings only)
- `pnpm typecheck` ✅
- `pnpm test` ✅
- `pnpm build` ✅ (with Prisma connectivity warnings but successful exit)

## Plan to get green (GitHub + Vercel)

## Phase 1 — Remove false-red conditions (high priority)

1. Add a Neon-secrets preflight gate in `preview-db.yml` similar to existing Vercel secret check.
   - If Neon secrets are missing, skip Neon migration steps and mark with an explicit “skipped due to missing secrets” message.
   - Keep job green for unsupported contexts (fork PRs).

2. Add explicit branch-limit and endpoint-readiness annotations.
   - Parse `FAIL_REASON` from Neon scripts and emit `::warning`/`::error` summaries in GitHub logs.
   - Distinguish infra/transient failures from code failures.

3. Mark preview DB workflow as non-blocking for fork PRs.
   - Either conditionalize the whole job to same-repo PRs or split into two jobs:
     - `preview-db-check` (always runs, fast)
     - `preview-db-migrate` (runs only when secrets available).

## Phase 2 — Harden migration reliability (main/staging)

4. Increase resilience around Neon endpoint eventual consistency.
   - Keep existing retry loop, but add jitter/backoff and explicit elapsed-time logging.
   - Capture endpoint inventory on failure for diagnosis.

5. Add preflight “secret contract” step for migrate/staging workflows.
   - Validate required secrets are non-empty before install/build.
   - Fail fast with actionable message (which secret is missing).

6. Add concurrency controls where missing.
   - Ensure staging and migrate workflows cannot overlap conflicting migration runs.

## Phase 3 — Align Vercel deployment contract

7. Enforce environment parity across Vercel targets (Preview/Production).
   - Required for this repo: `AUTH_SECRET`, `DATABASE_URL`, `CRON_SECRET` (and `DIRECT_URL` where configured).
   - Validate in Vercel UI and optionally via `vercel env pull` precheck in CI.

8. Create a deployment runbook checklist tied to `check-env`.
   - If build fails on Vercel, first inspect `check-env` output and missing keys.
   - Add this as a required troubleshooting sequence for on-call.

9. Optional: reduce confusing build-time DB warning noise.
   - Where feasible, avoid DB-dependent work in static generation paths when DB is unavailable.
   - Keep non-fatal behavior but provide clearer log prefix (“non-blocking db probe failure”).

## Suggested ownership + timeline

- Day 1: Implement Phase 1 workflow gating and annotations.
- Day 2: Add Phase 2 preflight and resilience logging.
- Day 3: Verify Vercel env parity + finalize runbook updates.
- Day 4-5: Observe 10+ PRs and 3+ deploy cycles; adjust retry/backoff thresholds.

## Success criteria

- 0 false-red preview workflow failures on fork PRs.
- >95% first-pass success for migrate/staging workflows over one week.
- 100% Vercel deploys fail only for actionable config/code issues (not opaque missing-secret surprises).
