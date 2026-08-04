# PR-Agent Expert Sheet — Cloudflare / OpenNext

> Domain rules for PRs touching Worker-bound code, `wrangler`, OpenNext, AI Gateway,
> `app/` routes deployed to Cloudflare, or `my-marketplace` Cloudflare jobs.
> Sheet: `cloudflare.md` · phase: B (post-measurement).

## Hard rules (BLOCKING if violated — all require proof)

1. **No speculative fs/path scares.** `fs`/`path` module imports are **not** automatic
   defects: the Worker codebase builds with the configured compatibility date + `nodejs_compat`
   (and `fs.native_api` where pinned in `wrangler.jsonc`). Flag ONLY filesystem-native code
   paths that demonstrate an unproven assumption — e.g. reading a local file at runtime that
   the Worker build does not bundle, or a native module the build cannot resolve.
2. **Test-device compatibility before compatibility claims.** A route that works in Next.js
   locally but lacks the Cloudflare build + smoke test evidence must present both before
   relying on a compatibility claim; flag the claim, not the import.
3. **Version-pinned Cloudflare SDK** usage must follow the pinned wrangler + OpenNext
   versions in the repo. Speculative "upgrade your workers runtime" findings = noise.
4. **Never leak bindings.** AI Gateway, Workers AI, D1/R2/KV binding names and IDs are
   runtime config — not secrets, but route changes must keep `wrangler.jsonc`/`wrangler.toml`
   bindings in sync with code references.

## Environment mastery

- Runtime: OpenNext (`opennextjs/cloudflare`) delivering the Next.js App Router onto
  Workers/Pages with `nodejs_compat`.
- Typecheck: `tsc --noEmit` + `wrangler types` (cf-bindings) are the build gates.
- AI providers behind AI Gateway when scoped; Workers AI models need env-aware model picking.

## Acceptable patterns (do NOT flag)

- Dynamic-import in OpenNext for server-only modules (supported at the configured compat date).
- `fs` usage inside build-time or dev-time scripts that never ship to the Worker runtime
  (`scripts/`, `tools/`).
- Bindings/gateways referenced via env vars with safe defaults for local dev.

## How to flag

`BLOCKING` — a Worker-runtime code path demonstrably reading an unbundled local file or
loading a native addon (prove with the build); a route leaking an un-gated binding ID.
`IMPORTANT` — a compatibility claim without the matching Cloudflare build + smoke test;
a SDK import whose pinned version contradicts `wrangler.jsonc`.
