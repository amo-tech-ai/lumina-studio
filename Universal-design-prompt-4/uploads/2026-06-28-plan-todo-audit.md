# Audit — plan.md + todo.md
**Date:** 2026-06-28
**Verified against:** `app/src/lib/route-agent-map.ts` · `app/src/mastra/index.ts` · `operator-panel.tsx`

**Scores: plan.md 62/100 · todo.md 72/100**

---

## 🔴 Critical Errors

### 1. `IntelligencePanel` marked ✅ Done — incorrect
**File:** plan.md, component tracker

The right panel is a bare `CopilotSidebar` chat box. The context → approvals → tabs IntelligencePanel does not exist in production. Rule 2 says "never a bare chatbox" — that's exactly what ships today.

**Fix:** Set to `🟡 In progress`. Add to todo.md Now: "Build IntelligencePanel (IPI-242 follow-up)".

---

### 2. Hardcoded hex values in the design rules
**File:** plan.md, Rule 4

> "amber border `#F3B93C`, amber bg `#FFFBF0`"

Directly contradicts Rule 5 (zero hardcoded hex) on the very next line.

**Fix:** Replace with `var(--approval-border)` and `var(--approval-bg)`.

---

### 3. `.dc.html` output format does not exist
**File:** plan.md header, changelog.md

Claude Design outputs HTML prototypes — there is no `.dc.html` format.

**Fix:** Replace all `.dc.html` references with "HTML prototype".

---

### 4. `operator-director` agent — does not exist
**File:** original audit (`01-audit-plan.md` prior version)

The codebase has no `operator-director` agent. `/app` uses `production-planner` as the default fallback (no explicit rule in `route-agent-map.ts`). Suggesting `operator-director` as a fix is wrong.

**Fix:** Use verified agent map (see below).

---

### 5. `asset-dna` agent — does not exist
**File:** original audit

`/app/assets` maps to `production-planner` in `route-agent-map.ts`. `asset-dna` is not registered anywhere.

**Fix:** Use verified agent map (see below).

---

### 6. IntelligencePanel build missing from todo.md entirely
**File:** todo.md

The single most important next piece is absent. `BrandContextPanel` UI was stripped from the shell (IPI-242); it needs to move inside the right slot as IntelligencePanel.

**Fix:** Add to Now: "Build IntelligencePanel — brand context + DNA + assets + chat inside right slot (IPI-242 follow-up)".

---

## 🟡 Errors / Inconsistencies

### 7. Agent map incorrect in plan.md screen tracker
**File:** plan.md, screen tracker table

Several agent assignments are wrong or aspirational. `visual-identity` and `social-discovery` are registered in Mastra but are **not wired to any routes** in `route-agent-map.ts`. Showing them as active route handlers is misleading.

| Route | plan.md says | Verified (route-agent-map.ts) |
| --- | --- | --- |
| `/app` | `production-planner` | `production-planner` ✅ (default fallback) |
| `/app/brand` | `brand-intelligence` | `brand-intelligence` ✅ |
| `/app/brand/[id]` | `brand-intelligence` | `brand-intelligence` ✅ |
| `/app/shoots` | `production-planner` | `production-planner` ✅ |
| `/app/shoots/new` | `creative-director` | `production-planner` ❌ (prefix-matched by /app/shoots) |
| `/app/campaigns` | `creative-director` | `creative-director` ✅ |
| `/app/assets` | `visual-identity` | `production-planner` ❌ |
| `/app/onboarding` | `brand-intelligence` | `production-planner` ❌ |
| `/app/matching` | `social-discovery` | `production-planner` ❌ |
| `/app/preview` | `visual-identity` | `production-planner` ❌ (default, no explicit rule) |

**Fix:** Update screen tracker to match the verified map. Note `visual-identity` and `social-discovery` as "registered but not yet routed" until wiring is added.

---

### 8. Over-strict AI value rules
**File:** plan.md, Rule 3

> "Every AI value shows confidence % + evidence + before/after"

Not every AI insight has a before/after (e.g., a DNA score explanation, a suggestion chip).

**Fix:**
```
Every AI-generated recommendation shows confidence + evidence.
Every AI-generated edit/draft shows before/after.
```

---

