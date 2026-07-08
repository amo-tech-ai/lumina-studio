# Implementation Plan — Plain-English Summary

> The short, no-jargon version of [`implement.md`](implement.md). Read this first; open `implement.md` for the task-by-task detail.
> Date: 2026-07-06.

## In one sentence

The **design is finished** (31 screens drawn and specced), the **foundations are built** (the app shell, the AI, the database), but **most of the actual screens aren't coded yet** — so the job now is to build the missing screens, starting with the ones whose backend is already done.

---

## The picture in plain words

Think of the product as a house:

- **The blueprints are complete** — every room (screen) is fully designed. 🟢
- **The frame, wiring, and plumbing are in** — the shared shell, the AI assistant, and the database all work. 🟢
- **Only a few rooms are actually finished** — 8 of ~26 screens are really built; the rest are empty shells or not started. 🟡

So this is **not** a "start from scratch" project. It's a "finish the rooms" project.

### What's already done ✅
- **The shell** every screen sits in (left nav, main area, right info panel, bottom AI chat).
- **The AI brain** — a chat assistant on every screen, 8 specialist agents, and Google's Gemini for the thinking. Two screens (Shoot Wizard, Brand pages) already use it end-to-end with "human approves before anything is saved."
- **The database** — tables for brands, shoots, assets, **CRM**, bookings, and notifications are all live.
- **8 finished screens** — Command Center, Brand List, Brand Detail, Shoots List, Shoot Wizard, Matching, Channel Preview, Onboarding.

### What's not done yet ⚪
- **CRM** (6 screens: companies, contacts, pipeline, deals) — designed, database ready, but the screens are empty placeholders.
- **Booking / talent** (6 screens) — mostly not started; needs a little backend first.
- **Assets, Campaigns** — placeholder screens.
- **Analytics, Notifications, Activity** — not started.
- **Mobile** — nothing mobile-specific exists yet.

---

## The one big insight

The old plans said "CRM and Booking are blocked because the database isn't ready." **That's no longer true.** The CRM database and its AI helper are already built. 

👉 **CRM is now the easiest, highest-value thing to build next** — it's pure screen-building work, with the hard backend part already done. This is why the plan builds **CRM before Booking** (Booking still needs two small backend pieces first).

---

## What to build, in order (and why)

1. **Make a few reusable Lego bricks first.** Right now small UI pieces (a status dot, an empty-list message, a list layout) are copy-pasted inside each screen. Pull them out into shared pieces — `StatusChip`, `EntityList` (a generic list), `Profile360` (a generic detail page). *Why first: every screen below reuses them, so building them once saves rebuilding them six times.*

2. **Build the CRM screens** (companies, contacts, pipeline, deals). *Why next: backend + AI are done, so it's the fastest way to ship 6 real screens.*

3. **Finish the half-built core screens** — the Shoot Detail tabs, the Assets library, Campaigns. *Why: these are partly there; finishing them is cheaper than starting fresh.*

4. **Add the two small backend pieces for Booking**, then build the booking/talent screens. *Why after CRM: Booking can't be finished until those backend pieces exist.*

5. **Analytics and Notifications screens.**

6. **Mobile version** of everything (bottom tab bar, slide-up panels, responsive layouts).

7. **Polish** — testing, accessibility, speed, remove any fake sample data.

---

## Where the design lives (source of truth)

When building any screen, open its design file first and copy it faithfully — don't redesign:

- **Screen designs:** [`../Pages/`](../Pages/) (e.g. `SCR-26-CRM-Companies-List.dc.html`)
- **Small UI pieces:** [`../components/`](../components/) (e.g. `StatusChip.dc.html`)
- **The full index of both:** [`../HTML.md`](../HTML.md)
- `implement.md` §3a maps **each task to its exact design file**.

---

## The few things genuinely blocking progress 🔴

| Blocker | What it stops | Fix |
|---|---|---|
| Shared Lego bricks not extracted yet | All CRM + list/detail screens | Build `StatusChip` / `EntityList` / `Profile360` first (small job) |
| One booking database function missing (`transition_booking`) | Booking screens | Add the function |
| No booking AI agent yet | Booking assistant | Build a small draft-only agent |
| Campaigns database not ready (IPI-268) | Campaigns screen | Land that schema |
| No mobile shell | Mobile everywhere | Build it as its own step |

---

## Bottom line

- **Design:** 🟢 done (95/100).
- **Build:** 🟡 about a third done (~38/100) — a solid, real foundation with most screens still to go.
- **Will it work out?** 🟢 Yes — the hard platform work is finished; what's left is mostly straightforward screen-building.
- **Best first move:** build the small shared UI pieces, then knock out the 6 CRM screens (backend's already waiting for them).
