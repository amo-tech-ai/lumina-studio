# Mobile Improvements — iPix / FashionOS

> Per-screen review, scores, and best-practice improvements for the mobile design set.
> **Companion to** `MOBILE-PLAN.md` (spec + rollout) — this doc is the **review + backlog**.
> **Source of truth:** every row reviewed against its live 390 px frame in `Pages/SCR-MOBILE-Gallery.dc.html`. This is a review of **what's actually on the screen**, not the spec.
> **Last reviewed:** 2026-07-04 · 27 screens · avg **84.9 / 100 (B)**.

---

## 1. Scoring method

**Rubric (100):**

| Dimension | Weight | What it measures |
|---|:--:|---|
| Purpose clarity | 20 | Is it obvious what this screen is for in 2 seconds? |
| Information hierarchy | 20 | Does the most important thing lead? |
| Mobile ergonomics | 20 | ≥44px targets, thumb-reach, snap-scroll, sticky actions |
| AI / HITL usefulness | 15 | Is the assistant helpful and human-in-the-loop safe? |
| Content density & scan-ability | 15 | Right amount of info, easy to skim |
| Visual polish | 10 | Type, spacing, rhythm, imagery |

**Grade:** A ≥90 · B 80–89 · C 70–79 · D <70.

---

## 2. Scorecard

| # | Screen | Purpose | Key content on frame | Score | Grade |
|---|---|---|---|:--:|:--:|
| 1 | Command Center | Operator's daily home — what needs me now | KPI snap row · "Needs attention" priorities · active-shoot cards | 88 | B |
| 2 | AI Brief | 30-second agent-drafted day summary | Intro note · numbered Top-3 · "also worth knowing" | 82 | B |
| 3 | Role Dashboard | Agency two-sided home — offers + roster | KPI snap · incoming offers (pinned) · booking cards | 90 | A |
| 4 | Notifications | Event inbox for booking/shoot activity | filter chips · Today/Earlier grouped list | 87 | B |
| 5 | Settings / Profile | Manage account, rate, availability sync | hero · account form · preference rows | 80 | B |
| 6 | Brand List | Browse/triage all brands | filter chips · 2-up brand cards w/ DNA | 85 | B |
| 7 | Brand Detail | One brand's health & pipeline | hero · KPI · upcoming shoots | 86 | B |
| 8 | Brand DNA / Health | Explain the DNA score | score header · 5 signal bars · signal notes | 84 | B |
| 9 | Shoot List | Track shoots across lifecycle | status chips · 2-up shoot cards | 85 | B |
| 10 | Shoot Wizard | Create a shoot (4 steps) | vertical stepper · AI-drafted details form | 88 | B |
| 11 | Shoot Detail | Run one shoot | hero · status stepper · on-set list | 87 | B |
| 12 | Call Sheet | Day-of logistics | schedule list · key crew | 83 | B |
| 13 | Schedule | Week/day plan & conflicts | week/month chips · day-grouped list | 82 | B |
| 14 | Deliverables | Track selects→retouch→delivery | KPI · select thumbs · delivery progress | 84 | B |
| 15 | Approvals | HITL sign-off queue | HITL note · pending sets · approve/reject CTA | 89 | B |
| 16 | Matching | Rank talent to a brief | fit chips · 2-up candidate cards w/ fit% | 88 | B |
| 17 | Model Profile | Evaluate one model & book | hero · bio note · portfolio grid | 84 | B |
| 18 | Booking Wizard | Book talent (4 steps) | stepper · AI-drafted terms form | 88 | B |
| 19 | Booking Detail | Manage one booking's lifecycle | hero · status stepper · terms list | 90 | A |
| 20 | Availability | Model sets open/blocked days | month grid · 4-state legend | 86 | B |
| 21 | Assets | Browse asset pool | filter chips · image grid | 80 | B |
| 22 | Asset Detail | One asset's rights & usage | hero · metadata form | 83 | B |
| 23 | Asset Library | Assets by campaign/brand | grouping chips · grouped grids | 81 | B |
| 24 | Channel Preview | Pre-publish channel render | channel chips · grid · approve CTA | 85 | B |
| 25 | Campaign Preview | Plan a multi-channel drop | hero · KPI · channel plan list | 84 | B |
| 26 | Analytics Dashboard | Portfolio performance | KPI · reach-by-brand bars | 83 | B |
| 27 | Reports / KPIs | Revenue/utilisation deep-dive | metric chips · KPI · monthly bars · notes | 82 | B |

