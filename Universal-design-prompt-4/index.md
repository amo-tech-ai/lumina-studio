# Universal Design Prompt v4 — Document Index

> Single source of truth for all documentation in this repository.
> Generated: 2026-07-13 · Reviewed/updated: 2026-07-18 | Total: ~270 document files

---

## 📋 Handoff docs — start here

Two different kinds of "handoff" live in this tree — don't confuse them:

**Engineering handoff docs** (prototype → React/Supabase mapping, the actual build spec):

| Doc | Scope | Use when |
|---|---|---|
| `docs/handoff/` (16 docs, `01-overview.md` → `14-ai-runtime-contract.md` + `handoff.md` index + `SCREEN-REGISTRY.md`) | **Canonical, cross-screen** — screen map, component map, journeys, state map, React implementation map, AI runtime contract | Building/verifying any screen against the full spec |
| `docs/CLAUDE-CODE-HANDOFF.md` | Main implementation handoff — prototype → React/Supabase mapping, single-file entry point | Quick orientation before diving into `docs/handoff/`'s numbered set |
| `crm/CRM-HANDOFF.md` | CRM/Relationship Hub engineering handoff, Phase 1-5 checklist | CRM-specific work only |
| `planner/planner-qa-handoff.md` | Planner QA → engineering handoff | Planner QA findings only |
| `docs/models/01-model-booking-engineering-handoff.md` | Model/talent booking technical handoff | Booking-flow work only |

**Session/prompt handoff docs** (conversation continuity between Claude Code sessions — not a build spec):

| Doc | Scope | Status |
|---|---|---|
| `tasks/todo/prompt-handoff.md` | 2026-07-18 session handoff — Wave 3, IPI-286 done → IPI-551 next | ⚠️ **untracked** (`git status` shows `??`) — commit it if this should survive/be shared, per this folder's "don't lose untracked work" rule |
| `tasks/prime/01-task-amemdments.md` | 2026-07-18 snapshot of an AI-provider (Groq/Cloudflare) plan-amendment session | ⚠️ **untracked** — same as above |

---

## Root Level (20 docs)

| File | Lines | Description |
|------|-------|-------------|
| `DESIGN.md` | 581 | Main design entry point — v3 "Zeely Editorial" visual language, shell architecture, AI/HITL patterns |
| `SITEMAP.md` | 360 | Master application sitemap — SCR-IDs, navigation maps, Mermaid diagram |
| `PLAN.md` | 152 | Design build plan — per-screen state tracking (Populated/Loading/Empty/Error/Approval) |
| `REFACTOR.md` | 185 | App-wide refactor audit — measures all DC prototype file sizes, extraction recommendations |
| `todo.md` | 69 | Near-term build priority todo — CRM completion + Planner foundation (IPI-528/562/563) |
| `changelog.md` | 409 | Design changelog — Phase A through C+++, governance docs, motion, error library |
| `checklist.md` | 630 | Complete design audit checklist — 15 items (A-O) with completion progress |
| `progress-tracker.md` | 146 | Design vs. real implementation progress tracker — 38 screens, ~52% weighted |
| `AI-EXPLAINABILITY.md` | 108 | AI explainability standard — 8-step EvidenceBlock workflow |
| `ANALYTICS-PLAN.md` | 77 | Analytics surface design plan — SCR-16, SCR-17 (not yet built) |
| `MOBILE-IMPROVE.md` | 370 | Mobile improvements review — 27 screens scored, avg 84.9/100 |
| `MOBILE-PLAN.md` | 1,218 | Mobile design plan — mobile-first strategy, cross-screen journeys, AI-native/HITL |
| `PAGES-REORG-PLAN.md` | 656 | Pages reorganization plan — 31 screens consolidated to `Pages/`, 19 docs re-pathed |
| `lessons.md` | 141 | Lessons learned — 16 guards from IPI-404 forensic review + CRM PRs |
| `design-audit.md` | 249 | Design audit — Planner focus, Linear validation (IPI-476-484), doc integrity |
| `design-audit-2026-06-28-rev2.md` | 174 | Design audit rev 2 — plan.md + todo.md vs. live codebase (scores: 90/100, 92/100) |
| `html.md` | 91 | HTML file inventory — all `.dc.html` prototype files in `Pages/` and `components/` |
| `HTML.md` | 123 | ⚠️ Separate file, different content from `html.md` (case-differing name — a filesystem hazard on case-insensitive systems). Not yet reconciled; check both before assuming either is stale. |
| `tokens.css` | — | CSS design tokens (parent-level; canonical copy in `design-patched/`) |
| `support.js` | — | Shared JavaScript runtime for all `.dc.html` prototypes |
| `index.md` | — | **This file** — master document index |

