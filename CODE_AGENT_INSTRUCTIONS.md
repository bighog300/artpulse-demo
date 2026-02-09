# Code Agent Instructions — Artpulse

## Your role
Implement the Artpulse MVP from the docs and keep it deployable on Vercel.

## Source of truth (precedence)
1. PRD.md
2. ARCHITECTURE.md
3. DATA_MODEL.md
4. API_SPEC.md
5. ROUTES.md
6. UI_UX.md
7. SECURITY_PRIVACY.md
8. STACK.md
9. ENVIRONMENT.md / VERCEL.md

## Implementation order
1) Scaffold Next.js + Tailwind + pnpm
2) Prisma schema + migrations
3) Auth (Google OAuth)
4) Public read APIs
5) Public pages (SSR)
6) Admin APIs + RBAC
7) Admin UI
8) Favourites
9) Calendar
10) SEO

## Guardrails
- No paid services by default
- No secrets in repo
- Enforce RBAC server-side
