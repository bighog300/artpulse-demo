# Security & Privacy — Artpulse

## Principles
- Least privilege
- Minimal data
- Deny by default

## RBAC
- USER: browse + favourites
- EDITOR: CRUD + publish
- ADMIN: editor + future user/role mgmt

## PII (MVP)
- email, display name (optional), profile image URL (optional)
- no passwords stored

## Secrets
- never commit secrets
- use Vercel env vars
