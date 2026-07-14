# Claude Design Prompt — Channel Preview (`/app/preview`)

**Screen:** Channel Preview — see brand assets rendered in real platform contexts (IG, TikTok, Amazon, Shopify).
**Route:** `/app/preview`
**Agent:** `visual-identity` *(reconciled — README/plan updated to match)*

Paste after the universal prompt from `prompts/00-universal.md`.

---

## Prompt (copy everything below this line)

---

Design the **Channel Preview** screen (`/app/preview`) for iPix / FashionOS.

### Layout

Standard 3-panel shell:

```
grid-template-columns: auto  minmax(0, 1fr)  auto
                        ↑          ↑              ↑
                    NavSidebar  Workspace   IntelligencePanel
```

Active nav item: Preview (Lucide `Monitor` icon, `var(--color-text-primary)`).
Workspace header: `Channel Preview › Nike` — breadcrumb `var(--font-size-sm)` `var(--color-text-muted)`.

---

### NavSidebar — Left panel

Identical to other screens. Preview nav item highlighted. Active state is a calm thin-grey: `--nav-item-active` light-grey fill + `--nav-item-active-text` charcoal label + charcoal icon. No orange, no heavy highlight.

---

### Workspace — Center panel

**Agent greeting card:**
- `Spring Lookbook assets ready for preview. IG feed score: 91% DNA. TikTok cover: 74% — I can suggest a better crop.`
- `var(--color-bg-subtle)` bg, 1px `var(--color-border)`, `var(--card-radius)`, `var(--font-size-sm)`

**Quick-action chips:**
1. `Preview all channels`
2. `Fix TikTok crop`
3. `Export for production`

**Platform selector** (horizontal row of channel tabs, below chips):

```
[IG Feed]  [IG Story]  [TikTok]  [Amazon]  [Shopify]
```

Each tab is a `<Button variant="outline" size="sm">` with platform glyph left (16px icon) + label. Active tab: `#000000` bg `#FFFFFF` text, `#000000` border. Inactive: white bg, `var(--color-border)`.

Platform glyphs (use CSS/SVG inline — no external icon library):
- IG Feed: circle with small circle inside (Instagram camera glyph)
- IG Story: vertical gradient bar (approximated)
- TikTok: music note
- Amazon: arrow underline
- Shopify: shopping bag

---

#### Active platform: IG Feed

**Device frame** (center of workspace):

Phone frame — vertical, approx 390×844px proportional (CSS border-based mock, not an image):
- Outer border: 2px `var(--color-border)`, radius 40px
- Screen area: `var(--color-bg-card)` bg

Inside the screen: IG post mockup:
```
┌────────────────────────────────┐
│  [N]  Nike  ···                │   ← username row
│                                │
│  ████████████████████████████  │
│  ████████████████████████████  │
│  ████████████████████████████  │
│  ██████  ASSET IMAGE  ████████  │
│  ████████████████████████████  │
│  ████████████████████████████  │
│                                │
│  ♡  💬  ↗           ⊕         │   ← action row
│  1,204 likes                   │
│  nike  Just do it. Spring '26  │   ← caption
└────────────────────────────────┘
```

The asset image area fills with `var(--color-bg-subtle)` placeholder (or image if provided). Square crop.
All chrome (username, icons, likes, caption) uses `var(--font-size-xs)` Inter, `var(--color-text-primary)`.

**DNA overlay badge** (top-right corner of device frame, outside the phone):
- `91% DNA` pill — `var(--font-size-xs)` Geist Mono — `var(--dna-bar-high)` bg white text, `var(--card-radius)`

**Crop/format controls** (below device frame, centered):
```
Format: [Square 1:1 ▾]    Zoom: [–]  100%  [+]
```
`<Select>` for format (Square 1:1, Portrait 4:5, Landscape 16:9). Zoom buttons ghost sm. `var(--font-size-sm)`.

---

#### Active platform: IG Story

