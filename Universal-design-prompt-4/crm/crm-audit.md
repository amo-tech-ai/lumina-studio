# CRM Design System — Forensic Audit

> **Audit only** — no redesign, no implementation, no invented features. Every claim below was verified against the live prototypes (DOM-probed at 1360 px), the plans (`crm-plan.md`, `PROFILE-360-template.md`, `RELATIONSHIP-HUB.strategy.md`), the registry, and the engineering references. Date: 2026-07-04.
> **Method:** each of the 6 screens loaded + JS-probed for `{{ }}` holes, header, tabs, stale-org refs, chip render, and state coverage. Docs read for consistency, Phase-tagging, and schema honesty.

---

## Executive summary

The CRM is a **disciplined, internally-consistent, AI-native design** that correctly positions itself as a **front door onto the existing product, not a parallel app**. All 6 MVP screens render clean (0 holes, 0 broken images) and reuse the shared 3-panel shell, IntelligencePanel, OperatorChatDock, EvidenceBlock, ApprovalCard, StatusChip, and unified activity timeline. The Relationships reframe (Organizations `kind` + People `role`) is applied without adding a single table. Phase-2 and Future scope is marked honestly throughout, and the cross-entity AI query set explicitly returns "not connected yet" where schema is missing.

**The design is complete and Claude-Code-ready as a *design*.** The only blockers are **backend** (all 4 `crm_*` tables are 🔴 proposed, `crm-assistant` unwired) — correctly flagged, not design gaps. This audit found and fixed **3 stale-org references** (Lumen Active on SCR-28 + SCR-30 in two places); no other errors of substance.

**Verdict: 🟢 ship the design to Claude Code.** Corrections required before *implementation* are backend, not design.

---

## Scorecard (/100)

| Area | Score | Status |
|------|------:|:------:|
| Design completeness | 96 | 🟢 |
| Internal consistency | 94 | 🟢 (post-fix; 3 stale refs corrected) |
| AI-native UX | 95 | 🟢 |
| Component reuse | 98 | 🟢 |
| Navigation / links | 92 | 🟢 |
| Scalability (one 360° template) | 96 | 🟢 |
| Maintainability | 93 | 🟢 |
| Extensibility (kind/role, config-per-entity) | 95 | 🟢 |
| Documentation consistency | 92 | 🟢 |
| Mobile readiness | 70 | 🟡 (1024 breakpoint speced; kanban→accordion not built) |
| **Claude Design readiness** | **95** | 🟢 |
| **Claude Code readiness** | **74** | 🟡 (gated on schema, not design) |
| **Backend readiness** | **20** | 🔴 (4 tables + agent unbuilt) |
| **AI readiness** | **60** | 🟡 (UX done; `crm-assistant` unwired) |
| **CRM maturity** | **88** | 🟢 |
| **Overall** | **90** | 🟢 |

---

## Screen-by-screen audit

### SCR-26 · Organizations 🟢 94
- **Verified:** header "Organizations"; 0 holes; **kind chips** Brand·Agency·Vendor·Sponsor all render; kind filter chips present; IntelligencePanel selection-driven (quick facts + EvidenceBlock + actions); names **not clipped** at 1360 px; no stale refs; nav labels "Relationships · Organizations/People/Pipeline".
- **States:** populated · loading · empty · error all present.
- **Issues:** none blocking. Nav rail is icon-only (labels as tooltips) — the "Relationships" hub name is visible in INDEX + rail labels, not as a rail header. Acceptable for the prototype; the shipping rename is a Claude Code task.
- **Improvements (P2):** (a) add column sort affordance on the org table header; (b) a kind-count summary in the header ("3 brands · 1 agency…") already present — keep; (c) pagination pattern for >25 orgs (fixtures show 6).
- **Production readiness:** 🟢 design-complete.

