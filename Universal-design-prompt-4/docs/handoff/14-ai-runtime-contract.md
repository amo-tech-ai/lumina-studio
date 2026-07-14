# 14 — AI Runtime & Backend Contract (for Claude Code)

> **The AI-native contract the UI docs don't cover.** This project is the **design** source; the matrices below are **scaffolds** — the columns are correct and grounded in the known agent map + prototype behavior, but exact Supabase tables/RLS, Mastra tool signatures, and CopilotKit registration must be **filled and verified against the live code repo** (`route-agent-map.ts`, `mastra/`, Supabase schema). Do not treat the _TBD_ cells as final.
>
> Read after `09-react-implementation-map.md`. Design owns the **UI states**; Claude Code owns everything in this doc's _TBD_ cells (runtime + backend). Agents referenced: `production-planner` · `brand-intelligence` · `creative-director` · `social-discovery` · `visual-identity`.

---

## 1. AI Runtime Matrix — Screen → Agent → Workflow → Approval → DB → UI update
> The end-to-end AI loop per screen. "UI update" = which prototype state the result lands in (see `08-state-map.md`).

| Screen | Agent | Workflow (Mastra) | Approval (HITL)? | Reads → Writes (Supabase) | UI update on result |
|---|---|---|:--:|---|---|
| Command Center | production-planner | next-best-action | approve/edit/reject | `brands,approvals,activity` → `approvals` | ApprovalCard resolves; realtime strip |
| Brand List | brand-intelligence | (none — list/score read) | n/a | `brands,dna_scores` → — | card analysing → score |
| Brand Detail | brand-intelligence | analyse-brand-dna | approve per pillar (EvidenceBlock) | `brands,dna_scores,assets` → `dna_scores,approvals` | analysing(n/47) → loaded; pillar → re-score |
| Shoots List | production-planner | (none — list read) | n/a | `shoots,brands` → — | list populated |
| Shoot Detail | production-planner | generate-shot-list · risk-scan | approve draft | `shoots,shot_list,crew,schedule,budget,approvals,deliverables,activity,assets` → same | tab content; ApprovalCard |
| Shoot Wizard | production-planner (**durable**) | draft-shoot (brief·shots·crew·budget·timeline·call-sheet) | confirm → commit | `?brand&campaign&season` → `shoots/*` | live Review scoring → create |
| Campaigns | creative-director | campaign-health | approve action | `campaigns,deliverables` → `campaigns` | EvidenceBlock (health); panel |
| Assets | creative-director | score-dna-match | approve/replace | `assets,dna_match` → `assets` | EvidenceBlock (match); panel |
| Matching | social-discovery | rank-creators | approve invite | `creators,shortlists,invites` → `shortlists,invites` | Save/Invite toast; shortlist drawer |
| Channel Preview | visual-identity | channel-readiness · publish | confirm publish | `assets,publishes` → `publishes` | readiness EvidenceBlock; publish flow |
| Onboarding | brand-intelligence | analyse-brand-dna | n/a (auto) | uploads → `brands,dna_scores` | analysis → DNA payoff |
| Analytics / Campaign Perf | production-planner / creative-director | insight-generation | n/a | `metrics,campaigns` → — | per-metric/insight EvidenceBlock |

## 2. CopilotKit integration matrix (per screen)
> What the dock exposes to the agent. Fill `Tools` from the live Mastra registration.

| Screen | Agent | Readable state | Writable state | Interrupt | Approval | Tools |
|---|---|---|---|:--:|:--:|---|
| Command Center | production-planner | portfolio summary, approvals | draft actions only | ✅ | ✅ | _TBD_ |
| Brand Detail | brand-intelligence | brand, scores, assets | draft DNA/recs only | ✅ | ✅ | _TBD_ |
| Shoot Wizard | production-planner | wizard inputs, brand/campaign/season | shoot draft (all steps) | ✅ | ✅ (commit) | _TBD_ |
| Assets | creative-director | asset, DNA match, readiness | draft edits only | ✅ | ✅ | _TBD_ |
| Matching | social-discovery | creator list, shortlist | shortlist/invite draft | ✅ | ✅ | _TBD_ |
| Channel Preview | visual-identity | channel checks | publish draft | ✅ | ✅ | _TBD_ |
| _all others_ | per §1 | read context | **draft-only** | ✅ | per §1 | _TBD_ |

**Global rule:** the agent may **draft** but never **commit** without HITL approval (see §4). Writable state is always a draft object; commit is a user-approved transition.

## 3. Mastra workflow map
> Per workflow: input → output → approval → commit. Signatures (`durable.ts`, tool schemas) = _TBD_ against `mastra/`.

| Workflow | Input | Output (draft) | Approval | Commit target |
|---|---|---|:--:|---|
| analyse-brand-dna | brand + assets | DNA scores + pillar evidence | per-pillar | `dna_scores` |
| draft-shoot (durable) | brand/campaign/season | brief·shots·crew·budget·timeline·call-sheet | confirm | `shoots/*` |
| generate-shot-list | shoot + brief | shot list | approve | `shot_list` |
| score-dna-match | asset + brand DNA | match score + evidence | approve | `assets.dna_match` |
| rank-creators | brief + creator pool | ranked list + fit evidence | approve invite | `shortlists,invites` |
| campaign-health | campaign + deliverables | health score + risks | approve action | `campaigns` |
| channel-readiness → publish | asset + channels | per-channel checks → publish | confirm publish | `publishes` |
| next-best-action | portfolio state | ranked actions | approve/edit/reject | `approvals` |

