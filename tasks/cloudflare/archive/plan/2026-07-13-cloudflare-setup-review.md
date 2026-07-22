# Cloudflare Setup Review — 2026-07-13

## What this is

This reviews iPix's **actual, already-deployed** Cloudflare setup — Next.js on Workers via OpenNext, Workers AI model selection, AI Gateway routing, the standalone `services/cloudflare-worker` — against current official Cloudflare best practice. It is scoped deliberately narrower than the original prompts in `tasks/cloudflare/prompts/`, which covered hypothetical app shapes iPix doesn't have (new app from scratch, static HTML, Vite, standalone runtime, a generic AI agent). This doc supersedes re-deriving architecture decisions that are already settled — see "what we did NOT re-litigate" below.

Plain English: we checked the Cloudflare pieces iPix actually runs today, not a textbook "how would you build this from zero" exercise.

## Table of contents

| # | Topic | Docs | GitHub | Template | Dashboard | CLI | Status |
|---|-------|------|--------|----------|-----------|-----|--------|
| 1 | [Next.js → Workers via OpenNext](#1-nextjs-app--cloudflare-workers-via-opennext) | ✅ | — | ✅ | — | ✅ | 🟢 |
| 2 | [Workers AI model selection](#2-workers-ai-model-selection-chattoolembeddingvisionfallback) | ✅ | ✅ | — | — | — | 🟡 |
| 3 | [AI Gateway configuration](#3-ai-gateway-configuration) | ✅ | — | — | ✅ | — | 🟡 |
| 4 | [services/cloudflare-worker standalone Worker](#4-servicescloudflare-worker-standalone-worker-ai-gateway) | ✅ | — | — | ✅ | ✅ | 🟡 |
| 5 | [CI/CD for Cloudflare deployment](#5-cicd-for-cloudflare-deployment) | ✅ | ✅ | — | ✅ | — | 🟡 |

Legend: ⬜ Not started · 🟡 Gap found, task doc written · 🟢 Already optimal, no action needed · 🔴 Blocked/unverified.

## What we did NOT re-litigate

These decisions are already settled in prior docs and were treated as given, not reopened:

| Settled decision | Where it's recorded |
|---|---|
| Cloudflare (not Vercel) is the deploy target, chosen for AI Gateway's caching/rate-limit/fallback/logging | `tasks/cloudflare/ai-provider-decision.md` |
| OpenNext adapter (not a hand-rolled Workers adapter) is the correct way to run Next.js on Workers | `app/wrangler.jsonc`, `app/open-next.config.ts` (both already match the official `@opennextjs/cloudflare migrate` output shape) |
| `wrangler.jsonc` (not legacy `wrangler.toml`) is the config format going forward | both `app/` and `services/cloudflare-worker/` already use it |
| Multi-provider abstraction (Workers AI + Gemini + Bedrock behind one interface) is a deliberate architecture choice, not an accident | `services/cloudflare-worker/src/providers/workers-ai.ts` design, confirmed in verdict #2 below |
| `llama-4-scout-17b-16e-instruct` as the current default/fast model is not deprecated | re-verified live against `model-registry.ts` on disk — the deprecated-model finding in `tasks/cloudflare/pr/MODEL-AUDIT-OFFICIAL-DOCS-2026-07-12.md` referred to a different code path (PR #340's proposed diff), not the live registry |

Plain English: don't re-argue "should we even be on Cloudflare" or "should Next.js use OpenNext" — those are done. This review only asks "is each already-built piece configured the current best way."

## Existing docs to consolidate/archive (flag only, not deleted)

| Doc | Why it's flagged |
|---|---|
| `tasks/cloudflare/plan/summary-plan.md` | Claims "push to main → automatic build and deploy... GitHub Actions running." Contradicted by direct grep of `.github/workflows/ci.yml` (zero wrangler/cloudflare/opennext references) and by `tasks/cloudflare/audits/AUDIT.md` (IPI-472). Stale/aspirational, not current state. |
| `tasks/cloudflare/pr/ARCHITECTURE-REDESIGN.md` | Untracked (`git status` shows `??`), never committed. Contains a real, already-correct migration analysis (custom gateway code vs. managed AI Gateway) that this review independently reconfirms — should be committed, not left to rot untracked. |
| `tasks/cloudflare/Tasks/053-CF-MIGRATION-cleanup-custom-code.md` | Same as above — untracked, already-correct plan (16 components marked REMOVE, 5 REPLACE), should be committed rather than re-derived later. |
| `.claude/skills/cloudflare/references/email-routing/configuration.md` (lines ~168-186) | Contains a stale hand-rolled CI/CD snippet (`actions/checkout@v3`, raw `npx wrangler deploy`) instead of the current official `cloudflare/wrangler-action@v3`. Update when touching that reference. |
| `tasks/cloudflare/pr/MODEL-AUDIT-OFFICIAL-DOCS-2026-07-12.md` | Flags a deprecated model ID that applies to PR #340's proposed diff, not the live `model-registry.ts` on disk. Keep for history, but label clearly so it isn't mistaken for a live-state finding. |

Plain English: nobody deletes anything here — just marking which docs are out of date or unpublished so the next person doesn't trust them at face value.

---

## 1. Next.js (app/) → Cloudflare Workers via OpenNext

**Status: 🟢 Already optimal, no action needed.**

iPix already uses the official `@opennextjs/cloudflare` adapter (v1.20.1, matches current npm latest). `app/wrangler.jsonc` and `app/open-next.config.ts` already match the exact shape the official `npx @opennextjs/cloudflare migrate` command itself generates — `main=.open-next/worker.js`, `nodejs_compat` flag, assets binding, `defineCloudflareConfig({})`. `compatibility_date` is `2026-07-08`, well past the 2024-09-23 minimum. `package.json` scripts already call the official CLI subcommands (`build`/`preview`/`deploy`/`upload`).

Only non-blocking housekeeping: `wrangler` devDependency is 4.107.1 vs. current 4.110.0 (3 patch releases behind) — bump next time deps are refreshed, not worth its own task.

No task doc written — nothing to fix.

## 2. Workers AI model selection (chat/tool/embedding/vision/fallback)

**Status: 🟡 Gap found, task doc written.**

Task doc: [`tasks/cloudflare/plan/CF-100-workers-ai-model-selection-chat-tool-embedding-vision-fallback-services-cloudflare-worker.md`](./CF-100-workers-ai-model-selection-chat-tool-embedding-vision-fallback-services-cloudflare-worker.md)

Two narrow gaps, not a broken-model gap (the live registry is clean today):

1. iPix authenticates to Workers AI via account-ID + API-token REST calls instead of the zero-config native `ai` binding — a defensible tradeoff (one HTTP interface shared across workers-ai/gemini/bedrock), but undocumented as intentional, so a future reviewer could "fix" it back.
2. A better tool-calling tier (`@cf/zai-org/glm-4.7-flash`) already exists, built and tested, on sibling branch `ipi/342-tool-routing-fix` (commit `75e2371d`) but hasn't been merged into this branch — the live registry reuses the general-purpose model for both `default` and `fast` instead.

Plain English: the model picker mostly works, but a better tool-calling model is already built on another branch and just needs merging in — and one config choice (skipping Cloudflare's simplest built-in AI binding) needs a one-line comment explaining why, so nobody "fixes" it by accident.

## 3. AI Gateway configuration

**Status: 🟡 Gap found, task doc written.**

Task doc: [`tasks/cloudflare/plan/CF-101-ai-gateway-configuration-services-cloudflare-worker-app-src-lib-ai-routing.md`](./CF-101-ai-gateway-configuration-services-cloudflare-worker-app-src-lib-ai-routing.md)

iPix does not route through Cloudflare's managed AI Gateway product at all — `AI_GATEWAY_URL` is unset everywhere outside tests/docs, so production hits Workers AI directly. Instead, `services/cloudflare-worker` hand-rolls ~1,400+ LOC reimplementing exactly what the managed AI Gateway gives for free (model registry, provider adapters, fallback/retry classifier, error envelope, console.log observability). Two untracked planning docs already reach this same conclusion independently. Work is trending the wrong direction: IPI-526 (merged 2026-07-12) added *more* custom fallback/retry logic into the exact code path flagged for deletion.

Plain English: iPix built its own version of a Cloudflare feature that already exists for free, and just added more code to the homemade version instead of switching to the real one.

## 4. services/cloudflare-worker standalone Worker (ai-gateway)

**Status: 🟡 Gap found, task doc written.**

Task doc: [`tasks/cloudflare/plan/CF-102-services-cloudflare-worker-standalone-worker-ai-gateway.md`](./CF-102-services-cloudflare-worker-standalone-worker-ai-gateway.md)

Config itself (wrangler.jsonc format, `compatibility_date`, `nodejs_compat`, `keep_vars`, `observability.enabled`, wrangler CLI version) is already current — no action needed there. The gap is deployment: `wrangler deploy` is run manually from a developer machine, with zero CI/CD, no rollback runbook, and only a boolean observability flag. This is already a known, tracked backlog item (IPI-472, scored 40/100 by a prior forensic audit) — this review reconfirms it, doesn't discover it new.

Plain English: the Worker's settings are fine, but someone still has to type a deploy command by hand every time — Cloudflare has a one-time dashboard button that removes that step entirely.

## 5. CI/CD for Cloudflare deployment

**Status: 🟡 Gap found, task doc written.**

Task doc: [`tasks/cloudflare/plan/CF-103-ci-cd-for-cloudflare-deployment-services-cloudflare-worker-the-ai-gateway-worker.md`](./CF-103-ci-cd-for-cloudflare-deployment-services-cloudflare-worker-the-ai-gateway-worker.md)

`.github/workflows/ci.yml` only lints/builds/tests the Next.js app and runs Supabase RLS checks — it never touches `services/cloudflare-worker`, and there is no `deploy.yml`. The one existing CI/CD snippet in the repo (buried in a skill reference doc) is stale, using `actions/checkout@v3` and raw `npx wrangler deploy` instead of the current official `cloudflare/wrangler-action@v3`.

Plain English: same root problem as #4, from the CI side — there's no automated pipeline at all for this Worker, just a stale reference snippet nobody wired up.

---

## Closing summary

- **Components reviewed:** 5
- **Real gaps found:** 4 of 5 (all but Next.js/OpenNext, which is already optimal)
- **Task docs written this run:** 4
  - [`CF-100-workers-ai-model-selection-chat-tool-embedding-vision-fallback-services-cloudflare-worker.md`](./CF-100-workers-ai-model-selection-chat-tool-embedding-vision-fallback-services-cloudflare-worker.md)
  - [`CF-101-ai-gateway-configuration-services-cloudflare-worker-app-src-lib-ai-routing.md`](./CF-101-ai-gateway-configuration-services-cloudflare-worker-app-src-lib-ai-routing.md)
  - [`CF-102-services-cloudflare-worker-standalone-worker-ai-gateway.md`](./CF-102-services-cloudflare-worker-standalone-worker-ai-gateway.md)
  - [`CF-103-ci-cd-for-cloudflare-deployment-services-cloudflare-worker-the-ai-gateway-worker.md`](./CF-103-ci-cd-for-cloudflare-deployment-services-cloudflare-worker-the-ai-gateway-worker.md)

**Single highest-priority next action:** commit the two untracked planning docs (`tasks/cloudflare/pr/ARCHITECTURE-REDESIGN.md` and `tasks/cloudflare/Tasks/053-CF-MIGRATION-cleanup-custom-code.md`) so the already-done AI Gateway migration analysis isn't lost, and freeze further custom routing/fallback additions to `services/cloudflare-worker` (component #3) until that migration is scheduled — IPI-526 already moved in the wrong direction once.
