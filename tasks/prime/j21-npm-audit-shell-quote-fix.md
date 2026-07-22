# `app/` npm audit — shell-quote critical fix (verified plan)

**Date:** 2026-07-21 · **Scope:** `app/package.json`, `app/package-lock.json` — dependency/config only, no application code touched.
**Status:** Verified against the real repo and a real `npm install` (not just read from a pasted transcript). Steps 1–3 below are **already applied in the working tree, uncommitted** — nothing pushed, nothing PR'd yet.

## Where this came from

Follow-up to `tasks/prime/j18-app.md` (the earlier terminal-transcript audit). The user reported "removed morph, pin the Cloudflare tool to exactly 1.20.1" plus a Codex-generated fix plan for the remaining critical `shell-quote` vulnerability. This doc verifies that plan line-by-line against the actual repo instead of trusting the paste, and records what actually works.

## What the pasted plan got right

| Claim | Verified? |
|---|---|
| Morph (`@morphllm/morphsdk`) removed from `app/package.json` | ✅ confirmed — no `morph` references left in `package.json` |
| "41 vulnerabilities (10 low, 21 moderate, 9 high, 1 critical)" after removing Morph | ✅ ran `npm audit --omit=dev` myself — exact match |
| Safe target for the critical is `shell-quote >= 1.9.0` | ✅ confirmed — npm's own advisory data flags the vulnerable range as `shell-quote <=1.8.4`; `1.9.0` and above are outside it |
| Don't run `npm audit fix --force` / `--legacy-peer-deps` blindly | ✅ agree — the postcss→next/sharp, sharp→wrangler, and uuid→copilotkit chains each carry an explicit breaking-change warning in the audit output |
| Pin `@opennextjs/cloudflare` before touching anything else | ✅ correct sequencing — confirmed the caret range (`^1.20.1`) resolves to `1.20.2` on a fresh install, and `1.20.2`'s peer range (`next: ">=15.5.21 <16 || >=16.2.11"`) rejects the repo's pinned `next: "16.2.10"`. Registry check: `npm view @opennextjs/cloudflare@1.20.1 vs @1.20.2 peerDependencies` — confirmed the range tightened between those two versions. |

## What the pasted plan got wrong

### 1. The pin was described as already done — it wasn't

`grep -n "opennextjs/cloudflare" package.json` still showed `"^1.20.1"` (caret) when I checked. Morph removal had landed; the pin had not. This doc applies it for real (see below).

### 2. `npm audit fix` does **not** actually fix `shell-quote` — the plan's central step doesn't work

This is the important one. I ran `npm audit fix --dry-run` (both with and without `--omit=dev`) and inspected the full list of packages it proposes to `add`/`change`/`remove`. **`shell-quote` never appears in that list.** It stays in the report at the end with a "fix available via `npm audit fix`" label, but the dry-run proves that label is misleading in this case.

**Root cause:** `shell-quote` is pulled in twice:
- `concurrently@9.2.1` (devDependency, used by the `dev` script) declares `"shell-quote": "1.8.3"` — an **exact pin**, no range.
- `mastra@1.1.0-alpha.3` (prod dependency, the Mastra CLI binary) declares `"shell-quote": "^1.8.3"` — flexible, would happily accept 1.9.0+.

npm dedupes both to one copy in `node_modules/shell-quote`, and since `concurrently` pins it exactly, non-force `npm audit fix` refuses to move it past `1.8.3`. I also checked whether upgrading `concurrently` itself would help — **it wouldn't**: even `concurrently@latest` (10.0.3, current repo is on 9.2.1) still pins `shell-quote` to exactly `1.8.4`, which is *still* inside the vulnerable range (`<=1.8.4`). There is no published `concurrently` version yet that pulls in a fixed `shell-quote`.

### 3. The plan's `npm audit fix` step (no `--omit=dev`) would also sweep in ~150 unrelated changes

Without `--omit=dev`, the dry-run pulls in devDependencies too — Sentry `10.65.0 → 10.67.0` across a dozen `@sentry/*` packages, a large OpenTelemetry SDK rewrite (`0.203.0 → 0.221.0` on ~10 packages plus removed/added sub-packages), Cloudflare `workerd`/`wrangler` bumps, `@ai-sdk/*` version churn, and dozens of `@esbuild/*` / `@ast-grep/*` / `@next/swc-*` platform binaries. None of that was the goal (fixing one critical) and none of it should land as a side effect of an "omit dev" production-vuln audit. If `npm audit fix` is ever run here, it must be `npm audit fix --omit=dev`.

