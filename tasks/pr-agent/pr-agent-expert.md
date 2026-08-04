# PRAGENT-001 — Plan iPix PR-Agent Expert Configuration

> **Status:** PLANNING (docs-only) — no files, workflows, labels, secrets, or GitHub settings change during this task.
> **Docs produced:** this plan only. Implementation is a separate task (see §9).
> **Companion docs:** `tasks/pr-agent/pr-agent-plan.md` (audit + rollout) and `tasks/pr-agent/summary.md`.
> **Verdict v2+v3 applied:** reviewer corrections merged into §4, §5, §6, §7, §9 — v2: manual-command
> allowlist, seeded-defect validation, non-absolute expert rules, docs/config task split, pinned version;
> v3 (PR #802 review): `[config]` vs `[pr_reviewer]` section placement, `publish_output_no_suggestions = false`,
> preferred 9-task numbering, 6-sheet expert pack, prompt-injection claim scoped to context files.

---

## 1. Executive verdict

**ADOPT — with staged context loading, a measured context budget, a seeded-defect validated pilot, and a hardened manual-command gate.**

PR-Agent already reviews every opened/reopened PR via the pinned GitHub Action (`.github/workflows/pr-agent.yml`, SHA `01569655d8b4825bbe599fd5b2a8de59d5c58390`, Bedrock `qwen.qwen3-coder-next`, least-privilege permissions). It produces genuinely useful, cross-referenced findings (verified on PR #791: race condition + missing error handling). Its ceiling is **domain knowledge**: without repo-owned expert context it cannot know iPix stack constraints (RLS policy+grant pairs, CopilotKit `/v2` + AG-UI wiring, `@ag-ui/mastra` bindings, Workers `nodejs_compat` + OpenNext stubs, Mercur commerce ownership). This plan closes that gap with a 7-file expert pack, a staged central-contract-first context strategy, an allowlisted manual-command gate so the hosted AWS-backed reviewer can't be freeloaded by unknown commenters, and a pilot that measures precision as well as recall.

**Key constraints verified (drive the design):**
- `skills.paths` is **host-level only** — a repo `.pr_agent.toml` cannot attach hosted Agent Skills. Repo-owned knowledge flows through `repo_context_files` (+ `extra_instructions`).
- **`repo_context_max_lines` defaults to 500** and `repo_context_files` is a static list that loads on every review — so sheets must stay small and staged; a conditional "load only when domain X changed" is not supported.
- Context loads from the **default branch** (`repo_context_from_default_branch`). This protects the
  **repo context files** (contract + sheets, maintainer-controlled) from PR prompt-injection — but note
  the guarantee is scoped to those context files only. PR **title, description, comments, and diff
  content are still untrusted inputs** that can carry injected instructions; the contract must tell
  the reviewer to treat them as evidence, never as instructions.
- Manual `/` commands on a PR can consume Bedrock resources — the manual-user branch must be guarded by **command + author-association allowlist** (§6).
- Upstream version variance: PyPI `0.41.0` vs release tag `v0.41.1`. Keep the pinned SHA unchanged throughout the initial pilot; upgrade the Action later as its own task.

---

## 2. Current-state audit (verified 2026-08-03)

### 2.1 What exists today

| Item | Verified state |
|---|---|
| Action workflow | Pinned SHA, permissions `contents: read` / `pull-requests: write` / `issues: write`, dotted `aws.*` env keys (Bedrock), `auto_review` enabled |
| Config | `bedrock/qwen.qwen3-coder-next`, `custom_model_max_tokens = 250000` (PR-Agent's session/token "width" cap override for this custom provider; re-validate against the installed upstream default at implementation, retain IPI-519 evidence) |
| Observations | Green runs 2026-08-03; real findings on PR #791; CodeRabbit rate-limited that day ("Review limit reached"); PR-Agent is the dependable channel |
| Docs so far | `tasks/pr-agent/pr-agent-plan.md`, `tasks/pr-agent/summary.md` (+ this file) |

### 2.2 Expert-ness gaps today

1. **No repo context files configured** — `repo_context_files` unset.
2. **No stack cheat sheets** — nothing tells the reviewer which platforms exist, which own which tables, which imports are proven, and which Worker behaviors are intentional.
3. **Context budget unknown** — default 500 lines, never measured.
4. **No false-positive taxonomy** — no shared model of what *not* to flag.
5. **No scoring loop and no seeded-defect gate** — there is no way to measure precision vs recall or prove the reviewer is not hallucinating specialty findings.
6. **Manual `/` commands ungated** — anyone who can comment on a PR can trigger Bedrock-backed commands (needs allowlist in PRAGENT-003 config+workflow task).

### 2.3 Repo facts the expert pack must encode (verified 2026-08-03)

- **Operator app** `app/` — Next.js 16.2.11, React 19.2.1. CopilotKit `@copilotkit/react-core` + `@copilotkit/runtime` **1.61.0** wired over AG-UI via `@ag-ui/client 0.0.57` + `@ag-ui/mastra 1.1.1`. `MastraAgent` is imported from `@ag-ui/mastra` in `app/src/app/api/copilotkit/[[...slug]]/route.ts` (NOT `@copilotkit/runtime`). Route also uses `getCloudflareContext` (`@opennextjs/cloudflare 1.20.2`), `withOperatorAuth` gate, `rejectTenantKeyRewrite`, stream idle timeout.
- **Mastra** `app/src/mastra/` — mastra `1.1.0-alpha.3`, `@mastra/core 1.41.0`, `@mastra/memory 1.0.1-alpha.1`, `@mastra/observability 1.16.2`, `@mastra/pg 1.12.0`. Registry `index.ts` exposes agents (`visual-identity`, `social-discovery`, `brand-intelligence`, `model-match`, `crm-assistant`, `booking` + `durableAgents`) and workflows (`shoot-wizard`, `brand-intelligence`). **`REQUIRED_AGENT_IDS = ["default", "production-planner", "creative-director"]` startup guard** — a renaming that drops any of these must fail boot. 25+ tools, storage mode flag `MASTRA_STORAGE_MODE=noop`, observability exposed opt-in (`MASTRA_OBSERVABILITY_EXPORTER=1`, `MASTRA_SCHEMA=mastra`, `SensitiveDataFilter`).
- **Cloudflare/OpenNext** — `app/wrangler.jsonc`: main `.open-next/worker.js`, `compatibility_flags: ["nodejs_compat"]`, ASSETS, WORKER_SELF_REFERENCE + AI_GATEWAY service bindings (preview/prod), IMAGES, Workers AI `ai` binding (IPI-586), Hyperdrive HYPERDRIVE_FRESH via `getCloudflareContext()` only (IPI-619), observability head_sampling_rate 1, per-env `vars` + `secrets.required: [GEMINI_API_KEY, SUPABASE_SERVICE_ROLE_KEY]`. `open-next.config.ts` = `defineCloudflareConfig` with buildCommand `IPIX_CF_BUNDLE_STUBS=1 MASTRA_STORAGE_MODE=noop npm run build`. **Intentional Wrangler `alias` stubs** (`@ast-grep/napi`, `shiki`, `mermaid`, `katex`, `@copilotkit/web-inspector`) — NOT findings. `@mastra/pg`/`pg` deliberately NOT stubbed (Hyperdrive).
- **Supabase** — 283 migrations, monotonic `YYYYMMDDHHMMSS_name.sql`. Platform patterns (IPI-903/IPI-896): `security invoker`, `set search_path`, explicit `auth.uid()` null check via 42501; **IPI-896 rule: new public tables need explicit `grant … to authenticated` in the same migration** — "RLS on, zero policies, still granted" is the loaded-half/safety-catch model. Findings must verify **policies AND grants**.
- **Commerce ownership split** — Mercur/Medusa (`my-marketplace/`, Postgres :5433) owns products, variants, inventory, carts, orders, sellers, commissions, payments, fulfillment, payouts. Supabase owns identity, asset metadata, brand intelligence, product links, AI agent logs, analytics, embeddings.
- **Doc surface** — no `docs/engineering/` directory yet (creation is part of the docs task). Root `AGENTS.md` + `app/AGENTS.md` are the current baseline.

---

## 3. Official-source findings

Priority: **installed iPix code/versions > official docs > official repos/examples > iPix architecture/tests > blogs.** Every cheat-sheet claim must cite one of these tiers.

### 3.1 PR-Agent (source of truth: The-PR-Agent/pr-agent)

| Claim | Status | Evidence |
|---|---|---|
| `skills.paths` is host-level only (cannot be set from a repo `.pr_agent.toml`) | Verified | PR-Agent Agent Skills docs (host configuration) |
| `repo_context_files`, `repo_context_from_default_branch`, `repo_context_max_lines` (default 500) | Verified | `pr_agent/settings/configuration.toml` |
| `restricted_mode`, `ignore_pr_labels`, `ignore_pr_authors` (under `[config]`); `persistent_comment`, `publish_output_no_suggestions`, `num_max_findings`, `extra_instructions` (under `[pr_reviewer]`) | Verified | same `configuration.toml` — section placement confirmed from the pinned file |
| `repo_context_files` is a static list — no conditional load per changed domain; repositories should override only the settings they need | Verified | configuration options docs warning |
| `github.repo` is the default context set; verify repo context resolution works in the Action runtime (repo checkout present) before relying on it at implementation | Verified | action runtime behavior to re-check |
| Release tag `v0.41.1` (2026-08-01) vs PyPI `0.41.0` | Verified | releases vs `pyproject.toml` — pin SHA, upgrade later |
| `custom_model_max_tokens` = PR-Agent's model-token-cap override for the external model (not a final-report or output limit) | Verified | settings docs — describe as token-cap override, retain IP-519 evidence |

### 3.2 CopilotKit / AG-UI

| Claim | Status | Evidence |
|---|---|---|
| v2 APIs import from `/v2` subpage; v1 imports trigger the repo's build-guard lint | Verified | docs + `app` lint v1-import guard + no v1 imports in installed 1.61.0 |
| AG-UI is the wire protocol (SSE); frontend w/ `@ag-ui/client` + `@ag-ui/mastra`; `MastraAgent` imported from `@ag-ui/mastra`; agent key sync to Mastra registry | Verified | `app/src/app/api/copilotkit/[[...slug]]/route.ts`, `app/AGENTS.md` |
| `with-mastra` archived → monorepo (`@ag-ui/*`) is the supported path | To cite | CopilotKit docs `with-mastra` → monorepo note (fetch exact URL at implementation) |
| Runtime-only failures (e.g. `useAgent: Agent 'default' not found after runtime sync`) — build/lint/tsc cannot catch | Verified | `app/AGENTS.md` + `REQUIRED_AGENT_IDS` guard |

### 3.3 Mastra

| Claim | Status | Evidence |
|---|---|---|
| Tools are typed functions with schemas + executors; registry key = `agentId` shared with frontend `useAgent({ agentId })` | Verified | `app/src/mastra/**` + Mastra docs |
| Cloudflare Workers deployment via OpenNext requires `nodejs_compat`; Node middleware unsupported on Workers | Verified | Cloudflare OpenNext guide + Wrangler config (re-cite exact URL at implementation) |
| Storage `InMemoryStore` default; Postgres + Hyperdrive spike opt-in (IPI-620); `@mastra/pg` real package required there — NOT stubbed | Verified | `app/src/mastra/storage.ts`, `open-next.config.ts` |
| Mastra `mastra dev` CLI requires a named `mastra` export (Proxy pattern in `app/src/mastra/index.ts`) | Verified | `app/src/mastra/index.ts` |

### 3.4 Cloudflare / OpenNext / Wrangler

| Claim | Status | Evidence |
|---|---|---|
| OpenNext on Workers is the foundation (NOT `next-on-pages`) | Verified | `app/open-next.config.ts`, `wrangler.jsonc` |
| `nodejs_compat` is set (compat date 2026-07-08) and Docker/Node aspects exist — **do not** claim "no Node runtime" | Verified | `wrangler.jsonc` → flag only **local-filesystem, native-mod, dynamic-file-load assumptions** not proven by the Cloudflare build + smoke tests |
| Intentional bundle stubs via `alias` — not findings | Verified | `wrangler.jsonc` alias block (IPI-490/706/849) |
| Secrets never in `wrangler.jsonc` — `secrets.required` + GitHub env `--var` injection; Wrangler is SSOT | Verified | `wrangler.jsonc` env blocks (CF-SEC-010) |
| Workers AI binding + AI Gateway service binding; Hyperdrive only via `getCloudflareContext().env` | Verified | `wrangler.jsonc` (IPI-586, IPI-619) |

### 3.5 Supabase

| Claim | Status | Evidence |
|---|---|---|
| RLS finding requires verifying policies **AND grants** (IPI-896 default-privileges revoked; explicit grants now mandatory in the creating migration) | Verified | `20260801091009_ipi896_revoke_default_table_privileges.sql`, `supabase/tests/security/default-table-privileges.sql` |
| Migrations conventions: monotonic timestamp, `security invoker`, `search_path`, `auth.uid()` null 42501, `materialize` RPC patterns | Verified | recent migrations |
| Edge functions (Deno) `supabase/functions/_shared/`; secrets are edge secrets, never client env | Verified | `supabase/functions/**`, AGENTS.md |
| Remote-only: no local `supabase start`; schema ships via `supabase:push` | Verified | AGENTS.md |

### 3.6 Mercur / Medusa

| Claim | Status | Evidence |
|---|---|---|
| `my-marketplace/` owns commerce (catalog, sellers, checkout, Stripe) on Medusa v2, separate Postgres :5433 | Verified | `my-marketplace/AGENTS.md`, `mercur` skill |
| Ownership split above; links bridge the two stores | Verified | AGENTS.md + repo structure |

### 3.7 GitHub Actions

| Claim | Status | Evidence |
|---|---|---|
| Pin actions to SHA; least-privilege `permissions`; secrets via env, not inline | Verified (existing file) | `.github/workflows/pr-agent.yml`, GitHub docs |
| `issue_comment` should be limited to PR review comments (`github.event.issue.pull_request`), plus **role/authority and command allowlists** | Verified | reviewer consensus + official examples; adopt the hardened `if` from §6 |

---

## 4. Expert-pack file plan

New docs-only files; neither wired into CI nor auto-imported. Each 50–100 lines with the same 8-section skeleton:

| # | File | Topic | Primary source tier |
|---|---|---|---|
| 1 | `docs/pr-review-guidelines.md` | **Contract**: stack map, ownership split, gate rules, hard vetoes, source-tier rule | evidence-level: AGENTS.md, this plan |
| 2 | `docs/engineering/pr-agent/supabase.md` | RLS+pol+grants, migrations, edge functions | Tier 1: `supabase/migrations/`, `supabase/functions/` + repo test |
| 3 | `docs/engineering/pr-agent/mastra.md` | Registry keys, tools, workflows, storage, memory, observability | Tier 1: `app/src/mastra/**` |
| 4 | `docs/engineering/pr-agent/copilotkit.md` | `/v2` + AG-UI, `@ag-ui/mastra`, runtime-sync gotcha, route wiring | Tier 1: `app/src/app/api/copilotkit/**`, installed 1.61.0 |
| 5 | `docs/engineering/pr-agent/cloudflare.md` | OpenNext/Workers, nodejs_compat, stubs, bindings, secrets | Tier 1: `app/wrangler.jsonc`, `open-next.config.ts` |
| 6 | `docs/engineering/pr-agent/commerce.md` | Mercur ownership; what to flag/never flag | Tier 1: `my-marketplace/AGENTS.md` |
| 7 | `docs/engineering/pr-agent/github-actions.md` | SHA pinning, permissions, secrets, command-auth | Tier 2: GitHub docs |

### 4.1 Required skeleton (every file)

1. **Purpose**
2. **Verified iPix architecture** (actual repo facts with `file:line` refs where possible)
3. **Blocking violations** — must be raised
4. **Important warnings** — stack-specific constraints
5. **Acceptable patterns** — intentionally-not-flags (stubs, `@ts-expect-error` on `@mastra/memory` beta types, `nodejs_compat`, opt-in observability)
6. **Common false positives** — suppression taxonomy
7. **Required verification commands** — `cd app && npx tsc --noEmit`, `npm run build`, `npm run supabase:verify-rls`, `npm run supabase:verify-edge`, `npm run supabase:verify-brand-intelligence`, `node scripts/seed-sample-brand.mjs` (read-only mentions), Graphify queries
8. **Full official source URLs** — exact links per claim

### 4.2 Expert-rule corrections (reviewer-seated — adopt exactly)

**Supabase**
- Replace "every table needs an org-scoped RLS policy" with:
  > Every tenant-owned table exposed through the Data API must have RLS enabled, appropriate grants, and policies that enforce the correct organization or ownership boundary. Reference and service-only tables require an explicitly documented access model.
- Replace "migrations must be reversible" with:
  > Migrations must be forward-safe for existing production data and include rollback, recovery, or roll-forward instructions appropriate to the change.

**CopilotKit**
- Replace "only `/v2` imports are valid" with:
  > Use import paths and APIs supported by the versions installed in `app/package.json`. Flag imports that conflict with the repository’s proven CopilotKit v2 integration and the TypeScript build.

**Cloudflare**
- Replace "Workers have no Node runtime" with:
  > Worker-bound code must comply with the configured compatibility date and `nodejs_compat`. Flag local-filesystem assumptions, native-module assumptions, unsupported Node APIs, dynamic file loading, or packages not proven by the Cloudflare build and smoke tests. `nodejs_compat` supports many Node APIs, so `path`/`fs` are not automatically defects — the runtime must be tested against the actual Worker configuration.

---

## 5. Proposed context strategy (staged, central-contract-first)

PR-Agent's `repo_context_files` is a static list loaded on every review with a 500‑line default budget. Therefore it cannot conditionally load a sheet when only a given domain changes. The strategy:

1. **Phase A — baseline.** `repo_context_files = ["AGENTS.md", "docs/pr-review-guidelines.md"]`, `repo_context_max_lines = 500`. The contract (file #1) holds the essential cross-domain rules so even the baseline has stack context.
2. **Measure.** Log the effective context size from the run output on 3 varied PRs. Record the number (must be ≤ budget without truncation).
3. **Phase B — specialist sheets.** Add `supabase.md`, `mastra.md`, `copilotkit.md`, `cloudflare.md` **only if** the Phase A pilot shows the domain adds review value vs the contract already encoding their essential rules. Re-measure each addition.
4. **Phase C — niche sheets.** Add `commerce.md`, `github-actions.md` only after B measured; these fire less often (few commerce PRs; workflows rare) so they are the most token-expensive per review.
5. **Advanced option (preferred at Phase C):** keep the essential rules of each domain in the central contract and keep the larger files as maintainers' references (loaded only if specifically justified / on demand), because the static list can't conditionally load per-path.

**Guardrails**
- Never load all 7 on iteration 1 (would overflow the 500 default and silently truncate).
- Do not ship `output_relevant_configurations` as permanent output; use it only during measurement, then remove.
- The **existing pinned Action SHA stays unchanged throughout the pilot** (PRAGENT-009 owns any version bump later).

---

## 6. Proposed minimal `.pr_agent.toml` + workflow hardening (verified keys only)

```toml
# Keys verified against pr_agent/settings/configuration.toml (v0.41.x, pinned 01569655…).
# Section placement matters: repo-wide context/skip keys live under [config],
# reviewer-specific behavior under [pr_reviewer].

[config]
# — model (existing): keep pinned bedrock/qwen.qwen3-coder-next —
model = "bedrock/qwen.qwen3-coder-next"
# custom_model_max_tokens = 250000   # force token cap override; re-validate vs upstream default at implement

# — knowledge (staged, §5) —
repo_context_files = ["AGENTS.md", "docs/pr-review-guidelines.md"]
repo_context_from_default_branch = true   # verified key under [config]
# repo_context_max_lines = 500            # default; raise ONLY after measured overflow (§5)
# Phase B/C entries appended to the list, one config-only PR each

# — noise control (repo-wide) —
restricted_mode = true            # cite-only findings (file:line)
ignore_pr_labels = ["dependencies"]
ignore_pr_authors = ["dependabot[bot]", "renovate[bot]"]
ignore_pr_title = ["^\\[Auto", "^release"]   # optional

[pr_reviewer]
num_max_findings = 15
persistent_comment = true        # one evolving top-level comment, not a new comment per run
publish_output_no_suggestions = false   # FALSE suppresses empty "no major issues" noise (set false, not true)
# caveat (verified upstream): this can also suppress labels + security-only info on clean PRs —
# verify during the seed-defect pilot (§7) that security/ticket lines still appear when needed.
```

**Manual-command trigger (what goes into the config/rollout workflow PR)** — harden the `issue_comment` branch so an unknown external commenter cannot spend Bedrock tokens or run unsupported commands. Use a command **and** an author-association allowlist:

```yaml
(
  github.event_name == 'issue_comment'
  && github.event.issue.pull_request
  && github.event.sender.type != 'Bot'
  && contains(
    fromJSON('["OWNER","MEMBER","COLLABORATOR"]'),
    github.event.comment.author_association
  )
  && (
    startsWith(github.event.comment.body, '/review')
    || startsWith(github.event.comment.body, '/describe')
    || startsWith(github.event.comment.body, '/ask')
    || startsWith(github.event.comment.body, '/improve')
  )
)
```

Explicitly **not** set here: `skills.paths` (host-only), `output_relevant_configurations` (pilot-only debug), `auto_describe`/`auto_improve`.

---

## 7. Pilot and scoring plan

### 7.1 Seeded-defect gate FIRST (recall + precision)

Before reviewing real PRs, run a **controlled validation** over draft test PRs, each with **one known defect**, to prove recall **and** that PR-Agent stays quiet on clean code (precision).

| Test PR | Seeded defect | Expected result |
|---|---|---|
| Supabase | New exposed tenant table without a policy OR grant | One BLOCKING RLS finding (points policy+grant) |
| Mastra | Registry key differs from frontend `useAgent` agentId | One precise mismatch finding |
| CopilotKit | Import known to fail against installed 1.61.0 | One build-compatibility finding |
| Cloudflare | Runtime filesystem-read not bundled into Worker | One Worker-compatibility finding |
| Clean UI/docs | No deliberate defect | **No fabricated finding** |

Close the test PRs unmerged at the end (or revert the deliberate defects) so the defect never ships. Pass bar: catches each defect AND stays silent on the clean PR.

### 7.2 Corpus — representative types (after §7.1 passes)

Pilot across 5 real PR types: Supabase migration/RLS · Mastra/CopilotKit · Cloudflare/OpenNext · TypeScript/UI · Docs-only.

### 7.3 Scoring rubric

| Dimension | Measure |
|---|---|
| Useful findings | accepted by human reviewer |
| Duplicates | # already flagged by CodeRabbit (measured single-champion) |
| Incorrect (false positive) | # wrong per the pack |
| Noise / fluff | trivial comments |
| Evidence | `file:line` per finding |
| Domain expertise | citing a pack rule with the matching source tier |
| Runtime + cost | minutes + tokens context loading |

### 7.4 Promotion gates / parallel reviewers

- **≥70% useful**, **<20% duplicates**, **<10% incorrect**, **0 security incidents** → keep expert sheets + authority.
- Gate failure → roll back phase, fix the sheet (docs PR), re-run on the same corpus.
- **Consolidation of reviewers is a gate condition:** if multiple AI reviewers (CodeRabbit, Seer, Copilot, etc.) remain enabled, pilot measurements are distorted and noise doubles. So, **before promotion**, align reviewers (see PRAGENT-006).

---

## 8. Risks and false-positive controls

| Risk | Control |
|---|---|
| Context overflow silently truncates (default 500) | Measured log per phase (§5) |
| Reviewer greedy on stubs / `nodejs_compat` / opt-in flags | "Acceptable patterns" + cite-only `restricted_mode` |
| "No Node on Workers" absolute claim | §4.2 Cloudflare rewrite — compatibility date + `nodejs_compat`, build/smoke-evidence |
| CopilotKit version drift after upgrade | Sheets pin to installed versions; re-validate at implementation |
| RLS findings ignoring grants | Sheet requires policy+grant verification + `supabase:verify-rls` |
| Commerce findings on frontend | Ownership table + contract rule |
| Host-only `skills.paths` misuse | Noted once — mechanism is `repo_context_files` |
| Untrusted commenter triggers manual `/review` | §6 allowlist (owner/member/collab + command list) |
| Token cost of 7-sheet static load | Phased; central-contract-first; niche sheets on demand |
| Version drift during pilot (0.41.0 vs v0.41.1) | SHA pinned; version upgrade = separate PR (#9) |
| Duplicate noise vs CodeRabbit | First consolidate reviewers (§7.4), then measure duplicates |
| `custom_model_max_tokens` misdescribed | Describe as token-cap override with IP-519 evidence |

---

## 9. Dependency-ordered task plan

> **Numbering note:** this table uses the reviewer-preferred **9-task sequence** (007 = measure,
> 008 = OIDC, 009 = version bump), which `pr-agent-plan.md` (Rollout Gantt) and `summary.md` §8 also
> use. Official Linear IDs include the extra verify-upstream task (IPI-929), so official numbers are
> +1 for rows 2–9; the exact preferred↔official map lives in `reference-registry.md` §7.

Each task = one concern (AGENTS.md): docs never mixed with code; **docs vs config vs pilot** separated. Task IDs provisional; Linear assigns finals.

| Order | ID | Full task name | Contains |
|---|---|---|---|
| 1 | PRAGENT-001 | Audit Existing AI Review Configuration | (done in `pr-agent-plan.md`; reuse, no new work unless gap) |
| 2 | PRAGENT-002 | Add PR-Agent Review Contract and Expert Sheets | docs-only: `docs/pr-review-guidelines.md` + all 6 expert sheets (`supabase`, `mastra`, `copilotkit`, `cloudflare`, `commerce`, `github-actions`). Authoring is one docs concern; only the 4 core sheets are wired into context at PRAGENT-003 (§5 ordering) |
| 3 | PRAGENT-003 | Add Restricted PR-Agent Configuration and GitHub Workflow | config-only + workflow: `repo_context_files` staged Phase A/B (§5), allowlists (manual-command §6), ignore lists, restricted_mode — one config-only PR |
| 4 | PRAGENT-004 | Validate with Controlled Seeded-Defect Test PRs | config/test only: §7.1 corpus; expect 1 finding each, quiet on clean; revert defects |
| 5 | PRAGENT-005 | Pilot across Representative Production PRs | pilot run on 5 real PRs §7.2, scored §7.3 |
| 6 | PRAGENT-006 | Consolidate Automated PR Reviewers | single champion (per §7.4 alignment) |
| 7 | PRAGENT-007 | Measure Accuracy, Noise, and Cost | report/gates per §7.3 / 7.4 |
| 8 | PRAGENT-008 | Replace static AWS creds with GitHub OIDC | infra; dependent on pilot quality |
| 9 | PRAGENT-009 | Test and Upgrade Pinned PR-Agent Action Version | separate because any user-visible change alters settings/prompts/output |

Ordering rationale: docs → config → sealed validation → pilot → consolidate → measure → OIDC → version-upgrade last.

---

## 10. Implementation prompt (copy/paste only on the implementation task, not now)

```
IPI-661 · PRAGENT-002 — Implement iPix PR-Agent expert configuration (review contract + 6 sheets).

follow tasks/pr-agent/pr-agent-expert.md §1–§8. Rules:
1. DOCS/CONFIG ONLY. No source code, no workflow change beyond PR #003's allowlist,
   no label/secret/GitHub surface changes outside the stated tasks.
2. One concern per commit/PR (AGENTS.md). Sheets = docs-only PRs. Config = config-only PR
   (with the §6 workflow allowlist). Pilot = separate.
3. Every sheet uses the 8-section skeleton (§4.1) and cites exact official URLs (§3).
4. Source priority: installed iPix code/versions → official docs → official repos → iPix
   architecture/tests → blogs. Never invent versions or URLs.
5. Verify before claiming: RLS = policies AND grants (IPI-896); CopilotKit imports vs installed
   /v2 + @ag-ui/mastra; Mastra registry keys vs REQUIRED_AGENT_IDS; Workers → build/smoke
   evidence via compatibility date + nodejs_compat (§4.2).
6. Context = §5 staged. Start AGENTS.md + pr-review-guidelines.md at 500; measure; then add 4
   specialist sheets; niche sheets (commerce, github-actions) on demand only. Do NOT load all
   sheets at once.
7. Control: PR #004 seeded-defect corpus must flag and pass precision (quiet on clean).
8. Do NOT set skills.paths (host-only) nor auto_describe/auto_improve. No manual commands
   outside the §6 allowlist.
9. Pilot gates → promotion (≥70% useful, <20% duplicates, <10% incorrect, 0 incidents) before
   any config expansion, single champion after consolidation.
10. Keep the pinned Action SHA during pilot. Version bump = PR #009 separate.
11. Close out: update .claude/skills/pr-agent/ + tasks/pr-agent/summary.md.
```

---

## Appendix A — Implementation sources

- PR-Agent: `github.com/The-PR-Agent/pr-agent` (`configuration.toml`, `docs/`, releases)
- CopilotKit: `docs.copilotkit.ai` (AG-UI, copilot-runtime, mastra integration); AG-UI: `ag-ui.com`
- Mastra: `mastra.ai/docs` (agents, tools, workflows, storage, deployment, observability)
- Cloudflare: `developers.cloudflare.com` (Workers, Wrangler, OpenNext, Workers AI/AI Gateway, Hyperdrive)
- Supabase: `supabase.com/docs/guides/database/postgres/row-level-security` + `supabase/tests/security/*`
- Mercur/Medusa: `my-marketplace/AGENTS.md` + Mercur docs
- GitHub Actions: `docs.github.com/en/actions` (security hardening: permissions, expressions, SHA pinning)