# CRM / Relationships — Claude Code Handoff

> **Start here** for building the CRM. Design is complete + verified on fixtures; everything below is engineering. **No design decisions are open** — this doc + the 6 prototypes + `crm-plan.md` are the source of truth.
> Legend: 🟢 done · 🟡 partial · 🔴 blocked/not started · ⚪ later.

**Status update (2026-07-12):** this doc's Phase 1–5 checklist below was written before any engineering started and had drifted badly — it still marked schema, the agent, and all 6 screens as 🔴. Corrected below against live Linear/Supabase/code state (see `Universal-design-prompt-4/crm/tasks/AUDIT/` for the full evidence trail and `IPI-568` in Linear for the current production-readiness tracker). Section 1 (screen designs) and section 3–4 (hard rules, scope boundary) are unchanged — those held up correctly.

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

### Phase 1 — Foundation 🟢 done
- [X] **Schema (IPI-362)** — `crm_companies`, `crm_contacts`, `crm_deals`, `crm_activities` all live, verified against the running Supabase project (`nvdlhrodvevgwdsneplk`).
  - [X] `crm_companies.kind` enum: `brand · agency · vendor · sponsor`
  - [X] `crm_contacts.role` enum: `contact · model · photographer · crew`
  - [X] `crm_deals.stage` enum: `lead · qualified · proposal · negotiation · won · lost`
  - [X] `crm_deals.shoot_id` FK → `shoots`; `crm_companies.brand_id` FK → `brands` (nullable, linked on convert)
  - [X] `crm_activities` — one unified timeline table with a `type` column (`call/email/note/meeting/ai_summary`). No separate Tasks/Comms/Notes tables were created — the rule held.
- [X] **RLS** — org-scoped on all 4 tables, zero security-advisor findings (re-verified 2026-07-12).
- [X] **Indexes** — FKs, `stage`, org scope confirmed live.

### Phase 2 — Data access 🟡 partial
- [X] Reads are **not literal RPCs** — implemented as typed server-side query functions in `app/src/lib/crm/queries.ts` (`listCompanies`, `getCompany`, `listContacts`, `getContact`, `listDeals`, `getDeal`) going through normal RLS, not `SECURITY DEFINER` wrappers. Functionally equivalent to this doc's original ask; naming diverged, worth knowing if you're grepping for `list_companies` and finding nothing.
- [X] **`crm_convert_deal`** RPC (IPI-367) — the real equivalent of this doc's proposed `transition_deal`. Service-role-gated via `is_org_editor_or_above()`, `SECURITY DEFINER`, atomic (lock → validate → convert → link → flag → update → log), 5 hardening passes, independently re-verified by 4 separate audits this week. This is the single most safety-critical piece of the whole module and it's solid.
- [X] **Brand-convert path** — won deal creates/links a `brands` row, copies `domain → brand_url` when present, hands off to `/app/brand/:id`.
- [ ] **create_* RPCs for Companies/Contacts** — no `POST /api/crm/companies` or `POST /api/crm/contacts` exists. "New Company"/"New Person" buttons still show `ComingSoonButton` — tracked as [IPI-562](https://linear.app/amo100/issue/IPI-562).
- [ ] **Notification kinds** — `deal_stage_changed` / `follow_up_due` still not added to `public.notifications`. Worth noting: there's no closed enum on `notifications.kind` to add them to (confirmed by direct schema read) — this is a code-wiring gap, not a schema migration. SCR-15's inbox itself is also unbuilt (see Phase 4).

### Phase 3 — Agent 🟡 partial (wave 1 only)
- [X] **`crm-assistant` wave 1** (IPI-368) — agent registered, mapped to every `/app/crm/*` route via `route-agent-map.ts`. Tools live: `searchCompanies`, `searchContacts`, `logActivity`, `moveDealStage`.
- [ ] **Wave 2** (IPI-369) — `summarizeRelationship`, `scoreDealHealth`, `draftFollowUp` **do not exist**. Every "crm-assistant · not yet wired" badge in the shipped screens is still accurate, not stale — the honesty rule (§3.5 below) is being followed correctly, it's just genuinely not built yet. This is the single largest remaining piece of CRM engineering work.
- [ ] Cross-entity queries per `crm-plan.md §21` — still gated on wave 2.

### Phase 4 — Frontend 🟡 partial
- [X] React routes for all 6 screens (SCR-26–31) shipped and match prototype layouts (SCR-30's parity was never formally diffed against the .dc.html — see task list item #2, still open).
- [X] Shared components reused: 3-panel shell, IntelligencePanel, PersistentChatDock, EvidenceBlock. `ApprovalCard`'s **visual pattern** was matched by a purpose-built `deal-stage-control.tsx`, not a literal import — functionally equivalent, worth knowing if you go looking for a direct `<ApprovalCard>` usage in the won/lost gate and don't find one.
- [ ] **Responsive (`< 1024px`)** — confirmed **zero** implementation. No `useMediaQuery`/`matchMedia`/`BottomSheet` usage anywhere in `app/src/components/crm/**`, despite `SCR-MOBILE-CRM-Gallery.dc.html` and `CRM-MOBILE-tasks.md §6` being fully spec'd and design-complete. Split across two tickets: [IPI-563](https://linear.app/amo100/issue/IPI-563) owns Pipeline's stage-accordion slice; [IPI-572](https://linear.app/amo100/issue/IPI-572) owns the shared mobile chrome plus Companies/Contacts/Company Detail/Contact Detail/Deal Detail.
- [ ] **A11y** — kanban keyboard/button move (drag alternative) not built; also part of IPI-563.

### Phase 5 — Verify 🔴 not started
- [ ] Journeys, states, and breakpoint checks from `CRM-MOBILE-tasks.md §6` — not run.
- [ ] **Zero Playwright/e2e tests exist for any CRM flow**, including the highest-risk write path (Won/Lost conversion). `scripts/verify-rls.mjs` has strong manual-run coverage of the convert RPC but isn't wired into CI. This is the top production blocker per this week's readiness audit (~54/100 composite, [IPI-568](https://linear.app/amo100/issue/IPI-568)).
- [X] HITL — won/lost/convert confirmed to always route through the approval dialog; verified by code-search regression test + live browser attempts to bypass it.
- [ ] axe/Lighthouse — not run.

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

- **Design readiness: 🟢 97/100** — 6 screens + mobile gallery built & verified, one shared 360° template, list↔detail parity, 0 stale refs, full audit on file. Unchanged — design was never the bottleneck.
- **Engineering readiness (2026-07-12 update): 🟡 ~54/100** — schema, the safety-critical Won/Lost RPC, and all 6 screens are done and independently re-verified. The gap moved: it's no longer "waiting on backend to start" (this doc's original 74/100 framing), it's now concentrated in three places — `crm-assistant` wave 2 (0% built, blocks the AI panels every screen already has a slot for), zero e2e test coverage on the highest-risk write path, and the mobile-responsive layer (fully designed, zero React implementation). See [IPI-568](https://linear.app/amo100/issue/IPI-568) for the live, evidence-weighted production-readiness tracker — treat that as more current than this static score.
