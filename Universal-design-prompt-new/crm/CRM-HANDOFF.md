# CRM / Relationships — Claude Code Handoff

> **Start here** for building the CRM. Design is complete + verified on fixtures; everything below is engineering. **No design decisions are open** — this doc + the 6 prototypes + `crm-plan.md` are the source of truth.
> Legend: 🟢 done · 🟡 partial · 🔴 blocked/not started · ⚪ later.

---

## 1. What's built (design — 🟢 complete)

| SCR | Screen | Route | Prototype | Notes |
|---|---|---|---|---|
| 26 | Organizations | `/app/crm/companies` | `Pages/SCR-26-CRM-Companies-List.dc.html` | **kind** chip (brand/agency/vendor/sponsor) + filter |
| 27 | Organization 360° | `/app/crm/companies/:id` | `Pages/SCR-27-CRM-Company-Detail.dc.html` | Overview·Contacts·Deals·Activity; unified timeline; kind chip |
| 28 | People | `/app/crm/contacts` | `Pages/SCR-28-CRM-Contacts-List.dc.html` | **role** chip (contact/model/photographer/crew) + filter |
| 29 | Person 360° | `/app/crm/contacts/:id` | `Pages/SCR-29-CRM-Contact-Detail.dc.html` | multi email/phone arrays; role chip |
| 30 | Pipeline | `/app/crm/pipeline` | `Pages/SCR-30-CRM-Pipeline.dc.html` | 6-stage kanban; mobile → stage accordion |
| 31 | Deal Detail | `/app/crm/pipeline/:id` | `Pages/SCR-31-CRM-Deal-Detail.dc.html` | **won/lost/convert gated behind ApprovalCard (HITL)** |
| — | Mobile gallery | — | `Pages/SCR-MOBILE-CRM-Gallery.dc.html` | all 6 @390px, shared chrome, accordion |

All render clean (0 holes, 0 broken images), each carries a visible **"sample data · crm-assistant not yet wired"** badge.

**Design docs:** `crm-plan.md` (master plan — IA, integration map, AI plan, journeys, permissions, state/event matrices, scores) · `RELATIONSHIP-HUB.strategy.md` (the reframe) · `PROFILE-360-template.md` (one shared 360° pattern) · `CRM-MOBILE-tasks.md` (phone layouts + §6 tightening spec).

---

## 2. Build checklist (in dependency order)

### Phase 1 — Foundation 🔴
- [ ] **Schema (IPI-362)** — `crm_companies`, `crm_contacts`, `crm_deals`, `crm_activities`. Verify against the **live** Supabase first — never duplicate an existing table.
  - [ ] `crm_companies.kind` enum: `brand · agency · vendor · sponsor`
  - [ ] `crm_contacts.role` enum: `contact · model · photographer · crew`
  - [ ] `crm_deals.stage` enum: `lead · qualified · proposal · negotiation · won · lost`
  - [ ] `crm_deals.shoot_id` FK → existing `shoots`; `crm_companies.brand_id` FK → existing `brands` (nullable — link on convert)
  - [ ] `crm_activities` — one **unified** timeline table with a `type` (call/email/note/meeting/deal_event). **Do not** make separate Tasks/Comms/Notes tables.
- [ ] **RLS** — org-scoped on all 4 tables (match the booking-set pattern).
- [ ] **Indexes** — FKs, `stage`, `last_activity_at`, org scope.

