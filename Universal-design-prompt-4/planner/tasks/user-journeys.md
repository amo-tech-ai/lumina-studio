# Planner — User Journeys

> **Reference doc — keeps future design decisions user-centered.** Four personas, their goals, and the path each takes through the Planner (SCR-32 Workspace · SCR-33 Dashboard · SCR-34 Settings · SCR-35 Hub). Pairs with `planner-firstuse-review.md` (the three-question principle + decision hierarchy). No new screens or features — journeys use only what's built or planned.

**The three questions every step must answer:** Where am I? · What needs my attention? · What should I do next?

---

## 1. First-time user (new operator, never seen Planner)
**Goal:** understand what this is and do one useful thing without training.

| Step | Screen | Sees | Does |
|---|---|---|---|
| 1 | Lands on **Dashboard** (home) | Greeting + **"Start here: 2 approvals blocking today's work"** + at-a-glance counts | Reads the one-line priority — knows immediately what matters |
| 2 | Clicks **Review** on Start Here | **Workspace**, pinned **Next approval** at top | Sees the gate in context without hunting |
| 3 | Right panel | **Assistant speaks first**: "You have 3 things needing attention. 1 approval is blocking today's shoot." | Trusts the guide; taps the suggested action |
| 4 | Approval sheet | Plain-language **"Approval"** (not "gate"), Approve · Edit · Discard | Approves (HITL) — completes a real task in <1 min |
| 5 | Hover "At risk" chip | Tooltip: "May miss its deadline — item delivery is 2 days late" | Learns the vocabulary in context, no manual |

**Success:** first-timer completed an approval and understood status language within the first session. **Design implications:** Start Here, Assistant-first, plain-language synonyms, and the at-risk explainer are all load-bearing for this persona.

---

## 2. Returning user (daily operator, knows the app)
**Goal:** clear today's blocking work fast.

| Step | Screen | Sees | Does |
|---|---|---|---|
| 1 | **Dashboard** | Urgency-ordered KPIs: **Needs approval → At risk → Due today → My tasks** | Scans the top-left card first (approvals) |
| 2 | KPI card | Tappable, chevron affordance | Jumps straight to the filtered list |
| 3 | **Workspace** Timeline | Collapsible weeks, completed weeks collapsed; **Today / Next approval** controls | Uses "Next approval" to skip the scroll |
| 4 | Acts on gates | Approve / edit inline | Clears the queue; **completion toast** confirms |

**Success:** zero-hunt path to the day's blocking work. **Design implications:** urgency ordering, collapsible weeks, jump-to-approval, positive/confirming feedback.

---

## 3. Manager / owner (oversees several plans + people)
**Goal:** see portfolio health, unblock the team, manage access.

| Step | Screen | Sees | Does |
|---|---|---|---|
| 1 | **Hub** | **Attention band** ("2 plans need you") + **risk-sorted** list, one status sentence per plan | Triages across plans in one glance |
| 2 | Selects a plan | Adaptive right panel → **plan detail** (progress · owner · next approval · AI summary · recommended action) | Decides without opening the plan |
| 3 | Opens **Workspace** | Board health, gate ownership | Approves owner-gated steps (owner-only) |
| 4 | **Settings** | **Invite-first** layout, per-member access phrase ("can edit") | Invites a collaborator; sets access role |
| 5 | Assistant | "N things need you" across the portfolio | Asks a cross-plan question (planned) |

**Success:** portfolio triage + access management without spreadsheet-hunting. **Design implications:** Hub attention band + risk sort, decision-oriented plan sheet, invite-first Settings, owner-only gate enforcement.

---

## 4. Photographer / crew (occasional, task-focused)
**Goal:** know what's assigned, when, and what's next — minimal UI.

| Step | Screen | Sees | Does |
|---|---|---|---|
| 1 | **Dashboard** (or deep link) | "My tasks" + **Today & this week** | Finds their assigned tasks fast |
| 2 | Task | Owner, phase, due, status | Opens the one relevant to today |
| 3 | Workspace (read-mostly) | Contributor access — edit own tasks, can't approve | Marks a task done; can't touch gates |
| 4 | Mobile | Pinned action + bottom-sheet detail + persistent composer | Checks status on their phone on set |

**Success:** a low-frequency user finds their job in seconds and can't break governance. **Design implications:** clear My-tasks surfacing, contributor read-mostly permissions, mobile parity (pinned action + sheet).

---

## 5. Cross-journey design rules
- **Every entry point answers "what needs me now"** — Dashboard Start Here, Hub attention band, Workspace pinned approval.
- **Permissions are visible, not surprising** — read-only banner for viewers, owner-only on gates, contributor edits own tasks.
- **Same vocabulary everywhere** — Plan / Step / Approval in the UI; "gate" only in code/data.
- **The Assistant is the shared guide** — opens with the same "N things need you" summary on every screen, so help is consistent across personas.
- **Mobile is not a lesser path** — each journey completes on a phone via pinned actions + bottom sheets (`planner-mobile-plan.md`).

---

## 6. Journey → screen coverage
| Journey | Primary screen | Secondary | Status |
|---|---|---|---|
| First-time | Dashboard | Workspace | 🟢 built (Dashboard Phase 2 done) |
| Returning | Dashboard | Workspace | 🟡 Workspace pins pending (Phase 4) |
| Manager | Hub | Settings, Workspace | 🟡 Hub band + Settings invite-first pending (Phases 3, 5) |
| Photographer | Dashboard | Workspace (mobile) | 🟢 mobile gallery built; desktop parity pending |