---

## `booking/` — Booking Screen Plans (5 docs)

| File | Lines | Description |
|------|-------|-------------|
| `SCR-09-Casting-Review.plan.md` | — | Casting Review plan (SCR-09) — card/swipe + grid + list views |
| `SCR-20-Model-Profile.plan.md` | — | Model/Talent Profile 360° plan (SCR-20) |
| `SCR-21-Booking-Wizard.plan.md` | — | Booking Wizard plan (SCR-21) — multi-step `flow=booking` |
| `SCR-22-Booking-Detail.plan.md` | — | Booking Detail plan (SCR-22) |
| `SCR-25-AI-Native-Dashboards.plan.md` | — | AI-Native Role Dashboards plan (SCR-25) |

---

## `components/` — Component Documentation (1 doc + 20 HTML prototypes)

| File | Lines | Description |
|------|-------|-------------|
| `COMPONENTS.md` | 295 | Component library index — 20 shared components with category and used-on info |
| `support.js` | — | JavaScript support for component prototypes |

---

## `crm/` — CRM Documentation (15 docs)

| File | Lines | Description |
|------|-------|-------------|
| `crm-plan.md` | 598 | CRM design plan — master plan for CRM/Relationships surface |
| `CRM-HANDOFF.md` | 90 | CRM Claude Code engineering handoff — Phase 1-5 checklist |
| `CRM-REFACTOR-AUDIT.md` | 156 | CRM refactor audit — file sizes, duplicated boilerplate |
| `CRM-MOBILE-tasks.md` | 170 | CRM mobile task list — 6 phone layouts at 390px |
| `RELATIONSHIP-HUB.strategy.md` | — | CRM Relationship Hub strategic reframe |
| `PROFILE-360-template.md` | — | Shared 360° detail screen template pattern |
| `SCHEMA-crew-location-360.claude-code.md` | — | Supabase schema design for crew/location |
| `crm-audit.md` | — | CRM general audit |
| `crm-linear-audit.md` | — | CRM Linear ticket verification |
| `tasks/crm-audit.md` | — | CRM task implementation audit |
| `tasks/crm-tests.md` | — | CRM test plans and results |
| `tasks/crm-337=341-audt.md` | — | PR #337/#341 audit (Deal Detail) |
| `tasks/july-12-session.md` | — | July 12 CRM work session notes |
| `tasks/july-12-337-341.md` | — | July 12 PR review (Deal Detail) |
| `tasks/crm-supa-audit.md` | — | CRM Supabase schema/RPC verification |

---

## `design-patched/` — Working Design Copy (20 docs)

