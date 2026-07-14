# Planner — Copy Guide

> **Status: 🟢 FROZEN reference — 2026-07-10.** The voice, vocabulary, and exact strings for the Planner surface. Companion to `planner-component-catalog.md` + `planner-interaction-catalog.md`.
> **Why this exists:** copy is where the product's trustworthiness lives. This guide keeps every screen (and the React build) on one vocabulary and one voice.

---

## 1. Voice — three rules

1. **Plain, human, calm.** Short sentences. Say what happened and what to do next. No jargon, no exclamation marks, no hype.
2. **Honest about AI.** The assistant offers; the human decides. Never imply the AI has done something it hasn't. Every AI surface carries the honesty pill.
3. **Action-first.** Lead with the thing the user can do. "Approve to unlock Payment" beats "This is an approval gate."

---

## 2. Canonical vocabulary (use ↔ never)

| Use | Never | Why |
|---|---|---|
| **approval** / **approval needed** | gate, gating, checkpoint | Users don't think in "gates". This was swept desktop + mobile at freeze. |
| **step** | phase, stage | One word for a unit of a plan, everywhere. (Internal code keeps `phase*` identifiers — not user-visible.) |
| **plan** | project, instance, workflow-instance | "instance" is a backend term; users see "plan". |
| **at risk** | slipping, red, behind (as a status) | "at risk" is the one status label; prose may say "2 days behind". |
| **needs you** / **waiting on you** | action required, pending your action | Warmer, clearer ownership. |
| **Sample data — not live** | demo, mock, placeholder | One ribbon string, everywhere. |
| **production-planner · not yet wired** | AI is thinking, coming soon | The one honesty pill string. |
| **member** / **access** | user, seat, permission level | Settings is about *access to this plan*. |

---

## 3. Status labels (fixed set)

`To do` · `In progress` · `At risk` · `Blocked` · `Done` · `Cancelled` (line-through) · `Approval needed`.
Plans add: `Active` · `Planned` · `Completed` · `Draft`.
Always paired with an icon or dot — never colour alone.

---

## 4. Screen-by-screen strings

### SCR-32 Workspace
- Sub-header: `5-Week Product Shoot · 11 steps · 1 approval waiting for you`
- Now&Next: `Happening now` → *Item delivery — In progress · 2 days behind — the courier task is blocked.* / `Your next approval` → *Outfit confirmation — Ready for your sign-off — approving opens Payment & scheduling.*
- Gate card: **Approval needed** · *The stylist has locked all 24 outfits. Approving opens Payment & scheduling.* · `Requires: Producer or Owner`
- Approve toast: `Gate approved — Payment & scheduling unlocked`
- Blocked column: `Locked — approve to add` (aria: *Locked step — approve the previous step before moving tasks into <step>*)
- Empty: **No steps yet** — *This plan hasn't been set up. Add steps from a template, or ask the planner assistant to draft a schedule.*
- Complete: **Summer Lookbook is complete** — *All 11 steps are done and every approval is signed off. Nice work — the plan wrapped 1 day ahead of the Apr 5 target.*
- Dock chips (view-aware): Timeline → *Shift downstream 2 days · Explain the delay · What needs me today?* / Kanban → *Suggest owners · Balance the workload · What's blocked?* / Calendar → *Draft the call sheet · Any date conflicts? · What ships this week?* / List → *Build my checklist · Sort by priority · What's overdue?*

### SCR-33 Dashboard
- Empty: **No plans yet** — *Once you're on a production plan it'll show here with your tasks, approvals, and this week's schedule.* CTA `Browse plans`.
- Read-only: **Read-only** — *Viewer access. You can browse plans but can't approve gates or edit tasks.* → (React: change "gates" → "approvals" to match freeze vocabulary — see §6 residual.)
- Sync: *Dashboard couldn't sync. Showing your last cached view.* `Retry now`

### SCR-34 Settings
- Invite hero: **Bring your team into this plan** — *A plan works best with the people who run it. Invite a producer to help manage, contributors to own their tasks, or the client as an approver — you choose what each can do.*
- Pending: **1 invite pending** — *dana@brandco.com hasn't accepted yet.* `Resend`
- Empty: **Just you so far** — *No one else has access to this plan yet. Invite a producer, contributor, or client approver to collaborate.*
- Invite errors: empty → `Enter an email address to send an invite.` · invalid → `That doesn't look like a valid email — check the address.`
- Send success toast: `Invite sent to <email>`
- Role presets: Owner *Full access — edit, assign, approve, manage members.* · Manager *Edit the plan, assign tasks, and move steps.* · Contributor *Edit their own assigned tasks only.* · Viewer *view + approve* (approver).

### SCR-35 Hub
- Sub-header: `12 plans · 3 need attention`
- Attention band: `3 plans need your attention` (singular: `1 plan needs your attention`)
- One-sentence plan status (examples): *Waiting on item delivery — 2 days late* · *2 approvals pending* · *On track — retouch underway* · *Completed — delivered Feb 8*
- Filter live-region: `4 plans shown · Shoot`
- Empty: **No plans yet** + `New plan`.

---

## 5. Assistant copy pattern

Every dock line = **one observation + one offer**, ending in a question:
> *Item delivery is slipping — want me to shift the downstream steps by 2 days and flag the shoot date?*

Never a command, never a claim of completion. Suggested chips are short imperatives (*Shift downstream 2 days*). Tapping a chip (until wired) → `Sample assistant — not wired yet`.

---

## 6. Residual copy — resolved at freeze

- SCR-33 read-only banner now reads "can't **sign off approvals** or edit tasks" (was "approve gates"). Vocabulary parity complete across all five files.
- Any new empty/error strings must follow the **title (bold, ≤4 words) + one-sentence body + one CTA** shape.

---

## 7. Microcopy checklist for new strings

- [ ] Uses **step / approval / plan / member** (never phase/gate/project/user).
- [ ] Leads with the action or the change, not the mechanism.
- [ ] No exclamation marks; sentence case; one idea per sentence.
- [ ] AI text offers, never claims; honesty pill present.
- [ ] Empty/error = bold title + one sentence + one CTA.
- [ ] Numbers in `--mono`.
