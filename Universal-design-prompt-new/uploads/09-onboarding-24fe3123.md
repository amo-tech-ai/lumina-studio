# Claude Design Prompt — Onboarding (`/onboarding`)

**Screen:** Zeely-inspired onboarding — 10-screen modal wizard for new brand setup.
**Route:** `/onboarding` (pre-app, not inside the operator shell)
**Style:** Apple + Zeely + Vogue. Black/white only. No orange. No beige. Inter font.

This is a **standalone page** — no NavSidebar, no IntelligencePanel, no operator shell.

---

## Prompt (copy everything below this line)

---

Design the **FashionOS Onboarding** flow (`/onboarding`) — a 10-screen sequential wizard that takes a new user from zero to a committed Brand DNA profile.

### Core aesthetic

Inspired by Zeely's onboarding UX. Do not copy Zeely. Borrow only:

- One focused question per screen, maximum two sentences of supporting copy
- White card floating on a full-bleed background (editorial fashion photography or solid black)
- Thin 3-segment progress bar at the very top of the page — not inside the card
- Inline affirmation that appears after a selection is made — activates the CTA
- Black pill button, full-width, bottom of card
- Analysis screen breaks the card format entirely — full black page, white text

**Never:** gradients, beige, orange, Geist font, shadows, the 3-panel shell, the operator nav.

---

