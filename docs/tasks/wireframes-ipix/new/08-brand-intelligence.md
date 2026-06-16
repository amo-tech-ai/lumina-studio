# 08 — Brand Intelligence Report

**Canonical route:** `/dashboard/brand`  
**Wireframe label (legacy):** `/dashboard/intelligence/:id`  
**Linear task:** IPI-18 · AI-001 — Brand Intelligence Agent  
**Phase:** MVP | **Agents:** Brand Intelligence Agent (`brand-intelligence`)

---

## AI-Native Dashboard Compliance

| Layer | Required? | Implementation |
|-------|-----------|----------------|
| L1 Context | Yes | `useCopilotReadable` — scores, gaps, brandId |
| L2 Proactive Suggestions | Yes | Right panel: biggest gap, ranked actions |
| L3 Chat | Yes | CopilotKit assistant (Phase B+; placeholder in UI-001) |
| L4 Generative UI | Optional for MVP | Tool result / citation list in right panel |
| L5 HITL | Required for writes | Approval before re-analyze persist / profile save |

## Panel Contract

| Panel | Purpose |
|-------|---------|
| Center | Human-first workspace — score bars, data points, re-analyze |
| Right | AI insight, gap narrative, suggested next steps |

---

## Report View

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR          │           CENTER                          │  INTELLIGENCE          │
│                  │                                           │                        │
│ iPix             │  Brand Intelligence                       │  ✦ Intelligence        │
│ ─────────        │  Maison Elara            [Re-analyze]     │                        │
│ [Brand ▼]        │  Last analyzed: Mar 15, 2026              │  ── Biggest Gap ──     │
│                  │                                           │                        │
│ (standard nav)   │  ── 5 Brand Scores ──────────────────     │  Amazon Readiness: 35  │
│                  │                                           │  Your product images   │
│                  │  ┌─────────────────────────────────────┐  │  lack white-BG         │
│                  │  │                                      │  │  compliance and have   │
│                  │  │  Visual Consistency                   │  │  only 3 images per    │
│                  │  │  ████████████████████████████░░░░ 78 │  │  listing (need 7+).   │
│                  │  │  Good — cohesive but minor gaps      │  │                        │
│                  │  │                                      │  │  Prioritize a product  │
│                  │  │  Ecommerce Readiness                 │  │  shoot focused on      │
│                  │  │  ████████████████░░░░░░░░░░░░░░ 42  │  │  Amazon standards.     │
│                  │  │  ⚠ Developing — avg 2.3 images/PDP  │  │                        │
│                  │  │                                      │  │  [Start Brief →]       │
│                  │  │  Amazon Readiness                    │  │                        │
│                  │  │  ██████████░░░░░░░░░░░░░░░░░░░░ 35  │  │  ── Suggestions ──     │
│                  │  │  ⚠ Needs Work — no white BG images  │  │                        │
│                  │  │                                      │  │  1. Add white-BG       │
│                  │  │  Social Maturity                     │  │     hero images to     │
│                  │  │  ██████████████████████░░░░░░░░ 65  │  │     all PDPs           │
│                  │  │  OK — IG active, TikTok dormant     │  │  Impact: HIGH          │
│                  │  │                                      │  │  Effort: MEDIUM        │
│                  │  │  Conversion Clarity                  │  │                        │
│                  │  │  ████████████████████░░░░░░░░░░ 58  │  │  2. Create Amazon      │
│                  │  │  OK — clear hero but weak CTAs      │  │     A+ content with    │
│                  │  │                                      │  │     brand story         │
│                  │  └─────────────────────────────────────┘  │  Impact: HIGH          │
│                  │                                           │  Effort: LOW           │
│                  │  ── 18 Data Points ─────────────────────  │                        │
│                  │                                           │  3. Standardize social  │
│                  │  Product     Visual       Position        │     grid to consistent  │
│                  │  ┌────────┐  ┌────────┐  ┌────────┐      │     warm palette        │
│                  │  │Accessor│  │Warm     │  │Aspira- │      │  Impact: MEDIUM        │
│                  │  │ies     │  │palette  │  │tional  │      │  Effort: LOW           │
│                  │  │120 SKUs│  │Serif    │  │Strong  │      │                        │
│                  │  │Premium │  │Editorial│  │story   │      │                        │
│                  │  │Leather │  │High     │  │4 rivals│      │                        │
│                  │  └────────┘  └────────┘  └────────┘      │                        │
│                  │                                           │                        │
│                  │  Audience                                  │                        │
│                  │  ┌────────┐                                │                        │
│                  │  │W 28-45 │                                │                        │
│                  │  │IT/UK/US│                                │                        │
│                  │  │IG:45K  │                                │                        │
│                  │  │5 chans │                                │                        │
│                  │  └────────┘                                │                        │
│                  │                                           │                        │
│                  │  [Download PDF Report]  [Start New Brief →]│                        │
└──────────────────────────────────────────────────────────────────────────────────────┘
```
