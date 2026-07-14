# State Patterns — Empty · Loading · Error (+ Offline · Permission · Syncing)

> Design rules for every non-populated state. Per-screen matrix: `../handoff/08-state-map.md`. AI states: `AI-UX.md`.

## Loading
- **Skeleton matching the populated layout** (cards/rows/text). Never a spinner for content.
- Shimmer ~1.4s linear; honour reduced-motion (static).
- AI loading = streaming steps (✅ done · ● active · ○ pending), not a spinner.
- Determinate work (DNA crawl, publish) = progress counter/bar eased to target (e.g. "31 of 47 pages").

## Empty
Pattern: muted icon (22–28px) + **title** + 1-line body + **primary next action**. Image-first screens may show a faded sample grid.
| Context | Title | Action |
|---|---|---|
| No brands | "No brands yet" | Add your first brand |
| No shoots | "No shoots planned" | Plan a shoot |
| No assets (filter) | "No assets match this filter" | Clear filter / Upload assets |
| No campaigns | "No campaigns yet" | Create a campaign |
| No matches | "No matches yet" | Adjust criteria |
| No notifications | "You're all caught up" | — |
| Search no-match | "No matches for '<query>'" | Try a different term |
| Archived | "Nothing archived" | — |
| Deleted/empty trash | "Trash is empty" | — |

## Error
- Message + **Retry · Report · Go back** (never a dead end). Show the cause when known (1 line).
- Non-durable agent (brand-intelligence) drop → determinate retry, not a resumable-stream illusion.
- Network/load fail → "Couldn't load X · Check your connection" + Retry.

## Error State Library (catalog — D-DS22)
> One place for every failure/edge state. Each row = the canonical pattern, one-line copy, and the recovery action. Reuse these verbatim; don't invent per-screen wording. Visuals follow the muted-icon + title + 1-line + action pattern; motion per `ANIMATIONS.md`.

| State | When | Copy (1 line) | Primary action | Surface |
|---|---|---|---|---|
| **Loading** | fetch in flight | — (skeleton) | — | skeleton matching layout |
| **No data / empty** | query returns nothing | see Empty table above | context primary | inline |
| **Network / load fail** | request failed | "Couldn't load {X} · Check your connection" | Retry | inline block |
| **Timeout** | request exceeded budget | "This is taking longer than expected" | Retry · Keep waiting | inline block |
| **404 not found** | object missing/bad link | "We couldn't find that {object}" | Go back · Go to {list} | full-workspace |
| **500 / server error** | backend failure | "Something went wrong on our end" | Retry · Report | full-workspace |
| **Permission denied** | viewer/role blocked | "You don't have access to {action}" | Request access | at the action (see Permission) |
| **Sync failed / stale** | realtime drop | "Last synced {n}m ago" | Refresh | quiet banner (see Offline) |
| **Offline** | no connection | "You're offline — changes will sync" | — (queue writes) | quiet banner |
| **AI failed** | agent drop / non-durable | "I couldn't finish that — want me to retry?" | Retry · Report · Go back | AI dock / EvidenceBlock |

**Rules:** every error names the cause when known, offers a recovery action, and never dead-ends. `404`/`500` take the full workspace; network/timeout/AI errors stay inline so surrounding context survives; permission/sync/offline are quiet (action-level or banner), never full-screen blocks.

## Offline / syncing / stale (realtime)
- 🟢 **Live** (synced) · 🟡 **Reconnecting** (re-establishing) · ⚪ **Stale** (banner: "last synced 4m ago" + **Refresh**; never shown as live) · 🔴 **Offline** (queue writes; show pending).
- Surface as a quiet inline banner (Command Center pattern); never block the whole screen.

## Permission denied (blocked)
- 🔴 **Read-only** for viewer role: hide/disable write actions (Approve, Edit, Generate, Publish) with a **why-disabled** hint + **Request access**.
- Gate at the action, not by hiding navigation (users still see the screen).

## Process states (workflow)
- ⏳ **Queued** — action accepted, waiting to run (uploads, publishes): show in a queue with position + cancel.
- 🟡 **Waiting approval** — pending HITL: chip + who/what; surfaces in Notifications + the object.
- ⚠️ **Conflict** — concurrent edit: show both versions + "keep mine / theirs / merge".
- 🕘 **Version history** — prior versions list (who · when · restore); see D-DS14.
- 📦 **Archived** — read-only, restorable; muted styling + "Restore".
- 🗑️ **Deleted** — soft-delete in trash; "Restore / Delete permanently".

## Rules
- Every empty/error state offers the relevant **primary next action**.
- Status is **dot + label**, never colour alone. Loading is announced (live region). Transitions follow `ANIMATIONS.md`.
