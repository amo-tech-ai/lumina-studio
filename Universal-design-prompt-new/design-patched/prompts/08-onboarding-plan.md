# Onboarding — Plan & Wireframes (Zeely-style)

> **Type:** Planning doc with low-fidelity wireframes. Companion to the build spec `08-onboarding.md`.
> **Screen:** FashionOS Onboarding — pre-app acquisition flow that takes a new user from zero → committed Brand DNA.
> **Route:** `/onboarding` (standalone — no operator shell, no NavSidebar, no IntelligencePanel).
> **Reference:** Zeely onboarding (`uploads/*-modal.png`). We borrow the *structure and rhythm*, not the brand.

---

## 1. Goal & strategy

Onboarding is a **conversion funnel**, not a settings form. Zeely's flow works because it **alternates asks with reassurance**: every time it asks the user for something, it follows with a value-prop or proof screen that re-sells the product and rebuilds momentum before the next ask. Drop-off stays low because the user is never asked twice in a row.

**Our adaptation keeps that rhythm** and ends on the FashionOS payoff — a live AI analysis that produces a real Brand DNA score the user can act on inside `/app`.

```
ASK ──▶ REASSURE ──▶ ASK ──▶ EDUCATE ──▶ ASK ──▶ PROVE ──▶ … ──▶ ANALYSE ──▶ PAYOFF
```

Three jobs, in order:
1. **Qualify** — what are you building, where do you sell, how do you grow (cheap, momentum-building questions first).
2. **Convince** — interleaved value-prop + social-proof screens (AI grows brands, ads on autopilot, go viral, real testimonials).
3. **Activate** — capture brand URL/handles, run the AI analysis, deliver a Brand DNA score, hand off to `/app`.

---

## 2. Direction decision (one open call) — ⚠ confirm before build

The current build spec (`08-onboarding.md`) is **pure black/white**. The Zeely reference uses **one signature green accent**. This plan adopts the green to stay faithful to "similar to Zeely". If you'd rather stay monochrome, say so and I'll swap every `--onb-accent` usage to charcoal/black.

| | Zeely-faithful (this doc) | Pure B/W (current spec) |
|---|---|---|
| Progress fill | green `--onb-accent` | black |
| CTA arrow | green | white |
| Affirmation callout | green tint + green hairline | grey |
| Positive chips (Live ad, +704 orders) | green | black |
| Everything else | black / white / grey | black / white / grey |

This green is a **local onboarding palette** only (the pre-app flow is sanctioned to carry its own palette); it never enters the operator app, which stays v3 "Zeely Editorial" monochrome.

---

## 3. Visual system

