# W2 — Brand Setup Wizard

**Canonical route:** `/dashboard/brand/intake`  
**Wireframe label (legacy):** `/dashboard/brand/new`  
**Linear task:** IPI-23 · UI-002 — Brand Intake Screen  
**Phase:** MVP | **Agents:** Brand Intelligence Agent (`brand-intelligence`)

---

## AI-Native Dashboard Compliance

| Layer | Required? | Implementation |
|-------|-----------|----------------|
| L1 Context | Yes | `useCopilotReadable` / `useAgentContext` — brand URL, step, partial profile |
| L2 Proactive Suggestions | Yes | Right panel: analyze URL, competitor chips |
| L3 Chat | Yes | CopilotKit assistant (Phase B+; placeholder in UI-001) |
| L4 Generative UI | Optional for MVP | Citation cards, score preview in right panel |
| L5 HITL | Required for writes | Approval card before save profile to Supabase |

## Panel Contract

| Panel | Purpose |
|-------|---------|
| Center | Human-first workspace — wizard steps, forms, profile review |
| Right | AI insight, recommendations, approvals |

**HITL:** Approve enriched profile before persist · edge: POST `/functions/v1/brand-intelligence` (as-built).

---

## Step 1 — Welcome & URL

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                          iPix                                        │
│                                                                      │
│              Welcome to iPix                                         │
│              Let's set up your brand.                                │
│                                                                      │
│              ●───○───○───○───○───○                                   │
│                                                                      │
│              What's your brand name?                                 │
│              ┌────────────────────────────────────┐                  │
│              │ Maison Elara                       │                  │
│              └────────────────────────────────────┘                  │
│                                                                      │
│              What's your website URL?                                │
│              ┌────────────────────────────────────┐                  │
│              │ https://maisonelara.com            │                  │
│              └────────────────────────────────────┘                  │
│                                                                      │
│              What does your brand do?                                │
│              ┌────────────────────────────────────┐                  │
│              │ Luxury leather accessories —       │                  │
│              │ handbags, scarves, jewelry.        │                  │
│              │ Based in Milan.                    │                  │
│              └────────────────────────────────────┘                  │
│                                                                      │
│                              [Analyze My Brand →]                    │
│                                                                      │
│              ┌────────────────────────────────────┐                  │
│              │ ✦ I'll analyze your website, extract│                  │
│              │ your visual identity, and score    │                  │
│              │ your brand across 5 dimensions.    │                  │
│              │ This takes about 15 seconds.       │                  │
│              └────────────────────────────────────┘                  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Step 2 — Social URLs (Optional)

```
┌─ CENTER ──────────────────────────────────────────────────┐
│                                                            │
│  Brand Setup · Step 2 of 6 — Social Presence               │
│  ○───●───○───○───○───○                                     │
│                                                            │
│  Add your social accounts for deeper analysis (optional)   │
│                                                            │
│  Instagram                                                 │
│  ┌───────────────────────────────────────────┐             │
│  │ https://instagram.com/maisonelara         │             │
│  └───────────────────────────────────────────┘             │
│                                                            │
│  TikTok                                                    │
│  ┌───────────────────────────────────────────┐             │
│  │ https://tiktok.com/@maisonelara           │             │
│  └───────────────────────────────────────────┘             │
│                                                            │
│  LinkedIn                                                  │
│  ┌───────────────────────────────────────────┐             │
│  │                                           │             │
│  └───────────────────────────────────────────┘             │
│                                                            │
│  [← Back]        [Skip]        [Next →]                    │
└────────────────────────────────────────────────────────────┘
```

---

## Step 3 — AI Analysis (In Progress)

