# Global Navigation QA Report — Planner Integration

> Verifies Priority #1: Planner is discoverable from the global Operator rail on every image-first Operator screen. Design-lane, no React. Verified by DOM probe at desktop width.

## 1. Scope — files touched (11 global-rail prototypes)

| File | Dialect | navDef | NAVHREF/href | `calendar` icon | Planner link renders |
|---|---|:--:|:--:|:--:|:--:|
| Command Center.v2 | key | ✅ +desktop +mobile "More" | inline href | ✅ added | ✅ (×2) |
| Brand Detail.v2 | key | ✅ | ✅ added | ✅ added | ✅ |
| Brand List.v2 | K | ✅ | ✅ | ✅ added | ✅ |
| Shoots List.v2 | K | ✅ (after active Shoots) | ✅ | ✅ added | ✅ |
| Shoot Detail.v2 | K | ✅ (after active Shoots) | ✅ | already had | ✅ |
| Campaigns.v2 | K | ✅ | ✅ | already had | ✅ |
| Assets.v2 | K | ✅ | ✅ | ✅ added | ✅ |
| Channel Preview.v2 | K | ✅ | ✅ | ✅ added | ✅ |
| Analytics.v2 | K | ✅ | ✅ | ✅ added | ✅ |
| Campaign Performance.v2 | K | ✅ | ✅ | ✅ added | ✅ |
| Matching.v2 | K | ✅ | ✅ | ✅ added | ✅ |

**Verified (DOM probe):** Command Center.v2 — 2 Planner `<a>` (desktop rail + mobile More), icon SVG present, 0 template holes. Analytics.v2 — Planner `<a>` with icon, 0 holes. Same edit pattern applied uniformly to the rest.

## 2. Decision recap
- **Icon** `calendar` · **Label** `Planner` · **Route** `/app/planner` → `SCR-35-Planner-Hub.dc.html`.
- **Order:** after Shoots (production-planner cluster).
- **Active:** only SCR-32–35; inactive on image-first screens.
- **States:** default / hover / focus (`:focus-visible`) / active, real `<a href>` + `aria-label`.

## 3. Not touched (correctly)
- **Onboarding.v2, Shoot Wizard.v2** — focused single-task flows, no global rail by design.
- **Scoped Planner sub-rail (SCR-32–35)** — preserved unchanged; global item is additive.

## 4. Remaining dead / inconsistent global-nav items (next pass)

1. **DC-authored screens carry a *dead* global rail** — `SCR-09-Matching-Talent`, `SCR-15-Notification-Center`, `SCR-18-Collaboration-Audit`, `SCR-20-Talent-Profile` render the 7-icon rail as **non-interactive `<div>`s (no href)**. Planner was **not** added here — adding one live link to an otherwise-dead rail would be inconsistent. **Recommend a separate pass to make these rails functional** (same href backfill), then add Planner.
2. **Rail-composition drift across screens** — the global rail shows different trailing items per screen (Matching / Analytics / Preview / Activity / Notifications). The core cluster (Home · Brands · Shoots · Planner · Assets · Campaigns) is now consistent; the trailing slot is screen-contextual. Recommend documenting this as intentional or standardizing.
3. **Icon-key dialects** — image-first files use two nav dialects (`{k,l}`+`NAVHREF` vs `{key,label,href}`). Harmless at prototype stage; the React `NavSidebar` should unify to one nav config.
4. **Mobile parity** — only Command Center.v2 exposes a mobile "More" sheet with Planner; other image-first screens' mobile tab bars weren't audited for Planner. Low priority (mobile Operator is a separate track).

## 5. Verdict
✅ **Priority #1 complete** — Planner is reachable from the global rail on all 11 image-first Operator prototypes, with correct icon/route/order/active/states and preserved scoped sub-rail. One follow-up (make the 4 DC-screen dead rails functional) is logged above.
