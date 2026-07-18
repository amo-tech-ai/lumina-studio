# OpenNext CI and Deployment Pipeline (IPI-472 · INFRA-001)

**Linear:** [IPI-472](https://linear.app/amo100/issue/IPI-472) · **Wrangler SSOT:** `app/wrangler.jsonc`

This document describes the build-time vs runtime secret contract for the OpenNext operator Worker (`ipix-operator`). **No secret values belong in this file or in git.**

## CI pipeline (GitHub Actions)

The `app-build` job in `.github/workflows/ci.yml` runs, in order:

1. Env guard (client secret scan)
2. Lint
3. `npm run cf-typegen` — generate binding types from `wrangler.jsonc`
4. `npm run build` — Next.js production build (generates types for `tsc`)
5. `npm run typecheck`
6. `npm run check:cf-types` — verify generated types match wrangler config
7. `npm run test` — Vitest unit tests
8. `npm run build:cf` — OpenNext build + Worker dry-run bundle gate

Steps 8 uses masked GitHub Actions secrets for **build-time public** Supabase variables (same names as the booking-gate job).

## Build-time vs runtime contract

| Variable | When required | Where set | Notes |
|----------|---------------|-----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `next build` / `opennextjs-cloudflare build` | CI secrets, local shell export, Infisical (IPI-606) | Public host only — e.g. `https://*.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same | same | Publishable anon key only |
| `MASTRA_STORAGE_MODE` | Worker runtime | `wrangler.jsonc` `vars` | `noop` until Hyperdrive (IPI-619) |
| `OPERATOR_AUTH_ENABLED` | Worker runtime | `wrangler.jsonc` `vars` | `true` in preview and production |
| `GEMINI_API_KEY`, `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc. | Runtime only | `wrangler secret put` / Infisical (IPI-606) | **Never** in client chunks or CI logs |

OpenNext inlines `NEXT_PUBLIC_*` at build time. Export them **before** `opennextjs-cloudflare build` locally:

```bash
cd app
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder \
npm run build:cf
```

Placeholder public values are sufficient for CI dry-run and bundle gate — no real Supabase project needed for gzip validation.

## Wrangler environments

| Environment | Worker name | Upload command |
|-------------|-------------|----------------|
| `preview` | `ipix-operator-preview` | `npm run upload -- --env preview` |
| `production` | `ipix-operator` | `npm run deploy -- --env production` |

Bindings, vars, and aliases inherit from the top-level `wrangler.jsonc` unless overridden per environment. `DATABASE_URL` is intentionally absent until Hyperdrive binding lands (IPI-619).

## Bundle gate (local + CI)

`npm run build:cf` runs:

1. `opennextjs-cloudflare build`
2. `npm run check:worker-bundle` → `scripts/check-worker-bundle-size.mjs`

The gate executes `wrangler deploy --dry-run` and enforces gzip size:

- **WARN** ≥ 8.5 MiB
- **FAIL** ≥ 9.0 MiB (Cloudflare Paid Worker compressed limit = 10 MB)

Local `wrangler check startup` output is diagnostic only — authoritative remote `startup_time_ms` comes from the first preview upload (manual step below).

## Manual steps (not in CI)

### First preview upload

Requires Cloudflare credentials (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) and build-time Supabase public vars:

```bash
cd app
export NEXT_PUBLIC_SUPABASE_URL=...   # from Infisical / GitHub secrets admin
export NEXT_PUBLIC_SUPABASE_ANON_KEY=...
npm run upload -- --env preview
```

Record the version ID and authoritative `startup_time_ms` from wrangler output. Remote runtime smoke is **IPI-632** · CF-MIG-220.

### GitHub secrets admin

Ensure repository secrets exist (names only):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Full Infisical → GitHub → Wrangler automation is **IPI-606** · CF-SEC-010.

## Related issues

| Issue | Scope |
|-------|-------|
| IPI-490 · CF-MIG-210 | Bundle trim, local dry-run gate |
| IPI-606 · CF-SEC-010 | Infisical secret delivery |
| IPI-619 · CF-DB-005 | Hyperdrive binding (no Worker `DATABASE_URL` before this) |
| IPI-632 · CF-MIG-220 | Protected preview runtime smoke |
