# Claude Design Prompt — Pipeline

Paste after `02-crm-design-master.md`.

**Purpose:** See every deal's stage at a glance and move deals forward.
**Route:** `/app/crm/pipeline`
**User:** Brand operator / business-development lead.
**Screen goal:** Understand pipeline health and act on the highest-priority deal in under 30 seconds.

## Layout

3-panel shell, reused. Workspace header: `Pipeline` + total value (mono numerals) across visible deals.

## Center workspace content

**Kanban board** — the one genuinely new layout primitive in this whole CRM design set (`PipelineBoard`).
Columns = stages, in fixed order: `lead` · `qualified` · `proposal` · `negotiation` · `won` · `lost`. Each
column header shows a count + total value. Column composition: shadcn `Card` per column
(`CardHeader`/`CardContent`), not a bespoke grid — deal cards stack inside `CardContent`.

**Deal card** (`DealCard`, new): company name, value (mono numerals), stage `Badge`, owner avatar, days in
stage, a small `crm-assistant`-derived risk indicator (from `scoreDealHealth`) rendered as a `Badge` variant
— never color-only, always paired with a short label ("at risk" / "on track").

**Drag between columns** moves the deal — for `lead`→`qualified`→`proposal`→`negotiation` this writes
immediately (ungated). Dragging into `won` or `lost` **does not** write immediately — it opens the
`ApprovalCard` gate inline (see Deal Detail, `02f`, for the full gate) before the column actually updates;
if the operator cancels, the card animates back to its origin column.

**Filter row:** Owner, value range, "at risk only" toggle (from `scoreDealHealth focus: at_risk`).

**AI Chat Dock:** context-aware — e.g. *"3 deals have had no activity in 10+ days. Want me to draft
follow-ups for all three?"* — a single batched suggestion, never one message per deal (avoids the
per-deal-loop anti-pattern documented in `plans/mastra-plan.md`).

## Right AI panel content

On card select: `EvidenceBlock` showing the health-score breakdown (why this deal is flagged), next-best-
action, `[Open deal]` primary action.

## Components

Reused: `OperatorShell`, `IntelligencePanel`, `PersistentChatDock`, `EvidenceBlock`, `ApprovalCard`. New:
`PipelineBoard`, `DealCard`, `DealStageChip` (a `Badge` variant per stage).

## States

- **Populated:** board as above.
- **Empty (no deals yet):** `Empty` — "No deals yet" + `[New deal]`, board columns still render (empty)
  so the stage structure is visible.
- **Loading:** `Skeleton` cards per column matching final card layout.
- **Error:** `Alert` + Retry.
- **Live update:** a deal moved by another operator (or the agent, for ungated stages) animates into its
  new column via the Supabase Realtime subscription — never a full-page refresh.

## Mobile behavior

Kanban becomes a single-column stage-switcher: a horizontal stage-pill row (`ToggleGroup`) at the top,
below it a vertical card list for the selected stage only — full kanban columns don't fit <768px. Drag is
disabled on mobile; moving a deal is a `[Move to →]` button in the card's overflow menu instead.

## Interactions

Drag-and-drop (desktop) or explicit move action (mobile) triggers `moveDealStage`. Card click selects (panel
updates); a second click or explicit "Open" opens Deal Detail.

## Accessibility notes

- Drag-and-drop has a full keyboard/button equivalent (`[Move to →]` menu) — required, not optional, since
  many operators won't use a mouse.
- The `won`/`lost` HITL gate is reachable and completable via keyboard alone.
- Risk indicators use both an icon/badge variant AND a text label — never color-only.

## What NOT to build

- Direct drag-to-won/lost without the approval gate — this is the single hardest rule in the whole CRM
  module; no shortcut path may exist, including this board.
- A separate "Deals" list screen distinct from this board — Pipeline *is* the deals view; don't build both
  (a redundancy an earlier review round proposed and this repo's own PRD nav explicitly avoids).
- Forecast/revenue-projection widgets — Advanced, deferred.

## AI Context

| Layer | Tech | Usage |
|---|---|---|
| **Mastra agent** | `crm-assistant` | `scoreDealHealth` (`focus: all/at_risk`), `moveDealStage` |
| **Realtime** | Supabase Realtime on `crm_deals` | Live board updates, the platform-native equivalent of a state-push channel |
| **Supabase** | `crm_deals` | Stage/value/owner reads, RLS via `is_org_member` |

## Implementation mapping

| Feature | Build step |
|---|---|
| Board + ungated drag | `05-crm-prd.md` §14.2 step 4 |
| `won`/`lost` HITL gate | Step 5 |
| Health scoring / at-risk filter | Step 6–7 |

## React Reality Check

| Component | Status | Action |
|---|---|---|
| `OperatorShell`, `IntelligencePanel`, `PersistentChatDock`, `EvidenceBlock`, `ApprovalCard` | 🟢 | Reuse as-is (paths in `00-design-audit.md`) |
| `PipelineBoard` | 🔴 New | The one new layout primitive across all 6 CRM screens |
| `DealCard` | 🔴 New | Card anatomy consistent with `CompanyCard`/`ContactCard` |
| `DealStageChip` | 🔴 New | `Badge` variant, not a new primitive |
| `crm_deals` table, Realtime subscription, `crm-assistant` | 🔴 Not built | Required before live board data |