| File | Lines | Description |
|------|-------|-------------|
| `DESIGN.md` | 576 | Patched copy of main DESIGN.md |
| `00-README.md` | 168 | Claude Design knowledge base — product intro, non-negotiable rules |
| `plan.md` | 148 | Patched design build plan |
| `redesign-spec.md` | 153 | v3 "Zeely Editorial" visual redesign spec — migrated from v2 "Atelier" |
| `image-strategy.md` | 155 | Image-first strategy — per-screen audit, subject rules, editorial levers |
| `todo.md` | 97 | Design TODO — v3 adoption, chat dock, IntelligencePanel |
| `changelog.md` | 110 | Patched design changelog |
| `tokens.css` | — | **Canonical** CSS design tokens (source of truth) |
| `archive/2026-06-design-setup-plan.md` | 1,175 | Pre-implementation setup plan (superseded by plan.md + DESIGN.md) |
| `prompts/00-universal.md` | — | Universal Claude Design prompt — shared context |
| `prompts/01-dashboard.md` | — | Command Center screen prompt |
| `prompts/02-brand-detail.md` | — | Brand Detail screen prompt |
| `prompts/03-shoots.md` | — | Shoots List screen prompt |
| `prompts/04-brand-list.md` | — | Brand List screen prompt |
| `prompts/05-shoot-wizard.md` | — | Shoot Wizard screen prompt |
| `prompts/06-campaigns.md` | — | Campaigns screen prompt |
| `prompts/07-assets.md` | — | Assets screen prompt |
| `prompts/08-onboarding.md` | — | Onboarding screen prompt |
| `prompts/08-onboarding-plan.md` | — | Onboarding planning doc (13-screen flow) |
| `prompts/09-matching.md` | — | Matching screen prompt |
| `prompts/10-channel-preview.md` | — | Channel Preview screen prompt |

---

## `docs/` — Handoff & Design Specifications (49 docs)

### Root
| File | Lines | Description |
|------|-------|-------------|
| `CLAUDE-CODE-HANDOFF.md` | 289 | Main implementation handoff — prototype → React/Supabase mapping |

### `docs/handoff/` (16 docs)
| File | Lines | Description |
|------|-------|-------------|
| `handoff.md` | — | Handoff index / overview |
| `01-overview.md` | — | Project overview and scope |
| `02-screen-map.md` | — | 31 screens with SCR-IDs, routes, descriptions |
| `03-component-map.md` | — | Tier matrix of 20 shared components (blast radius) |
| `04-user-journeys.md` | — | Cross-screen journey documentation |
| `05-feature-map.md` | — | Feature-level mapping across screens |
| `06-ai-workflows.md` | — | AI interaction and workflow documentation |
| `07-navigation-map.md` | — | Navigation structure and routing |
| `08-state-map.md` | — | All 9 states with canonical copy + recovery actions |
| `09-react-implementation-map.md` | — | DC prototype → React page → route → agent → Linear mapping |
| `10-implementation-order.md` | — | Build order recommendation |
| `11-screen-checklists.md` | — | Per-screen build checklists |
| `12-production-handoff.md` | — | Production readiness documentation |
| `13-react-mobile-verification.md` | — | Mobile responsiveness verification specs |
| `14-ai-runtime-contract.md` | — | AI runtime matrix, CopilotKit, Mastra, state machine |
| `SCREEN-REGISTRY.md` | — | Canonical SCR-ID registry — numbering owner |

### `docs/design/` (18 docs)
| File | Lines | Description |
|------|-------|-------------|
| `README.md` | 50 | Design docs index — navigation hub |
| `DESIGN-TASKS.md` | — | Design tasks master tracker with per-screen completion % |
| `IMPLEMENTATION-TASKS.md` | — | Engineering/backend tasks (Supabase/RLS/Edge/Cloudinary/Mastra/CopilotKit) |
| `DESIGN-AUDIT-2026-07-01.md` | — | Forensic design audit |
| `DESIGN-PRINCIPLES.md` | — | Core design principles |
| `DESIGN-TOKENS.md` | — | Token system with governance rules |
| `DESIGN-QA.md` | — | 11-section master design QA checklist |
| `PATTERNS.md` | — | Design patterns — forms, tables, charts, KPI cards, notifications |
| `WORKFLOWS.md` | — | Per-workflow interaction design |
| `STATES.md` | — | All 9 states with canonical copy + surface |
| `AI-UX.md` | — | AI interaction UX patterns and rules |
| `ANIMATIONS.md` | — | Canonical motion spec (timings, easing, streaming) |
| `ACCESSIBILITY.md` | — | A11y requirements and guidelines |
| `PERFORMANCE.md` | — | Performance budget — CWV targets, per-route budgets |
| `IMAGE-STANDARDS.md` | — | Canonical aspect ratios, crop rules, Cloudinary presets, fallback chain |
| `improve.md` | — | UX audit findings and improvement suggestions |
| `todo.md` | — | Design docs TODO |
| `tokens.css` | — | CSS tokens copy |