### 4. The plan's backup step and the Node.js heredoc are unnecessary ceremony

`cp package.json /tmp/...` before editing, and a 15-line inline Node script to toggle one field — both work, but this is already a git-tracked file in a dirty working tree. `git diff -- package.json` / `git checkout -- package.json` already gives full, safe rollback; a `/tmp` backup and a custom script add nothing. A single line edit is enough.

## The actual verified fix

`shell-quote` needs to be forced past what `concurrently` pins, on a package that `concurrently` doesn't own. The correct tool for that — and the one this repo already uses elsewhere in the same file — is npm's **`overrides`** field, not `audit fix`.

**Steps taken (already applied to the working tree):**

1. `app/package.json` — pinned `"@opennextjs/cloudflare": "1.20.1"` (removed the caret).
2. `app/package.json` — added `"shell-quote": "1.9.0"` to the existing `overrides` block (which already had 4 `@ag-ui/*` pins, so this follows an established pattern in this file, not a new mechanism).
3. `npm install` (real install, not `--package-lock-only`) — synced `node_modules` and `package-lock.json`.

**Verified results:**

```text
npm ls shell-quote
  concurrently@9.2.1 └── shell-quote@1.9.0 overridden
  mastra@1.1.0-alpha.3 └── shell-quote@1.9.0 deduped

npm audit --omit=dev
  40 vulnerabilities (10 low, 21 moderate, 9 high, 0 critical)   ← was 41 (…, 1 critical)

npm run typecheck
  exit code 0 — no regressions
```

No `ELSPROBLEMS`/`invalid` state left in `node_modules`, no ERESOLVE on a plain `npm install` (the `@opennextjs/cloudflare` pin fixed that), critical count is now zero.

## What's still open (unchanged from the earlier audit — do not force-fix)

| Finding | Why it's parked | Action |
|---|---|---|
| `postcss` (via `next`) | Fix needs `@opennextjs/cloudflare` bumped past the pin — direct conflict with the fix above | Separate task: bump `next` to `>=16.2.11` deliberately, re-verify the Cloudflare Worker bundle-size gate (`IPI-490`), then re-pin |
| `sharp` (via `miniflare`/`wrangler`) | `npm audit fix --force` would install `wrangler@4.15.2` — breaking change flagged explicitly | Separate task: upgrade Cloudflare tooling as its own PR |
| `uuid` (via `@copilotkit/runtime`) | `npm audit fix --force` would downgrade to `@copilotkit/runtime@1.54.1` (repo is on `1.61.0`) — a real regression, not just noisy | Do not run this fix; wait for upstream `@copilotkit/runtime` to ship a `uuid@11.1.1+` bump on the `1.6x` line |
| `@ai-sdk/provider-utils` | Confirmed via dry-run: even the proposed bump (`3.0.25 → 3.0.30`) stays inside the vulnerable range (`<=3.0.97`) | No fix available upstream yet — track, don't act |
| `@hono/node-server` | No fix available upstream | Track |
| `@mastra/deployer` | Transitive through the `mastra` CLI | Do not install/update alone |

## Checklist

- [x] Confirm Morph fully removed (`grep morph app/package.json` → none)
- [x] Pin `@opennextjs/cloudflare` to `1.20.1` exact
- [x] Add `shell-quote: 1.9.0` override
- [x] `npm install` — verify `node_modules` is clean (no `invalid`/`ELSPROBLEMS`)
- [x] `npm audit --omit=dev` — confirm 0 critical
- [x] `npm run typecheck` — confirm no regression
- [ ] `npm test` — not yet run for this change
- [ ] `npm run build` — not yet run for this change
- [ ] Decide: commit this on a worktree branch + open a docs/deps-only PR (per this repo's hard rule — deps changes don't mix with anything else)
- [ ] File separate follow-up tasks for the 3 parked chains above (postcss/next, sharp/wrangler, uuid/copilotkit) rather than bundling them into this fix

## Bottom line

The critical fix works, but not the way the pasted plan said it would. `npm audit fix` was never going to touch `shell-quote` — `concurrently`'s exact pin blocks it, and no released `concurrently` version fixes it either. The `overrides` field (already used in this file for the `@ag-ui/*` packages) is what actually gets `shell-quote` to `1.9.0`. Verified live: 41 vulnerabilities → 40, 1 critical → 0, typecheck clean.