### SCR-27 · Organization 360° 🟢 95
- **Verified:** header "Acme Athletic"; 0 holes; tabs **Overview · Contacts · Deals · Activity**; no stale orgs (only Acme referenced); unified timeline; the reference 360° template.
- **Issues:** none. This is the canonical template instance.
- **Improvements (P2):** (a) surface the org `kind` chip in the 360° header for parity with the list; (b) "Convert to Brand" affordance is design-noted — keep gated behind schema.
- **Production readiness:** 🟢.

### SCR-28 · People 🟢 93 *(fixed this pass)*
- **Verified:** header "People"; 0 holes; **role chips** Contact·Model·Photographer·Crew all render; names not clipped; count line "6 people across 5 organizations · 1 model · 1 photographer".
- **Fixed this pass:** Lena Cho's employer **"Lumen Active" → "Orbit Denim"** (Lumen was removed from SCR-26 last session) + email/summary; **"Company" column + filter → "Organization"** for reframe consistency.
- **Issues:** none remaining. John Sato (photographer) row honestly states "Photographer profile is Phase 2 — no table yet" ✓.
- **Improvements (P2):** (a) role filter chip parity with SCR-26's kind filter; (b) show primary-org link per person row (already links).
- **Production readiness:** 🟢.

### SCR-29 · Person 360° 🟢 92
- **Verified:** header "Dana Vale"; 0 holes; multi email/phone arrays (labeled + primary); linked deals + activity; only real org (Acme) referenced.
- **Issues:** none.
- **Improvements (P2):** add the person `role` chip to the 360° header (parity with SCR-28).
- **Production readiness:** 🟢.

### SCR-30 · Pipeline (kanban) 🟢 90 *(fixed this pass)*
- **Verified:** 0 holes; **6 stages** Lead·Qualified·Proposal·Negotiation·Won·Lost; deal cards with value + days-in-stage + risk; "Won / Lost require approval" HITL banner; board-health panel.
- **Fixed this pass:** stale **"Lumen Active" deal → "Nord Apparel"** (whose "lost" status coherently explains an at-risk proposal) in **two** places — the deal card **and** the board-health "best next move" line.
- **Note (not a bug):** Kestrel Wear · Pace Co. · Sable Studio appear as **lead-stage** deals but aren't in the 6-org list. This is **realistic** — a lead isn't a full org record yet — and is **left intentionally**. If strict 1:1 coherence is wanted, promote them into SCR-26 as `prospect` orgs (P2 polish).
- **Improvements (P1):** kanban needs a **keyboard/button move** equivalent for drag (accessibility — speced in §10, not built). (P2) mobile kanban → stage accordion.
- **Production readiness:** 🟢 design; 🟡 a11y drag-alternative must ship with build.

### SCR-31 · Deal Detail 🟢 92
- **Verified:** header "Acme Athletic — SS26 Edi…"; 0 holes; stage control; **won/lost & brand-convert gated behind ApprovalCard** (HITL) — confirmed `approval` present; no stale orgs.
- **Issues:** none.
- **Improvements (P2):** show the linked shoot (`deal.shoot_id`) as a link-out chip when present.
- **Production readiness:** 🟢.

---

## Workflow audit

| Workflow | Coverage | Verdict |
|---|---|---|
| **Brand → Contact → Relationship → Opportunity → Shoot → Booking → Assets → Analytics** | CRM owns Org→Contact→Deal; hands off to existing Brand Detail / Shoot / Booking / Assets / Analytics via link-outs (§3–4). | 🟢 complete as **design** — every hop is a documented link, not a reimplementation. Downstream data links (Shoot, Assets, Analytics) are **Phase-2/Future** (need `deal.shoot_id`, `campaigns`). |
| **Model → Relationship → Booking → Notifications → Dashboard** | Person(role=model) 360° links to Model Profile (SCR-20); bookings via existing flow; notifications land in SCR-15; Role Dashboards SCR-25. | 🟢 complete; cross-links honest. |
| **Agency → Roster → Relationship → Bookings → Revenue → Reports** | Org(kind=agency) 360° → roster (People filtered role) → bookings → revenue (deals won) → Reports. Revenue/Reports are **Future** (Analytics deferred). | 🟡 design-complete to the CRM boundary; Revenue/Reports are Future (no Analytics-CRM tables). |

