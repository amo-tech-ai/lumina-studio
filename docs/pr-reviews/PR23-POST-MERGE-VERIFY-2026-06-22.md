# PR #23 — Post-Merge Verification Audit

**PR:** [amo-tech-ai/lumina-studio#23](https://github.com/amo-tech-ai/lumina-studio/pull/23) — `chore: vendor Next.js operator app (IPI2-121 + PLT-012)`
**Merged:** 2026-06-22 13:23 UTC · squash commit `ede6747` · review decision **APPROVED**
**Branch verified:** `main` (fast-forwarded from `origin/main`) · **Scope:** `app/` operator app, CopilotKit runtime, Mastra agents, DeepSource/CodeRabbit, Linear
**Method:** every claim verified from source / live runtime / browser. No assumptions. Strict pass/fail.

---

## Verdict: **PASS WITH FOLLOW-UPS**

The vendored Next.js operator app + CopilotKit v2 + AG-UI + Mastra foundation **works correctly on `main`**: clean install, typecheck, lint, build, runtime (3 agents over AG-UI SSE), and a clean browser smoke test with no error overlay. Not 100% — three follow-ups remain (CI does not build `app/`; demo-user identity; one out-of-scope `Supabase Preview` failure on main).

---

## Checklist

| # | Step | Result | Evidence |
|---|---|---|---|
| 1 | Sync `main` | ✅ PASS | `git pull --ff-only` clean; on `main`; tree clean (only untracked `.claude/`). |
| 2 | PR #23 landed cleanly | ✅ PASS | squash `ede6747`; `git ls-files app` = **38**; `app/.git` **not tracked**; `git submodule status` empty. |
| 3 | Leak / security | ✅ PASS | `app/.env`, `app/.env.local`, `app/.next`, `app/node_modules`, `github/`, `.copilotkit/` all **0 tracked**; `.env.example` tracked (placeholders only); secret-pattern scan of tracked `app/` = **0 matches**. |
| 4 | Install + validate | ✅ PASS | `npm ci` exit 0; `npx tsc --noEmit` **0 errors**; `npm run lint` clean; `npm run build` clean (TypeScript step active). |
| 5 | Runtime validation | ✅ PASS | UI `GET /` 200; `/api/copilotkit/info` 200 → agents `[default, production-planner, creative-director]`, `mode: sse`, v`1.61.0`; Mastra `:4111/api` 200; **no** `Agent 'default' not found`. |
| 6 | Browser smoke (Chrome) | ✅ PASS | homepage renders; **no red error overlay**; console **no errors**; no failed `/api/copilotkit` requests (only telemetry POST 202); Threads locked-state shown (no license); CopilotSidebar opens connected. |
| 7 | DeepSource / CodeRabbit | ✅ PASS (w/ note) | `.deepsource.toml` on `main` excludes `app/**` → JS false-positives resolved for future PRs; merge-commit `build` success; PR APPROVED. |
| 8 | Regression checks | ✅ PASS | `ignoreBuildErrors` **absent**; `default` alias + `REQUIRED_AGENT_IDS` guard present; 2 targeted `@ts-expect-error`; package `ipix-operator`; `@ai-sdk/openai` removed; `.env.example` placeholders; `getWeather` hoisted; `defaultOpen` (no `={true}`). |
| 9 | Linear updates | ✅ DONE | IPI2-121 → **Done**; IPI2-124 → **In Progress**; verification comments posted on both. |
| 10 | Final report | ✅ this file | — |

---

## Commands run (key)

```bash
git checkout main && git pull --ff-only origin main && git status --short
git log --oneline -8                       # ede6747 = PR #23 squash
git ls-files app | wc -l                    # 38
git ls-files app/.git ; git submodule status # both empty
for p in app/.env app/.env.local app/.next app/node_modules github; do git ls-files "$p" | wc -l; done   # all 0
git grep -nIE "sk-[A-Za-z0-9]{20}|AIza...|service_role|eyJ..." -- app/ ':!app/package-lock.json'          # 0
cd app && npm ci && npx tsc --noEmit && npm run lint && npm run build   # all clean
npm run dev                                 # UI :3002, Mastra :4111
curl -s localhost:3002/api/copilotkit/info  # 200, 3 agents, mode sse
grep -n ignoreBuildErrors app/next.config.ts            # none
grep -n "REQUIRED_AGENT_IDS\|default:" app/src/mastra/index.ts   # guard + alias present
grep -n app/ .github/workflows/ci.yml       # NONE — app/ not in CI (follow-up)
```

## Browser notes

Screenshot captured at `localhost:3002/?postmerge=1` (Chrome MCP): three-pane layout — **left** Threads "licensed feature" locked card (expected, no `COPILOTKIT_LICENSE_TOKEN`); **center** Proverbs workspace rendering the seeded agent-state proverb; **right** CopilotSidebar "👋 Hi, there! You're chatting with an agent." with all six suggestion chips and message input. No Next.js error overlay; `onlyErrors` console read returned none; network filter showed only `telemetry.copilotkit.ai/ingest` (202). Did not send a live chat message (would call Gemini); sidebar render + connected state is sufficient for "sidebar opens".

---

## Errors found & status

| Sev | Finding | Status |
|---|---|---|
| 🔴 High (was) | `useAgent: Agent 'default' not found after runtime sync` — prebuilt UI resolves a `default` agent the renamed registry didn't define. **Build/lint/tsc could not catch it (runtime-only).** | **FIXED** pre-merge — `default` alias → production-planner + startup registry guard (`REQUIRED_AGENT_IDS`). Verified gone on `main`. |
| 🟠 Med | **CI does not build `app/`** — `ci.yml` has only the Vite root `build` job. app/ regressions (type errors, the registry guard) won't be caught by CI. | **OPEN** → IPI2-124 (CI split). |
| 🟠 Med | `Supabase Preview` check **failure** on merge commit `ede6747`. | **OUT OF SCOPE** (Supabase migration/branch-preview, PLT-010 area — not touched per instructions). Flagged for the Supabase owner. |
| 🟡 Low | `demo-user` identity in `route.ts` → all users share one thread history. | **TRACKED** IPI2-127 (gate before multi-user). |
| 🟡 Low | `useInterrupt` HITL exists only as the demo moon gate; live approval round-trip not exercised. | **TRACKED** IPI2-114 (real production-planner HITL). |
| ⚪ Info | Preview model `gemini-3-flash-preview`; in-memory LibSQL (ephemeral). | **TRACKED** AI-018 / AIOR-005/001. |

## Fixes needed (ranked)

1. **High:** Add a Next/`app` CI job (`cd app && npm ci && npm run build && npx tsc --noEmit`) independent of the Vite env guard — closes IPI2-124 acceptance and makes app/ regressions CI-visible.
2. **Medium:** Investigate `Supabase Preview` failure on `main` (Supabase owner; out of this scope).
3. **Low:** Replace `demo-user` identity before any multi-user deploy (IPI2-127).

## Linear updates completed

- **IPI2-121 · SHOOT-UX-000** → **Done** (`completedAt` set) + verification comment.
- **IPI2-124 · PLT-012** → **In Progress** (was Backlog) + comment noting vendoring done, CI split remaining.

---

## Foundation fixes that shipped in PR #23 (post-audit, squashed into `ede6747`)

| Commit (pre-squash) | Change |
|---|---|
| `e0763c7` | a11y + type-safety + error-handling batch (button/proverbs `type`+`aria-label`, `z.infer` AgentState, threads-drawer error feedback, `:memory:` unify, LOG_LEVEL validation, `ipix-operator` rename, drop `@ai-sdk/openai`, README+`.env.example` → `GEMINI_API_KEY`, license-token guard). |
| `fe9be2f` | Restore typecheck gate — drop `ignoreBuildErrors`, 2 targeted `@ts-expect-error` on `@mastra/memory` beta. |
| `c1e7ee9` | Fix `Agent 'default' not found` — register `default` alias + lift `CopilotChatConfigurationProvider`. |
| `7f27ca6` | Registry guard — fail fast if a required agent id is missing. |
| `64ad486` | DeepSource: hoist `getWeather` (no-use-before-define); `defaultOpen={true}` → `defaultOpen`. |