### `docs/models/` (7 docs + 1 TS file)
| File | Description |
|------|-------------|
| `00-model-booking-plan.md` | Overall model booking plan |
| `01-model-booking-engineering-handoff.md` | Technical engineering handoff |
| `02-engineering-reference.md` | Authoritative engineering reference v1.0 |
| `AUDIT-ipix.md` | Model booking audit |
| `COMPOSER-PRIMITIVE.spec.md` | Composer (AI chat input) primitive spec |
| `IMPLEMENTATION-MATRICES.md` | Engineering implementation matrices |
| `handoff/composer-registry.ts` | Composer component registry (TypeScript) |

---

## `plan/` — Planning Documents (27 docs)

> ⚠️ **Known duplication, not yet resolved:** `plan/planner/` (below) and the top-level `planner/` section further down both hold a full parallel set of Planner design/audit/task docs (e.g. `plan/planner/planner.md` vs `planner/planner.md`; three separate audit files across the two trees). Neither is marked canonical. This needs a human decision on which tree wins before consolidating — flagged here, not merged, per this repo's file-safety rule for this folder.

| File | Description |
|------|-------------|
| `implement-summary.md` | Plain-English implementation summary (house/room analogy) |
| `02-implementation-audit.md` | Implementation status audit |
| `designtoreact.md` | Design-to-React conversion strategy |
| `audit/01-design-package-audit.md` | Complete design package quality audit |
| `booking-wizard/audit.md` | Booking wizard audit |
| `planner/planner.md` | Planner master design document |
| `planner/01-audit.md` | First planner design package audit |
| `planner/audit-planner.md` | Comprehensive planner audit |
| `planner/architecture-plan.md` | Planner technical architecture |
| `planner/mermaid-diagrams.md` | Architecture/flow Mermaid diagrams |
| `planner/wireframes.md` | Planner screen wireframes |
| `planner/design-prompts/00-design-plan.md` | Planner design plan |
| `planner/design-prompts/00-review-and-conventions.md` | Coding/design conventions |
| `planner/design-prompts/planner.md` | Main planner design prompt |
| `planner/design-prompts/SCR-32-planner-workspace.md` | SCR-32 Workspace prompt |
| `planner/design-prompts/SCR-33-planner-dashboard.md` | SCR-33 Dashboard prompt |
| `planner/design-prompts/SCR-34-planner-instance-settings.md` | SCR-34 Settings prompt |
| `planner/design-prompts/SCR-35-planner-hub.md` | SCR-35 Hub prompt |
| `planner/design-prompts/design-prompt-audit.md` | Design prompt audit |
| `planner/design-prompts/diagrams.md` | Planner diagrams |
| `planner/design-prompts/supabase-reference.md` | Planner Supabase schema |
| `planner/tasks/prompt-design.md` | AI prompt engineering task |
| `planner/tasks/283-284-prompt-tests.md` | Prompt tests #283/#284 |
| `planner/tasks/prompt-tests-2.md` | Prompt tests, round 2 |
| `planner/tasks/progress.md` | Planner tasks progress |
| `planner/tasks/report-tests.md` | Report/analytics tests |
| `planner/tasks/review-prs.md` | PR review tracking |
| `planner/tasks/prompt-` | ⚠️ Empty (0 bytes) — stray file, likely an accidental save. Candidate for cleanup once confirmed unneeded. |
| `planner/design-prompts/Untitled` | ⚠️ 19 bytes, no extension — stray file, likely an accidental save. Candidate for cleanup once confirmed unneeded. |

