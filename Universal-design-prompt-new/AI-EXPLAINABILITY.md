# AI-EXPLAINABILITY.md — FashionOS AI Review Standard

> **Mandatory for every AI-generated score, recommendation, or automated change in FashionOS.**
> Companion to `DESIGN.md`, `PATTERNS.md`, `AI-UX.md`, `STATES.md`.
> Design system: **Zeely Editorial v3** — pure white / grey / black, Inter, image-first.

Every place the product shows an AI judgement — a DNA score, an asset match %, a creator-fit %, a campaign-performance prediction — the user must be able to answer three questions in one click: **Why this number? What's the evidence? How do I improve it?** The **EvidenceBlock** component (`components/EvidenceBlock.dc.html`) is the single, canonical surface for this. Do **not** build a second explainability component.

---

## 1. The standard workflow

```
AI analyzes
   ↓
Evidence collected        (sources the score is built from)
   ↓
Reasoning                 (how the evidence was weighed)
   ↓
Confidence                (how sure the AI is)
   ↓
Potential improvements    (specific, each with a +gain)
   ↓
Before / After            (visual proof where applicable)
   ↓
Approve                   (human-in-the-loop gate)
   ↓
Apply changes
   ↓
Updated score             (re-score + toast confirmation)
```

Every AI score supports the full chain. Sections with no data **hide** (never show an empty "Evidence" header) — EvidenceBlock already auto-hides reasoning / evidence / suggestions / before-after when their props are empty.

---

## 2. The canonical component — EvidenceBlock

**Anatomy (top → bottom):**
1. **Header** — title · confidence badge · `score → potential` with a dual progress bar (solid = now, hatched = potential).
2. **Why this score** — one plain-language paragraph (always present).
3. **AI reasoning** — how evidence was weighed (subtle grey block; hides if empty).
4. **Evidence** — source thumbnails + bulleted sources (hides if empty).
5. **Suggested improvements** — each line a concrete action + green `+N` gain (hides if empty).
6. **Before / After** — two images, "Before · score" vs "After · potential" (hides unless both imgs supplied).
7. **Actions** — Approve fixes (primary) · Improve · Regenerate.

**Props:** `title, score, potential, confidence, why, reasoning, evidence[], evidenceImgs[], suggestions[{text,gain}], beforeImg, afterImg, onApprove, onImprove, onRegenerate`.

**Mount pattern (in any screen):**
```html
<dc-import name="components/EvidenceBlock"
  title="{{ evTitle }}" score="{{ evScore }}" potential="{{ evPotential }}"
  confidence="{{ evConfidence }}" why="{{ evWhy }}" reasoning="{{ evReasoning }}"
  evidence="{{ evEvidence }}" evidence-imgs="{{ evEvidenceImgs }}"
  suggestions="{{ evSuggestions }}" before-img="{{ evBefore }}" after-img="{{ evAfter }}"
  on-approve="{{ evApprove }}" on-improve="{{ evImprove }}" on-regenerate="{{ evRegen }}"
  hint-size="420px,640px"></dc-import>
```
Open it in a centred modal (Brand Detail, Assets) or inline in a wide intelligence panel.

---

## 3. Standardized sub-patterns

**Confidence badges** — dot + `N% confidence`. Dot colour: ≥85 green (`--color-approved`), 70–84 amber (`--color-warning`), <70 grey. Never show a score without a confidence read.

**Evidence cards** — square source thumbnails (54px, `--image-radius-sm`) + a bulleted source list. Evidence is *specific and checkable* ("Palette within 4% of brandbook swatches"), never vague ("looks on-brand").

**Reasoning sections** — subtle grey panel, max ~2 sentences, name the reference set and the weighting ("Scored against 1,240 on-brand assets — palette ΔE, crop ratio, framing weighted by recency").

**Approval actions** — Approve is the primary (filled black) button. Approving **must** produce a re-score + toast. Improve generates an alternative; Regenerate re-runs analysis. No AI change lands without an explicit human Approve (HITL).

**Recommendations** — every suggestion is an action + quantified gain (`+6`). No suggestion without a number.

---

## 4. AI states (every explainability surface)

| State | Treatment |
|---|---|
| **Loading / analyzing** | Determinate progress where possible ("Scoring 23/47"), skeleton matching final layout. Never a bare spinner. |
| **Streaming** | Step list with done ✓ / active · / todo; announce via `aria-live="polite"`. |
| **Ready** | Full EvidenceBlock. |
| **Retry** | On a dropped/failed analysis: `Retry · Report · Go back`. Note: `brand-intelligence` is **not durable** — use error+retry, not a resumable-stream UI. |
| **Error** | Plain cause + the same three recovery actions. Never a dead end. |
| **Empty** | "No analysis yet" + a primary "Analyze" action. |

---

## 5. Where it's used (and pending)

| Surface | Score explained | Status |
|---|---|---|
| Brand Detail — DNA pillars | Pillar score → potential | ✅ shipped |
| Assets — selected asset | DNA match % | ✅ shipped (modal) |
| Matching — creator fit | Audience/DNA fit % | ⬜ next (reuse) |
| Campaigns — performance | Predicted performance | ⬜ next (reuse) |
| Channel Preview — readiness | Per-channel readiness | ⬜ next (reuse) |
| Analytics — metric drilldown | KPI movement | ⬜ after chart standards |

---

## 6. Rules (do / don't)

**Do** — reuse EvidenceBlock everywhere; always show confidence; keep evidence specific; gate every applied change behind Approve; re-score + toast after Approve; hide empty sections.

**Don't** — build a second explainability component; show a score with no "why"; use vague evidence; auto-apply AI changes without HITL; use a bare spinner for analysis; leave an error without recovery actions.