### Phase 2 — Data access 🔴
- [ ] RPCs (verify none exist first): `list_companies` · `get_company` · `list_contacts` · `get_contact` · `list_deals(by stage)` · `get_deal` · `create_*` · `log_activity` · `move_deal_stage`
- [ ] **`transition_deal`** RPC for won/lost — **service-role only**, mirrors booking's `transition_booking`.
- [ ] **Brand-convert** path — won deal creates/links a `brands` row + hands off to Brand Intelligence.
- [ ] Notification kinds — add `deal_stage_changed` + `follow_up_due` to existing `public.notifications`; surface in **SCR-15** (don't build a new feed).

### Phase 3 — Agent 🔴
- [ ] **`crm-assistant`** (IPI-368/369) — waves 1–2 tools: `searchCompanies` · `summarizeRelationship` · `scoreDealHealth` · `draftFollowUp` · `logActivity` · `moveDealStage`. Replace every "not yet wired" badge.
- [ ] Cross-entity queries per `crm-plan.md §21` — wire only 🟢/🟠 rows; 🔴 rows return the honest **"not connected yet (Phase 2)"** copy. Never fabricate.

### Phase 4 — Frontend 🔴
- [ ] React routes for SCR-26–31 (match prototype layouts exactly).
- [ ] Reuse existing shared components: 3-panel shell · IntelligencePanel · OperatorChatDock · EvidenceBlock · **ApprovalCard**. New: `PageHeader` · `FilterBar` · `SearchBar` · `StatusChip`.
- [ ] **Responsive** (`< 1024px`) — mobile shell per `CRM-MOBILE-tasks.md`: bottom tab bar, top app bar, persistent composer, Insights BottomSheet, **Pipeline → stage accordion**. Container queries + Tailwind.
- [ ] **A11y** — ≥44px targets; focus-trap sheets; `aria-live` toasts; **kanban keyboard/button move** (drag alternative); stage/risk never colour-only.

### Phase 5 — Verify 🔴
- [ ] Journeys — every route in `CRM-MOBILE-tasks.md §6.1` resolves (no dead ends).
- [ ] States — populated (built) + loading/empty/error per screen (`§6.3`).
- [ ] Breakpoints — 390 (design-verified) · 430 · 768 · 1024 (`MOBILE-PLAN.md §18`).
- [ ] HITL — won/lost/convert always route through the approval sheet; agent never auto-writes.
- [ ] axe/Lighthouse/Playwright.

---

## 3. Hard rules (do not violate)

1. **CRM is a front door, not a parallel app.** A won deal hands off to existing Brand/Shoot screens — design the *handoff*, don't rebuild those.
2. **One unified activity timeline** (`crm_activities`) — never separate Tasks/Comms/Notes/Meetings tables.
3. **`kind`/`role` are columns, not tables.** Agencies, vendors, sponsors, crew, models, photographers are variants of the two list screens.
4. **HITL on every write.** Find is free; act (draft/create/move/convert) routes through draft→approve. Won/lost/convert = a focused confirmation sheet.
5. **Honesty.** Fixtures until schema lands; every unwired surface says so. Sending (email/WhatsApp/SMS) is **draft + log only** at MVP — never actually send.
6. **Verify live schema before writing any table/RPC** — the 4 tables are *proposed*; confirm what already exists.

---

## 4. Scope boundary

| Now (MVP) | Phase 2 (needs schema) | Future (do NOT design) |
|---|---|---|
| 6 screens · 4 tables · kind/role · pipeline · won/lost HITL · brand-convert · crm-assistant waves 1–2 · mobile | Photographer/Crew/Location 360° (same template, per-entity config) · Command Center pipeline widget · contact merge | Campaigns · Products · Events · Contracts · Sponsors-as-entity · invoices/payments · live graph viz · semantic cross-entity search · email/calendar sync · comms **send** |

**Anti-creep rule:** anything not in the "Now" column requires an explicit scope decision. The reference deferred each Future item deliberately.

---

## 5. Readiness

- **Design readiness: 🟢 97/100** — 6 screens + mobile gallery built & verified, one shared 360° template, list↔detail parity, 0 stale refs, full audit on file.
- **Claude Code readiness: 🟡 74/100** — design is unambiguous, but all wiring is gated on 🔴 schema (IPI-362) + `crm-assistant`. Not a design gap; it's the expected backend start line.