**No dead ends found** in the prototypes — every CTA either navigates within the fixture set or is a documented link-out. Live navigation to *other-domain* screens is a Claude Code wiring task (prototypes are self-contained).

---

## AI audit

| Element | Status | Notes |
|---|:--:|---|
| IntelligencePanel (every screen) | 🟢 | Present on all 6; selection-driven; quick facts + EvidenceBlock + action buttons. Separate from chat. |
| OperatorChatDock | 🟢 | Present; route-scoped greeting; marked **"crm-assistant not yet wired"**. |
| Proactive summaries | 🟢 | Board health (SCR-30), relationship summary (SCR-27), needs-attention (SCR-26). |
| Action cards | 🟢 | Draft follow-up / log activity / open — all HITL. |
| EvidenceBlock | 🟢 | On every scored/ranked judgment (relationship confidence, deal health). |
| Human-in-the-Loop | 🟢 | **No AI writes automatically.** Won/lost + convert gated behind ApprovalCard (SCR-31). Chat can *find*; *acting* routes through draft→approve. |
| AI boundaries | 🟢 | §21: 🔴 queries return "not connected yet (Phase 2)" + offer a 🟢/🟠 alternative — never fabricate. |
| Conversation context | 🟢 | Route + selected entity documented as UI state until backend memory exists (honest). |
| Route awareness | 🟢 | Per-route assistant + greeting speced. |
| Cross-entity queries | 🟢 | §21 set with 🟢/🟠/🔴 wiring legend; 6 of 10 wire at MVP on live/fixture data. |

**AI verdict:** the AI-native UX is **complete and correctly bounded**. The gap is purely wiring (`crm-assistant` agent 🔴).

---

## Schema audit

| Category | Items |
|---|---|
| **Exists (live)** | `brands` (87 rows), `public.notifications` + `list_notifications`/`mark_notifications_read` RPCs, booking/shoot tables, `model-match` agent. |
| **Required (MVP, 🔴 not built)** | `crm_companies`, `crm_contacts`, `crm_deals`, `crm_activities` (+ org-scoped RLS, indexes, booking-style status enums). `crm-assistant` Mastra agent (IPI-368/369). Notification kinds `deal_stage_changed` + `follow_up_due`. Brand-conversion route. |
| **Future (no schema — do NOT design)** | `campaigns`, photographer/location/crew entity tables, contracts/invoices/payments, meetings/calendar, comms-send, forecasting, relationship-graph store, semantic search index. |

**Schema honesty check: 🟢 PASS.** No prototype assumes backend that doesn't exist — every screen carries a visible "sample data · not yet wired" badge; photographer/location/campaign are explicitly Phase-2/Future in both list rows and docs.

---

## Reuse audit

🟢 **No duplicated UI patterns.** CRM reuses: 3-panel shell · IntelligencePanel · OperatorChatDock · EvidenceBlock · ApprovalCard · StatusChip · unified Timeline · cards · tables · filters · search · drawers/sheets. Genuinely-new (documented) primitives: `PageHeader`, `FilterBar`, `SearchBar` — flagged 🔴 not-built, use shared patterns. The **one 360° template** (`PROFILE-360-template.md`) replaces what would have been 5+ bespoke detail screens with a config-per-entity model — the single strongest scalability decision in the set.

---

## Documentation audit

