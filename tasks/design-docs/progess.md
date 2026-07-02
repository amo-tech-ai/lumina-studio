# Design V2 — Screen Implementation Progress

**Updated:** 2026-07-02
**In plain terms:** We designed 11 screens for the operator app. This doc tracks how many of them are actually built and working in the real product (`app/`) vs. how many are still just the design mockup with nothing behind it.

**How this was checked:** Every screen was read directly from the code — not from status labels or tickets. For each one: does the route exist? Does it render real data? Does it match what the design file says it should do? Every claim below has a file/line as proof, so nothing here is a guess.

---

## The short version

**Average: ~26% built across all 11 screens.** Nothing is fully done. Nothing is broken/crashing either — the gap is "not built yet," not "built wrong."

| | |
|---|---|
| 🟡 **Partly working** (7 screens) | Real code exists, real data loads, but pieces of the design are missing |
| ⚪ **Not started** (4 screens) | Just an empty placeholder, or the page doesn't exist at all |
| 🟢 **Fully done** (0 screens) | — none yet |
| 🔴 **Built but broken** (0 screens) | — none found; nothing crashes |

---

## Screen by screen (best to worst)

### 🟡 Matching — 55% (furthest along)
**What works:** You can browse creators in a swipe view or a table, save them to a shortlist, and see the AI's "why this match" explanation. Backed by real data, tests pass.
**What's missing:** Can't select multiple creators at once to act on them in bulk. The "Invite" button exists but doesn't do anything yet. 3 of the 4 sub-tabs just say "Coming soon."

### 🟡 Shoot Detail — 35%
**What works:** The page loads a specific shoot and shows 3 working tabs (Overview, Shot List, Deliverables) with real data.
**What's missing:** The other 6 tabs (Assets, Team, Schedule, Budget, Approvals, Activity) are empty placeholders — click them and there's nothing there yet.

### 🟡 Shoot Wizard — 35%
**What works:** A 6-step form to create a new shoot, with built-in approval steps for deliverables/shots/budget — this part genuinely works end-to-end.
**What's missing:** The design calls for 10 steps, not 6. No "save as draft," no way to jump between steps, and finishing the wizard doesn't take you to the new shoot's page.

### 🟡 Shoots List — 35%
**What works:** A working list of all shoots — search, filters, sorting, and "create new" all function.
**What's missing:** It's using an older visual style (orange/serif), not the new black-and-white design. No AI assistant panel on this page yet, and no automated tests.

### 🟡 Brand Detail — 30%
**What works:** A real page per brand with a score, activity history, pulled from the live database.
**What's missing:** No "Plan a Shoot" button, no breakdown of the 4 scoring categories, and clicking the score doesn't open the "why this score" explanation panel yet (that panel exists elsewhere in the app, just isn't connected here). *Note: a separate in-progress branch (PR #181, not yet merged) claims this is ~75% done — but that work isn't live on the main branch yet, so it's not reflected here.*

### 🟡 Channel Preview — 25%
**What works:** Shows how an image/video will look on Facebook, Instagram feed, Instagram story, and TikTok, with a safe-zone guide toggle.
**What's missing:** Not connected to the rest of the app's navigation/menu yet, no "publish" button actually works, no AI explanation panel.

### 🟡 Brand List — 18%
**What works:** A real list of brands pulled from the database, with a working "empty state" message.
**What's missing:** It's a plain text list, not the card-grid design calls for. No search, no filters. Uses hardcoded colors instead of the shared design system. *Same note as Brand Detail — PR #181 (unmerged) claims ~80% done on a separate branch, not yet on main.*

### ⚪ Campaigns — 5%
The page exists but shows nothing — it's an empty placeholder. Blocked on a database table that hasn't been created yet.

### ⚪ Assets — 0%
Empty placeholder. Nothing built yet — waiting on the file-upload pipeline to be ready first.

### ⚪ Analytics — 0%
Doesn't exist yet — no page at all.

### ⚪ Campaign Performance — 0%
Doesn't exist yet — no page at all.

---

## What to build next (ranked by easiest win first)

1. **Fill in Shoot Detail's empty tabs** — the data is already loaded, these just need to be connected to the screen. Cheapest win available.
2. **Finish Matching** — closest to 100%. Add multi-select and make the Invite button work.
3. **Build Assets** — bigger job, but nothing else is blocking it once the upload pipeline (in progress separately) is ready.
4. **Create the Campaigns database table** — this one change unblocks both Campaigns and Campaign Performance, which are both currently stuck at ~0%.
5. **Merge the Brand List/Detail branch (PR #181)** — that work already exists and is much further along; it just isn't live yet.

---

## Quick glossary

- **v2 parity** — how closely the real screen matches the approved design file.
- **HITL (human-in-the-loop)** — an AI suggests something, but a person has to approve it before it's saved.
- **EvidenceBlock / "why this score" panel** — the popup that explains an AI score with reasoning and evidence.
- **SectionPlaceholder** — a filler component that just says "coming soon," used when nothing real has been built yet.

## Other docs — heads up

- `/home/sk/ipix/todo.md` (root file) is outdated (last updated 2026-06-24) and references old ticket numbers — don't use it as the source of truth.
- The current, up-to-date task list lives at `tasks/plan/todo.md`.