Taller vertical frame (9:16) — same border treatment. Story chrome:
- Username top-left, progress bar strip at very top
- Asset fills full frame (no crop controls visible — story always fills)
- `91% DNA` badge bottom-right

---

#### Active platform: TikTok

Same 9:16 frame. TikTok chrome:
- Username, description, hashtags bottom-left
- Side rail: heart, comment, share, sound icons right
- DNA overlay: `74%` amber (`var(--dna-bar-mid)`) — flag this as low

---

#### Active platform: Amazon

Horizontal desktop-style frame (16:9 wide):
- Product listing mockup: asset left (square), product name + price + `Add to cart` right
- DNA overlay: `88%` `var(--dna-bar-high)`

---

#### Active platform: Shopify

Desktop frame (16:9):
- Product page: hero asset top, product details below
- DNA overlay: `92%` `var(--dna-bar-high)`

---

**AI Chat Dock** (pinned to bottom of center workspace — always present):
- Context-aware greeting: names active platform, asset, and next action — e.g. "You're previewing Shot 3 on TikTok. DNA is 74% — I can suggest a 9:16 crop that brings it to ~89%." Never "How can I help?".
- Quick-action chips (3–5): thin grey, context-specific, minimal line icons.
- Streaming status: live steps — green check = done, pulsing dot = active, faint dot = pending. Never a spinner.
- Input: full-width "Ask about this preview…" placeholder, mic icon left, black send button right.
- Style: white bg, 1px `var(--color-border)` top border, Inter, black actions. No orange, no gradients.

---

### IntelligencePanel — Right panel

Platform-specific DNA breakdown for the selected channel. Always white. 320px.

**Panel header:**
- `IG Feed` — `var(--font-size-base)` `var(--font-weight-semibold)` + platform glyph
- `Nike` chip `var(--font-size-xs)` `var(--color-bg-subtle)`

**Channel DNA score:**

Score: `91` `var(--font-size-display)` Geist Mono `var(--font-weight-bold)` `var(--dna-bar-high)` color. Label "IG Feed DNA" muted.

Full-width bar: 91%, 6px.

Channel-specific pillar breakdown:
```
Composition   ████████░  92   --dna-bar-high
Aspect ratio  █████████  98   --dna-bar-high  ← 1:1 optimal
Colour tone   █████████  94   --dna-bar-high
Text density  ████░░░░░  58   --dna-bar-low   ← too much text
```

Text density row flagged: amber dot + label in `var(--dna-bar-mid)`. Suggestion appears below.

Divider.

**AI suggestion (channel-specific):**

Lucide `Sparkles` 14px `var(--color-text-primary)` + `Text density is low (58%). Remove caption text from asset and let copy handle the message.` `var(--font-size-sm)` `var(--color-text-secondary)`.

`[Apply fix]` ghost sm Button `var(--color-text-primary)` → triggers inline HITL.

Divider.

**Asset info:**
```
Asset       Spring Lookbook, Shot 3
Format      JPEG · 4000×5000px
Crop        Square (auto)
File size   4.2 MB
```
`var(--font-size-xs)` label + `var(--font-size-sm)` value.

Divider.

**Export section:**

Label "Export" `var(--font-size-xs)` uppercase muted.
- `[Export for IG Feed]` `<Button variant="default" size="sm">` full-width `var(--color-text-primary)` bg
- `[Export all channels]` `<Button variant="outline" size="sm">` full-width

**Panel tabs** (sticky bottom):
`DNA | Suggestions | Export` — `<Tabs>`. Active: black underline (`var(--color-text-primary)`).

---

### Generate all 5 states

**State 1 — IG Feed, asset loaded, score 91%** (as above)

**State 2 — TikTok selected, low DNA (74%):**
- Device frame shows TikTok chrome
- DNA overlay badge: `74%` `var(--dna-bar-mid)` amber
- Right panel: score 74 in amber, Text density pillar flagged red (43%), AI suggestion: `Crop is too wide for TikTok. Switch to 9:16 portrait — DNA improves to est. 89%.`
- `[Fix crop]` ghost Button in right panel → triggers HITL