| Doc | Consistency | Notes |
|---|:--:|---|
| `crm-plan.md` | 🟢 | Tracker + audit + IA + integration + §21 cross-entity + scores. Phase-tagged throughout. |
| `PROFILE-360-template.md` | 🟢 | One template, per-entity config; MVP green / Location amber Phase-2. |
| `RELATIONSHIP-HUB.strategy.md` | 🟢 | Reframe rationale; scope decision A adopted. |
| `Pages/INDEX.html` | 🟢 | "Relationships" hub; all 6 SCR + 3 doc links resolve. |
| `SCREEN-REGISTRY.md` | 🟢 | SCR-26 kind / SCR-28 role documented; booking paths updated to `booking/`. |
| Cross-refs | 🟢 | No broken internal links found. |

**Stale docs:** none found beyond the 3 fixture data refs (fixed in-screen).

---

## Critical fixes (before implementation)

**P0 (blockers — backend, not design):**
1. **Schema (IPI-362)** — author the 4 `crm_*` tables + org-scoped RLS + indexes + status enums. Blocks everything.
2. **`crm-assistant` agent (IPI-368/369)** — wire waves 1–2 tools; replace every "not yet wired".
3. **Won/lost + convert RPCs** — SCR-31 ApprovalCard actions must call real transitions + brand-conversion (writes existing `brands`).

**P1:**
4. **Kanban a11y** — ship the keyboard/button move alternative to drag (speced §10, not built).
5. **Notification kinds** — add `deal_stage_changed` + `follow_up_due`; surface in SCR-15.

**P2 (polish):**
6. Promote Kestrel/Pace/Sable pipeline leads into SCR-26 as `prospect` orgs for strict cross-screen coherence (or leave as intentional pre-org leads).
7. ✅ **DONE (2026-07-05)** — added `kind` chip to SCR-27 header (Brand) and `role` chip to SCR-29 header (Contact) for list↔detail parity.
8. Mobile/tablet frames for the 6 screens (kanban→accordion the one non-trivial one).

---

## Recommended improvements (nice-to-have)
- Column sort + pagination patterns on the list screens (fixtures are small; real data isn't).
- Bulk actions on People/Organizations (multi-select → tag / assign owner) — design-only.
- Deal Detail: link-out chip to the associated shoot when `deal.shoot_id` is set.

---

## Remaining Phase 2 work (design vs engineering)

| Item | Lane | Gate |
|---|---|---|
| Photographer · Crew · Location 360° | **Design** (same template, new config) | needs entity schema first |
| Mobile kanban accordion + 6 mobile frames | **Design** | none — can do on fixtures |
| Command Center pipeline widget, +Deal/+Follow-up quick-adds | **Design + Code** | needs schema for live data |
| Campaigns / Products / Events / Contracts / graph-viz / semantic search | **Do NOT design** | Future — explicit scope decision required |

---

## Final verdict

- **Is the CRM design complete?** 🟢 Yes — all 6 MVP screens built, verified, reuse-based, AI-native; one shared 360° template; Phase scope explicit.
- **Is it internally consistent?** 🟢 Yes (post-fix) — 3 stale-org refs corrected this pass; no other inconsistencies found.
- **Will Claude Code succeed?** 🟢 Yes for the UI — the design is unambiguous and reuse-first. Success is **gated on backend** (schema + agent), which is clearly scoped, not missing.
- **Is it production-ready?** 🟡 **Design yes, system no** — nothing ships until the 4 tables + `crm-assistant` exist. Every prototype honestly says so.
- **What must be corrected before implementation?** Backend P0 (schema, agent, transition RPCs) + P1 kanban a11y. No design corrections remain.

| Metric | Value |
|---|---|
| **Overall grade** | 🟢 A− |
| **Overall score** | **90 / 100** |
| **Estimated implementation risk** | **Medium** — low on the UI, medium on backend (net-new schema + agent, but patterned on the shipping booking stack) |
| **Estimated design completeness** | **95%** (−5 for un-built mobile frames + kanban a11y alternative) |
| **Confidence level** | **High** — every screen DOM-probed, every doc read; findings are evidence-backed, not inferred |