---

## `planner/` — Planner Feature Docs (28 docs)

| File | Description |
|------|-------------|
| `planner.md` | Planner design master doc |
| `planner-copy-guide.md` | Copywriting guidelines for planner screens |
| `SCR-32-workflow.md` | SCR-32 Planner Workspace workflow |
| `adaptive-panel-wireframes.md` | Adaptive panel wireframes |
| `nav-qa-report.md` | Navigation QA report |
| `planner-firstuse-review.md` | First-time user experience review |
| `high-impact-verification.md` | High-impact feature verification |
| `planner-final-qa.md` | Final QA report |
| `planner-qa-handoff.md` | QA → engineering handoff |
| `navigation.md` | Planner-specific navigation design |
| `todo.md` | Planner-specific TODO |
| `planner-freeze.md` | Freeze/checkpoint document |
| `planner-mobile-plan.md` | Mobile design plan for planner |
| `planner-component-catalog.md` | Component usage catalog |
| `planner-interaction-catalog.md` | Interaction/behavior catalog |
| `sheet-wireframes.md` | Bottom sheet wireframes |
| `planner-audit.md` | General planner audit |
| `audit/planner-audit.md` | Detailed audit #1 |
| `audit/planner-audit-2.md` | Detailed audit #2 |
| `audit/planner-audit-3.md` | Detailed audit #3 |
| `notes/notes-1-session.md` | Work session notes |
| `notes/session-notes-2.md` | Session notes #2 |
| `notes/notes-3.md` | Session notes #3 |
| `notes/Untitled.md` | Miscellaneous notes |
| `tasks/01-efficiency.md` | Efficiency review task |
| `tasks/implementation-roadmap.md` | Implementation roadmap |
| `tasks/implementation.md` | Detailed implementation plan |
| `tasks/planner-react-onboarding.md` | React component onboarding guide |
| `tasks/user-journeys.md` | Planner-specific user journeys |

---

## `prompts/` — AI Generation Prompts (1 doc)

| File | Description |
|------|-------------|
| `prompt-efficienct.md` | Planner task efficiency review prompt |

---

## `screenshots/` — Screenshot Index (1 doc + 27 PNGs)

| File | Description |
|------|-------------|
| `INDEX.md` | Maps each screenshot to screen, version, capture date, staleness status, coverage gaps |

---

## `tasks/` — Implementation Tasks (78 docs)

### Root
| File | Lines | Description |
|------|-------|-------------|
| `README.md` | 207 | Master implementation backlog — readiness scores, dependency-ordered |
| `checklists.md` | — | Task checklists |
| `designtoreact.md` | — | Design-to-React workflow entry point |
| `note-update.md` | — | General task notes update |
| `todo.md` | — | Task-specific TODO |

### `tasks/AUDIT/` (5 docs)
| File | Description |
|------|-------------|
| `ipi-367-real-world-browser-workflow-audit.md` | Live browser verification of Deal Detail won/lost flow (IPI-367) |
| `pr-343-344-audit.md` | PR #343/#344 merge-readiness audit |
| `crm-337=341-audt.md` | PR #337/#341 audit — duplicate of `crm/tasks/crm-337=341-audt.md`? Check before treating either as canonical |
| `j16-audit.md` | July 16 session audit |
| `linear-audit-1.md` | Linear ticket verification audit |

### `tasks/backend/`
| File | Description |
|------|-------------|
| `BE-RT2-extend-get-shoot-detail-rpc-to-include-resource-type.md` | Extend `get_shoot_detail` RPC |

