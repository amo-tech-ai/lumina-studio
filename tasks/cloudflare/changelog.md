# Cloudflare Platform — Changelog

A dated, reverse-chronological log of significant Cloudflare/hosting-migration events — what happened, what it means, and where the evidence lives. This complements [`todo.md`](./todo.md) (which owns *current* status) rather than duplicating it: `todo.md` answers "what's true right now," this file answers "what happened and when."

Started 2026-07-24. Earlier milestones (IPI-472, IPI-586, IPI-632, IPI-695/697/699/742, etc.) are summarized in `todo.md`'s "✓ Done" section and are not backfilled here — this log begins from today forward.

---

## 2026-07-24

### Vercel production outage fixed (IPI-788)

`app/package.json`'s `overrides["@ag-ui/mastra"]` pinned a nested `@ai-sdk/provider-utils` to `4.0.30` (added in PR #579), but `app/package-lock.json` was never regenerated to match. GitHub Actions CI (Node 22 / npm 10) silently tolerated the mismatch; Vercel's `ipix-operator` project (Node 24.x / npm 11) enforced it strictly and hard-failed `npm ci` on every deploy — production and every branch preview, including PR #616's — for at least an hour before being caught.

Fixed in [PR #620](https://github.com/amo-tech-ai/lumina-studio/pull/620): a purely additive 29-line `package-lock.json` diff, verified clean under both npm 10 and npm 11. Merged (`7ea801a5`); new production deployment confirmed `● Ready`; `ipix.co/` and `ipix.co/app` smoke-tested live. Full report: [`../prime/ipi-788-vercel-lockfile-fix.md`](../prime/ipi-788-vercel-lockfile-fix.md).

Three follow-ups filed to prevent recurrence and close related debt: [IPI-789](https://linear.app/amo100/issue/IPI-789) (add npm 11/Node 24 lockfile-drift check to CI — closes the actual detection gap), [IPI-790](https://linear.app/amo100/issue/IPI-790) (`@mastra/deployer` vs `@mastra/core` peer mismatch), [IPI-791](https://linear.app/amo100/issue/IPI-791) (pin `engines.node` to match Vercel's actual Node 24.x).

### PR #616 (IPI-595) preview unblocked

PR #616 had been unable to get a real Vercel preview because of the same lockfile drift above. Merged `origin/main` (with the IPI-788 fix) into `ipi/595-gateway-auth-verify`, no conflicts, pushed — the PR's Vercel check flipped from `fail` to `pass` ("Deployment has completed") for the first time.

### Full Vercel→Cloudflare migration audit (j24)

Produced [`prime/j24-cloudflare-plan.md`](./prime/j24-cloudflare-plan.md): a from-scratch, live-verified audit of everything required to move `ipix.co` hosting from Vercel to Cloudflare Workers/OpenNext. Verdict: ~70% ready — the Cloudflare Worker preview itself is proven and auth-correct, but DNS cutover is explicitly **not safe** because four operational gates (rollback rehearsal, observability baseline, automated smoke, branch protection) have sat at 0% in Linear for 6 days. Re-verified a few hours later in [`prime/j24-progress-tracker.md`](./prime/j24-progress-tracker.md) with fresh live checks — found the Worker bundle size had gotten *worse* (8.799 → 8.985 MiB) in the interim, and confirmed Server Actions exist in dynamic routes (`brand/[id]`, `planner/[instanceId]`) that hit a known OpenNext/Workers edge case, never live-tested.

### IPI-706 (Worker bundle size) — root cause traced, fix started

Local esbuild metafile analysis (`.open-next/server-functions/default/handler.mjs.meta.json`, analyzed via `esbuild.analyzeMetafile()` — never uploaded anywhere third-party) traced the bundle's growth to `@copilotkit/react-core → streamdown → mermaid/cytoscape/katex`, plus `@copilotkit/web-inspector` — all landing in the server SSR chunk despite **zero direct usage anywhere in `src`** (`git grep` confirmed). Since the containing chat components are already `"use client"`, the fix in progress is `next/dynamic(..., { ssr: false })` to defer them to client-only loading, which should remove the bulk of that weight from the server Worker without touching the actual chat/markdown/diagram rendering feature. In progress in worktree `wt-ipi-706-bundle-size-reduction`; not yet merged as of this entry.

### Linear hygiene

- [IPI-595](https://linear.app/amo100/issue/IPI-595) flagged for a status flip to Done (evidence complete via PR #616) — not yet actioned, pending confirmation.
- [IPI-706](https://linear.app/amo100/issue/IPI-706) flipped Backlog → In Progress.
- [IPI-788](https://linear.app/amo100/issue/IPI-788) created, taken through the full lifecycle (Todo → In Progress → Done) same day.

---

## Maintenance

- Add a dated entry here for anything that changes production behavior, fixes a live incident, or closes/reopens a Linear-tracked gap in the hosting/Cloudflare migration. Routine status updates with no new event belong in `todo.md`, not here.
- Keep entries short: what happened, why it mattered, where the full evidence lives (link the report/PR/audit file — don't duplicate its contents here).
