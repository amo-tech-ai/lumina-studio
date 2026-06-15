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