```
┌─ CENTER ──────────────────────────────────────────────────┐
│                                                            │
│  Brand Setup · Step 3 of 6 — Analyzing Your Brand          │
│  ○───○───●───○───○───○                                     │
│                                                            │
│              ┌────────────────────────────┐                │
│              │         ✦  Analyzing       │                │
│              │  maisonelara.com           │                │
│              │  ████████████░░░░  72%     │                │
│              └────────────────────────────┘                │
│                                                            │
│  ✓ Website visual identity extracted                         │
│  ✓ Instagram channel analyzed                              │
│  ◌ Scoring brand dimensions…                               │
│  ○ Generating recommendations                              │
│                                                            │
│  This usually takes about 15 seconds.                      │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌─ RIGHT (Intelligence) ────────────────────────────────────┐
│  Live status from `brand-intelligence` edge function       │
│  · URL Context + structured output                         │
│  · Errors surface here with retry CTA                      │
└────────────────────────────────────────────────────────────┘
```

**Behavior:** Auto-advance to Step 4 on success. On failure, show retry + allow [← Back] to edit URLs.

---

## Step 4 — Profile Confirmation

```
┌─ CENTER ──────────────────────────────────────────────────┐
│                                                            │
│  Brand Setup · Step 4 of 6 — Confirm Your Profile          │
│  ○───○───○───●───○───○                                     │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │  Maison Elara                                         │  │
│  │  Luxury accessories · Milan · $200–$800 · Premium     │  │
│  │                                                       │  │
│  │  Visual Consistency  ████████████████░░░░  78          │  │
│  │  Ecommerce Readiness ████████░░░░░░░░░░░░  42         │  │
│  │  Amazon Readiness    ██████░░░░░░░░░░░░░░  35         │  │
│  │  Social Maturity     ██████████████░░░░░░  65         │  │
│  │  Conversion Clarity  ████████████░░░░░░░░  58         │  │
│  │                                                       │  │
│  │  ✦ "Your brand has a strong visual identity but your  │  │
│  │  ecommerce presence needs significant improvement.    │  │
│  │  Product photography is your biggest opportunity."    │  │
│  │                                                       │  │
│  │  Does this look right?                                │  │
│  │                                                       │  │
│  │  [Edit Profile]           [Looks Good → ]             │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## Step 5 — Approve & Save (HITL)

```
┌─ CENTER ──────────────────────────────────────────────────┐
│                                                            │
│  Brand Setup · Step 5 of 6 — Save Your Brand Profile       │
│  ○───○───○───○───●───○                                     │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Ready to save Maison Elara to your workspace?        │  │
│  │                                                       │  │
│  │  · Brand profile + 5 dimension scores                 │  │
│  │  · Source URLs (website + 2 social channels)          │  │
│  │  · AI analysis log (audit trail)                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  [← Back to Edit]              [Save Brand Profile →]      │
└────────────────────────────────────────────────────────────┘

┌─ RIGHT (Intelligence) ────────────────────────────────────┐
│  HITL approval card (L5)                                   │
│  "Approve saving this profile to Supabase?"                │
│  [Approve] [Reject] — required before POST persist         │
└────────────────────────────────────────────────────────────┘
```

**Edge:** POST `/functions/v1/brand-intelligence` with approved payload · writes `brands` + `brand_scores`.

---

## Step 6 — Canvas Recommendations

```
┌─ CENTER ──────────────────────────────────────────────────┐
│                                                            │
│  Brand Setup · Step 6 of 6 — Your Canvases                 │
│  ○───○───○───○───○───●                                     │
│                                                            │
│  Based on your profile, we recommend starting with:        │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑ Brand DNA Canvas              ← Recommended        │   │
│  │   Define your visual identity, voice, and rules      │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ☑ Digital Presence Canvas       ← Recommended        │   │
│  │   Map your channel strategy and content specs        │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ☐ Collection Design Canvas                           │   │
│  │   Plan your product collections and SKU strategy     │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ☐ Season Planner Canvas                              │   │
│  │   Map your annual production calendar                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                            │
│  You can always add more canvases later.                   │
│                                                            │
│  [← Back]                    [Complete Setup →]            │
└────────────────────────────────────────────────────────────┘
```