**Average: 84.9 / 100 (B).** Highest: Role Dashboard & Booking Detail (90). Lowest: Settings & Assets (80). No screen below 80 — the shared shell floors quality; the gap to A is per-screen ergonomics (inline actions, sticky CTAs, trend deltas).

---

## 3. Per-screen improvements (mobile best practice)

> Each fix is written as **what to change — then, in plain terms, what it does and why it helps.**

### Core

**1. Command Center**
- **Add a peek/scroll cue to the KPI row** — four stats exist but only two fit on screen; showing a sliver of the third tells the user "swipe for more" so nothing hidden gets missed.
- **Make "needs attention" rows tappable with a chevron** — right now they look like text; a chevron + tap that jumps straight to the task turns a summary into a to-do list.
- **Add a one-line "today at a glance"** — a single plain sentence at the top ("3 approvals, 1 conflict") orients the user before they read anything else.

**2. AI Brief**
- **Add a "why" link + time estimate per item** — shows the evidence behind each suggestion and how long it'll take, so the user trusts the AI and can plan their morning.
- **Let the brief be dismissed or saved** — once read, it should get out of the way; keeping it forever makes it feel stale.
- **Show the conflict as a colored callout** — a red highlighted box is impossible to skim past; a plain grey row is easy to miss.

**3. Role Dashboard**
- **Put Accept/Decline buttons (≥44px) on each offer** — offers are the whole point of this screen; the user should act right here instead of tapping in and back out.
- **Add a live expiry countdown** — "expires in 40h" ticking down creates urgency a static date can't.
- **Confirm before accepting** — a quick "are you sure?" sheet prevents a mis-tap from booking a real job.

**4. Notifications**
- **Swipe-to-dismiss + unread dots** — lets the user clear the list with a thumb flick and see at a glance what's new, like every messaging app they already know.
- **Sort urgent items to the top with an amber edge** — time-sensitive alerts shouldn't be buried below old ones.
- **Sticky "Mark all read"** — one tap to clear the badge, always reachable.

**5. Settings / Profile**
- **Split public Profile from private Settings** — they're two different jobs (how others see me vs. how the app behaves); mixing them confuses both.
- **Add a profile-completeness meter** — a simple "92% complete" nudges the user to fill the gaps that improve their match rate.
- **Use real toggle switches (≥44px)** — on/off settings should look and tap like switches, not text rows.

### Brand

**6. Brand List**
- **Add search + sort** — with 18+ brands, scrolling is slow; letting the user search or sort by "at risk" gets them to the right one fast.
- **Default to the "At risk" filter when something's flagged** — surfaces problems automatically instead of waiting to be asked.
- **Add a small DNA color legend** — explains what the green/amber score dots mean so the numbers aren't cryptic.

**7. Brand Detail**
- **Add a DNA trend sparkline** — a tiny line showing the score going up or down tells a story a single number can't.
- **Quick "New shoot" button** — the most common next action should be one tap away.
- **Recent-asset thumbnail strip** — a glance at the latest work grounds the stats in real images.

**8. Brand DNA / Health**
- **Add up/down arrows on each signal bar** — shows whether each part of the score is improving or slipping, not just its current level.
- **Add a portfolio benchmark tick** — a marker for "average across all brands" tells the user if 88 is good or bad here.
- **Keep the Explain chip** — letting the user ask the AI "why 92?" is exactly the right HITL touch.

### Shoots

