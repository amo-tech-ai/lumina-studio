# Mastra / AI-Agent Architecture Docs — Forensic Reconciliation

**Date:** 2026-07-09
**Scope:** `tasks/cloudflare/mastra/*`, `tasks/cloudflare/plan/ai-agent-architecture.md`, ground truth in `app/src/mastra/`, `app/src/lib/ai/`, `services/cloudflare-worker/`, and live Linear (IPI-454/457/461/462/465/471/485/486/459).
**Method:** every claim below was checked against a file on disk, a `git log`/`git show`, or a live Linear MCP `get_issue` call — not against the docs' own prose.

---

## Executive summary

The two "brain" documents — `MASTRA-EPIC.md` and `mastra-audit.md` — are **unusually accurate**. They already say the two things that matter most: `app/src/lib/ai/model-registry.ts` is missing on `main`, and the Mastra→Gateway wire (AC-F) is not done. Nothing in this audit found a case where those two SSOT docs claim something is done that isn't. Where they're wrong is smaller: stale line-item wording, and trusting a couple of self-reported Linear issue bodies that turned out to contain fabricated/stale proof.

Two concrete falsehoods were found, both **inside Linear issue descriptions**, not in the reviewed docs:

1. **IPI-471** claims proof at `docs/architecture/ai-agent-architecture.md`. That path was deleted by commit `bf8c9a28` ("move agent architecture doc to tasks/cloudflare/") — the real doc has lived at `tasks/cloudflare/plan/ai-agent-architecture.md` since. Linear's description was never updated after the move. `docs/architecture/` today contains only `sitemap-ai-native.md`.
2. **IPI-461** claims proof at `app/src/lib/ai/provider-adapter.ts` + `provider-adapter.test.ts`, "9 tests passing," on branch `ai/ipi-471-agent-001-ai-agent-architecture`. **That file does not exist anywhere in the repo** — not on `main`, not on that branch, not in any commit (`git log --all` for the path returns nothing). This is either a hallucinated status update or a description written for work that was reverted/never committed. `MASTRA-EPIC.md` and `mastra-audit.md` both independently override this (they say keep IPI-461 "In Progress," not Done) — the higher-level docs happen to be right despite the false input.

A third, smaller inflation: **IPI-454**'s Linear body says "14 tests on main after PR #279" for the gateway Worker. The actual count in `services/cloudflare-worker/` is **5 tests**, all in one file (`src/index.test.ts`). `router.ts`, `model-registry.ts`, and the two providers have no dedicated test files — they're only exercised indirectly through the 5 integration-style assertions in `index.test.ts`.

The architecture itself is not overengineered and doesn't need new abstractions — the gap is entirely "ship AC-F and merge the registry," not "design something new."

---

## Per-document verdicts