### Page structure (all 10 screens)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ◀   [logo wordmark — FashionOS]   top-center   [Skip for now — text link]  │
│  ████████████████ ░░░░░░░░░░░░░░░░ ░░░░░░░░░░░░░░░░  ← 3-segment progress  │
│                                                                              │
│                        [full-bleed background]                               │
│                        fashion photography or                                │
│                        solid black (#000000)                                 │
│                                                                              │
│               ┌─────────────────────────────────────┐                       │
│               │  WHITE CARD  max-width 480px         │                       │
│               │  border-radius 24px                  │                       │
│               │  padding 32px                        │                       │
│               │  background #FFFFFF                  │                       │
│               │  border 1px solid #E5E5E5            │                       │
│               │                                      │                       │
│               │  [card content — varies per screen]  │                       │
│               │                                      │                       │
│               │  ┌────────────────────────────────┐  │                       │
│               │  │  Continue  →                   │  │                       │
│               │  └────────────────────────────────┘  │                       │
│               └─────────────────────────────────────┘                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Progress bar:** 3 segments, 3px height, full page width. Each segment covers ~3–4 screens.
- Segment 1 (screens 1–3): About you
- Segment 2 (screens 4–7): About your brand
- Segment 3 (screens 8–10): AI analysis + ready

Filled segment: `#000000`. Unfilled: `#E5E5E5`. No animation — fill jumps on advance.

**Back arrow:** Lucide `ChevronLeft` 20px `#000000` top-left. Hidden on screen 1.

**Logo:** `FashionOS` wordmark, Inter 15px 600, `#000000`, top-center.

**Skip:** `Skip for now` — Inter 13px, `#9E9E9E`, top-right, only visible on screens 3–7.

**CTA button:** `Continue →` (or screen-specific label). Black pill: `#000000` bg, `#FFFFFF` text, Inter 15px 500, border-radius 100px, height 52px, full-width. Disabled state: `#E5E5E5` bg, `#9E9E9E` text. Enables on valid selection.

**Background:** Use images from `/app/design/images/`. Fashion editorial photography — female models, luxury apparel, studio/runway. Never stock, never business imagery. Alt: solid `#000000`.

---

### Typography system (Inter throughout — no Geist)

| Usage | Size | Weight | Color |
|---|---|---|---|
| Screen headline | 26px | 700 | `#000000` |
| Subtext | 14px | 400 | `#616161` |
| Option label (primary) | 15px | 500 | `#000000` |
| Option label (secondary) | 13px | 400 | `#616161` |
| Affirmation text | 13px | 400 | `#212121` |
| Button | 15px | 500 | `#FFFFFF` |
| Caption | 12px | 400 | `#9E9E9E` |

---

### Radio row pattern (used on screens 2, 5)

Full-width row, 60px height, 1px `#E5E5E5` bottom border.

```
[40px circle image]  [label text]                    ○
```

- Circle image: 40px, object-fit cover, border-radius 50%
- Label: Inter 15px 500 `#000000`
- Radio: 20px circle, 1.5px `#9E9E9E` border. Selected: `#000000` filled + white center dot 8px
- Row hover: `#FAFAFA` bg
- Selected row: no bg change — only the radio changes

**Affirmation callout** (appears below the option list after selection):
- `#F5F5F5` bg, border-radius 8px, 12px padding
- Lucide `Sparkles` 13px `#000000` + affirmation text 13px `#212121`
- Slides in 150ms ease-out

---

### Checkbox row pattern (used on screens 4, 7)

Same as radio row but checkbox right: 20px square, border-radius 4px, 1.5px `#9E9E9E` border. Checked: `#000000` bg + white `✓`.

---

### Screen 1 — Welcome

**Background:** full-bleed fashion editorial collage — multiple female models, luxury runway, high contrast. `object-fit: cover`. Dark overlay `rgba(0,0,0,0.35)` so card reads clearly.

**Card:**
```
FashionOS                                 ← Inter 13px 400 #616161

Welcome to
FashionOS                                 ← 36px 700 #000000 (larger on welcome only)

Build a complete AI-powered fashion
brand in minutes.                         ← 14px 400 #616161

[  Start  →  ]                           ← always enabled
```

No radio options. No affirmation. CTA label: `Start →`.

Below card (outside it): press logos row `Forbes  ·  TechCrunch  ·  Sifted` — Inter 12px 400 `#9E9E9E`, centered, 20px gap below card.

---

### Screen 2 — What are you building?

**Background:** editorial photo — runway close-up, luxury fabric texture.

**Card:**
```
What are you
building?

Choose one.                               ← 13px #616161

─────────────────────────────────────────
[img]  Fashion Brand                   ○
[img]  Clothing Label                  ○
[img]  Swimwear                        ○
[img]  Luxury Brand                    ○
[img]  Jewelry                         ○
[img]  Shoes                           ○
[img]  Bags                            ○
[img]  Beauty                          ○
[img]  Accessories                     ○
[img]  Other                           ○
─────────────────────────────────────────

[affirmation callout — after selection]

[Continue →]                             ← enables after selection
```

Images: small fashion editorial crops matching each option — Luxury Brand → couture gown detail, Shoes → product flat lay, etc. Source from `/app/design/images/`. Use `#F5F5F5` placeholder circle if image unavailable.

After selecting "Fashion Brand":
`✦ Fashion brands on FashionOS average 91% DNA accuracy in under 3 minutes.`

---

### Screen 3 — Tell us about your brand

**Background:** editorial — studio shoot, clean backdrop, model with product.

**Card:**
```
Tell us about
your brand

─────────────────────────────────────────
Brand name *
[                                        ]

Website  (optional)
[https://                                ]

Instagram
[@                                       ]

TikTok  (optional)
[@                                       ]
─────────────────────────────────────────

[Continue →]                             ← enables when Brand name filled
```

Inputs: height 48px, border-radius 8px, 1px `#E5E5E5` border, Inter 15px. Focus: 1.5px `#000000` border. Label: 13px 500 `#000000` above each input.

URL field — after typing, inline domain preview strip below input:
- `#F5F5F5` pill, border-radius 6px, 8px 12px padding
- Lucide `Globe` 13px `#9E9E9E` + `nike.com · 47 pages found · Apparel` 13px `#616161`
- Appears 400ms after typing stops (debounce), disappears if URL clears

---

### Screen 4 — What do you need help with?

**Background:** fashion campaign editorial — model in bold setting.

**Card:**
```
What do you need
help with?

Select all that apply.                    ← 13px #616161

─────────────────────────────────────────
☐  Brand DNA
☐  Product Photography
☐  Campaigns
☐  Social Content
☐  AI Models
☐  Ecommerce
☐  Marketplace
☐  Marketing
☐  Creative Direction
─────────────────────────────────────────

[affirmation — after ≥1 selection]

[Continue →]                             ← enables after ≥1 selection
```

After selecting 2+ items:
`✦ You've selected [n] areas — I'll prioritise these when building your Brand DNA.`

---

### Screen 5 — Choose your brand aesthetic

**Background:** solid `#000000` — the only screen with an intentionally dark, editorial mood.

**Card:**
```
Choose your
aesthetic

Which style defines your brand?          ← 13px #616161

─────────────────────────────────────────
[img]  Luxury                          ○
[img]  Minimal                         ○
[img]  Streetwear                      ○
[img]  Resort                          ○
[img]  Editorial                       ○
[img]  Scandinavian                    ○
[img]  Modern                          ○
[img]  Vintage                         ○
─────────────────────────────────────────

[affirmation]

[Continue →]
```

Images: 40px circle crops — Luxury → couture detail, Minimal → white space studio, Streetwear → street candid, Resort → beach editorial. Source from `/app/design/images/`.

After selecting "Luxury":
`✦ Luxury brands typically achieve the highest Brand DNA scores on FashionOS — strong foundation.`

---

### Screen 6 — Upload your brand assets

**Background:** editorial — product flat lay on clean surface.

**Card:**
```
Upload your
brand assets

Optional — skip if you don't have these yet.   ← 13px #616161

─────────────────────────────────────────

  ┌──────────────────────────────────┐
  │  ↑  Logo                         │
  │  Drop or tap · SVG, PNG, JPG     │
  └──────────────────────────────────┘

  ┌──────────────────────────────────┐
  │  ↑  Moodboard / Campaign photos  │
  │  Drop or tap · max 20MB          │
  └──────────────────────────────────┘

  ┌──────────────────────────────────┐
  │  ↑  Brand guide (PDF optional)   │
  └──────────────────────────────────┘

─────────────────────────────────────────

[Continue →]                             ← always enabled (all optional)

Skip for now                             ← ghost link below button, 13px #9E9E9E
```

Upload zones: `#FAFAFA` bg, 1px dashed `#E5E5E5`, border-radius 12px, 68px height. Icon: Lucide `Upload` 18px `#9E9E9E`. Uploaded: file name + Lucide `Check` 14px `#000000`.

---

### Screen 7 — Where is your brand listed?

**Background:** ecommerce editorial — product on device mockups.

**Card:**
```
Where is your
brand listed?

Select all that apply.                    ← 13px #616161

─────────────────────────────────────────
[I]   Instagram                        ☐
[Tk]  TikTok                           ☐
[S]   Shopify                          ☐
[♦]   My own website                   ☐
[A]   Amazon                           ☐
[E]   Etsy                             ☐
[e]   eBay                             ☐
[?]   Other                            ☐
─────────────────────────────────────────

Skip for now                             ← 13px #9E9E9E, below list

[Continue →]                             ← enables after ≥1 selection (or via Skip)
```

Platform glyphs: 28px circles, `#F5F5F5` bg, Inter monochrome letterforms — no external icon library.

---

### Screen 8 — Social proof (trust bridge before analysis)

**Background:** solid `#000000`.

**Card:**
```
"91% DNA accuracy
on the first scan."                       ← 22px 700 #000000, quote marks included

★★★★★  Aria M.                           ← stars #000000 filled, name 13px 500 #000000
Fashion Director, HAUS Studio             ← 12px 400 #9E9E9E

She uploaded 3 campaign photos and a
brand guide. FashionOS built a complete
Brand DNA in 90 seconds and scored her
visual identity at 91%.                   ← 13px 400 #616161

┌─────────────────────────────────────┐
│  [editorial fashion thumbnail]       │  ← 100% wide, 120px tall, object-fit cover,
│                              [91%]   │     border-radius 12px, score pill bottom-right
└─────────────────────────────────────┘

[Continue →]                             ← always enabled
```

Score pill: `#000000` bg, `#FFFFFF` 10px 500, border-radius 100px, 6px 12px padding.

Below card: `Forbes  ·  TechCrunch  ·  Sifted` — 12px `#9E9E9E` centered, 20px gap below card.

---

### Screen 9 — AI Analysis (full black — no card)

**This screen breaks the card pattern entirely.** Full `#000000` page. No card. No background photo.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ◀                    FashionOS                                              │
│  ████████████████████████████████ ████████████████ ░░░░░░░░░░░░             │
│                                                                              │
│                                                                              │
│              Building your Brand                                             │
│              DNA profile|                   ← #FFFFFF 28px 700, cursor blinks│
│                                                                              │
│   ✓  Website analysed                       ← #9E9E9E (done)                │
│   ✓  Instagram detected                     ← #9E9E9E (done)                │
│   ✓  Colours extracted                      ← #9E9E9E (done)                │
│   ···  Building Brand DNA…                  ← #FFFFFF current, pulsing      │
│   ○  Scoring visual identity                ← #2A2A2A (upcoming)            │
│   ○  Preparing recommendations              ← #2A2A2A (upcoming)            │
│                                                                              │
│  Analysing nike.com                                              85%         │
│  ████████████████████████████████████████████████████░░░░░░░░              │
└──────────────────────────────────────────────────────────────────────────────┘
```

- Headline: Inter 28px 700 `#FFFFFF`, centered in upper half of viewport
- Typing cursor `|` after headline: `#FFFFFF`, blinks 1s
- Checklist: Inter 13px, 48px from left edge. Items fade in 1 per 600ms
- Done items: `✓` `#FFFFFF` Lucide `Check` 12px + `#9E9E9E` text
- Current: `···` pulsing dots + `#FFFFFF` text
- Upcoming: `○` `#2A2A2A` + `#2A2A2A` text
- Bottom progress bar: 3px, full-width, `#FFFFFF` filled, `#2A2A2A` track, animated fill
- Task label bottom-left: `Analysing nike.com` Inter 13px `#9E9E9E`
- Percentage bottom-right: `85%` Inter 13px `#9E9E9E`
- No CTA button — auto-advances after 4 seconds (simulation)

---

### Screen 10 — Your Brand Intelligence is ready

**Background:** editorial — model in motion, high-contrast fashion photography. Overlay `rgba(0,0,0,0.3)`.

**Card:**
```
Your Brand DNA
is ready

nike.com · 47 pages · 90 seconds         ← 12px 400 #9E9E9E caption

─────────────────────────────────────────
                          DNA Score  87   ← 11px 500 #9E9E9E uppercase + 32px 700 #000000

████████░░  Brand       88
██████░░░░  Visual      72               ← label "72" in #B45309 amber (weakest pillar)
█████████░  Voice       94
███████░░░  Commerce    79
─────────────────────────────────────────
Strengths
Strong athlete lifestyle voice · Aspirational
tone · E-commerce presence

Opportunities
Visual consistency (72) · Brand tone
text density needs work
─────────────────────────────────────────

[  Open FashionOS  →  ]                  ← always enabled, goes to /app

Review before committing                 ← ghost link, 13px #616161, below button
```

Pillar bars: full-width, 6px, `#000000` filled, `#F0F0F0` track. Bars animate width 0 → final on screen enter (200ms ease-out staggered, 50ms between each).

`#B45309` amber on the weakest pillar score label only — the single colour exception in the entire flow.

---

### Generate all 10 screens as toggle-able views

HTML prototype requirements:
- Screen counter `3 / 10` visible below progress bar, centered, `#9E9E9E` 12px
- `← Back` and `Continue →` navigate between screens
- Screens 2, 5: radio selection → affirmation slides in → CTA enables
- Screens 4, 7: checkbox selection → affirmation slides in → CTA enables
- Screen 3: name input enables CTA; URL debounce shows domain preview strip
- Screen 6: drag-and-drop zones (show filename on drop)
- Screen 9: checklist items appear 1 per 600ms on enter; auto-advance at 4s
- Screen 10: pillar bars staggered entry animation
- Progress bar segments fill as user advances
- Mobile: card fills `calc(100% - 48px)` with `max-width: 480px`
- Keyboard: `Enter` advances if CTA enabled, `Escape` goes back

---

### Design tokens (B/W system — overrides FashionOS orange design system)

| Element | Value |
|---|---|
| Page bg | `#000000` (screens 5, 8, 9) or editorial photo |
| Card bg | `#FFFFFF` |
| Card border | `1px solid #E5E5E5` |
| Card radius | `24px` |
| Card padding | `32px` |
| Card max-width | `480px` |
| Headline | `#000000` Inter 700 26px |
| Subtext | `#616161` Inter 400 14px |
| Option label | `#000000` Inter 500 15px |
| Radio selected | `#000000` filled, white 8px dot |
| Radio border | `1.5px solid #9E9E9E` |
| Checkbox checked | `#000000` bg + white `✓` |
| Affirmation bg | `#F5F5F5` |
| Affirmation text | `#212121` Inter 400 13px |
| CTA bg | `#000000` |
| CTA text | `#FFFFFF` Inter 500 15px |
| CTA disabled bg | `#E5E5E5` |
| CTA disabled text | `#9E9E9E` |
| CTA radius | `100px` |
| CTA height | `52px` |
| Progress filled | `#000000` |
| Progress unfilled | `#E5E5E5` |
| Progress height | `3px` |
| Analysis bg | `#000000` |
| Analysis text | `#FFFFFF` |
| Analysis track | `#2A2A2A` |
| Weakest pillar | `#B45309` amber — ONLY colour exception |

---

### Rules for this screen

1. **Inter font throughout** — no Geist, no other typeface anywhere in the flow.
2. **Black + white only.** Single exception: `#B45309` amber on the weakest DNA pillar label on screen 10.
3. No gradients, no shadows, no beige, no orange from the FashionOS design system.
4. Card is always `max-width: 480px`, centered, floating on the background — never full-bleed.
5. **Screen 9 has no card.** Full `#000000` page, white type only.
6. Progress bar lives at the very top of the page — never inside the card.
7. Photography must be editorial fashion — female models, luxury apparel, studio/runway/ecommerce. Source `/app/design/images/`. Fallback: `#000000` solid.
8. Affirmation callout slides in **below the option list** after selection — it does not replace the list.
9. CTA is disabled until the screen's requirement is met. Screens 1, 6, 8 are always enabled.
10. `Skip for now` only appears on screens 3–7 — never on trust or analysis screens.
11. `[Open FashionOS →]` on screen 10 navigates to `/app` — the full operator shell.
12. The operator shell (NavSidebar, IntelligencePanel, 3-panel grid) never appears inside this flow.
