# IPI-306 · CC-INT-001 — Intelligence Panel Parity

**Linear:** https://linear.app/amo100/issue/IPI-306  
**Parent:** [IPI-305](IPI-305-cc-op-command-center-operator-experience.md) · CC-OP-001  
**Blocked by:** [IPI-295](https://linear.app/amo100/issue/IPI-295) · 3-panel layout fix (merge pending)  
**Plan:** `tasks/design-docs/implementation/command-center.md`  
**Visual SSOT:** `Command Center.v2.image-first.dc.html` L366–417 · `command.png`  
**Dev route:** `/app?skip=1` (fixtures only — no schema/API until UX sign-off)  
**Estimate:** 5 points  
**Status:** In Progress

> **ID note:** Proposed IPI-302 is taken (PLAT-ICONS). Linear assigned **IPI-306**.

---

## User story

> As an **operator** on Command Center, the right Intelligence Panel shows brand health, AI insights, rich approval cards, recommended actions, and recent activity — matching the DC prototype — so I know **what to work on next** without opening chat.

---

## Six sections (top → bottom)

### §1 Brand summary

```
Nike · active
DNA 87 · Last updated <relative>
```

- Extend `intelligence-panel.tsx` header (not a new panel component)
- Data: `panel-contract` + `dev-panel-fixture.ts` on skip routes

### §2 Health

Pillar row with trend signal:

```
Brand · Visual · Voice · Commerce · Trend
```

- Reuse `DnaScoresSection` bars + map pillars to DC labels (Visual / Voice / Commerce)
- Trend: fixture delta (e.g. Visual −4%) until live scores wired

### §3 AI insights

Insight cards:

- Highest priority
- Lowest score
- Needs review
- AI recommendation (one line + confidence)

- Reuse `AIContextCard` pattern or compact `EvidenceBlock` **summary** variant (no second explain surface)
- Fixture-driven on `?skip=1`

### §4 Approval queue

Per card (compact — DC `ApprovalCard` variant):

- Thumbnail
- Title
- Confidence
- Explanation (one line)
- `EvidenceBlock` expand / Explain
- Approve · Edit actions

- Reuse `ApprovalCard` where draft payload exists; compact list + link for dev fixture items
- Wire `EvidenceBlock` per `PATTERNS.md` hard rule

### §5 Recommended actions

Chip row:

```
Review approvals · Generate campaign · Improve visuals · Plan shoot
```

- Reuse `QuickActionChips` or briefing pills from `route-briefing.ts`

### §6 Recent activity

Grouped list:

```
Yesterday · Today · Upcoming
```

- Fixture timeline in `dev-panel-fixture.ts`
- Later extraction → CC-TIME-001 (no redesign)

---

## Files (expected touch)

| File | Change |
|------|--------|
| `app/src/lib/intelligence/panel-contract.ts` | Extended fixture shape |
| `app/src/lib/intelligence/dev-panel-fixture.ts` | Rich mock for skip routes |
| `app/src/components/intelligence-panel/intelligence-panel.tsx` | Section composition |
| `app/src/components/intelligence-panel/*.tsx` | Wire sections (minimal new files) |
| `app/src/components/intelligence-panel/intelligence-panel.module.css` | Density / scroll |

**Do NOT:** new panel shell · duplicate `ApprovalCard` · Realtime · API/schema changes

---

## Acceptance criteria

- [ ] `/app?skip=1` — all 6 sections visible, scrollable, no horizontal overflow
- [ ] Right column is Intel only (no Copilot sidebar)
- [ ] At least one approval card shows thumb + confidence + Explain → `EvidenceBlock`
- [ ] Recommended actions clickable (route or chat suggestion)
- [ ] Side-by-side screenshot vs `command.png` intel column
- [ ] `cd app && npm run lint && npm test && npx tsc --noEmit && CI=true npm run build`

---

## Verification

```bash
cd app && npm run lint && npm test && npx tsc --noEmit && CI=true npm run build
# Browser: http://localhost:3002/app?skip=1 @ 1440px
```

Evidence: `docs/ecommerce/evidence/2026-07-01/ipi-17-command-center/screenshots/intel-panel-parity.png`

---

## Deferred to CC-AI-001

Contextual Production Planner chat copy — **not in this PR**.
