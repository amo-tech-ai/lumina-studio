# HAR policy (IPI-724)

Do **not** commit authenticated Playwright HARs with `mode: "full"` / `content: "embed"`.

They can retain `Cookie`, `Set-Cookie`, `Authorization`, Supabase tokens, and login POST bodies.

## Allowed

- `network-summary.json` at the evidence root (method / URL / status / latency / `cf-ray`)
- Optional local `session.har` from the runner with `mode: "minimal"` + `content: "omit"`, only if `assertNoSecrets()` passes — still prefer not committing it

## Required after any accidental full HAR commit

1. Delete the HAR from the branch **and** purge it from git history on the PR branch.
2. Rotate the QA password and revoke the captured session.
3. Re-run the runner; commit sanitized artifacts only.
