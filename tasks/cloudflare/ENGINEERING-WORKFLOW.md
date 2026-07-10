# Cloudflare Engineering Workflow — Accuracy-First Standard

Applies to **all** Cloudflare-related work: Workers, OpenNext, AI Gateway, Workers AI, Durable
Objects, Queues, KV, Vectorize, Hyperdrive, D1, R2, Workflows, AI provider integrations,
CopilotKit, Mastra, Supabase integration, OAuth, runtime compatibility, deployment, CI/CD,
security.

Referenced from [`CLAUDE.md`](../../CLAUDE.md) — this is the canonical, tracked copy. (The
`.claude/skills/cloudflare/` hub is versioned in-repo, but skills are supplemental guidance; this
 document is the team-wide source of truth for the workflow standard.)

## Principles

- Verify before changing.
- Keep each task focused — one concern per PR/commit (see `CLAUDE.md` hard rules).
- Base decisions on evidence, not assumptions.
- Preserve architecture consistency.
- Prevent documentation drift.
- Keep implementation aligned with Linear, PRDs, and the current codebase.
- **Match verification cost to actual risk** — see "Right-sizing verification" below. Running
  every gate on every change is not more accurate, just slower.

---

## Stage 1 — Scope Verification

Before writing code:

- Verify the task still aligns with the current architecture.
- Compare with `origin/main` — including a cheap divergence check (`git merge-base
  --is-ancestor` / commit count) before assuming a branch is rebasable. A branch hundreds of
  commits behind is a signal to recreate fresh rather than force a rebase.
- Check for overlapping PRs and active branches.
- Review related Linear issues.
- Review current PRDs, roadmap, and architecture documents.

Classify work as:

- ✅ In scope
- ⚠️ Related but separate
- ❌ Out of scope

Do not expand the scope.

---

## Stage 2 — Evidence Collection

For every issue or review comment, collect evidence from:

1. Current source code
2. Installed package source
3. Official documentation (prefer retrieval over pre-training — Cloudflare's platform changes
   fast; use the `cloudflare` skill's `references/` and the Cloudflare docs MCP)
4. Runtime reproduction (when possible)

Classify each finding:

- ✅ Confirmed
- 🟡 Unproven
- ⚪ Already fixed
- ❌ Incorrect
- ⚠️ Out of scope

Only implement confirmed, in-scope issues.

---

## Stage 3 — Implementation

- Make one logical change at a time.
- Keep commits small and focused.
- Preserve backwards compatibility where required.
- Avoid unrelated refactoring.
- If a new root cause belongs to another feature or epic, stop and create/update the appropriate
  Linear task instead of expanding the current work.

---

## Stage 4 — Testing (right-sized)

Run the cheapest gate that actually proves the change first, then escalate only as needed:

1. **Targeted** — typecheck + the specific test file(s) touched. Seconds.
2. **Focused** — lint on changed files only.
3. **Full local suite** — before pushing (this is what the repo's pre-push hook already runs:
   `tsc --noEmit` + `vitest run`).
4. **Full production build** (`next build`, `opennextjs-cloudflare build`) — **only when the
   change touches build/bundling config itself** (`next.config.ts`, `wrangler.jsonc`,
   `open-next.config.ts`, dependency bundling). For ordinary application code, trust CI's
   `app-build` job to run this — don't duplicate a 2–3 minute build locally on every change.
5. **Cloudflare preview** (local `wrangler dev` or, better, a real remote preview — see
   "Right-sizing verification" below) — only for changes to runtime-compat surfaces: streaming,
   bindings, OAuth/auth, env-var timing, CopilotKit/Mastra wiring.

Don't run every level on every change. Pick the lowest level that would actually have caught the
class of bug you're worried about.

---

## Stage 5 — Runtime Verification

Clearly distinguish verification levels, and never claim a higher one than you actually ran:

| Level | Meaning |
|---|---|
| Unit Verified | Tests only |
| Build Verified | Application builds successfully |
| Local Runtime Verified | Local Cloudflare/OpenNext runtime (`wrangler dev`) |
| Remote Preview Verified | Real Cloudflare preview deployment (`*.workers.dev`) |
| Production Verified | Live production verification |

Never claim production readiness without production evidence.

---

## Stage 6 — Documentation Verification

Before updating PR description / Linear / PRD / roadmap / architecture docs, do a contradiction
check:

- Implementation matches documentation.
- Acceptance criteria are satisfied.
- Task status reflects reality.
- Test counts are current.
- File references exist.
- Links are valid.

Do not mark work complete without evidence.

---

## Stage 7 — Architecture Review

Confirm the work:

- Matches the current architecture.
- Avoids duplicate implementations (grep for existing types/helpers before adding new ones).
- Maintains single sources of truth.
- Preserves clear ownership between tasks/issues.
- Does not introduce unnecessary abstractions.
- Follows Cloudflare and OpenNext best practices.

---

## Stage 8 — Production Readiness

Before recommending merge, verify:

- CI passes.
- Builds pass.
- Runtime verification passes at the level the change actually needs.
- Security requirements satisfied.
- Review comments addressed (or explicitly skipped with a stated reason).
- Regression tests added where appropriate.
- Documentation updated.

If any production blocker remains, classify it clearly. **Do not describe mitigations as complete
fixes** — a bounded timeout around a hang is not the same as fixing the hang.

---

## Reporting Template

| Item | Result |
|---|---|
| Finding | Exact issue |
| Evidence | Code / Docs / Runtime |
| Classification | Confirmed / Unproven / Already Fixed / Incorrect / Out of Scope |
| Change Made | Files changed |
| Regression Test | Test added or updated |
| Validation Level | Unit / Build / Local Runtime / Remote Preview / Production |
| Scope Preserved | Yes / No |
| Remaining Risks | Details |
| Next Recommended Action | Details |

## Quality Gates (before closing a task)

- ✅ Current architecture verified
- ✅ Scope preserved
- ✅ Runtime verified (at the appropriate level)
- ✅ Documentation synchronized
- ✅ Linear synchronized
- ✅ No unresolved contradictions
- ✅ No duplicate implementations
- ✅ Production readiness evaluated

Only recommend merging or marking a task complete after all applicable quality gates pass.

---

## Right-sizing verification — reduce error *and* wasted time

Exhaustive local verification on every change is not the only way to reduce errors, and it's
often slower than the platform's own safety nets. This repo does not yet use any of the following
(confirmed against `main` and Cloudflare's current docs, 2026-07-10) — adopting them shifts some
of Stage 4/5's burden from "verify everything locally before pushing" to "the platform catches it
fast, and rollback is one command":

1. **Cloudflare Workers Builds (native GitHub integration)** — connecting the repo gives every PR
   a real `*.workers.dev` preview URL, auto-posted as a PR comment, without a manual `wrangler
   dev` session. This is the single biggest gap: this repo has never done a *remote* Cloudflare
   preview deploy, only local `wrangler dev` — closes CF-MIG-111/CF-MIG-220 in the tracker.
   ([docs](https://developers.cloudflare.com/workers/ci-cd/builds/))
2. **Gradual deployments + version affinity** — ship a risky change to 10% of traffic, watch
   error rates via Observability, ramp or roll back in one command. Makes "is this 100% correct
   before merge" a less load-bearing question — the blast radius of being wrong is capped and
   reversible. ([docs](https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/))
3. **One-command rollback** — up to the last 100 versions, via `wrangler rollback` or the
   dashboard. Means a bounded-timeout mitigation (like this session's `PostgresStore` hang fix)
   can ship with less pre-merge exhaustiveness, because "it broke in prod" has a fast, cheap exit.
   ([docs](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/))
4. **Workers Logs / Traces / Analytics Engine** — real-time console logs and execution traces are
   free and always on. Cheaper and more accurate than trying to predict every runtime edge case
   locally — for CopilotKit/Mastra streaming specifically, this beats guessing at hang causes from
   local reproduction alone.
5. **`wrangler deploy --dry-run`** — validates a Worker bundle without deploying; cheap sanity
   check for config/binding changes, faster than a full `opennextjs-cloudflare build` + local
   `wrangler dev` cycle.

None of this replaces Stage 1–3 (scope, evidence, focused implementation) — it changes what
Stage 4/5 need to prove locally versus what the platform proves for you after merge.