**9. Shoot List**
- **Add a status color legend** — clarifies what "shooting / prep / post" colors mean at a glance.
- **Flag anything behind schedule** — a clear warning badge stops slipping shoots from hiding in the list.
- **Progress ring per card** — a small dial shows how far along each shoot is without opening it.

**10. Shoot Wizard**
- **Keyboard-aware sticky Back/Continue footer (≥44px)** — the navigation buttons must stay visible above the keyboard so the user never loses their place while typing.
- **Turn the "AI review" badge into an Approve/Edit control** — right now the AI's draft is just labelled; the user should be able to accept or fix each field, which is the whole point of human-in-the-loop.

**11. Shoot Detail**
- **Make the status stepper horizontal-scroll** — fits a long lifecycle without cramping.
- **Add a tab strip (Overview / Crew / Deliverables)** — separates dense info into clean sections instead of one long scroll.
- **Quick actions (message crew, add note)** — the things people do most on set, one tap away.

**12. Call Sheet**
- **Add a "now" time indicator** — a line marking the current moment on the day's schedule tells the crew what's next at a glance.
- **Tap-to-call/message crew** — on set you need to reach someone fast; make names dial or text directly.
- **Weather block + map link** — the two things every call sheet is checked for.

**13. Schedule**
- **Add a week-strip date selector** — a swipeable row of days is faster than scrolling a long list.
- **Show conflicts inline in red** — a clash is currently only mentioned in the AI panel; it should scream from the schedule itself.
- **Tap a row to open the shoot** — every entry should be a doorway, not a dead label.

**14. Deliverables**
- **Add per-stage progress bars** — visualises how many photos are shot vs. retouched vs. approved vs. delivered.
- **Status filter** — lets the user see just "awaiting approval" without hunting.
- **Bulk-approve entry** — a shortcut into the Approvals screen for the common "sign off everything ready" action.

**15. Approvals**
- **Add Approve/Reject on each set (not just one global button)** — the user often wants to approve two and hold one; per-item buttons allow that.
- **Expand the flagged item to show the reason + evidence** — before rejecting, the user should see exactly what the AI flagged and why.
- **Keep the strong HITL note** — the "AI never auto-approves" line sets the right expectation.

### Talent & Booking

**16. Matching**
- **Show fit% as a ring or badge** — a visual score reads faster than a number in text.
- **"Why matched" expand** — lets the user see the reasoning behind a 94% before trusting it.
- **Shortlist-add + availability dot** — save good candidates and see who's free without leaving the list.

**17. Model Profile**
- **Add a sticky "Request booking" button** — the main action should follow the user down the page, carrying the right talent id so the booking is pre-filled.
- **Tab strip (Portfolio / Measurements / Availability)** — organises a rich profile into scannable sections.
- **Show the rating count** — "4.9 from 40 jobs" is far more trustworthy than "4.9" alone.

**18. Booking Wizard**
- **Keyboard-aware sticky Send, locked until Review** — keeps the final action reachable while typing, but prevents sending before the user has checked everything.
- **Approve/Edit each AI-drafted term** — the user confirms rate, usage, and release line by line rather than trusting a black box.
- **Running cost total** — always show the money so there are no surprises at the end.

**19. Booking Detail**
- **Make "Confirm booking" a sticky primary button (≥44px, operator-only)** — the decisive action shouldn't be hunted for; and only the operator should be able to press it.
- **Hold-expiry countdown** — shows how long the crew hold lasts before the user must decide.
- **"Message talent" action** — a direct line to the person, right where the booking lives.

**20. Availability**
- **Add a "Save" bar that appears when changes are made** — the user should clearly know their edits aren't saved until they tap it.
- **Month arrows + drag to select** — move between months and block a range of days in one gesture instead of tapping each.
- **Explain held days inline** — a tap on a held day should say "backing the Nike offer" so blocking it isn't a mystery.

### Assets & Commerce

**21. Assets**
- **Add search + a "rights expiring" filter** — 1,200 assets are unusable without search; expiring rights are the thing most worth surfacing.
- **Select/multi mode** — pick several at once to package or export.
- **Counts per filter** — "Approved (218)" tells the user how big each bucket is before tapping.