**Durability:** `draft-shoot` is the **only durable** workflow (resumable stream). All others are non-durable → on failure show **error + retry**, not a resumable stream (matches Brand Detail's analysing/retry design).

## 4. AI approval state machine (HITL)
> Every AI-authored object moves through this lifecycle. UI surfaces: ApprovalCard / EvidenceBlock (Approve · Improve · Regenerate).

```
Draft ──▶ Review ──▶ Approved ──▶ Committed ──▶ Archived
  │          │            ▲                         ▲
  │          └─▶ Rejected ─┘ (edit → back to Draft)  │
  └────────────────────▶ Expired ────────────────────┘  (stale draft TTL)
```

| State | Meaning | Who | UI |
|---|---|---|---|
| Draft | AI generated, not shown for decision | agent | hidden / "thinking" |
| Review | awaiting human decision | user | ApprovalCard/EvidenceBlock pending |
| Approved | human accepted | user | approved chip; ready to commit |
| Rejected | human declined (→ edit → Draft) | user | fades / returns to draft |
| Committed | written to the real table | system | live data; StatusChip updates |
| Archived | superseded/retired | system | history (e.g. DNA history) |
| Expired | stale draft past TTL | system | quiet "regenerate" prompt |

**Store** `status` + `created_by='ai'` + `confidence` + `evidence` on every AI object; RLS: agents write **Draft/Review only**; Committed requires an approving user id.

## 5. AI component interaction states
> Maps each AI-bearing component to the runtime states it must render (design owns these; wire to CopilotKit/Mastra events).

| Component | loading | thinking | streaming | interrupt | approval | rejected | retry | cancelled |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| PersistentChatDock | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | ✅ |
| AgentStatusIndicator | — | ✅ | ✅ | ✅ | ✅ (awaiting) | — | — | ✅ |
| EvidenceBlock | ✅ | — | — | — | ✅ | ✅ | ✅ (Regenerate) | — |
| ApprovalCard | — | — | — | — | ✅ | ✅ | ✅ | — |
| Brand Detail analysing | ✅ (n/47) | — | — | — | — | — | ✅ | — |

**Error mapping (extends `STATES.md` §catalog with AI runtime errors):** agent-timeout · workflow-cancelled · approval-rejected · streaming-interrupted · offline-sync-recovery → each shows the catalog copy + recovery action; non-durable agents → retry, durable (`draft-shoot`) → resume.

## 6. Source-of-truth / ownership matrix
> Prevents duplicated state. Per object: system of record + who may write.

| Object | System of record | Agent may write | User may write | Notes |
|---|---|:--:|:--:|---|
| Brand (canonical) | Supabase `brands` | ❌ (read) | ✅ | AI never edits canonical brand |
| DNA scores | `dna_scores` | ✅ Draft | ✅ approve | committed on approval |
| AI draft (any) | draft table / `status='draft'` | ✅ | ✅ edit | never the canonical row |
| Approval | `approvals` | ✅ create | ✅ decide | AI proposes, human disposes |
| Asset | `assets` (+ Cloudinary) | ✅ match/meta draft | ✅ | media in Cloudinary, refs in row |
| Shortlist / Invite | `shortlists,invites` | ✅ Draft | ✅ send | send = user commit |
| Publish | `publishes` | ✅ Draft | ✅ confirm | external channel APIs |

## 7. Ownership by layer (who owns what)
| Layer | Owns | Docs |
|---|---|---|
| **Design** (Claude Design) | DC prototypes, layout, components, tokens, all UI states, responsive, AI **UX** (what the user sees) | `docs/design/*`, `components/*` |
| **React** (Claude Code) | `app/` pages, component port, routing, data binding, CopilotKit wiring | `09`, `11`, this doc §2 |
| **AI runtime** (Claude Code) | Mastra workflows/tools, durability, streaming, approval transitions | this doc §1/§3/§4 |
| **Backend** (Claude Code) | Supabase schema, RLS, Cloudinary presets, channel APIs | this doc §6, `IMPLEMENTATION-TASKS.md` |
| **Product** | priorities, agent behavior policy, HITL thresholds | Intelligence PRD |

---

## Claude Code — implementation tasks (from this contract)
- [ ] **RT-1** Fill the AI Runtime Matrix (§1) against `route-agent-map.ts` + `mastra/` — confirm agent, workflow name, durability per screen.
- [ ] **RT-2** Register CopilotKit per route (§2): readable/writable state, interrupt, approval, **tools** — draft-only write rule enforced.
- [ ] **RT-3** Implement Mastra workflows (§3) with `draft-shoot` durable; all others non-durable + retry.
- [ ] **RT-4** Implement the AI approval state machine (§4) as a real `status` column + RLS (agent writes Draft/Review only; Committed needs approver id).
- [ ] **RT-5** Wire AI component interaction states (§5) to CopilotKit/Mastra events; map the 5 AI runtime errors into `STATES.md`.
- [ ] **RT-6** Define Supabase source-of-truth + RLS per object (§6); no duplicated canonical state.
- [ ] **RT-7** Cloudinary transform presets per ratio (`IMAGE-STANDARDS.md` §5) + focal `g_auto`.
- [ ] **RT-8** Confirm the ownership-by-layer split (§7) with the team; log deviations in the code repo.
