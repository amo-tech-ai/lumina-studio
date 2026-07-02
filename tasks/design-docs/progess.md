# Design V2 — Screen Implementation Progress

**Updated:** 2026-07-02
**Method:** Forensic code audit — design HTML spec (`Universal design prompt/*.v2.image-first.dc.html`) vs actual `app/src/app/` route on `main` @ `31d60c1`, checked against `tasks/design-docs/handoff/11-screen-checklists.md`. No screen graded on claims alone — every row backed by file:line proof.

🟢 complete (≥90%) · 🟡 in progress · 🔴 broken/errors found · ⚪ not started

| Screen | Status | % | What's built | What's missing / next |
|---|---|---|---|---|
| Matching | 🟡 | 55% | Swipe+table toggle, live Supabase shortlist RPCs, EvidenceBlock, 2/2 tests pass (`talent-tab.tsx`) | No bulk-select/checkbox bar, no Invite flow (disabled, "IPI-309"), no save/invite toasts, 3 of 4 sub-tabs are "Coming soon" stubs |
| Shoot Detail | 🟡 | 35% | Route resolves `:id`, 3 of 9 tabs live (Overview, Shot List, Deliverables) w/ real data | 6/9 tabs are bare `<Placeholder>` stubs (Assets, Team, Schedule, Budget, Approvals, Activity); no insights panel, no edit modal, no Assets deep-link |
| Shoot Wizard | 🟡 | 35% | 6 real, functional steps w/ HITL approval gates (Deliverables/Shot List/Budget) wired live | Only 6 of 10 spec'd steps exist; no Production Readiness dashboard, no draft-save, no URL-param hydrate, no step-jump menu, uses spinner not skeleton |
| Shoots List | 🟡 | 35% | Fully functional list: fetch, search, status filter, sort, empty/error states, New→wizard wired | Wrong design system entirely — old orange/serif theme, not v2 tokens; no AI dock/IntelligencePanel, no mobile nav, zero tests |
| Brand Detail | 🟡 | 30% | Real tabbed page on `main`, DNA score badge, activity timeline, Supabase-backed | No "Plan a Shoot" CTA, no 4-pillar breakdown, EvidenceBlock exists but not wired here, 2 tabs "Coming soon". Draft PR #181 (unmerged, Cursor) claims ~75% on a separate branch — not reflected on `main` |
| Channel Preview | 🟡 | 25% | Real route, 4 phone frames, image/video toggle, safe-zone toggle, live channel specs | No operator shell/nav, no AI dock, no publish flow at all, no EvidenceBlock, no tests |
| Brand List | 🟡 | 18% | Real DB-backed list (auth-gated Supabase query), empty-state CTA works | Plain `<ul>` rows, no `BrandCard` component exists at all, no search/filter, hardcoded hex colors (violates tokens rule), only 2 of 5 states. Draft PR #181 claims ~80%, unmerged |
| Campaigns | ⚪ | 5% | Route resolves, nothing else | Pure `<SectionPlaceholder>`; no DB table exists yet (blocked on IPI-268 schema migration) |
| Assets | ⚪ | 0% | — | Pure `<SectionPlaceholder>`; no `AssetCard`, no upload modal, no DNA panel, no tests. Older MVP claim in root `todo.md` is stale/superseded — nothing on disk now |
| Analytics | ⚪ | 0% | — | No route exists at all |
| Campaign Performance | ⚪ | 0% | — | No route exists at all |

**Overall: ~26% average v2 parity across these 11 screens.** No screen complete; none had actual crashes/build errors (nothing rated 🔴).

## Next (highest leverage, ranked)

1. **Shoot Detail tab-fill** — 6 of 9 tabs are placeholder swaps away from already-fetched data.
2. **Matching bulk-select + Invite flow** — closest screen to done; needs D-DS5 selection + wiring the disabled Invite CTA.
3. **Assets** — nothing built (P3/IPI-248), gated behind Cloudinary pipeline (DESIGN-074); sequence after that lands.
4. **Campaigns schema (IPI-268)** — unblocks both Campaigns and Campaign Performance, both hard-blocked at 0-5%.
5. **Brand List/Detail on `main`** — real gap is PR #181's work (~80%/~75%) isn't merged; `main` is materially behind until that branch lands.

## Notes on other docs

- Root `/home/sk/ipix/todo.md` is a stale 2026-06-24 forensic audit with superseded ticket IDs (IPI-900 series) — not current SSOT.
- Live SSOT for priority/sprint/blockers: `tasks/plan/todo.md`.