**22. Asset Detail**
- **Rights countdown** — shows how long this asset is legally usable before it expires.
- **Usage-rights visual + "Add to campaign"** — makes the licensing plain-English and lets the user act on a good asset immediately.
- **Similar-assets strip** — "more like this" helps find alternates fast.

**23. Asset Library**
- **Collapsible groups** — fold campaigns the user isn't looking at so the page stays short.
- **Performance sort** — put the best-performing assets first.
- **"Export set" action** — bundle a group for hand-off in one tap.

**24. Channel Preview**
- **Render a real in-feed device mock** — show the post as it will actually look on Instagram/TikTok, not as a plain grid, so the user can judge it truthfully.
- **Caption-draft block** — the AI drafts the caption right beside the image, ready to edit.
- **Schedule/date picker before Approve** — decide when it goes out as part of approving it.

**25. Campaign Preview**
- **Reach-forecast mini chart** — a simple projection of how far the drop will travel.
- **Per-channel readiness chips** — "IG ready · TikTok draft" shows what's blocking launch at a glance.
- **Launch date + "Approve to publish"** — a clear go-live moment with a human sign-off.

### Analytics

**26. Analytics Dashboard**
- **Add +/− deltas on each KPI** — "£182k ▲11%" tells the user if things are getting better; a bare number doesn't.
- **Time-range selector** — compare this week vs. this quarter without leaving the screen.
- **Tap-to-drill + sparklines** — tap a stat to see detail; a tiny trend line gives instant context.

**27. Reports / KPIs**
- **"Export PDF" action** — reports get shared; make sending one effortless.
- **Period-compare toggle** — see this quarter against last to judge progress.
- **Chart legends + segment filters** — label what the bars mean and let the user slice by brand or channel.

---

## 4. Cross-cutting best practices (apply to all 27)

- **Inline primary action** — the main verb (Accept, Confirm, Approve, Book, Save) should be reachable in the thumb zone as a sticky ≥44px control, not buried in a list row.
- **Live urgency** — anything time-boxed (offers, holds, rights) shows a countdown, not a static date.
- **Trend over snapshot** — KPIs and DNA carry a delta/sparkline; a number alone under-informs.
- **Tap-through everything** — every list row and card has a clear affordance (chevron/press state) and a destination.
- **HITL visible** — AI-drafted fields carry an explicit Approve/Edit, and irreversible actions open a confirm sheet.
- **Keyboard-aware** — forms lift their footer above the keyboard; the composer never traps focus.

---

## 5. Priority backlog (highest leverage first)

| Priority | Improvement | Screens affected | Why |
|:--:|---|---|---|
| P0 | Inline ≥44px primary action (Accept/Confirm/Approve/Book/Save) | Role Dashboard, Booking Detail, Approvals, Availability, Model Profile | The core verb is currently in a non-tappable row — biggest UX gap |
| P0 | Live countdown on time-boxed items | Role Dashboard, Booking Detail, Asset Detail, Notifications | Expiry drives action; static dates under-communicate |
| P1 | FieldReview Approve/Edit on AI-drafted fields | Shoot Wizard, Booking Wizard | HITL is passive today (badge only) |
| P1 | Trend deltas / sparklines on metrics | Command Center, Brand Detail, Brand DNA, Analytics, Reports | Numbers without direction under-inform |
| P2 | Search + smarter filters | Brand List, Assets, Asset Library | Scales past demo data |
| P2 | In-feed device mock | Channel Preview | Preview should look like the channel |

> **Status (updated 2026-07-04):** every P0–P2 item below is now **demonstrated in the Mobile Preview Gallery** (`Pages/SCR-MOBILE-Gallery.dc.html`) as real 390 px frames. "Demonstrated" = the affordance is visible and, where stateful, interactive in the preview; production wiring (live RPCs, real gestures, keyboard focus mgmt) is still the Claude Code build. Reusable blocks added to do this: CALLOUT · SEARCH · LEGEND · WEEK · HSTEP · FEED · card ring/badge/avail · KPI delta+spark · BARS trend+bench · LIST unread/toggle/dismiss/countdown/actions/chev · dual sticky · FORM Approve/Edit · confirm sheet.

