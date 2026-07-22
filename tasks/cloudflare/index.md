# Cloudflare docs — folder index

**Updated:** 2026-07-21 · **~226 markdown files** under `tasks/cloudflare/`  
**Purpose:** Find the right doc fast. Prefer **Active SSOT** over historical / scratch.

| Authority | Where |
|-----------|--------|
| Status | [Linear](https://linear.app/amo100) first |
| Open work + evidence | [`todo.md`](./todo.md) |
| Roadmap / PRD | [`PLAN.md`](./PLAN.md) |
| Root board pointer | [`../../todo.md`](../../todo.md) |
| This map | [`index.md`](./index.md) (you are here) |

**Do not implement from:** `archive/` (all of it — draft, plan, notes, prompts, superseded root docs, old audits/PR evidence) · `Tasks/archive/`.

---

## Start here (active)

| Doc | Role |
|-----|------|
| [`README.md`](./README.md) | Folder entry + Linear links |
| [`todo.md`](./todo.md) | **Progress tracker** — Do next, lanes, evidence |
| [`PLAN.md`](./PLAN.md) | **Active roadmap / PRD** |
| [`audit/j21-todo-audit.md`](./audit/j21-todo-audit.md) | Latest todo accuracy audit (2026-07-21) |
| [`user-journeys/00-index.md`](./user-journeys/00-index.md) | Journey test catalog (IPI-500) |
| [`adr/IPI-695-edge-llm-via-ai-gateway-worker.md`](./adr/IPI-695-edge-llm-via-ai-gateway-worker.md) | Edge LLM → Gateway REST ADR |
| [`CLOUDFLARE-EPIC.md`](./CLOUDFLARE-EPIC.md) | Epic narrative (IPI-487 parent — historical Done; children still drive) |

Official-first ladder: Dashboard → Wrangler → bindings → OpenNext → GitHub Actions → official repos → custom last.

---

## Folder map (how to read the tree)

| Folder | Count (approx) | Role | Trust |
|--------|----------------:|------|:-----:|
| **Root `*.md`** | 5 | SSOT only — `README.md` / `index.md` / `PLAN.md` / `todo.md` / `CLOUDFLARE-EPIC.md` | ✅ |
| [`audit/`](./audit/) | 1 | **Current** dated audits | ✅ |
| [`audits/`](./audits/) | 7 | Topic audits (hosting, bundle, secrets, …) | ✅ evidence |
| [`adr/`](./adr/) | 1 | Architecture decision records | ✅ |
| [`user-journeys/`](./user-journeys/) | 12 | Journey test plans | ✅ |
| [`tests/`](./tests/) | 13+ md + JSON packs | Runtime / PR evidence | ✅ |
| [`Tasks/`](./Tasks/) | 28 active specs | Spec sheets (may lag Linear — trust Linear) | 🟡 |
| [`Tasks/archive/`](./Tasks/archive/) | many | Superseded Plan A specs | ❌ do not implement |
| [`prime/`](./prime/) | 8 | Hosting / migration working notes | 🟡 supporting |
| [`agent/`](./agent/) | 8 | Edge / agent planning chats | 🟡 |
| [`mastra/`](./mastra/) | 5 md | Mastra×CF notes (prefer `tasks/mastra/`) | 🟡 |
| [`migration/`](./migration/) | 12 | Vercel→Workers research | 🟡 historical |
| [`bedrock/`](./bedrock/) | 4 | Bedrock fallback research | 🟡 |
| [`dash/`](./dash/) | 1 | Dashboard setup notes | 🟡 |
| [`pr/`](./pr/) | 4 | PR planning / multi-PR audits | 🟡 |
| [`archive/`](./archive/) | ~91 | **All stale/scratch/historical content** — see breakdown below | ❌ do not implement |

### Inside `archive/` (2026-07-21 consolidation)

| Subfolder | Was at | Count | Role |
|-----------|--------|------:|------|
| [`archive/root/`](./archive/root/) | root-level `*.md` orphans | 13 | Superseded root docs (architecture drafts, lessons, summary, …) |
| [`archive/plan/`](./archive/plan/) | `plan/` | 22 | Historical research package — **not** active `PLAN.md` |
| [`archive/draft/`](./archive/draft/) | `draft/` | 35 | Scratch audits / PR notes |
| [`archive/prompts/`](./archive/prompts/) | `prompts/` | 9 | Agent prompts (scratch) |
| [`archive/notes/`](./archive/notes/) | `notes/` | 4 | Scratch notes |
| `archive/*.md` (loose, pre-existing) | `audits/` · `Tasks/` | 6 | Moved-out audits / PR evidence (July 19 pass) |

### Layout cleanup (done 2026-07-21)

Root orphans + `plan/` + `draft/` + `notes/` + `prompts/` consolidated into `archive/` (docs-only PR). Root now holds only `README.md` · `index.md` · `PLAN.md` · `todo.md` · `CLOUDFLARE-EPIC.md` plus active working folders.

**Still open:** `audit/` vs `audits/` duplication — low-value merge, not blocking.

---

## Root-level markdown

### Active / keep

| File | Role |
|------|------|
| [`index.md`](./index.md) | This map |
| [`README.md`](./README.md) | Entry + Linear |
| [`PLAN.md`](./PLAN.md) | Active roadmap |
| [`todo.md`](./todo.md) | Progress tracker |
| [`CLOUDFLARE-EPIC.md`](./CLOUDFLARE-EPIC.md) | Epic long-form |

### Historical (moved to `archive/root/` 2026-07-21 — do not treat as Do next)

| File | Role |
|------|------|
| [`archive/root/cf-000-platform-architecture.md`](./archive/root/cf-000-platform-architecture.md) | Early platform architecture |
| [`archive/root/ai-agent-architecture.md`](./archive/root/ai-agent-architecture.md) | Agent architecture notes |
| [`archive/root/ai-provider-decision.md`](./archive/root/ai-provider-decision.md) | Provider decision snapshot |
| [`archive/root/cf-ai-migration-research.md`](./archive/root/cf-ai-migration-research.md) | AI migration research |
| [`archive/root/intelligence-platform-plan.md`](./archive/root/intelligence-platform-plan.md) | Intelligence platform sketch |
| [`archive/root/diagrams.md`](./archive/root/diagrams.md) | Diagrams |
| [`archive/root/ENGINEERING-WORKFLOW.md`](./archive/root/ENGINEERING-WORKFLOW.md) | Engineering workflow |
| [`archive/root/LINEAR-INTEGRATION.md`](./archive/root/LINEAR-INTEGRATION.md) | Linear integration notes |
| [`archive/root/lessons.md`](./archive/root/lessons.md) | Lessons learned |
| [`archive/root/summary.md`](./archive/root/summary.md) | Status summary (superseded by `todo.md`) |
| [`archive/root/09-gemini-groq-audit.md`](./archive/root/09-gemini-groq-audit.md) | Gemini/Groq audit |
| [`archive/root/LINTER-FIX-SUMMARY.md`](./archive/root/LINTER-FIX-SUMMARY.md) | Linter fix notes |
| [`archive/root/NOTES-REVIEW-ACTIONS.md`](./archive/root/NOTES-REVIEW-ACTIONS.md) | Notes review actions |

---

## By topic

### Progress · roadmap · epic

| Doc | Path |
|-----|------|
| Progress tracker | [`todo.md`](./todo.md) |
| Active plan | [`PLAN.md`](./PLAN.md) |
| Epic narrative | [`CLOUDFLARE-EPIC.md`](./CLOUDFLARE-EPIC.md) |
| Todo accuracy audit | [`audit/j21-todo-audit.md`](./audit/j21-todo-audit.md) |
| Hosting execution notes | [`prime/04-plan-hosting.md`](./prime/04-plan-hosting.md) |

### Architecture · ADR

| Doc | Path |
|-----|------|
| Edge LLM via AI Gateway (ADR) | [`adr/IPI-695-edge-llm-via-ai-gateway-worker.md`](./adr/IPI-695-edge-llm-via-ai-gateway-worker.md) |
| Architecture decision task sheet | [`Tasks/000-Architecture-Decision.md`](./Tasks/000-Architecture-Decision.md) |
| Platform architecture (early) | [`archive/root/cf-000-platform-architecture.md`](./archive/root/cf-000-platform-architecture.md) |
| Diagrams | [`archive/root/diagrams.md`](./archive/root/diagrams.md) |
| Historical redesign package | [`archive/plan/`](./archive/plan/) — start [`archive/plan/README.md`](./archive/plan/README.md) |

### Native AI · gateway · OpenNext

| Doc | Path |
|-----|------|
| Workers AI / gateway task sheets | [`Tasks/001`](./Tasks/001-CF-GW-create-gateway.md)–[`019`](./Tasks/019-CF-GW-enable-guardrails.md), [`003`](./Tasks/003-CF-AI-add-workers-ai-binding.md)–[`004`](./Tasks/004-CF-AI-setup-models.md) |
| OpenNext / Next.js sheets | [`Tasks/022`](./Tasks/022-CF-NEXTJS-install-opennext-deps.md)–[`025`](./Tasks/025-CF-NEXTJS-update-package-json.md) |
| Multi-turn tool test | [`Tasks/012-CF-TEST-multi-turn-tool-calling.md`](./Tasks/012-CF-TEST-multi-turn-tool-calling.md) |
| Cleanup custom Worker | [`Tasks/053-CF-MIGRATION-cleanup-custom-code.md`](./Tasks/053-CF-MIGRATION-cleanup-custom-code.md) |
| Wire Mastra agents | [`Tasks/054-CF-MIGRATION-wire-mastra-agents.md`](./Tasks/054-CF-MIGRATION-wire-mastra-agents.md) |
| AI Search | [`Tasks/039-CF-STORAGE-setup-ai-search.md`](./Tasks/039-CF-STORAGE-setup-ai-search.md) |
| CI/CD Workers Builds | [`Tasks/008-CF-CICD-setup-workers-builds.md`](./Tasks/008-CF-CICD-setup-workers-builds.md) |

### Edge → AI Gateway REST (CF-EDGE)

| Doc | Path |
|-----|------|
| Epic sheet | [`Tasks/060-CF-EDGE-AI-epic.md`](./Tasks/060-CF-EDGE-AI-epic.md) |
| ADR / client / BI / DNA / secrets | [`061`](./Tasks/061-CF-EDGE-001-adr.md)–[`065`](./Tasks/065-CF-EDGE-005-secrets-smoke.md) |
| Edge plan / prompts | [`agent/5-cf-edge-plan.md`](./agent/5-cf-edge-plan.md) · [`agent/6-cf-edge-prompt.md`](./agent/6-cf-edge-prompt.md) |
| Agent folder README | [`agent/README.md`](./agent/README.md) |

Trust **Linear + root/`todo.md`** over Edge task sheets when they still mention custom Worker paths.

### User journeys · tests · evidence

| Doc | Path |
|-----|------|
| Journey index | [`user-journeys/00-index.md`](./user-journeys/00-index.md) |
| J01–J11 plans | [`user-journeys/01`](./user-journeys/01-ai-onboarding.md)–[`11`](./user-journeys/11-ai-gateway-health.md) |
| Journey companion | [`tests/worker-user-journeys.md`](./tests/worker-user-journeys.md) |
| Preview smoke packs | [`tests/ipi-632-preview-smoke/`](./tests/ipi-632-preview-smoke/) |
| AI health pack | [`tests/ipi-510-health/`](./tests/ipi-510-health/) |
| Security pack | [`tests/ipi-627-security/`](./tests/ipi-627-security/) |
| Older PR / worker verifies | [`tests/`](./tests/) (`ipi-*`, `pr-*`, `worker-*`) |
| Real-world notes | [`tests/real-world/jul10-tests.md`](./tests/real-world/jul10-tests.md) |

### Audits (topic + dated)

| Doc | Path |
|-----|------|
| Todo sync (j21) | [`audit/j21-todo-audit.md`](./audit/j21-todo-audit.md) |
| Hosting implementation | [`audits/cloudflare-hosting-implementation-audit.md`](./audits/cloudflare-hosting-implementation-audit.md) |
| Migration audit | [`audits/cloudflare-migration-audit.md`](./audits/cloudflare-migration-audit.md) |
| Mastra hosting | [`audits/cloudflare-mastra-hosting-audit.md`](./audits/cloudflare-mastra-hosting-audit.md) |
| OpenNext bundle | [`audits/opennext-worker-bundle-audit.md`](./audits/opennext-worker-bundle-audit.md) |
| Planner security session | [`audits/planner-security-audit-session-2026-07-14.md`](./audits/planner-security-audit-session-2026-07-14.md) |
| Secrets classification | [`audits/secrets-classification-verification.md`](./audits/secrets-classification-verification.md) |
| PR #512 / IPI-510 binding | [`audits/pr-512-ipi-510-ai-gateway-service-binding-audit.md`](./audits/pr-512-ipi-510-ai-gateway-service-binding-audit.md) |
| Archived audits | [`archive/`](./archive/) |

### Mastra × Cloudflare

| Doc | Path |
|-----|------|
| Prefer live Mastra board | [`../mastra/todo.md`](../mastra/todo.md) · [`../mastra/PLAN.md`](../mastra/PLAN.md) |
| CF-local Mastra epic notes | [`mastra/MASTRA-EPIC.md`](./mastra/MASTRA-EPIC.md) |
| Audits / tables | [`mastra/mastra-audit.md`](./mastra/mastra-audit.md) · [`mastra-studio-audit.md`](./mastra/mastra-studio-audit.md) · [`mastra-table.md`](./mastra/mastra-table.md) |

### Migration · Bedrock · dashboard · PR notes

| Area | Path |
|------|------|
| Vercel → Workers research | [`migration/`](./migration/) (`Migrate-Vercel-to-Cloudflare-Workers.md`, `docs/`, `notes-*`) |
| Bedrock fallback | [`bedrock/`](./bedrock/) |
| Dashboard setup | [`dash/setup.md`](./dash/setup.md) |
| Multi-PR audits | [`pr/`](./pr/) |
| Hosting / j18–j19 | [`prime/`](./prime/) |

### Scratch (ignore for execution)

| Area | Path |
|------|------|
| Draft audits / PR threads | [`archive/draft/`](./archive/draft/) (~35 files) |
| Historical research package | [`archive/plan/`](./archive/plan/) (~22 files) — [`archive/plan/README.md`](./archive/plan/README.md) |
| Prompts | [`archive/prompts/`](./archive/prompts/) |
| Scratch notes | [`archive/notes/`](./archive/notes/) · [`Tasks/notes/`](./Tasks/notes/) |
| Superseded Plan A task sheets | [`Tasks/archive/2026-07-plan-a/`](./Tasks/archive/2026-07-plan-a/) |

---

## Active `Tasks/` specs (inventory)

Trust Linear status over these sheets when they conflict.

| Spec | File |
|------|------|
| Architecture decision | [`000-Architecture-Decision.md`](./Tasks/000-Architecture-Decision.md) |
| Gateway create / routing | [`001`](./Tasks/001-CF-GW-create-gateway.md) · [`002`](./Tasks/002-CF-GW-configure-routing.md) |
| Workers AI binding / models | [`003`](./Tasks/003-CF-AI-add-workers-ai-binding.md) · [`004`](./Tasks/004-CF-AI-setup-models.md) |
| CI/CD | [`008`](./Tasks/008-CF-CICD-setup-workers-builds.md) |
| Multi-turn tools | [`012`](./Tasks/012-CF-TEST-multi-turn-tool-calling.md) |
| Gateway features | [`013`](./Tasks/013-CF-GW-enable-caching.md)–[`019`](./Tasks/019-CF-GW-enable-guardrails.md) |
| OpenNext | [`022`](./Tasks/022-CF-NEXTJS-install-opennext-deps.md)–[`025`](./Tasks/025-CF-NEXTJS-update-package-json.md) |
| AI Search | [`039`](./Tasks/039-CF-STORAGE-setup-ai-search.md) |
| Migration cleanup / Mastra wire | [`053`](./Tasks/053-CF-MIGRATION-cleanup-custom-code.md) · [`054`](./Tasks/054-CF-MIGRATION-wire-mastra-agents.md) |
| CF-EDGE epic + 001–005 | [`060`](./Tasks/060-CF-EDGE-AI-epic.md)–[`065`](./Tasks/065-CF-EDGE-005-secrets-smoke.md) |
| Master plan (historical) | [`MASTER-PLAN.md`](./Tasks/MASTER-PLAN.md) |

Archived index: [`Tasks/archive/2026-07-plan-a/TASKS-INDEX.md`](./Tasks/archive/2026-07-plan-a/TASKS-INDEX.md) — **do not implement**.

---

## User journeys (quick links)

See full table in [`user-journeys/00-index.md`](./user-journeys/00-index.md).

| ID | Doc |
|----|-----|
| J01 Onboarding | [`01-ai-onboarding.md`](./user-journeys/01-ai-onboarding.md) |
| J02 Brand Intelligence | [`02-brand-intelligence.md`](./user-journeys/02-brand-intelligence.md) |
| J03 Brand brief | [`03-ai-brand-brief.md`](./user-journeys/03-ai-brand-brief.md) |
| J04 Shoot planning | [`04-shoot-planning.md`](./user-journeys/04-shoot-planning.md) |
| J05 Booking | [`05-booking-workflow.md`](./user-journeys/05-booking-workflow.md) |
| J06 CRM | [`06-crm-workflow.md`](./user-journeys/06-crm-workflow.md) |
| J07 Planner | [`07-planner-workflow.md`](./user-journeys/07-planner-workflow.md) |
| J08 Marketing chat | [`08-marketing-operator-chat.md`](./user-journeys/08-marketing-operator-chat.md) |
| J09 Embeddings | [`09-embeddings-asset-search.md`](./user-journeys/09-embeddings-asset-search.md) |
| J10 Visual DNA | [`10-visual-dna-analysis.md`](./user-journeys/10-visual-dna-analysis.md) |
| J11 AI health | [`11-ai-gateway-health.md`](./user-journeys/11-ai-gateway-health.md) |

---

## Related outside this folder

| Surface | Path |
|---------|------|
| Root active board | [`../../todo.md`](../../todo.md) |
| Mastra board | [`../mastra/todo.md`](../mastra/todo.md) |
| Supabase / Edge board | [`../supabase/todo.md`](../supabase/todo.md) |
| CopilotKit audits | [`../copilotkit/`](../copilotkit/) |
| Cloudflare workflow skill | [`.claude/skills/cloudflare-workflow/`](../../.claude/skills/cloudflare-workflow/) |
| Workers testing skill | [`.claude/skills/cloudflare-workers-testing/`](../../.claude/skills/cloudflare-workers-testing/) |

---

## Maintenance rules

1. **New active doc** → add a row under the right section here + link from `README.md` if it is SSOT.
2. **New audit** → prefer `audits/` (topic) or `audit/` (dated accuracy); link from `todo.md` when it changes Do next.
3. **Scratch** → `archive/draft/` or `archive/notes/`; never promote to Do next without Linear.
4. **One concern:** docs-only PRs stay docs-only; do not mix with production code.
5. After a large move, update this index and run a quick `rg` for broken relative links.
