# Merge Record

**Task:** IPI-920 · ONB2-INT-001g — Brand website identity SSOT
**PR:** #777 — IPI-920 · ONB2-INT-001g — Brand website identity SSOT
**Merge SHA:** `576d33ca580c08a86966ca5cee86d9f9cd4ba373` (squash, `main`)
**Merged:** 2026-08-03T16:28:23-04:00
**Recorded:** 2026-08-03

## Squashed commits (folded into merge)

- `feat(ipi-920): share one brand-URL identity rule between app and Edge`
- `fix(ipi-920): match full fc00::/8 ULA block, not just literal fc00:`
- `chore(ipi-920): drop package.json scripts from feature PR`
- `docs(ipi-920): document brand-url mirror via cp without package script`
- `chore: retrigger supabase-verify-rls (serial #777)`

## Purpose

Brand Hub restart (app) and the `brand-intelligence` Edge function each carried their own "is this the same brand website?" rule, so the same URL with tracking params, different case, or a default port could be treated as two different sites, starting a redundant crawl. This PR introduces one canonical identity rule (`supabase/functions/_shared/brand-url.ts`) with a byte-identical Next.js mirror, normalizes to lowercase HTTP(S) origin, and blocks private/internal/CGNAT hosts including the full IPv6 ULA range `fc00::/7` (`fc00::/8` + `fd00::/8`) to prevent SSRF.

**Single concern:** `app/` + `supabase/functions/` brand-url identity SSOT only. Root `package.json` (`sync:brand-url` script, `supabase:verify-edge-unit` wiring) is explicitly out of scope, deferred to sibling PR #790.

## Files / systems changed

| Path | Change |
| --- | --- |
| `supabase/functions/_shared/brand-url.ts` | New canonical module: `PRIVATE_HOST_PATTERNS`, `normalizeHostname`, `isPrivateOrInternalHost`, `normalizeBrandUrl`, `sameBrandWebsite` |
| `app/src/lib/brand/brand-url.ssot.ts` | New byte-identical generated mirror of the Edge module (Turbopack cannot resolve modules outside `app/`) |
| `app/src/lib/brand/restart-stage.ts` | `normalizeAnalysisUrl` now aliases the shared `normalizeBrandUrl` (removed 51 lines of duplicated private-host logic) |
| `supabase/functions/brand-intelligence/handler.ts` | Removed local `isValidHttpUrl`/`normalizeBrandUrl`/`PRIVATE_HOST_PATTERNS`; `loadCrawlRow` now uses shared `sameBrandWebsite` and rejects when the request URL has no normalized origin |
| `supabase/functions/_shared/brand-url.fixtures.json` | New 51-row shared fixture matrix (accepts / rejects / sameWebsite), asserted by both runtimes |
| `supabase/functions/_shared/brand-url.test.ts` | New Deno tests against the fixture matrix |
| `app/src/lib/brand/brand-url.ssot.test.ts` | New Vitest tests: fixture matrix, mirror byte-identity check, `normalizeAnalysisUrl === normalizeBrandUrl`, crawl-reuse fixtures |

No changes to Brand Hub UI, database schema, `reanalyzeBrand`, `start-brand-crawl`'s URL normalizer, or root `package.json` in this PR.

## Tests / CI at merge

- App SSOT suite: `cd app && npx vitest run src/lib/brand/brand-url.ssot.test.ts` — reported green in PR description (56 tests, incl. mirror drift check)
- Edge suite: `cd supabase/functions && deno test --frozen --allow-env _shared/brand-url.test.ts` — reported green in PR description
- Fixture coverage confirmed for `fc00::`, `fcff::`, `fd12::` (full `fc00::/7`), added after a CodeRabbit review flagged that `/^fc00:/i` only matched the literal `fc00:` prefix and missed the rest of `fc00::/8`
- No `package.json` diff in this PR (verified: root `package.json` currently has no `sync:brand-url` script and `supabase:verify-edge-unit` does not yet list `_shared/brand-url.test.ts`)

## Production impact

- `brand-intelligence`'s crawl-matching rule is now stricter: embedded credentials, CGNAT (`100.64.0.0/10`), and additional `::`/IPv6-unspecified hosts are rejected at validation where the old local check may have let some through.
- A `null`/malformed `brand_crawls.source_url` can no longer throw or silently fall back to a raw-string comparison during crawl matching (`loadCrawlRow` returns `null` early instead).
- App-side `restart-stage.normalizeAnalysisUrl` behavior is unchanged in intent (same origin-only rule, same private-host blocklist) but now sourced from one shared implementation instead of a hand-maintained mirror.
- `www.` and apex domains are intentionally treated as different origins (not collapsed) — no behavior change from pre-PR, but now formally covered by the fixture matrix.

## Known limitations

- The mirror (`app/src/lib/brand/brand-url.ssot.ts`) is manually copied (`cp supabase/functions/_shared/brand-url.ts app/src/lib/brand/brand-url.ssot.ts`) until sibling PR #790 lands the `sync:brand-url` npm script; drift is caught by a test, not prevented by tooling, until then.
- CI's `supabase:verify-edge-unit` script does not yet include `_shared/brand-url.test.ts` on `main` — the new Deno suite runs manually/locally but is not yet wired into the standard edge-unit CI gate pending PR #790.
- This PR does not touch `start-brand-crawl`'s separate URL normalizer, so a third, unreconciled implementation may still exist there (out of scope per PR description).

## Rollback / cleanup notes

- Multi-file, additive-plus-refactor change; revertable with `git revert 576d33c` if the shared rule or its stricter SSRF checks cause unexpected crawl-matching regressions.
- No migrations, feature flags, or secrets introduced — pure application/Edge-function logic and tests.
- If reverted, `brand-intelligence/handler.ts` and `app/src/lib/brand/restart-stage.ts` would need their previous local implementations restored (available in this PR's diff) rather than a partial revert, to avoid leaving `normalizeAnalysisUrl` pointing at a deleted module.

## Follow-up tasks

- Merge PR #790 (CI/config sibling) to land the `sync:brand-url` script and add `_shared/brand-url.test.ts` to `supabase:verify-edge-unit`, per the PR's own unchecked test-plan item.
- Reconcile `start-brand-crawl`'s URL normalizer against this SSOT if/when that path needs the same identity guarantees.