### `tasks/mobile/` (11 docs — missing from the previous index revision)
| File | Description |
|------|-------------|
| `MOB-01-bottom-sheet-primitive.md` | Bottom sheet primitive component |
| `MOB-02-bottom-navigation-shell.md` | Bottom navigation shell |
| `MOB-03-composer-primitive.md` | Mobile composer (AI chat input) primitive |
| `MOB-04-operator-shell-integration.md` | Operator shell mobile integration |
| `MOB-10-mvp-operator-screens.md` | MVP operator screens, mobile |
| `MOB-20-phase2-flows.md` | Phase 2 flows — Wizard, Campaigns, Matching |
| `MOB-30-channel-preview-mobile.md` | Channel Preview mobile layout |
| `MOB-31-selection-gestures-a11y.md` | Selection gestures + accessibility |
| `MOB-32-tablet-breakpoints.md` | Tablet breakpoint handling |
| `MOB-40-booking-set-mobile.md` | Booking screen set, mobile (7 SCRs) |
| `MOB-90-verification-pass.md` | Mobile verification pass |

### `tasks/notes/`
| File | Description |
|------|-------------|
| `jul10-session.md` | July 10 session notes |
| `jul11-notes-session.md` | July 11 session notes |
| `july-11-notes-2.md` | July 11 notes (second session) |

### `tasks/prime/` (1 doc, ⚠️ untracked)
| File | Description |
|------|-------------|
| `01-task-amemdments.md` | 2026-07-18 — AI-provider (Groq/Cloudflare) plan-amendment session snapshot. **Not committed to git** — commit before relying on it surviving. |

### `tasks/todo/` (1 doc, ⚠️ untracked)
| File | Description |
|------|-------------|
| `prompt-handoff.md` | 2026-07-18 — session handoff, Wave 3 (IPI-286 done → IPI-551 next). **Not committed to git** — commit before relying on it surviving. |

### `tasks/refactor/` (13 RF tasks)
| File | Description |
|------|-------------|
| `README.md` | Refactor tasks index |
| `RF-01-status-chip.md` | StatusChip standardization |
| `RF-02-entity-list.md` | Entity list component extraction |
| `RF-03-crm-list-screens.md` | CRM list screens consolidation |
| `RF-04a-crm-company-detail.md` | CRM Company Detail extraction |
| `RF-04b-profile360-extract.md` | Profile 360 extraction |
| `RF-05-token-cleanup-touch-as-you-go.md` | Token cleanup |
| `RF-A1-wizardshell-shoot-booking-flow-configs.md` | Wizard shell flow configs |
| `RF-A1b-detailshell-booking-flow-config.md` | Detail shell flow config |
| `RF-A3-icon-standardization-emoji-lucide.md` | Icon standardization (emoji → Lucide) |
| `RF-A6-analytics-kpi-kit.md` | Analytics KPI kit extraction |
| `RF-A7b-empty-error-state.md` | Empty/error state components |
| `RF-A9-matching-v2-vs-scr-09-registry-doc.md` | Matching v2 vs SCR-09 registry |
| `RF-OPT-shootcard-statuschip.md` | ShootCard/StatusChip optimization |

### `tasks/screens/` — Per-Screen Tasks (30 docs)
| File | Description |
|------|-------------|
| `README.md` | Screen tasks index |
| `MATRIX.md` | Master screen matrix with SCR-IDs, routes, status |
| `SCR-TEMPLATE.md` | Template for new SCR screen task files |
| `SCR-01-command-center.md` through `SCR-31-crm-deal-detail.md` | 27 per-screen task files |

### `tasks/screens/diagrams/` (27 docs)
Per-screen Mermaid/wireframe diagrams for SCR-01 through SCR-31.

### `tasks/screens/wireframes/` (27 docs)
Per-screen wireframe documents for SCR-01 through SCR-31 (plus README).

---

## `tests/` — Test Reference (3 docs + 2 TS/TSX specs)

