# PR-Agent customization plan for iPix (lean, verified)

> Status: **execution SSOT** — incorporates forensic notes (`02-notes.md`, `03-notes.md`) after evidence check against live pilot + installed packages.  
> Upstream: [The-PR-Agent/pr-agent](https://github.com/The-PR-Agent/pr-agent) · [docs](https://docs.pr-agent.ai/) · [config](https://docs.pr-agent.ai/usage-guide/configuration_options/) · [repo context](https://docs.pr-agent.ai/usage-guide/additional_configurations/#bringing-per-repo-context-files-to-pr-agent) · [Action](https://docs.pr-agent.ai/installation/github/#run-as-a-github-action)

---

## Notes verification (02 + 03)

| Claim (source) | Verdict | Evidence |
|----------------|---------|----------|
| Lean A→B→C / skip org + merge gates + satellites (02, 03) | ✅ Keep | Matches PR-Agent minimal-config guidance |
| Day-0: tighten `extra_instructions` → calibrate → standards only if needed (03) | ✅ Adopt | Lowest effort; standards file before evidence is optional |
| Call 3–5 PRs **calibration**, not benchmark % (02, 03) | ✅ Adopt | Count gates, not fake 90% recall |
| `bedrock/us-east-1/qwen...` is wrong (02) | ✅ Correct finding | Live pilot already uses `bedrock/qwen.qwen3-coder-next` + `aws.AWS_REGION_NAME=us-east-1` in [`.github/workflows/pr-agent.yml`](../../.github/workflows/pr-agent.yml) |
| Identical `fallback_models` useless (02) | ✅ Adopt | Use `[]` until a second model is verified |
| Pin Action SHA (02, 03) | ✅ Already done | `the-pr-agent/pr-agent@01569655d8b4825bbe599fd5b2a8de59d5c58390` |
| Workflow `types` must match `pr_actions` (02) | ✅ Already matched | both `opened/reopened/ready_for_review` |
| Path triggers are guidance, not a router (02) | ✅ Adopt | Require cite touched file / affected contract |
| `custom_model_max_tokens=250000` vs `max_model_tokens=32000` (02) | 🟡 Partial | Live pilot already sets 250000 and runs; **do not change in Task A**. Only revisit if C shows clip/timeout/cost pain — then set `max_model_tokens` in tandem |
| Omit full `AGENTS.md` from `repo_context_files` (01, 02) | ✅ Keep | 246-line AGENTS.md burns budget; 03’s “load both” only if standards ≤150 lines |
| CopilotKit: v2 uses only `showDevConsole`; drop `enableInspector` (02) | ❌ Reject for iPix | `@copilotkit/react-core@1.61.0` wrapper: `enableInspector` → inspector; `showDevConsole` → banners. Marketing chat correctly sets **both** false ([#424](https://github.com/amo-tech-ai/lumina-studio/pull/424)) |
| OpenNext: flag `runtime = "edge"` (02) | ✅ Adopt | Adapter does not support Next Edge runtime |
| Hyperdrive driver/PREPARE rules (02) | ✅ Adopt | Request-scoped client; no SQL PREPARE/EXECUTE |
| Narrow “Mastra → DB write ❌” (02) | ✅ Adopt | Ban unapproved **business** writes; allow documented memory/storage |
| Separate official vs iPix invariants (02) | ✅ Adopt | Label `iPix invariant` |
| CI: capabilities not hard-coded job names (02) | ✅ Adopt | |
| Compat-date severity evidence-based (02) | ✅ Adopt | |
| Remove “D1” from generic ladder title (02) | ✅ Adopt | D1 only if PR touches D1 |
| `restricted_mode` / no untrusted checkout (02) | ✅ Note | Current workflow: `contents: read`, no checkout step — good. Don’t flip `restricted_mode` until C proves tools still work |
| Load AGENTS.md + standards always (03) | ❌ Prefer omit AGENTS | Budget; put 15-line contract inside standards |

**Net:** 02 is strong on config/OpenNext/Hyperdrive/calibration; wrong on CopilotKit for this pin. 03 is right on leaner sequencing; soften dual-file context loading.

---

## Efficiency decision

| Skip / defer | Why |
|--------------|-----|
| Four satellite `*-review.md` | Not in `/review` context |
| Org `pr-agent-settings` | Single-repo pilot |
| AI merge gates | CI stays authoritative |
| Full `AGENTS.md` in `repo_context_files` | 246 lines; budget |
| Changing live Bedrock model string / token knobs in Task A | Already working; don’t fix what isn’t broken |

### Ship sequence (leanest)

```text
A. Config-only  → sharpen .pr_agent.toml (keep working Bedrock/Action settings)
C. Calibrate    → /config + /review on 5 known PRs (count gates; include clean control)
B. Docs-only    → docs/pr-agent/review-standards.md ONLY if C shows recurring misses
— stop —
```

Optional day-0: A with `extra_instructions` only (no `repo_context_files` yet) → C → add B if needed.

---

## Architecture

```text
.pr_agent.toml (minimal overrides)
  → optional repo_context_files = ["docs/pr-agent/review-standards.md"]  # after B merges
  → ≤500 rendered lines (wrappers included) → target standards 150–180 lines
  → path guidance (not deterministic routing)
  → CI = merge gate; PR-Agent = advisory
```

---

## A — Config-only PR

Extend [`.pr_agent.toml`](../../.pr_agent.toml). **Do not** change Action pin or region env unless broken.

```toml
[config]
# LIVE convention (verified): model id after bedrock/; region via Action env
model = "bedrock/qwen.qwen3-coder-next"
fallback_models = []

# Leave custom_model_max_tokens as in live pilot until C proves a problem.
# custom_model_max_tokens = 250000

# Add only after B merges on default branch (missing files are skipped silently)
# repo_context_files = ["docs/pr-agent/review-standards.md"]
repo_context_from_default_branch = true
repo_context_max_lines = 500
output_relevant_configurations = false

[github_action_config]
auto_review = true
auto_describe = false
auto_improve = false
pr_actions = ["opened", "reopened", "ready_for_review"]

[pr_reviewer]
require_tests_review = true
require_security_review = true
require_ticket_analysis_review = true
require_can_be_split_review = false
num_max_findings = 5
persistent_comment = true

extra_instructions = """\
Senior iPix platform engineer review.

Apply domain guidance only when the PR changes a relevant path or directly affects
that runtime contract. Every finding must cite a touched file, diff evidence, or an
explicit iPix invariant.

Focus surfaces: Cloudflare Workers/OpenNext deploy+bindings+secrets; Hyperdrive
request-scoped DB; AI Gateway binding/routing/timeouts; Mastra registry/tools/HITL/
Workers-safe storage; Supabase RLS/tenant/SECURITY DEFINER; CopilotKit v2 agentIds,
auth, streams; CI/security when those paths change.

Report: Severity; file:line; verified problem; iPix impact; minimal fix; Blocking Y/N;
verification level (Unit|Build|Preview|Production|NOT VERIFIED).

Do not invent APIs, bindings, schema, env vars, or production evidence.
Never say production-ready from the diff alone. Ignore formatting-only nits.
One concern per PR (iPix invariant).
"""

[pr_code_suggestions]
focus_only_on_problems = true
suggestions_score_threshold = 7

extra_instructions = """\
High-confidence minimal fixes only. No drive-by refactors, no disabling checks, no secrets in source.
"""

[pr_description]
generate_ai_title = false
add_original_user_description = true
enable_pr_diagram = false
publish_labels = false

extra_instructions = """\
Preserve IPI-XXX · TASK-ID — Plain English titles.
If suggesting body edits, use: What / Does not / One concern / Why in iPix / Test plan.
"""

[ignore]
glob = [
  "**/.next/**", "**/.open-next/**", "**/node_modules/**", "**/dist/**",
  "**/coverage/**", "**/cloudflare-env.d.ts", "**/graphify-out/**",
  "**/.@worktrees/**", "**/github/**", "**/*.min.js", "**/*.map",
]
```

### Task A acceptance criteria

- [ ] `/config` shows intended model `bedrock/qwen.qwen3-coder-next` and region via Action
- [ ] `/review` completes on a real PR
- [ ] Workflow `on.pull_request.types` == `github_action_config.pr_actions`
- [ ] Action remains SHA-pinned (not `@main`)
- [ ] No `PR_AGENT_CONFIG_BRANCH` / `--config-branch` from PR head
- [ ] Config PR does not mix docs or unrelated workflow rewrites
- [ ] Keep `contents: read` + no PR-head checkout while holding Bedrock secrets

Action env (already correct — do not regress):

```yaml
aws.AWS_REGION_NAME: "us-east-1"
config.model: "bedrock/qwen.qwen3-coder-next"
uses: the-pr-agent/pr-agent@01569655d8b4825bbe599fd5b2a8de59d5c58390
```

---

## C — Calibrate (ops; after A on default branch)

Not a statistical benchmark. Five PRs:

| # | Kind | Role |
|---|------|------|
| 1 | [#424](https://github.com/amo-tech-ai/lumina-studio/pull/424) CopilotKit | Known inspector/banner contract |
| 2 | Cloudflare/OpenNext | Deploy/bindings/secrets |
| 3 | Supabase RLS/migration | RLS / SECURITY DEFINER |
| 4 | Mastra tool/agent | Registry / HITL / storage |
| 5 | Clean PR | False-positive control |

**Count gates (replace %):**

```text
Known critical defects detected:  ≥ 4 of 5
False blockers:                   0
Unsupported factual claims:       0
Duplicate findings:               ≤ 1
Useful minimal fixes:             ≥ 4 of findings reviewed
Action/review completed:          5 of 5
```

Per-PR log: PR · seeded defect · detected Y/N · severity · false blocker · unsupported claim · usable fix · `/config` snapshot.

| C result | Next |
|----------|------|
| Passes | **Stop** |
| Same domain miss repeatedly | Task B — only that section |
| Excess false positives | Narrow path guidance / shorten instructions |
| Timeouts/clipping | Then consider `ai_timeout` / `max_model_tokens` |
| CI rung missed often | Later: artifacts inject |

---

## B — `docs/pr-agent/review-standards.md` (only if C needs it)

Docs-only PR. **150–180 dense lines** (not 220–250). Structure:

1. Contract (≤15 lines)  
2. Path guidance disclaimer  
3. Official platform constraints  
4. `iPix invariant` block  
5. Dense checklists  
6. Finding format  

### Path guidance (honest)

```text
Path tables are reviewer guidance, not enforced routing.
Emit a domain finding only if:
(1) the PR changes a relevant path, or
(2) the changed code directly affects that domain.
Cite the touched file or runtime contract.
```

### Checklists (corrected)

#### Cloudflare deployment 🔴

`wrangler.jsonc` · `compatibility_date` · `compatibility_flags` (incl. `nodejs_compat`) · bindings↔Env · routes · assets/`_headers` · migrations **only if present** · secrets never in `vars` · preview vs prod · upload/version · rollback note.

Compat-date severity: **High** only without build/preview evidence or known break; **Medium** if validation thin; **none** if impact+evidence present.

Refs: [best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/) · [bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/) · [secrets](https://developers.cloudflare.com/workers/configuration/secrets/) · [compat dates](https://developers.cloudflare.com/workers/configuration/compatibility-dates/)

#### OpenNext 🔴

Use OpenNext CLI for the Next app; avoid raw Wrangler unless OpenNext docs require it or PR explains. Cache/R2 · middleware/handlers must be **Workers/OpenNext-compatible** · flag `export const runtime = "edge"` · server actions/streaming · image/ISR assumptions · Node APIs incompatible with Workers.

Refs: [OpenNext CF](https://opennext.js.org/cloudflare/) · [get started](https://opennext.js.org/cloudflare/get-started) · [CLI](https://opennext.js.org/cloudflare/cli)

#### AI Gateway 🔴

Binding · fallback/provider priority · retries/timeouts · logging without secrets · rate/cost if claimed · opt-in routing must not break tool-heavy Mastra agents when product rule is direct Gemini.

Ref: [Worker binding methods](https://developers.cloudflare.com/ai-gateway/usage/worker-binding-methods/)

#### Hyperdrive 🔴

New client per request (no cross-request I/O reuse) · supported driver · Postgres.js `prepare`/`fetch_types` as applicable · **no** SQL `PREPARE`/`EXECUTE`/`DEALLOCATE`/`DISCARD` · short transactions (pooling) · idempotent retries · least-privilege role / `NOBYPASSRLS` where required.

Refs: [Hyperdrive](https://developers.cloudflare.com/hyperdrive/) · [Postgres](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/) · [Supabase](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/supabase/)

#### Runtime verification ladder 🔴

```text
Code → Tests → Typecheck → Build → Preview → Production
```

Missing rung → **NOT VERIFIED**. Local ≠ production. No “looks good for production” from diff alone. Mention D1 **only** if PR adds/changes D1.

#### CI 🟡

When workflows/CI change: keep capabilities — lint · typecheck · tests · Next/OpenNext build · schema/RLS when SQL changes · preview when runtime config changes. Prefer capabilities over brittle job-name equality.

#### Packages 🟡

`package.json` + matching lock · no accidental lock-manager churn · majors need notes · CopilotKit/Mastra/AI majors High-touch.

#### Security 🟡

Secrets/keys · JWT/cookies/headers · CORS/CSP · service role server-only · `NEXT_PUBLIC_*` non-sensitive · Workers secrets vs `vars` · auth on agent/API routes.

#### Architecture 🟡

```text
Official-ish:
  CopilotKit UI → runtime route → Mastra → tools     ✅
  Client → provider API keys                         ❌

iPix invariant:
  Consequential business writes: Tool → RPC/service → Supabase (+ HITL)  ✅
  Mastra agent → unapproved privileged business DB write                 ❌
  Mastra memory/PostgresStore / approved infra persistence               ✅ when documented
  no top-level getMastra() in Next route modules                         ❌ (iPix)
  remote-only Supabase (no local supabase start as truth)                iPix
  one concern per PR                                                     iPix
```

#### CopilotKit (iPix @ 1.61.0) 🟡 — **corrected vs 02-notes**

Installed wrapper (`@copilotkit/react-core` 1.61.0 `CopilotKit`):

| Prop | Effect |
|------|--------|
| `enableInspector` | Inspector / thread-store path (`/threads`) |
| `showDevConsole` | ToastProvider / usage banners (`undefined` → localhost) |

Rules:

- Prefer `@copilotkit/*/v2` imports; flag v1 patterns when CI/repo bans them (`iPix invariant`).
- `agentId` = Mastra registry key = agent `id`.
- Public/marketing chat: **`enableInspector={false}` and `showDevConsole={false}`** (both).
- Do not tell authors to “replace enableInspector with showDevConsole” on this wrapper — that regresses the `/threads` fix.

#### Testing 🟡

Surface→expect: unit · route/integration · RLS/pgTAP · edge · Workers/build:cf note · Mastra tool/HITL · CopilotKit contract · Hyperdrive/Gateway probe or Local Runtime Verified. Missing high-value test on High/Blocker = finding.

#### Mastra / Supabase (compact)

- Mastra: registry · schemas · HITL · Workers-safe storage · [docs](https://mastra.ai/docs)
- Supabase: RLS · tenant · service role server-only · migrations · SECURITY DEFINER + `search_path` · [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)

### Finding format

```text
Severity: Blocker|High|Medium|Low
File:line:
Verified problem:
Why it matters (iPix):
Minimal fix:
Official reference OR "iPix invariant":
Blocking: Yes/No
Verification level: Unit|Build|Preview|Production|NOT VERIFIED
```

---

## Deferred

| Item | When |
|------|------|
| Satellite domain docs | `/help_docs` actually used |
| Org `pr-agent-settings` | ≥2 repos |
| AI merge block | Never by default |
| Raise token limits / `ai_timeout` | C proves need |
| `restricted_mode = true` | After confirming Action tools OK |
| `[artifacts]` CI inject | C misses CI rung often |

---

## Gap map (Issues 1–10)

| # | Gap | Status in this plan |
|---|-----|---------------------|
| 1 | CF deploy checklist | B checklist + A instructions |
| 2 | OpenNext | Corrected (no Edge runtime) |
| 3 | AI Gateway depth | B checklist |
| 4 | Hyperdrive depth | Driver/PREPARE precise |
| 5 | Verification ladder | Renamed; no generic D1 |
| 6 | CI | Capability-based |
| 7 | Packages | B |
| 8 | Security | B |
| 9 | Boundaries | Narrowed + iPix labels |
| 10 | Testing matrix | B |

---

## Anti-patterns

| Wrong | Right |
|-------|-------|
| Region inside `bedrock/` model string | `bedrock/<model-id>` + `aws.AWS_REGION_NAME` |
| Same model as fallback | `fallback_models = []` |
| `@main` Action | Keep commit SHA pin |
| Fake 90% recall on 5 PRs | Count gates |
| Path tables as hard router | Guidance + cite evidence |
| Drop `enableInspector` on 1.61.0 wrapper | Keep both props false on marketing |
| Ban all Mastra DB access | Ban unapproved business writes only |
| Load AGENTS.md + fat standards | One 150–180 line file |
| Standards before calibration | C first; B if needed |

---

## Linear naming

```text
IPI-XXX · PRAGENT-A — Tighten .pr_agent.toml review instructions (config-only)
IPI-XXX · PRAGENT-C — Calibrate PR-Agent on five historical PRs (ops)
IPI-XXX · PRAGENT-B — Add docs/pr-agent/review-standards.md if calibration gaps (docs-only)
```

---

## Reference index

| Topic | URL |
|-------|-----|
| Overview | https://docs.pr-agent.ai/ |
| Config | https://docs.pr-agent.ai/usage-guide/configuration_options/ |
| Repo context / ignore | https://docs.pr-agent.ai/usage-guide/additional_configurations/ |
| Automation | https://docs.pr-agent.ai/usage-guide/automations_and_usage/ |
| Review | https://docs.pr-agent.ai/tools/review/ |
| GitHub Action | https://docs.pr-agent.ai/installation/github/#run-as-a-github-action |
| Defaults | https://github.com/The-PR-Agent/pr-agent/blob/main/pr_agent/settings/configuration.toml |
| OpenNext CLI | https://opennext.js.org/cloudflare/cli |
| Hyperdrive Postgres | https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/ |
| CopilotKit + Mastra | https://docs.copilotkit.ai/mastra |
