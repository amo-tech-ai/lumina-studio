# HAR policy (IPI-724)

Do **not** commit Playwright HARs — especially not `mode: "full"` / `content: "embed"`.

Those can retain `Cookie`, `Set-Cookie`, `Authorization`, Supabase tokens, and login POST bodies.
See [Playwright HAR options](https://playwright.dev/docs/api/class-browser#browser-new-context-option-record-har).

## Allowed in git

- `network-summary.json` at the evidence root: `host`, `path`, `method`, `status`, `latencyMs`, `cf-ray`
- This README + `.gitignore` (`*.har`)

## Runner policy

`run-e2e.mjs` records HAR only as:

```js
recordHar: {
  path: harPath,
  mode: "minimal",
  content: "omit",
  urlFilter: "**/api/**",
}
```

Then **deletes** the local HAR before exit. Commit `network-summary.json` only.

## If a full HAR was ever pushed

1. Delete it from the branch and purge from git history on the PR branch.
2. Rotate `qa@ipix.test` and revoke the captured session ([GitHub secret exposure guidance](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)).
3. Re-run the runner; commit sanitized artifacts only.
