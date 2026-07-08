# Claude Design Prompt — Deal Detail

Paste after `02-crm-design-master.md` + `02e-crm-pipeline.md`.

**Purpose:** The single deal record, its activity timeline, and the one place a deal can be marked
`won`/`lost` — the most safety-critical screen in the CRM module.
**Route:** `/app/crm/pipeline/:id`
**User:** Brand operator / business-development lead.
**Screen goal:** Review a deal and either progress it or make the `won`/`lost` call with full context.

## Layout

3-panel shell, reused. Workspace header: company name + deal value (mono numerals) + `DealStageChip` +
breadcrumb (`Pipeline / {company} — {deal name}`).

## Center workspace content

**Overview block:** company (link to Company Detail), contact (link to Contact Detail), value, currency,
expected close date, linked shoot/campaign (if any — nullable FKs, shown as links only when populated).

**Stage control:** current stage as a `Select`/`ToggleGroup` of the 6 stages. Selecting
`lead`/`qualified`/`proposal`/`negotiation` writes immediately (`moveDealStage`, ungated) with a toast
confirmation. Selecting `won` or `lost` does **not** write — it opens an inline `ApprovalCard`:

> **Mark this deal as Won?**
> Before: `negotiation` → After: `won`
> This will create or link a `brands` record for **{company}** and hand off to Brand Intelligence.
> [Cancel] [Approve]

Only clicking **Approve** calls `api/crm/deals/[id]/convert`. Cancel returns the stage control to its prior
value with no write. This is the **only** path in the entire CRM module that may set `stage = won/lost` —
no other screen, button, or agent action may bypass this card.

**Activity timeline:** same unified `crm_activities` component as Company Detail's Activity tab
(note/call/email/meeting/task/ai_summary), scoped to `deal_id`. `[Log activity]` button opens an inline
form (type picker + body).

**AI Chat Dock:** context-aware — e.g. *"This deal has had no activity in 9 days. I can draft a follow-up —
want me to?"*

## Right AI panel content

Context (deal name/stage/value) → `EvidenceBlock` health-score breakdown (`scoreDealHealth`, same as
surfaced on the Pipeline board for this card) → any pending draft (`draftFollowUp` output) rendered as its
own `ApprovalCard`, separate from the stage-change `ApprovalCard` above — **two distinct approval surfaces
can coexist** (one for stage, one for a draft), never merged into one generic "approve" button.

## Components

Reused: `OperatorShell`, `IntelligencePanel`, `PersistentChatDock`, `EvidenceBlock`, `ApprovalCard`,
`DealStageChip`. No new components beyond what `02e` already introduces.

## States

- **Populated:** overview + stage control + timeline as above.
- **Won (converted):** stage control locks to `won` (read-only, no further stage changes), a banner shows
  "Converted to brand — [View brand]" linking to the existing Brand Detail screen.
- **Lost:** stage control locks to `lost`, no conversion banner.
- **Approval pending:** the inline `ApprovalCard` is shown in place of the stage control until
  approved/cancelled — it is not a modal that blocks the rest of the page.
- **Empty timeline:** `Empty` — "No activity yet" + `[Log activity]`.
- **Loading:** `Skeleton`.
- **Error:** `Alert` + Retry — and specifically, if `api/crm/deals/[id]/convert` fails, the stage control
  must **not** silently show `won` — it reverts and surfaces the error explicitly (no optimistic-success UI
  for this specific action, given its irreversibility).

## Mobile behavior

Overview block stacks vertically. Stage control becomes a full-width `Select`. `ApprovalCard` renders as a
`Sheet` (bottom) rather than inline, given limited vertical space. Panel → bottom sheet.

## Interactions

Stage `Select`/`ToggleGroup` change → immediate write (non-terminal stages) or `ApprovalCard` (terminal
stages). Activity form submit → `logActivity`, timeline updates optimistically then confirms via Realtime.

## Accessibility notes

- The `won`/`lost` `ApprovalCard` must trap focus appropriately for a `Sheet`/inline-critical-action pattern
  and be fully operable via keyboard — this is the single most important a11y requirement in the CRM module,
  since it's the irreversible-commitment gate.
- Stage changes announce via `aria-live="polite"` (e.g. "Stage changed to Qualified").
- The distinction between the two possible `ApprovalCard`s (stage vs. draft) must be clear from their
  accessible names, not just visual position.

## What NOT to build

- Any button, menu item, or keyboard shortcut that sets `stage = won/lost` without going through the
  `ApprovalCard` shown above — including from the Pipeline board's drag interaction (`02e`) or any future
  bulk-action UI.
- A "send" button on the draft `ApprovalCard` that calls an external email/WhatsApp API — approving a draft
  here only logs it as an activity; actual send integration is Advanced/deferred (`02-crm-architecture-brief.md`).

## AI Context

| Layer | Tech | Usage |
|---|---|---|
| **Mastra agent** | `crm-assistant` | `scoreDealHealth`, `draftFollowUp`, `logActivity`, `moveDealStage` |
| **Backend route** | `api/crm/deals/[id]/convert` | The one write path for `won`/`lost` + brand creation/link |
| **Supabase** | `crm_deals`, `crm_activities`, `brands` | Deal read/write, activity log, brand conversion target |

## Implementation mapping

| Feature | Build step |
|---|---|
| Overview + ungated stage moves + activity timeline | `05-crm-prd.md` §14.2 step 5 |
| `won`/`lost` `ApprovalCard` + convert route | Step 5 |
| Health scoring + draft `ApprovalCard` | Step 6–7 |
| Acceptance test: "no silent won/lost" | Step 8 |

## React Reality Check

Same as `02e-crm-pipeline.md` — no additional components beyond what that file introduces.