| Document | Verdict | Evidence |
|---|---|---|
| **MASTRA-EPIC.md** | **KEEP AS-IS** (minor line-item update) | Correctly states `model-registry.ts` missing on main (confirmed: `app/src/lib/ai/` has `gemini-registry.ts`, `provider.ts`, `provider.test.ts`, `types.ts` — no `model-registry.ts`; it exists only on `ai/ipi-471-agent-001-ai-agent-architecture`, commit `212bc512`). Correctly states AC-F not wired (confirmed: `provider.ts` has zero references to `AI_GATEWAY_URL` or `@ai-sdk/openai-compatible`). Live Linear pull for IPI-457/454/485 matches the doc's "Keep In Progress" / "Backlog" instructions exactly. One thing to fix: §2.3's agent list says "9 agents" — that's the registry *key* count (`default`, `production-planner`, `creative-director`, `visual-identity`, `social-discovery`, `brand-intelligence`, `model-match`, `crm-assistant`, `booking`); `default` and `production-planner` are the same `durablePlanner` instance, so it's 9 keys / 8 unique agent objects. Not wrong, just worth a footnote. |
| **mastra-audit.md** | **KEEP AS-IS** | Same forensic conclusions as the epic doc, cross-checks out. Correctly flags IPI-457 as "Complete ⚠️ / Branch only" (its own caveat marker shows the auditor already smelled the false-Done risk) and IPI-461 as "not wired to Mastra" without repeating the provider-adapter.ts claim verbatim — it summarizes rather than parrots the fabricated proof, which is the right call. |
| **cloudflare-mastra-build.md** | **SUPERSEDED — DELETE** (or clearly re-label) | This is not an iPix planning doc — it's a verbatim copy of a public Medium blog post ("Context Engineering: Building Intelligent AI Agents with Memory using Mastra on Cloudflare," Alex Fuentes, Oct 2025) about D1/Vectorize/Workers AI in general. It contains zero iPix-specific content, no file paths, no IPI IDs, and describes a generic Mastra-on-CF memory architecture that doesn't match iPix's actual choice (iPix uses Postgres via `getMastraStorage()`, not D1; no Vectorize is wired). Keeping it in the same folder as the real epic/audit docs invites someone to mistake blog marketing copy for the plan. If any of its background material is worth keeping, extract 2-3 lines into `MASTRA-EPIC.md` §2 as a citation; delete the rest. |
| **cloudflare-workersai.md** | **KEEP AS-IS** | This is a curated Mastra/Workers-AI model-catalog reference (81 CF models, 22 exposed via Mastra's router, iPix tier mapping) with an explicit, correct caveat: "**Not wired in app yet** — preview marketing chat still uses `AI_PROVIDER=gemini`." That matches ground truth (`provider.ts` `resolveAiProvider()` defaults to `"gemini"`). No update needed. |
| **cloudfalre-deployer.md** | **KEEP AS-IS** | Upstream Mastra `CloudflareDeployer` reference doc, correctly banner-marked "⛔ iPix SSOT — reference only... Canonical: MASTRA-EPIC.md." Confirmed no `@mastra/deployer-cloudflare` usage anywhere in `app/` — it's genuinely reference-only, banner is accurate. (Filename typo "cloudfalre" — cosmetic, not worth a rename-only PR by itself; fix opportunistically if either file is touched for content reasons.) |
| **deploy-cloudflare.md** | **KEEP AS-IS** | Same pattern as above — upstream Mastra deploy guide, correctly banner-marked reference-only, correctly says iPix uses in-process OpenNext instead. No contradiction with current code. |
| **mastra issues.md** (300KB) | **ARCHIVE** (see Q3 below) | Raw Linear CSV/table export (pipe-table format, `ID | Team | Title | Description | Status | ...` header at line 1) rather than curated prose. Contains the two false proof claims above baked into individual issue "Description" cells (i.e., the falsehood originates in Linear itself, this file is just a mirror of it). Not actively harmful to keep, but it duplicates what's more cleanly and more currently summarized in `MASTRA-EPIC.md`/`mastra-audit.md`, and its size (300KB, 5904 lines, 218 unique IPI-IDs) makes it something no one will re-read for drift. |
| **tasks/cloudflare/plan/ai-agent-architecture.md** | **KEEP AS-IS** | This is the real, current architecture doc (Linear IPI-471's actual deliverable, moved here by commit `bf8c9a28`). Cross-checked every "Current state" line against code — all accurate (see Q1 below). This is the doc that should be treated as canonical; `docs/architecture/ai-agent-architecture.md` referenced by IPI-471's Linear body no longer exists and the Linear description should be corrected to point here. |

---

## 1. The "7 agents" — described vs. real

The architecture doc's **§3 "Agent Definitions"** names 7 product-level roles. Its own **§2.1 "Current Mastra Agents"** table separately lists 8 code-level agent IDs — a different, only partially overlapping list. Both were checked against `app/src/mastra/index.ts`, `agents/index.ts`, `durable.ts`.

| Agent (§3 role) | Described in doc | Exists in code (Y/N + path) | Notes |
|---|---|---|---|
| **Brand Agent** | Yes (§3.1) | **Y** — `brand-intelligence-agent.ts`, registered as `"brand-intelligence"` in `agents/index.ts` | Doc's own "Current state" line is accurate: real agent + `brand-intelligence/handler.ts` edge function. |
| **CRM Agent** | Yes (§3.2) | **Y** — `crm-assistant-agent.ts`, registered as `"crm-assistant"` | 4 CRM tools present in `tools/index.ts` (`searchCompanies`, `searchContacts`, `logActivity`, `moveDealStage`) — matches doc exactly. |
| **Booking Agent** | Yes (§3.3) | **Y** — `booking-agent.ts`, registered as `"booking"` | Has a snapshot test (`booking-agent.snapshot.test.ts`) enforcing draft-only behavior, matching the doc's "no confirm_booking tool" claim. |
| **Shoot Agent** | Yes (§3.4) | **Y** — `productionPlannerAgent` in `agents/index.ts`, registered as both `"production-planner"` and `"default"` | 10 tools in `agentTools` (minus the 3 excluded booking/CRM write tools), `shoot-wizard` workflow present in `workflows/index.ts`. Matches doc's "10 shoot tools" and "3-gate HITL" claim. |
| **Campaign Agent** | Yes (§3.5) | **N** — no dedicated agent | Doc itself is honest here: "🔴 Campaigns UI is a stub (5%)... No campaign agent yet — defined here for architecture completeness." `creativeDirectorAgent` exists in code (registered as `"creative-director"`) but has no tools and isn't the Campaign Agent described (no campaigns/campaign_deliverables read/write). |
| **Research Agent** | Yes (§3.6) | **N** — no dedicated agent | Doc says "🟡 Partial... No dedicated agent yet — brand-intelligence agent covers some research flows." Confirmed no standalone research agent file exists. |
| **Notification Agent** | Yes (§3.7) | **N** — by design, not a Mastra agent | Doc says this is intentionally system-triggered (Supabase trigger → Realtime), "No agent-initiated notifications." Correctly described as not needing agent code. |

**Bottom line:** of the 7 named roles, **4 are real, working Mastra agents today** (Brand, CRM, Booking, Shoot); **3 are aspirational/planned-only** (Campaign, Research, Notification) — and the doc already says so plainly, it doesn't oversell them. Additionally, 4 more registered agents exist in code that aren't part of this 7-role taxonomy at all: `creative-director` (empty shell, no tools), `visual-identity`, `social-discovery`, `model-match` — all real, all registered, none mapped to one of the 7 named roles.

## 2. Does MASTRA-EPIC.md accurately reflect the registry/AC-F gap?

**Yes — already correct, no fix needed.**

- §1 "Do not" list: *"Mark IPI-457 Done until `app/src/lib/ai/model-registry.ts` is on `main`."* Confirmed: file absent on `main`, present only on `ai/ipi-471-agent-001-ai-agent-architecture` (added by `212bc512 feat(ipi-457): CF-AI-005 unified provider types + typed model registry`).
- §2.2 table: `Model resolution | app/src/lib/ai/provider.ts | 🔴 gemini/groq only; no AI_GATEWAY_URL` and `App model registry | app/src/lib/ai/model-registry.ts | 🔴 branch only`. Confirmed via `grep -rn "AI_GATEWAY_URL" app/src/lib/ai/` (zero hits) and reading `provider.ts` in full — it has `resolveAiProvider()` (`gemini | groq | openai`), `resolveModel()`, none of which touch a gateway URL or `@ai-sdk/openai-compatible`.
- Live Linear cross-check: IPI-457 status is genuinely **"In Progress"** (not Done) as of this query — the doc's instruction to keep it In Progress until merge is exactly what Linear currently reflects, i.e., someone already acted on this doc's advice, or wrote the doc to match reality. Either way, no drift.

## 3. Is `mastra issues.md` signal or noise?

**Archive it — recommend `git mv` to `tasks/cloudflare/mastra/archive/mastra-issues-export-2026-07-08.md` (or delete if the team is fine losing it; git history keeps it either way).**

It's a raw Linear table export (header row: `ID | Team | Title | Description | Status | Estimate | Priority | Project ID | ...`), 5904 lines, 218 unique `IPI-` references, 68 `# ` headers that are actually embedded sub-documents (prompt packs, wireframe specs, SQL snippets) pasted into Description cells — not a curated issue list. Two things argue for archiving over keeping it live:

1. **It's the source of the two false claims** (IPI-471's dead path, IPI-461's nonexistent `provider-adapter.ts`) — because it's a straight mirror of Linear description fields, any staleness in Linear ships straight into this file with no editorial check.
2. **Everything useful in it is already synthesized** into `MASTRA-EPIC.md` (roadmap, phases, dependency table, Gantt) and `mastra-audit.md` (forensic scoring, red flags) in far less space (44KB combined vs 300KB). No one is going to re-read a 5904-line CSV dump to catch drift; they'll read the 31KB epic.

Don't delete outright without team sign-off (it may be someone's only offline copy of the full Linear export), but it should not be treated as a doc anyone maintains or trusts going forward.

## 4. Contradictions between mastra docs and sibling cloudflare docs

No hard contradictions found on the AC-F/gateway wiring state — every doc checked (`MASTRA-EPIC.md`, `mastra-audit.md`, `cloudflare-workersai.md`, IPI-454's live Linear body) agrees: **gateway wire not done, Gemini direct is what's actually live.** That consistency is worth calling out positively — it would have been easy for one doc to say "done" while another said "pending."

The one internal inconsistency is **within Linear itself, not across docs**: IPI-471's own description says `Status: ✅ Complete` in its body text, but the issue's actual Linear `status` field is `"In Progress"` (`statusType: started`, not a completed/done state). The higher-level docs (`MASTRA-EPIC.md` §9 "Mark Done" table) correctly say "IPI-471 — architecture doc — mark Done if proof path fixed," which implicitly flags this exact mismatch without spelling it out. Recommend: fix the IPI-471 description's proof path (point at `tasks/cloudflare/plan/ai-agent-architecture.md`) and let the state field, not the prose, be the source of truth.

## 5. Genuine architecture gaps (Phase 5 ask vs. what already exists)

The AI Agent Architecture doc's Phase 5 items are: Prompt Registry, Model Registry, Provider Router, Agent Memory, Model Evaluation, Failover, Cost Routing, future MCP integration. Checked against what's already tracked:

- **Model Registry** — tracked (IPI-457), just not merged. Not a gap, an execution lag.
- **Provider Router** — tracked (IPI-454 AC-F / IPI-461), same story.
- **Agent Memory** — already shipped (`getMastraMemory()`, `getPlannerMemory()`, `PostgresStore` via IPI-129). Not a gap.
- **Model Evaluation** — tracked (IPI-462). Not a gap.
- **Failover** — tracked (IPI-463). Not a gap.
- **Cost Routing** — tracked (IPI-460, deferred to P6). Not a gap, just later.
- **Prompt Registry** — tracked (IPI-473 / AGENT-003) but **not in `MASTRA-EPIC.md`'s child-issue list** (§9 lists IPI-454, 457, 461, 485, 462, 463, 465, 470, 482, 240, 129, 132–135, 278 as children of IPI-486 — IPI-473 is absent). This is the one real, if small, gap: a tracked issue that exists in the architecture doc and in Linear but has fallen out of the epic's own dependency table and Gantt. Low effort to fix — add one row.
- **Future MCP integration** — genuinely unscoped, no issue found for it anywhere. This is fine to leave unscoped (it's explicitly "future"), just don't invent an abstraction for it now — YAGNI applies until there's a concrete MCP use case.

No new abstraction is needed anywhere in this list — the only real gap is a bookkeeping one (IPI-473 missing from the epic's child list), not a missing architectural layer.

---

## Appendix — out-of-scope observation

Not part of this audit's mandate, but noticed in passing: the current git working tree (branch `ipi/restore-universal-design-prompt`) has **uncommitted deletions** of `config/groq-models.json` and `config/groq-models.schema.json` (`git status` shows ` D config/groq-models.json`, ` D config/groq-models.schema.json`). These files are present and correct on `main`/HEAD (`git show HEAD:config/groq-models.json` returns valid JSON) — the deletion exists only in this dirty working tree, unrelated to the skills-reorg work the branch is for. If committed as-is, it would break `provider.ts`'s `loadGroqModelsConfig()` (which throws if the file can't be found) for any code path using `AI_PROVIDER=groq`. Flagged separately — not fixed here since it's outside this audit's scope and may be incidental collateral from an in-progress merge/rebase on this branch.
