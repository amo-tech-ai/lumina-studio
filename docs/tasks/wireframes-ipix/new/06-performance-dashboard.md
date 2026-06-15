# 06 — Performance Dashboard

**Canonical route:** `/dashboard/analytics`  
**Wireframe label (legacy):** `/dashboard/performance`  
**Linear task:** IPI-97 · DASH-011 — D10 Analytics Scaffold  
**Phase:** Advanced | **Agents:** Performance Feedback Agent (`analytics`)

---

## AI-Native Dashboard Compliance

| Layer | Required? | Implementation |
|-------|-----------|----------------|
| L1 Context | Yes | `useCopilotReadable` — KPIs, channel filters, date range |
| L2 Proactive Suggestions | Yes | Right panel: top insight, recommendations |
| L3 Chat | Yes | CopilotKit assistant (Phase B+; placeholder in UI-001) |
| L4 Generative UI | Optional for MVP | Generative charts (DASH-012, Advanced) |
| L5 HITL | Required for writes | Approval before "Apply to next brief" actions |

## Panel Contract

| Panel | Purpose |
|-------|---------|
| Center | Human-first workspace — KPI cards, charts, comparisons |
| Right | AI insight, performance narrative, apply actions |

**UI-001:** Placeholder page at `/dashboard/analytics` only — full wireframe is Advanced.

---

## Main View

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR          │           CENTER                          │  INTELLIGENCE          │
│                  │                                           │                        │
│ iPix             │  Performance                              │  ✦ Performance Intel    │
│ ─────────        │  Last 30 days              [Date Range ▼] │                        │
│ [Brand ▼]        │                                           │  ── Top Insight ──     │
│                  │  ── KPI Cards ──────────────────────────  │                        │
│ ── Filters       │                                           │  "Editorial-style      │
│                  │  ┌──────────┐ ┌──────────┐ ┌──────────┐  │  shoots drove 3x more  │
│ Channel ▼        │  │Engagement│ │   CTR    │ │Conversion│  │  Instagram saves than  │
│  All             │  │  Rate    │ │          │ │  Rate    │  │  product-only shoots.  │
│ Shoot ▼          │  │  4.2%    │ │  2.8%    │ │  1.9%    │  │  Increase editorial    │
│  All             │  │  ↑ +18%  │ │  ↑ +5%   │ │  ↓ -3%   │  │  mix to 35% next      │
│ Period ▼         │  └──────────┘ └──────────┘ └──────────┘  │  shoot."               │
│  30 days         │                                           │                        │
│                  │  ── Channel Comparison ──────────────────  │  [Apply to next brief] │
│                  │                                           │                        │
│                  │  Instagram  ████████████████░░  4.2% eng  │  ── Recommendations ── │
│                  │  Amazon     ████████████░░░░░░  1.9% conv │                        │
│                  │  Shopify    ██████████░░░░░░░░  1.6% conv │  1. Increase editorial  │
│                  │  TikTok     ████████████████████  6.1% eng│     mix from 20%→35%   │
│                  │  Pinterest  ██████████████░░░░  3.8% eng  │  2. Add infographic     │
│                  │                                           │     variants for all    │
│                  │  ── Shoot Comparison ────────────────────  │     Amazon hero images │
│                  │                                           │  3. Test Creative Temp  │
│                  │  ┌──────────────┐ ┌──────────────┐        │     75+ for TikTok     │
│                  │  │ Spring Drop  │ │ Resort LB    │        │                        │
│                  │  │              │ │              │        │  ── Temperature ──     │
│                  │  │ Temp: 45     │ │ Temp: 72     │        │                        │
│                  │  │ Eng: 3.1%    │ │ Eng: 5.8%    │        │  Low (0-30):  2.1% eng │
│                  │  │ Conv: 2.1%   │ │ Conv: 1.4%   │        │  Mid (31-60): 3.4% eng │
│                  │  │ Best: Amazon │ │ Best: IG     │        │  High(61+):   5.2% eng │
│                  │  └──────────────┘ └──────────────┘        │                        │
│                  │                                           │  Higher temp = higher   │
│                  │  ── Top Performing Assets ──────────────   │  engagement but lower   │
│                  │                                           │  conversion             │
│                  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │                        │
│                  │  │[Img] │ │[Img] │ │[Img] │ │[Img] │     │                        │
│                  │  │6.2%  │ │5.8%  │ │5.1%  │ │4.9%  │     │                        │
│                  │  │eng   │ │eng   │ │eng   │ │conv  │     │                        │
│                  │  └──────┘ └──────┘ └──────┘ └──────┘     │                        │
└──────────────────────────────────────────────────────────────────────────────────────┘
```