### Backdrop
- Full-bleed **`#000000`** page.
- Behind the card: a faint **striped "globe" motif** — concentric horizontal bars clipped to a circle, `#0E1A12` (very dark green) at ~6% contrast against black. Low-key, never competes with the card. (Zeely's signature; build as a single absolutely-positioned SVG/`radial` element.)
- Some screens swap the motif for a **full-bleed editorial fashion photo** (welcome, payoff) with a `rgba(0,0,0,0.4)` scrim.

### Card
- White `#FFFFFF`, **radius 28px**, padding 32px, `max-width 480px`, centered horizontally and sitting in the **lower-middle** of the viewport (Zeely places it low so the motif breathes above).
- Soft shadow `0 24px 60px rgba(0,0,0,0.35)` to lift it off black.
- The **analysis screen breaks the card** entirely (full-black, white type).

### Top chrome (fixed, above the card, on the black)
```
◀                       ⊚ FashionOS                        Skip for now
━━━━━━━━━━━  ━━━━━━━━━━━  ──────────────   ← 3-segment progress (thin, full width)
```
- Back chevron `ChevronLeft` 22px **white**, top-left (hidden on screen 1).
- Wordmark **white**, top-center.
- `Skip for now` white-60% text-link, top-right (only on optional screens).
- **Progress: 3 segments**, 2px tall, full page width, 8px below the wordmark. Filled = `--onb-accent` green; partially-filled segment uses a green sub-fill; unfilled = `#2A2A2A`.

### Accent & tokens (local onboarding palette)
| Token | Value | Use |
|---|---|---|
| `--onb-bg` | `#000000` | page |
| `--onb-motif` | `#0E1A12` | striped globe behind card |
| `--onb-card` | `#FFFFFF` | card surface |
| `--onb-card-radius` | `28px` | card |
| `--onb-ink` | `#0A0A0A` | headline / primary text |
| `--onb-sub` | `#5C5C5C` | subtext |
| `--onb-muted` | `#9E9E9E` | captions, skip link |
| `--onb-hair` | `#ECECEC` | row dividers, input borders |
| `--onb-accent` | `#16E07D` | progress fill, CTA arrow, positive chips |
| `--onb-accent-tint` | `#E8FBF1` | affirmation callout bg |
| `--onb-accent-line` | `#9BE9C4` | affirmation left hairline |
| `--onb-accent-ink` | `#0B7A43` | affirmation text |
| `--onb-cta` | `#000000` | CTA pill bg |
| `--onb-cta-text` | `#FFFFFF` | CTA label |
| `--onb-cta-off` | `#EDEDED` / text `#B0B0B0` | disabled CTA |
| `--onb-weak` | `#B45309` | weakest-pillar amber (payoff only) |

### Type (Inter throughout)
| Usage | Size / Weight | Color |
|---|---|---|
| Headline | 28px / 700, ~1.15 line-height | `--onb-ink` |
| Subtext | 15px / 400 | `--onb-sub` |
| Option label | 16px / 600 | `--onb-ink` |
| Option sublabel | 13px / 400 | `--onb-sub` |
| Affirmation | 13px / 500 | `--onb-accent-ink` |
| CTA | 16px / 600 | `--onb-cta-text` |
| Caption / counter | 12px / 500 | `--onb-muted` |

### CTA
- **Black pill**, full-width, height 56px, radius 100px. Label left-center, **green `→` arrow** trailing.
- Disabled: `--onb-cta-off` until the screen's requirement is met. Always-enabled on welcome / value-prop / proof screens.

---

## 4. Flow map — 13 screens (interleaved)

| # | Type | Screen | Ask? | Progress seg |
|---|---|---|---|---|
| 1 | Proof | Social-proof welcome ("We've helped N brands") | — | 1 |
| 2 | **Ask** | What are you building? (radio + avatar) | ✓ | 1 |
| 3 | Educate | AI builds your Brand DNA (before/after sales) | — | 1 |
| 4 | **Ask** | Tell us about your brand (name · URL · handles) | ✓ | 2 |
| 5 | **Ask** | Where is your brand listed? (checkbox + brand icons) | ✓ | 2 |
| 6 | Proof | Testimonial ("21 sales in the first hour") | — | 2 |
| 7 | **Ask** | Preferred way to grow? (radio + affirmation) | ✓ | 2 |
| 8 | Educate | Turn your brand into cash flow (ads-by-AI phone mock) | — | 3 |
| 9 | Educate | Make your ad budget work smarter (monthly-goals card) | — | 3 |
| 10 | Educate | Go viral on socials, 10× orders (social funnel) | — | 3 |
| 11 | Educate | Clicks → sales in minutes (product content grid) | — | 3 |
| 12 | System | AI Analysis (full-black, no card, live checklist) | — | 3 |
| 13 | Payoff | Your Brand DNA is ready (score + pillars → `/app`) | — | 3 |

> Mirrors Zeely's cadence: proof → ask → educate → ask → ask → proof → ask → 4× educate → analyse → payoff. The four consecutive educate screens (8–11) are Zeely's "value stack" right before the analysis — they justify the wait.

---

## 5. Component patterns

### A. Radio row (with avatar) — screens 2, 7
```
┌──────────────────────────────────────────────┐
│ (◎)  Products                              ◯  │  ← 64px row, avatar 40px circle, radio 22px
├──────────────────────────────────────────────┤
│ (◎)  Services                              ◯  │
├──────────────────────────────────────────────┤
│ (◎)  Both                                  ●  │  ← selected: radio = black fill + white dot
└──────────────────────────────────────────────┘
```
- Avatar = small editorial fashion crop (screen 2) from `app/design/images`; plain when an option has no natural image (screen 7 has no avatars — label only).
- Radio right: 22px ring `--onb-hair`→`#9E9E9E`; selected = `--onb-ink` fill + 8px white dot. Row hover `#FAFAFA`.

### B. Checkbox row (with brand icon) — screen 5
```
 (IG)  Instagram                                ☐
 (f)   Facebook                                 ☐
 (S)   Shopify                                  ☑   ← checked: black box + white ✓
 (🌐)  My own website                            ☐
```
- Left glyph: **real brand mark in brand color** (Instagram, Facebook, Shopify, TikTok, Etsy, Amazon, eBay) — these are recognized marks, allowed as small list affordances. "My own website"/"Other" use a neutral Lucide glyph.
- Checkbox right: 22px, radius 6px; checked = `--onb-ink` fill + white `✓`.
- `Skip for now` link sits **above** a disabled Continue until ≥1 box is ticked.

### C. Affirmation callout — appears after a selection (screens 2, 7)
```
┌─┬────────────────────────────────────────────┐
│ │ Great choice! We'll combine ads and social │   ← --onb-accent-tint bg,
│ │ posts to get you more customers faster.    │     --onb-accent-line left hairline (3px),
└─┴────────────────────────────────────────────┘     --onb-accent-ink text, slides in 150ms
```

### D. Value-prop card body — screens 3, 8, 9, 10, 11
Headline (2 lines) + 1–2 line subtext + a **single hero visual** (image or built graphic) + Continue. The visual is the star:
- **3** — Before/After sales charts (red "Before" tag on a flat $0 chart, green "After" tag on a rising $32K chart).
- **8** — Phone mockup running a live ad (Facebook "Clicks 14K", Instagram "Views 35K", "Add to cart" chip).
- **9** — "Monthly goals" dashboard card (Revenue / Amount spent / Ad Profit bars + Zeely-AI toggle).
- **10** — Social funnel diagram (FB · TikTok · IG → avatars → cart "+704 orders").
- **11** — Product content grid ("Your product" tagged thumbnail → 6 AI-generated lifestyle shots).
> Build these as HTML/CSS using `app/design/images` photos + simple shapes. Mark complex composites `data-om-raster` for clean export.

### E. Proof card — screens 1, 6
- **1**: headline "We've helped 10,000+ fashion brands launch" + a **5×2 grid of avatar tiles** (editorial fashion crops, each with a tiny store-app glyph + a small sales figure) + "Featured in **Forbes · TechCrunch · Sifted**".
- **6**: big quote headline + a **review block** (avatar, name, ★★★★★, date, paragraph) + a supporting photo (packed orders + a "$587.65 · 21 orders" sales widget overlay).

---

## 6. Per-screen wireframes

> Top chrome (back · wordmark · progress) is present on every screen except where noted; omitted below for density.

### Screen 1 — Social-proof welcome  ·  *always enabled*
```
            ⊚ FashionOS
  ━━━━━━━━  ────────  ────────

        ┌─────────────────────────────────────┐
        │  We've helped 10,000+               │
        │  fashion brands launch              │   ← 28/700
        │                                     │
        │  [◐][◑][◐][◑][◐]                     │   ← 5×2 avatar tiles,
        │  [◑][◐][◑][◐][◑]                     │     each w/ app glyph + sales no.
        │                                     │
        │  Featured in                        │
        │  Forbes   TC   \sifted/             │
        │                                     │
        │  [        Continue        →]        │
        └─────────────────────────────────────┘
```

### Screen 2 — What are you building?  ·  *ask (radio)*
```
        ┌─────────────────────────────────────┐
        │  What are you                        │
        │  building?                           │
        │  Choose one.                         │
        │ ─────────────────────────────────── │
        │ (◎) Fashion brand               ◯   │
        │ (◎) Clothing label              ◯   │
        │ (◎) Accessories & jewelry       ◯   │
        │ (◎) Beauty                      ◯   │
        │ (◎) Both products & services    ●   │
        │ ─────────────────────────────────── │
        │ ┃ Great — fashion brands hit 91%    │   ← affirmation (green)
        │ ┃ DNA accuracy in under 3 min.      │
        │ [        Continue        →]         │   ← enables after pick
        └─────────────────────────────────────┘
```

### Screen 3 — AI builds your Brand DNA  ·  *educate, always enabled*
```
        ┌─────────────────────────────────────┐
        │  FashionOS builds your              │
        │  Brand DNA fast                     │
        │  Trained on top fashion houses —    │
        │  see your identity score climb.     │
        │                                     │
        │   ╭Before╮            ╭After╮       │
        │   ┌────────┐     ┌──────────────┐   │
        │   │ DNA 0  │     │ DNA 87  ↗42% │   │   ← red flat card vs green rising card
        │   │ ▁▁▁▁▁▁ │     │ ▁▂▄▆█▆█  📈  │   │
        │   └────────┘     └──────────────┘   │
        │       Results may vary              │
        │  [        Continue        →]        │
        └─────────────────────────────────────┘
```

### Screen 4 — Tell us about your brand  ·  *ask (inputs)*
```
        ┌─────────────────────────────────────┐
        │  Tell us about                       │
        │  your brand                          │
        │ ─────────────────────────────────── │
        │  Brand name *                        │
        │  [____________________________]      │
        │  Website (optional)                  │
        │  [https://_________________]         │
        │  ┌ 🌐 nike.com · 47 pages · Apparel ┐ │   ← debounced URL preview strip
        │  Instagram         TikTok            │
        │  [@________]       [@________]       │
        │ ─────────────────────────────────── │
        │  [        Continue        →]         │   ← enables when name filled
        └─────────────────────────────────────┘
```

### Screen 5 — Where is your brand listed?  ·  *ask (checkbox + Skip)*
```
        ┌─────────────────────────────────────┐
        │  Where is your                       │
        │  brand listed?                       │
        │  Select all that apply               │
        │ ─────────────────────────────────── │
        │  (IG) Instagram                  ☐   │
        │  (f)  Facebook                   ☑   │
        │  (S)  Shopify                    ☑   │
        │  (🌐) My own website              ☐   │
        │  (♪)  TikTok                     ☐   │
        │  (E)  Etsy                       ☐   │
        │  (a)  Amazon                     ☐   │
        │  (e)  eBay                       ☐   │
        │ ─────────────────────────────────── │
        │             Skip for now             │
        │  [        Continue        →]         │   ← disabled until ≥1 or Skip
        └─────────────────────────────────────┘
```

### Screen 6 — Testimonial  ·  *proof, always enabled*
```
        ┌─────────────────────────────────────┐
        │  "21 sales in the                    │
        │   first hour!"                       │
        │  ┌───────────────────────────────┐   │
        │  │ (av) Rosemary N. Conroy       │   │
        │  │      ★★★★★  Nov 30, 2025       │   │
        │  │ My first campaign brought 21  │   │
        │  │ sales in the first hour…      │   │
        │  └───────────────────────────────┘   │
        │  ┌───────────────────────────────┐   │
        │  │ [packed-orders photo]  $587.65│   │   ← photo + sales widget overlay
        │  │                        21 ord │   │
        │  └───────────────────────────────┘   │
        │  [        Continue        →]         │
        └─────────────────────────────────────┘
```

### Screen 7 — Preferred way to grow?  ·  *ask (radio + affirmation)*
```
        ┌─────────────────────────────────────┐
        │  What's your preferred way           │
        │  to get more customers?              │
        │ ─────────────────────────────────── │
        │  Social media                    ◯   │
        │  Paid ads                        ◯   │
        │  Both                            ●   │
        │  No plan yet — FashionOS decides ◯   │
        │ ─────────────────────────────────── │
        │ ┃ Great choice! We'll combine ads   │   ← green affirmation
        │ ┃ and social to grow you faster.    │
        │  [        Continue        →]         │
        └─────────────────────────────────────┘
```

### Screens 8–11 — value stack  ·  *educate, always enabled*
Same card skeleton (headline → subtext → hero visual → Continue). Heroes:
```
 8  Turn your brand into cash flow with ads run by AI
    └ phone mock: Live-ad badge · "Clicks 14K" · "Views 35K" · Add-to-cart chip
 9  Make your ad budget work smarter with AI
    └ "Monthly goals" card: Revenue $450/$5,000 · Amount spent $2,000/$2,000 · Ad Profit · AI toggle
10  Go viral on socials and 10× your orders
    └ funnel: FB · TikTok · IG → creator avatars → cart "+704 orders"
11  Go from clicks to sales in minutes, not weeks
    └ grid: "Your product" tagged jar → 6 AI lifestyle shots
```

### Screen 12 — AI Analysis  ·  *system, full-black, NO card, auto-advance*
```
   ◀                ⊚ FashionOS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ━━━━━━━━━  ────

            Building your Brand
            DNA profile▏                         ← white 30/700, blinking cursor

      ✓  Website analysed
      ✓  Instagram detected
      ✓  Colours extracted
      ···  Building Brand DNA…                   ← current, green pulse
      ◦  Scoring visual identity
      ◦  Preparing recommendations

   Analysing nike.com                      85%
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ──   ← green fill on #2A2A2A track
```
Checklist items reveal 1/600ms; done ✓ green; auto-advances ~4s.

### Screen 13 — Your Brand DNA is ready  ·  *payoff → /app*
```
   [full-bleed editorial photo + dark scrim]
        ┌─────────────────────────────────────┐
        │  Your Brand DNA                      │
        │  is ready                            │
        │  nike.com · 47 pages · 90 seconds    │
        │ ─────────────────────────────────── │
        │                      DNA Score  87   │
        │  ████████░  Brand        88          │
        │  ██████░░░  Visual       72*         │   ← * weakest, amber label
        │  █████████  Voice        94          │
        │  ███████░░  Commerce     79          │
        │ ─────────────────────────────────── │
        │  Strengths   athlete voice · ecom    │
        │  Opportunities  visual consistency   │
        │  [     Open FashionOS     →]         │   → /app
        │         Review before committing     │
        └─────────────────────────────────────┘
```
Pillar bars animate 0→value, staggered 50ms. Single amber exception on the weakest pillar.

---

## 7. Interactions & states

- **Nav:** `Continue/→` advances; back chevron / `Esc` goes back; `Enter` advances when CTA enabled. Progress segments fill across the 3 phases (1: s1–3, 2: s4–7, 3: s8–13).
- **Asks (2, 5, 7):** selection → affirmation slides in (where defined) → CTA enables. Screen 4: CTA enables when brand name is non-empty; URL field shows a debounced preview strip (~400ms).
- **Skip:** screen 5 only (and any optional asset step). Skipping advances with no selection.
- **Analysis (12):** checklist reveals on a timer, bottom bar animates to 100%, auto-advances. No CTA.
- **Payoff (13):** bars animate on enter; `Open FashionOS` → `/app`.
- **Reduced motion:** affirmations/bars appear without slide/grow; cursor stops blinking.
- **Mobile:** card = `calc(100% − 40px)`, `max-width 480px`, pinned lower; top chrome unchanged; value-prop heroes scale to card width.

---

## 8. Build notes

- One standalone DC: `Onboarding.v2.zeely.dc.html` (13 screens as toggle-able views + a step selector for review). No operator shell.
- Striped-globe motif = one absolutely-positioned element behind the card; reuse across screens (swap to photo on 1 & 13).
- Reuse components: `TopChrome` (back · wordmark · 3-seg progress), `OnbCard`, `RadioRow`, `CheckRow`, `Affirmation`, `ValuePropCard`, `CTAButton`.
- Photos from `app/design/images`; brand marks (IG/FB/Shopify/TikTok/Etsy/Amazon/eBay) as small inline SVG in brand colors.
- Value-prop composites: build with CSS + photos; tag heavy ones `data-om-raster`.
- **Confirm the green-accent decision (§2) before building.** Default = adopt green.