**State 3 — HITL: crop fix** (operator clicked `[Apply fix]`):
Center workspace (above device frame) shows ApprovalCard:

```
┌──────────────────────────────────────────────────────────┐
│ ● TikTok Crop Adjustment               89% confidence     │
├───────────────────────┬──────────────────────────────────┤
│ Before                │ After (AI crop)                  │
│ 1:1 square            │ 9:16 portrait, subject centred   │
│ DNA: 74%              │ est. DNA: 89%                    │
├───────────────────────┴──────────────────────────────────┤
│ Based on TikTok DNA spec                                 │
│                                                          │
│  [Approve crop]   [Adjust manually]   [Keep original]    │
└──────────────────────────────────────────────────────────┘
```

Required elements: amber status dot + title, before/after diff (two columns), confidence %, evidence source, `[Approve crop]` (black fill) + `[Adjust manually]` (outline) + `[Keep original]` (ghost).

**State 4 — Loading:**
- Center: skeleton greeting + skeleton platform tabs + skeleton device frame (placeholder outline, shimmer inner fill)
- Right panel: skeleton score (32px) + 4 skeleton bars + 2 skeleton text rows

**State 5 — Error** (asset load failed):
- Device frame: Lucide `ImageOff` 32px muted centered + `Asset couldn't load` `var(--font-size-sm)` `var(--color-text-muted)` + `[Try again]` ghost Button
- Right panel: DNA sections hidden — shows `Asset unavailable` message

---

### Design tokens

| Element | Token |
|---|---|
| Page bg | `var(--color-bg-page)` |
| Device frame border | `var(--color-border)` |
| Device screen bg | `var(--color-bg-card)` |
| DNA high overlay | `var(--dna-bar-high)` |
| DNA mid overlay | `var(--dna-bar-mid)` |
| DNA low overlay | `var(--dna-bar-low)` |
| Platform tab active | `#000000` bg `#FFFFFF` text |
| Platform tab inactive | `var(--color-border)` |
| Nav active fill | `--nav-item-active` |
| Nav active text | `--nav-item-active-text` |
| HITL card border | `var(--approval-border)` (amber 1px) |
| HITL card bg | `var(--approval-bg)` (white) |
| Asset placeholder | `var(--color-bg-subtle)` |

---

### Rules for this screen

1. Device frames are CSS-border mocks — never image assets. Phone outline = border-radius 40px + 2px border `var(--color-border)`.
2. Platform chrome (IG action row, TikTok side rail) uses minimal representation — recognisable but not photorealistic.
3. DNA overlay badge is always outside the device frame — never obstructing the preview.
4. Switching platform tabs updates the device frame aspect ratio, the chrome, and the right panel score simultaneously.
5. Low DNA channels (< 80) are visually flagged: amber overlay badge + right panel shows the weakest pillar in amber/red.
6. Crop and format controls only appear for platforms where cropping is relevant (IG Feed, Amazon). Story and TikTok always fill.
7. The HITL crop adjustment card (state 3) always shows before/after with estimated DNA improvement — never just "crop applied".
8. `[Export for [platform]]` always names the active platform in the button label — never a generic "Export".
9. Platform glyphs are inline CSS/SVG — no external icon library for platform logos.
10. The right panel tabs (DNA / Suggestions / Export) mirror the natural operator workflow for this screen: assess → fix → ship.
11. Real fashion photography from `/app/design/images/` fills the device frame asset area. Do not use placeholder divs if images are available.

---

### Output format

Full-page HTML prototype:
- All 5 states as toggle-able views
- Platform tab switching changes: device frame aspect ratio + internal chrome + right panel content + DNA score
- Device frames built with CSS border only — no external images
- Asset fill area uses `var(--color-bg-subtle)` placeholder
- DNA overlay badge positioned absolutely outside the frame top-right
- HITL card appears above the device frame on crop action
- Mobile at `max-width: 1024px`: right panel hidden, platform tabs scroll horizontally, device frame scales to fit width
