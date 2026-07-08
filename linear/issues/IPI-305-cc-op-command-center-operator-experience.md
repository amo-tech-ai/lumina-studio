# IPI-305 · CC-OP-001 — Command Center Operator Experience (Epic)

**Linear:** https://linear.app/amo100/issue/IPI-305  
**Parent:** [IPI-290](https://linear.app/amo100/issue/IPI-290) · DESIGN-050b  
**Follow-on:** Layout + image-first polish (IPI-291–295) + 3-panel shell fix  
**Visual SSOT:** `Universal design prompt/Command Center.v2.image-first.dc.html` L320–421 (Intel)  
**Status:** Backlog · Spec ready 2026-07-01

> **ID note:** Proposed IPI-301 is taken (MOBILE-005). Linear assigned **IPI-305**.

---

## Goal

Finish Command Center as the **Operator Hub template** — not a static dashboard. Target **92% overall** after Phase 1–2 (Intel panel + contextual AI).

---

## Execution spine (create issues only when ready)

| Priority | Spec ID | Title | Linear | Status |
|----------|---------|-------|--------|--------|
| 🟢 1 | CC-INT-001 | Intelligence Panel Parity | [IPI-306](IPI-306-cc-int-intelligence-panel-parity.md) | **In Progress** |
| 🟡 2 | CC-AI-001 | Production Planner Context | *(defer until 306 reviewed)* | ⚪ |
| ⚪ 3 | CC-HERO-002 | Hero Intelligence | defer | ⚪ |
| ⚪ 4 | CC-RECENT-002 | Recent Work Metadata | defer | ⚪ |
| ⚪ 5 | CC-TIME-001 | Intelligence Timeline | defer (may split from 306 §6) | ⚪ |

**Rule:** Only **IPI-306** is active until review. Do not open follow-on issues until 306 ships.

---

## Out of scope (entire epic until UX locked)

- Live subscriptions / Realtime sockets
- Streaming responses
- Notification center
- Analytics summaries
- New React component library entries (reuse only)

---

## Reuse (mandatory)

| Component | Path |
|-----------|------|
| `IntelligencePanel` | `app/src/components/intelligence-panel/` |
| `EvidenceBlock` | `app/src/components/evidence-block/` |
| `ApprovalCard` | `app/src/components/brand-hub/approval-card.tsx` |
| `QuickActionChips` | `app/src/components/command-center/quick-action-chips.tsx` |
| `CopilotChat` | center dock via `operator-chat-dock.tsx` |

**DC-only (not React yet):** `StatusChip`, `MetricCard` — match via existing DNA bars + tokens until extracted.

---

## Target scores (post 306 + CC-AI-001)

| Area | Now | Target |
|------|-----|--------|
| Intelligence Panel | 80% | 95% |
| AI Experience | 65% | 85% |
| Overall Command Center | 80% | **92%** |

---

## Acceptance (epic Done)

- [ ] IPI-306 merged + side-by-side vs DC intel panel @ 1440
- [ ] CC-AI-001 merged + contextual chat on `/app?skip=1`
- [ ] Command Center ≥92% review score vs `command.png`
- [ ] Patterns documented for Brand Hub / Shoots reuse