### 9. Rule 2 wording too broad
**File:** plan.md, Rule 2

> "IntelligencePanel is never detail content"

Brand context, DNA scores, and assets are compact context that belongs in the panel.

**Fix:** "IntelligencePanel must not become a separate fourth column or full detail workspace. Compact context is allowed — context → approvals → suggestions → evidence → activity → chat."

---

### 10. No distinction between prototype vs production in the tracker
**File:** plan.md

`✅ Done` means both "Claude Design prototype built" and "production-shipped". These are different things.

**Fix:** Add a Spec column to the screen tracker (✅ spec written / ⬜ not written). Current state: 01 ✅, 02 ⬜, 03 ✅, 04 ✅, 05-10 ⬜.

---

### 11. Brand Detail before Brand List — unexplained ordering
**File:** todo.md

Brand Detail is Now, Brand List is Next — but you can't navigate to a detail without a list. Fine if intentional, but needs a comment.

---

### 12. Shoots List in Next — spec is complete
**File:** todo.md

`prompts/03-shoots.md` is fully written. Shoots List can start now.

**Fix:** Promote Shoots List to Now.

---

### 13. Recently Done is stale
**File:** todo.md

Missing:
- `DESIGN.md` created at `app/DESIGN.md` *(2026-06-28)*
- `tokens.css` + `design-system-rules.md` merged to main (PR #132) *(2026-06-28)*
- 10 shadcn/ui primitives merged (PR #132) *(2026-06-28)*
- `21-component-dependencies.md` created *(2026-06-28)*
- `prompts/02-brand-detail.md` + `prompts/03-shoots.md` written

---

### 14. Two plan files coexist
**File:** folder root

`plan.md` and `design-plan.md` both present. One is a stale predecessor.

**Fix:** Delete or archive `design-plan.md`.

---

## 🔵 Missing Items (valid, not yet in either file)

- **Command Palette** — should be P1 shared component, not M6 polish
- **DataTable** component for assets, campaigns, matching
- **FilterBar** component
- **SearchInput / GlobalSearch**
- **EvidenceBlock** — P0 for Brand Detail, not later
- **ActivityTimeline** — shared AI component
- **Error recovery actions**: retry, report, go back
- **Permission states**: read-only, operator, admin
- **Realtime states**: connected, reconnecting, stale data
- Link to `app/DESIGN.md` from plan.md (it's the session entry point but not referenced)

---

## PR Alignment Status

Original warning in prior audit: do not merge any 4th-column implementation.

**✅ Resolved — IPI-242 (commit 993c713, 2026-06-28).** PR #127 reverted to 3-panel grid. All `ActiveBrandContext` infrastructure kept. BrandContextPanel UI redirected to IntelligencePanel build.

---

## Correctness Score

| File | Score | Key issues |
| --- | --- | --- |
| `plan.md` | **62%** | IntelligencePanel status wrong; hardcoded hex in rules; .dc.html fabricated; 4 agent IDs wrong |
| `todo.md` | **72%** | IntelligencePanel build absent; shoots spec not reflected; recently done stale |

---

## Priority Fix List

| # | File | Fix | Effort |
| --- | --- | --- | --- |
| 1 | plan.md | IntelligencePanel → `🟡` | 1 min |
| 2 | plan.md | Rule 4: hex → `var(--approval-border)` / `var(--approval-bg)` | 1 min |
| 3 | plan.md + changelog | Remove `.dc.html` | 2 min |
| 4 | plan.md | Fix agent map (4 routes wrong) | 3 min |
| 5 | plan.md | Relax Rule 3 (before/after only on edits) | 1 min |
| 6 | plan.md | Relax Rule 2 (compact context allowed) | 1 min |
| 7 | todo.md | Add IntelligencePanel build to Now | 1 min |
| 8 | todo.md | Promote Shoots List to Now | 1 min |
| 9 | todo.md | Update recently done | 2 min |
| 10 | plan.md | Add Spec column to screen tracker | 5 min |
| 11 | Both | Link to `app/DESIGN.md` | 1 min |
| 12 | Folder | Delete or archive `design-plan.md` | 1 min |
| 13 | plan.md | Add DataTable, FilterBar, EvidenceBlock (P0), ActivityTimeline to component backlog | 5 min |