| File | Description |
|------|-------------|
| `README.md` | Test archive — reference copies, not executable (maps to `app/`) |
| `planner-routes.spec.ts` | Playwright route test spec (Planner, reference copy) |
| `planner-error-boundary.render.test.tsx` | Planner error boundary render test (reference copy) |
| `pr-311-tests.md` | PR #311 test notes |

---

## `uploads/` — Uploaded Design References (38 docs)

| File | Description |
|------|-------------|
| `README.md` | Uploads index |
| `todo.md` | Uploads task tracking |
| `plan.md` | Uploads planning |
| `diagrams.md` | Uploaded diagram documentation |
| `2026-06-28-plan-todo-audit.md` | Plan/todo audit |
| `00-review-and-conventions.md` | Design review conventions |
| `01-design-prompt.md` | Main upload design prompt |
| `02-crm-design-master.md` | CRM design master reference |
| `02a-crm-companies-list.md` through `02f-crm-deal-detail.md` | 6 CRM per-screen references |
| `04-brand-list.md` through `10-channel-preview.md` | Various screen references |
| `06-crm-supabase-design-reference.md` | CRM Supabase schema (verified against live) |
| `09-onboarding.md` / `09-onboarding-24fe3123.md` | Onboarding variants |
| `SCR-32-planner-workspace.md` through `SCR-35-planner-hub.md` | 4 Planner screen references |
| `ipi-529-line-items.md` | Line items (IPI-529) |
| `ipi-531-offers.md` | Offers (IPI-531) |
| `ipi-532-scheduling-availability.md` | Scheduling/availability (IPI-532) |
| `model-prompt.md` | Model prompt reference |
| `booking/` (2 docs) | Booking concept + wizard flow references |
| `line-items/` (7 docs) | Line item screen references |
| `shoot-wizard-talent/` (2 docs) | Shoot wizard talent flow references |
| `claude-design/` (5 docs + `prompts/`, missing from the previous index revision) | `00-README.md`, `00-upload-manifest.md`, `21-component-dependencies.md`, `DESIGN.md`, `design-plan.md` — Claude Design upload staging area |

---

## Summary

| Directory | Doc Count | Focus |
|-----------|-----------|-------|
| Root | 20 | Design entry, sitemap, plans, audits, changelog |
| `booking/` | 5 | Booking screen plans |
| `components/` | 1 | Component library index |
| `crm/` | 15 | CRM design, handoff, audits, tasks |
| `design-patched/` | 20 | Working design copy, prompts, tokens |
| `docs/` | 49 | Handoff docs, design specs, model booking |
| `plan/` | 29 | Planning, audits, planner design prompts — **overlaps with `planner/`, unresolved (see note above)** |
| `planner/` | 29 | Planner feature design, QA, tasks — **overlaps with `plan/planner/`, unresolved (see note above)** |
| `prompts/` | 1 | AI generation prompts |
| `screenshots/` | 1 | Screenshot index |
| `tasks/` | 91 | Master backlog, refactor tasks, per-screen tasks, wireframes, mobile tasks, prime/todo session snapshots |
| `tests/` | 5 | Test reference copies |
| `uploads/` | 44 | Uploaded design references, incl. `claude-design/` staging area |
| **Total** | **~270** | 2 files (`tasks/prime/`, `tasks/todo/`) are untracked — commit them if they should persist |

**Open items from this review (2026-07-18), not auto-resolved:**
1. `plan/planner/` vs `planner/` — full parallel doc trees, no canonical marked. Needs a decision before merging.
2. `html.md` vs `HTML.md` — different content, case-differing names. Needs a decision.
3. `plan/planner/tasks/prompt-` (empty) and `plan/planner/design-prompts/Untitled` — likely stray saves, candidates for deletion once confirmed.
4. `tasks/AUDIT/crm-337=341-audt.md` vs `crm/tasks/crm-337=341-audt.md` — possible duplicate, not diffed.
5. `tasks/prime/` and `tasks/todo/` are untracked — commit if they should be shared/preserved, per this folder's file-safety convention.
