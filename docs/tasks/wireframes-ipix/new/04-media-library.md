# 04 — Media Library

**Canonical route:** `/dashboard/assets` · detail: `/dashboard/assets/:assetId`  
**Wireframe label (legacy):** `/dashboard/media`  
**Linear task:** IPI-24 · UI-003 — Asset Library Screen  
**Phase:** MVP | **Agents:** AestheticAuditor, TransformationAgent (`asset-dna`)

---

## AI-Native Dashboard Compliance

| Layer | Required? | Implementation |
|-------|-----------|----------------|
| L1 Context | Yes | `useAgentContext` — selected `assetId`, filters, DNA status |
| L2 Proactive Suggestions | Yes | Right panel: blocked asset queue, retake hints |
| L3 Chat | Yes | CopilotKit assistant (Phase B+; placeholder in UI-001) |
| L4 Generative UI | Optional for MVP | DNA pillar breakdown cards |
| L5 HITL | Required for writes | Approval before approve/flag/publish asset |

## Panel Contract

| Panel | Purpose |
|-------|---------|
| Center | Human-first workspace — grid, upload, bulk actions |
| Right | AI insight, DNA detail, recommendations, approvals |

**Legacy alias:** `/dashboard/brands/:id/assets` → `/dashboard/assets` (future multi-brand).

---

## Default View (Grid + Asset Selected)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR          │           CENTER                          │  INTELLIGENCE          │
│                  │                                           │                        │
│ iPix             │  Media Library                            │  ✦ Asset Detail         │
│ ─────────        │  247 assets across 5 shoots               │                        │
│ [Brand ▼]        │                            [Upload +]     │  ┌────────────────┐    │
│                  │                                           │  │ [Image Preview] │    │
│ ── Collections   │  [Search...] [Score ▼] [Status ▼]         │  │                │    │
│                  │  [Channel ▼] [Shoot ▼] [Type ▼]           │  │ spring_A01.jpg │    │
│ All Assets (247) │                                           │  └────────────────┘    │
│ By Shoot ▼       │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │                        │
│  Spring (67)     │  │[Img] │ │[Img] │ │[Img] │ │[Img] │    │  DNA: 92 ✓             │
│  Summer (45)     │  │      │ │      │ │      │ │      │    │  ████████████████████░  │
│  Resort (120)    │  │●✓ 92 │ │ ✓ 88 │ │ ⚠ 72 │ │ ✓ 85 │    │                        │
│ By Channel ▼     │  └──────┘ └──────┘ └──────┘ └──────┘    │  Color:       88 ✓     │
│  Amazon (89)     │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │  Lighting:    95 ✓     │
│  Shopify (120)   │  │[Img] │ │[Img] │ │[Img] │ │[Img] │    │  Composition: 91 ✓     │
│  Instagram (156) │  │      │ │      │ │      │ │      │    │  Style:       94 ✓     │
│ ─────────        │  │ ✗ 48 │ │ ✓ 91 │ │ ⚠ 65 │ │ ✓ 89 │    │                        │
│ Flagged (14) ⚠   │  └──────┘ └──────┘ └──────┘ └──────┘    │  Status: ✓ Approved    │
│ Approved (189) ✓ │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │                        │
│ Blocked (8) ✗    │  │[Img] │ │[Img] │ │[Img] │ │[Img] │    │  ── Actions ──         │
│                  │  │      │ │      │ │      │ │      │    │  [Approve]             │
│ ─────────        │  │ ✓ 83 │ │ ✓ 94 │ │ ⚠ 70 │ │ ✓ 87 │    │  [Flag for Review]     │
│ ○ Settings       │  └──────┘ └──────┘ └──────┘ └──────┘    │  [Transform ▼]         │
│                  │                                           │   Instagram Feed 4:5   │
│                  │  23 of 247 · [Select All] [Bulk Actions ▼]│   Amazon 1:1           │
│                  │                             ← 1 2 ... →   │   Shopify Square       │
│                  │                                           │   TikTok 9:16          │
│                  │                                           │  [Download]            │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Upload Zone (Drag & Drop Active)

```
┌─ CENTER ──────────────────────────────────────────────────┐
│                                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │           ┌─────────────────────┐                    │   │
│  │           │                     │                    │   │
│  │           │    📁 Drop files    │                    │   │
│  │           │    here or click    │                    │   │
│  │           │    to browse        │                    │   │
│  │           │                     │                    │   │
│  │           │  JPG, PNG, WEBP     │                    │   │
│  │           │  RAW, TIFF, MP4     │                    │   │
│  │           │  Max 50MB each      │                    │   │
│  │           └─────────────────────┘                    │   │
│  │                                                      │   │
│  │  Uploading 3 files...                                │   │
│  │  spring_B12.jpg  ████████████████░░  82%  Scoring... │   │
│  │  spring_B13.jpg  ████████░░░░░░░░░░  45%             │   │
│  │  spring_B14.jpg  ██░░░░░░░░░░░░░░░░  12%             │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

---

## Lightbox (Full-Screen Asset View)

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                              [✕ Close]│
│  ┌─────────────────────────────────────────────┐  ┌────────────────┐ │
│  │                                              │  │ DNA Score: 72⚠ │ │
│  │                                              │  │                │ │
│  │                                              │  │ Color:    82 ✓ │ │
│  │              [ Full Image ]                  │  │ Lighting: 58 ⚠ │ │
│  │                                              │  │ Comp:     75 ⚠ │ │
│  │                                              │  │ Style:    73 ⚠ │ │
│  │                                              │  │                │ │
│  │                                              │  │ ── Flags ──   │ │
│  │                                              │  │ "Mixed light  │ │
│  │                                              │  │  sources —    │ │
│  │                                              │  │  warm ambient │ │
│  │                                              │  │  + cool flash"│ │
│  └─────────────────────────────────────────────┘  │                │ │
│                                                    │ [Approve]      │ │
│  ← Previous                          Next →        │ [Flag]         │ │
│  spring_B01.jpg · Resort Lookbook · Mar 15         │ [Override ▼]   │ │
│                                                    └────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```