| Priority | Improvement | Screens affected | Status | Why |
|:--:|---|---|:--:|---|
| P0 | Inline ≥44px primary action (Accept/Confirm/Approve/Book/Save) | Role Dashboard, Booking Detail, Approvals, Availability, Model Profile | 🟢 shown | Core verb was in a non-tappable row — now inline buttons + sticky CTAs |
| P0 | Live countdown on time-boxed items | Role Dashboard, Booking Detail, Asset Detail, Notifications | 🟢 shown | Expiry drives action; static dates under-communicate |
| P1 | FieldReview Approve/Edit on AI-drafted fields | Shoot Wizard, Booking Wizard | 🟢 shown | HITL was passive (badge only) — now Approve/Edit per field |
| P1 | Trend deltas / sparklines on metrics | Command Center, Brand Detail, Brand DNA, Analytics, Reports | 🟢 shown | Numbers without direction under-inform |
| P2 | Search + smarter filters | Brand List, Assets, Asset Library | 🟡 partial | Brand List done (SEARCH+legend); Assets/Library pending (todo 13–14) |
| P2 | In-feed device mock | Channel Preview | 🟢 shown | Preview looks like the channel now (FEED block) |
| — | **Casting Review Mode** (Skip/Shortlist/Profile deck) | SCR-09 Matching Talent tab | 🟢 built | Interactive in SCR-09 (Casting/Grid/List) + mobile gallery frame; buttons + ←→↑ keys + aria-live toast; no dating copy |

> **Also demonstrated beyond the original backlog:** confirm-before-accept sheet (Role Dashboard) · unread dots + dismiss + sticky Mark-all-read (Notifications) · toggle switches + completeness meter (Settings) · progress rings + status legend (Shoot List) · horizontal stepper + tab strip + quick actions (Shoot Detail) · week-strip + inline conflict + tappable rows (Schedule) · pipeline bars + status filter + bulk-approve (Deliverables) · per-set Approve/Reject + evidence callout (Approvals) · fit badges + availability dots + "Why matched" (Matching) · DNA benchmark ticks + recent-work strip (Brand) · weather callout + "now" marker + tap-to-call (Call Sheet).

> Remaining gallery polish (todos 12–15): Availability save-bar + month arrows · Assets/Library search + rights filter + Export set · Channel caption-draft + schedule row · Campaign reach-forecast + readiness chips.

---

## 6. External review — are the suggestions correct?

A reviewer scored this doc 95/100 and asked for 10 implementation-readiness audits. **Verdict: the suggestions are correct in principle — but ~half already exist elsewhere in the project.** Honest status of each:

| # | Reviewer ask | Verdict | Where it lives / what's missing |
|:--:|---|:--:|---|
| 1 | User-flow audit (how did I get here / where next / every CTA) | 🟢 **Exists** | `AUDIT-ipix.md §12.1` master nav matrix + `MOBILE-PLAN §22.6` journey audit + `docs/handoff/07-navigation-map.md`. Every CTA verified there. |
| 2 | Component dependency matrix | 🟢 **Exists** | `IMPLEMENTATION-MATRICES.md §1` (component→screens, build order). |
| 3 | Data requirements per screen (tables/RPCs) | 🔴 **Genuine gap — engineering** | Deliberately Phase 2. Do **not** fabricate schema; see §7 below + `01-model-booking-engineering-handoff.md`. |
| 4 | Empty-state audit (systematic) | 🟡 **Partial → added below (§7)** | Loading/error added under D-FIX-006; empty/permission/offline not systematic. Now covered by archetype. |
| 5 | AI context audit (assistant/context/chips/allowed/forbidden) | 🟢 **Exists** | `IMPLEMENTATION-MATRICES.md §6` + `MOBILE-PLAN §22.3–22.4` + `COMPOSER-PRIMITIVE.spec.md §4`. |
| 6 | Mobile interaction audit (swipe/drag/tap/keyboard) | 🔴 **Genuine gap → added below (§8)** | Not previously documented. |
| 7 | Performance audit (lazy/pagination/virtualization) | 🟡 **Engineering — guidance added (§10)** | Design-side guidance only; impl is Claude Code. |
| 8 | Accessibility audit | 🟢 **Exists → checklist added (§9)** | `docs/design/ACCESSIBILITY.md` is the source; §9 adds a per-screen quick-check. |
| 9 | Production checklist per screen | 🔴 **Genuine gap → added below (§11)** | Reusable template didn't exist. |
| 10 | Backend mapping (Supabase/RPC/agents/permissions) | 🔴 **Genuine gap — engineering** | Phase 2, engineering-owned. Structure exists in `IMPLEMENTATION-MATRICES §5` (state) + `§6` (AI); the concrete table/RPC names must come from the real backend, not be invented. |

