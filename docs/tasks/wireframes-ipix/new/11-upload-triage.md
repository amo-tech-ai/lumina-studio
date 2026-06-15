# 11 — Upload & Triage

**Canonical route:** `/dashboard/assets` (upload/triage mode)  
**Wireframe label (legacy):** `/dashboard/shoots/:id/upload` — **Deferred** post-MVP  
**Phase:** Post-MVP | **Agents:** AestheticAuditor (`asset-dna`)

---

## AI-Native Dashboard Compliance

| Layer | Required? | Implementation |
|-------|-----------|----------------|
| L1 Context | Yes | `useAgentContext` — upload batch, live DNA scores |
| L2 Proactive Suggestions | Yes | Right panel: live scoring status, flag queue |
| L3 Chat | Yes | CopilotKit assistant (Phase B+) |
| L4 Generative UI | Optional for MVP | Per-file DNA cards |
| L5 HITL | Required for writes | Approval before bulk approve |

## Panel Contract

| Panel | Purpose |
|-------|---------|
| Center | Human-first workspace — drop zone, triage grid |
| Right | AI insight, live scores, approve/flag actions |

---

## Upload View (Real-Time Scoring)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR          │           CENTER                          │  INTELLIGENCE          │
│                  │                                           │                        │
│ iPix             │  ← Spring Drop / Upload & Triage          │  ✦ Upload Status       │
│ ─────────        │                                           │                        │
│ (standard nav)   │  ┌─────────────────────────────────────┐  │  ── Live Scores ──     │
│                  │  │                                      │  │                        │
│                  │  │    📁 Drop files here or browse       │  │  ✓ Approved: 142      │
│                  │  │    JPG, PNG, RAW · Max 50MB each     │  │  ⚠ Review:    38      │
│                  │  │                                      │  │  ✗ Blocked:   20      │
│                  │  └─────────────────────────────────────┘  │  ── Total: 200         │
│                  │                                           │                        │
│                  │  ── Processing Queue ──────────────────   │  ── Coverage ──        │
│                  │                                           │                        │
│                  │  IMG_001.jpg  ████████████████████ ✓ 92   │  Shot list: 73/80      │
│                  │  IMG_002.jpg  ████████████████████ ✓ 88   │  ████████████████████░  │
│                  │  IMG_003.jpg  ██████████████░░░░░░ ⚠ 72   │  91% coverage          │
│                  │  IMG_004.jpg  ████████████████████ ✓ 85   │                        │
│                  │  IMG_005.jpg  ████████░░░░░░░░░░░░ ✗ 48   │  Missing:              │
│                  │  IMG_006.jpg  ████████████████░░░░ ⚠ 78   │  • 4 detail close-ups  │
│                  │  IMG_007.jpg  ░░░░░░░░░░░░░░░░░░░░ ⏳ ...  │  • 3 lifestyle back    │
│                  │  IMG_008.jpg  ░░░░░░░░░░░░░░░░░░░░ ⏳ ...  │                        │
│                  │                                           │  ⚠ 7 shots remaining   │
│                  │  ── Triage Queue (Review 38) ──────────   │  before studio wraps.  │
│                  │                                           │  Reshoot now?          │
│                  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │                        │
│                  │  │[Img] │ │[Img] │ │[Img] │ │[Img] │     │  ── Quick Actions ──   │
│                  │  │ ⚠ 72 │ │ ⚠ 65 │ │ ⚠ 78 │ │ ⚠ 70 │     │                        │
│                  │  │[✓][✗]│ │[✓][✗]│ │[✓][✗]│ │[✓][✗]│     │  [Approve all 80+]     │
│                  │  └──────┘ └──────┘ └──────┘ └──────┘     │  [Review flagged]      │
│                  │                                           │  [Auto-select best     │
│                  │  ── Blocked (20) ──────────────────────   │   per shot]            │
│                  │                                           │                        │
│                  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │                        │
│                  │  │[Img] │ │[Img] │ │[Img] │ │[Img] │     │                        │
│                  │  │ ✗ 48 │ │ ✗ 52 │ │ ✗ 41 │ │ ✗ 55 │     │                        │
│                  │  │[Ovrd]│ │[Ovrd]│ │[Ovrd]│ │[Ovrd]│     │                        │
│                  │  └──────┘ └──────┘ └──────┘ └──────┘     │                        │
└──────────────────────────────────────────────────────────────────────────────────────┘
```