**Bottom line:** 4 of 10 already done, 2 are engineering-owned (don't invent), 4 are real design-side gaps — added below as §7–§11. The reviewer's new-document list (Screen Inventory, Component Inventory, Backend Mapping, Journey/Nav/AI matrices) is **already satisfied** by `SCREEN-REGISTRY.md`, `COMPONENTS.md`, `IMPLEMENTATION-MATRICES.md`, and `AUDIT-ipix.md` — no new files needed for those.

---

## 7. Empty / loading / error state audit

> Systematic per **archetype** (patterns are shared by screen type — cleaner than 27 near-identical rows). Loading + error already built on Model Profile, Booking Wizard/Detail (D-FIX-006); the rest inherit these patterns.

| Archetype | Screens | Empty | First-time | Loading | Error | Offline / permission |
|---|---|---|---|---|---|---|
| **List** | Brand/Shoot/Asset List, Notifications, Matching | "No X yet" + primary CTA to create/discover | onboarding hint card | 3–4 skeleton rows | inline retry banner | cached list + "offline" chip; empty if no permission |
| **Detail** | Brand/Asset/Shoot/Booking/Model Detail | n/a (always has a subject) | — | hero + text skeleton | full-card retry | read-only if permission denied |
| **Dashboard** | Command Center, Role Dashboard | "Nothing needs you" positive empty | welcome + setup checklist | KPI + card skeletons | per-widget retry (don't fail whole page) | stale-data banner |
| **Wizard** | Shoot/Booking Wizard | n/a (starts fresh) | step-0 intro | inline field spinners | keep input, show field error | block Send offline |
| **Calendar** | Availability | all-free month | "Set your availability" prompt | month-grid shimmer | retry month | edit disabled if not owner |
| **Analytics** | Analytics, Reports, Deliverables | "No data for this range" | — | chart shimmer | retry chart | cached snapshot |

**Rule:** every screen must render all applicable states; an empty state is a **guided next action**, never a blank page. Permission-denied is a distinct state (read-only or explain), not an error.

---

## 8. Mobile interaction audit

> Which gestures each archetype supports. Keeps interactions consistent so the app feels learnable.

| Gesture | Where it applies | Behaviour |
|---|---|---|
| **Tap** | everywhere | rows/cards → destination; ≥44px targets; visible press state |
| **Horizontal snap-scroll** | KPI rows, filter chips, tab strips, portfolio, status stepper | scroll-snap; partial peek signals more |
| **Vertical scroll** | all bodies | composer + tab bar stay fixed below (never scroll away) |
| **Swipe** | Notifications rows | swipe-to-dismiss / mark read |
| **Drag** | Availability, Insights sheet handle | drag to multi-select days; drag sheet peek↔full |
| **Long-press** | asset grids, roster cards | multi-select mode |
| **Pull-to-refresh** | List + Dashboard + Notifications | refetch; show last-updated |
| **Keyboard** | Wizards, composer, forms | footer/CTA lifts above keyboard; composer never traps focus |
| **Sheet dismiss** | every Insights/Evidence sheet | drag-down, backdrop tap, Esc (desktop), close button |

**Not yet in the gallery** (design backlog): swipe-to-dismiss, drag-multi-select, long-press, pull-to-refresh — all require the React shell; specced here so they're built consistently.

---

## 9. Accessibility quick-check

> Full standard = `docs/design/ACCESSIBILITY.md`. This is the per-screen fast check.

- **Contrast** — body text ≥4.5:1, large text ≥3:1; the amber `--warning` on white needs `--warning-text` for text (already the token split).
- **Touch targets** — ≥44×44px; today's list-row actions and tab items pass; inline offer/approve buttons (backlog) must too.
- **VoiceOver labels** — every icon-only button (Insights ✦, send ▸, back, tab items) needs an `aria-label`; images need alt or `role="img"` + label.
- **Focus order** — logical top→bottom; sheets trap focus while open and return it on close (design added Esc + backdrop; refs are Code).
- **Reduced motion** — honor `prefers-reduced-motion`: sheet-up, shimmer, pulse dots become instant/none.
- **Text scale** — layouts must survive Dynamic Type up to ~200% (avoid fixed-height text rows).
- **State not by color alone** — availability/status use shape+label, not just hue (calendar already uses strike-through + border).

---

## 10. Performance guidance (design-side)

> Implementation is Claude Code; these are the design decisions that make it possible.

- **Lazy-load images** — grids (Assets, Portfolio, Deliverables) load below-fold thumbnails on demand; use low-res placeholders (the gallery already uses `background-image` divs, which are swap-friendly).
- **Paginate / infinite-scroll long lists** — Assets (1,200), Notifications, Matching: page in ~20 at a time.
- **Virtualize** the asset grid and any list >100 rows.
- **Cache** dashboard KPIs + AI summaries; label AI text non-live until Phase 2.
- **Skeletons over spinners** — the loading states in §7 keep perceived speed high.

---

## 11. Production-readiness checklist (per-screen template)

> Copy this block per screen at build time. A screen ships only when every line is ✅.

```
Screen: SCR-__  ________________________

[ ] Layout        renders 390 · 430 · 768 · 1024 with no overflow
[ ] Navigation    reachable from ≥1 entry; back/close works
[ ] Links         every CTA resolves (no dead ends)
[ ] Responsive    3-pane → 1-col collapse verified
[ ] Loading       skeleton state
[ ] Error         retry state
[ ] Empty         guided-action empty state
[ ] Permissions   role-gated / read-only variant
[ ] Accessibility contrast · labels · focus · 44px · reduced-motion
[ ] Performance   lazy images · pagination where needed
[ ] AI            correct assistant · chips · HITL (no auto-act)
[ ] Analytics     key events instrumented
[ ] Complete      signed off
```

**Rollup:** track completion in `MOBILE-PLAN §22.5` (the 9-column matrix) — extend it with Loading/Error/Empty/A11y columns as those get built. Design columns (Layout/Chatbot/Insights/Safe-area/Bottom-nav) are ✅ at 390; the rest flip to ✅ during the Claude Code build.

---

## 12. Suggested next steps

1. **Nothing to re-document** — Screen Inventory, Component Inventory, Nav/Journey, and AI Context matrices already exist (§6 table shows where). Don't duplicate them.
2. **Design backlog** (this doc §3, prioritized in §5) — optionally upgrade the top P0 frames in the gallery (Role Dashboard, Booking Detail, Approvals) so the preview *demonstrates* inline actions + countdowns.
3. **Engineering-owned, Phase 2** — Backend Mapping (#3, #10): fill the real Supabase tables / RPCs / agents / permissions against the live schema. This is the true remaining 5% and it is **not** design work — it must not be invented here.
4. **Carry §7–§11 into the Claude Code build** — empty/interaction/a11y/performance/production checklists are the acceptance criteria for each screen.
