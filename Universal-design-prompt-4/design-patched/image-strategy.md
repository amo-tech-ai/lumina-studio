# FashionOS — Image-First Strategy & Per-Screen Audit

> Companion to `DESIGN.md` §5H/§5I and `redesign-spec.md`. Direction = **v3 "Zeely Editorial"**: pure white / grey / black chrome, Inter type, and large **editorial fashion photography** doing the visual work. This doc reviews **every screen** and says exactly where images replace icons, text-heavy layouts, or empty white space — without sacrificing fast scanning or enterprise usability.

**Do not copy any benchmark's branding or layouts.** Extract the principle: image-first cards, large previews, editorial galleries, neutral chrome.

---

## Subject & sourcing rules (non-negotiable)

- **Subject:** **female models wearing apparel** — high-fashion / editorial photography. The work the platform produces.
- **Never:** random stock images, illustrations, cartoons, office/corporate/business photos, abstract gradients, **glamour or nude imagery**, or anything unrelated to fashion.
- **Source:** **prefer the project's uploaded images** (`app/design/images`); fall back to tasteful editorial fashion mock photography only when none exist.
- **Tone:** editorial, not glamour — apparel and styling are the subject, shot like a magazine.

---

## Why the editorial direction feels premium (the 6 levers)

1. **Photography is the hero.** Cards are previews, not icon tiles. The eye lands on real fashion images first.
2. **Neutral chrome.** Pure white / grey / black UI (Inter type) recedes so the imagery supplies the colour and richness.
3. **One consistent frame.** Every thumbnail shares radius (20px), ratio, and `cover` cropping — instant order.
4. **Generous whitespace.** Images breathe; nothing is crammed. Calm = expensive.
5. **Status shown, not spelled.** A cover, a portrait, a swatch strip, a match chip on the image — visual at a glance.
6. **Large previews before commitment.** AI outputs are shown big and uncropped; you approve what you see.

---

## Global image system (applies everywhere)

- **Frame:** `--image-radius` 20px (large) / `--image-radius-sm` 10px (inline), 1px `--image-border` on white, `object-fit: cover`.
- **Subject:** editorial fashion photography of female models in apparel (see subject rules above) — never icons, stock, or illustration for content objects.
- **Ratios by type:** brand/campaign 16:9 · model 3:4 · product 1:1 · shoot 4:3 · venue 3:2 · asset 1:1 or native · AI social 4:5 · AI story 9:16.
- **Image card:** full-bleed image on top → title + quiet metadata below on white → status chip on the image corner.
- **Overlay text:** only with `--image-scrim`; keep it to title + one tag.
- **Placeholder:** neutral `--image-placeholder-bg` + small camera glyph; loading = aspect-ratio skeleton (never a spinner, never broken-image).
- **Hover:** image zoom 1.02 inside a fixed frame, or a quiet action bar; reduced-motion safe.
- **Real assets:** prototypes use `<image-slot>` drop targets; ship with the project's uploaded editorial fashion photography (`app/design/images`), never random stock or lorem-grey.

---

## Global AI chat dock (applies to every operator screen)

Every operator screen carries a persistent, context-aware **AI chat dock** at the **bottom of the center workspace** (see `DESIGN.md` §5I). It is image-aware where relevant — its greeting can reference the active brand/shoot/campaign/asset and its quick actions surface visual outputs (e.g. "Generate shot list," "Improve visuals"), streaming live progress with thumbnails rather than a spinner. Pure white, hairline top border, Inter, black send button. Never overlaps the IntelligencePanel.

---

## Per-screen audit

Legend: 🖼 = add/enlarge imagery · ✂️ = replace icon/text · ⬜ = fill dead white space.

### 01 · Command Center (`/app`)
- 🖼 **Active-brand context card** → add the brand's hero image (16:9) as the card's left visual, not just a name + score.
- 🖼 **Quick-action chips** stay text (fast scan), but the **greeting card** gains a small thumbnail strip of the 3 most recent visual outputs.
- ✂️ **Approval stack** → each ApprovalCard shows a **thumbnail of what's being approved** (DNA palette strip, the draft caption's paired image, the shot-list cover) beside the diff.
- ⬜ Below the fold, an **"Recent work" moodboard row** (justified thumbnails of latest assets/AI outputs) fills the empty workspace and reinforces momentum.
- Keep: DNA bars, mono numerals, neutral panel.
- 💬 **AI chat dock** at the base of the workspace greets with the active brand + pending count and surfaces visual quick-actions.

### 02 · Brand List (`/app/brand`)
- ✂️ **Replace icon/text rows with image-first `BrandCard`s:** brand hero/logo lockup (16:9 cover) on top → brand name, DNA score (mono), status chip below.
- 🖼 Card hover reveals a **2–3 thumbnail peek** of the brand's top assets.
- ⬜ Empty state → a **faded sample BrandCard** ("Your brands will appear here") instead of a generic layers icon.
- Status by image: a low-DNA brand shows a muted/!-flagged cover; `active` chip on the cover corner.

### 03 · Brand Detail (`/app/brand/[id]`)
- 🖼 **Header band:** large brand hero (16:9) with the logo lockup — replaces the plain breadcrumb-only top.
- ✂️ **DNA "Visual" pillar** → pair the score with a **palette/imagery swatch strip** (the brand's actual colours + 3 sample frames) so "Visual 72" is *seen*.
- 🖼 **Assets section** in the right panel already uses thumbnails — enlarge to a 3-wide moodboard with match chips on each.
- 🖼 **HITL DNA draft** → when the change is visual (photography style), show **before/after as two image strips**, not two text columns.
- ⬜ Profile section gains a small reference-image row beneath the text excerpt.

### 04 · Shoots List (`/app/shoots`)
- ✂️ **`ShootCard` = cover-image-first** (4:3 cover) → shoot name, date (mono), status chip, DNA badge below. No icon tiles.
- 🖼 Status by image: `planning` cover is a desaturated/mockup frame; `complete` shows the hero final.
- ⬜ Empty state → a **faded sample shoot cover** + "Plan your first shoot," with the agent's suggestion line.
- Filter chips above the grid (not a toolbar of icons).

### 05 · Shoot Wizard (`/app/shoots/new`)
- 🖼 **Each step is visual:** location step = venue cards (3:2 photos); model step = casting grid (3:4 portraits); shot-list = reference thumbnails per shot.
- ✂️ Replace bullet shot-lists with a **shot grid** — each row carries a reference image.
- 🖼 **Budget/deliverable approval cards** show the deliverable's preview frame.
- ⬜ Wizard side rail shows a **live moodboard** of choices made so far.

### 06 · Campaigns (`/app/campaigns`)
- ✂️ **`CampaignCard` = 16:9 cover-first** → name, date range (mono), deliverables count, status. No icon-led rows.
- 🖼 Card shows a **stacked thumbnail count** ("+8") of campaign deliverables on the cover.
- 🖼 Right-panel Creative Director brief → next-deliverable **preview thumbnail**.
- ⬜ Empty state → faded sample campaign cover + CTA.

### 07 · Assets (`/app/assets`)
- 🖼 **This is the gallery screen.** Masonry/justified grid of `AssetCard`s — native ratios, generous gaps, creative-tool feel (not a table).
- ✂️ Replace any list/table view default with the **grid**; table is an optional secondary view.
- 🖼 **DNA match shown on the image** (corner chip, colour by score); selection = checked overlay on the image; bulk-action bar floats.
- 🖼 Right-panel selected-asset detail → large preview + EXIF + match suggestions as thumbnails.
- ⬜ Empty state → a **faded 6-up asset moodboard** + "Upload your first assets / let AI discover them."

### 08 · Onboarding — Brand Setup (`/app/onboarding`)
- 🖼 **Step 2 (crawling)** → show **live thumbnails of pages/images being pulled** alongside the progress text, not just a counter.
- 🖼 **Step 3 (DNA draft)** → present the drafted DNA as a **moodboard** (palette + sample imagery + type) — visual, reviewable.
- ✂️ **Step 4 HITL** → before/after DNA diff includes the **visual identity strip**, not only text fields.
- ⬜ Full-width wizard uses a large brand-hero placeholder that fills as the crawl resolves.

### 09 · Matching (`/app/matching`)
- 🖼 **Swipe-card variant = full-bleed portrait/cover** (model 3:4, venue 3:2, designer lookbook) — the match *is* the image.
- ✂️ Table variant keeps a **leading thumbnail column** so rows stay visual.
- 🖼 Match quality shown as a chip on the image; saved = overlay check.
- ⬜ Empty state → a faded sample match card.

### 10 · Channel Preview (`/app/preview`)
- 🖼 **Device frames render the actual creative** at platform ratios (9:16 story, 4:5 feed, 1:1) — the screen is inherently image-led; enlarge frames, reduce surrounding chrome.
- ✂️ Replace platform **icon rows** with small **rendered-thumbnail tabs** (each platform shows its framed preview).
- ⬜ Generous neutral stage around the device frames so the creative is the focus.

---

## Cross-cutting: imagery communicates status / quality / progress

| Signal | Image treatment |
|---|---|
| Brand health | hero cover quality + DNA palette strip; weak brand = muted cover + flag |
| Shoot status | `planning` = desaturated mock cover · `active` = WIP frame · `complete` = hero final |
| Asset DNA match | colour-coded chip on the image corner (green/amber/red) |
| AI draft pending | large preview card + amber hairline (HITL), not a text blob |
| Approved | preview card border → green + check |
| Progress (crawl/render) | live thumbnails appearing + text counter, not a spinner |
| Selection | checked overlay on the image |

---

## Components to add / upgrade for the image-first system

| Component | Note | Effort |
|---|---|---|
| `ImageThumb` | base framed image (radius, ratio, cover, placeholder, skeleton, scrim) | S |
| `MediaCard` | image-first card (image + metadata + corner status chip) — base for Brand/Shoot/Campaign/Asset/Model/Venue cards | M |
| `AIPreviewCard` | large uncropped AI output + ApprovalCard beneath | M |
| `Moodboard` | justified/masonry mixed-ratio collage (DNA visuals, references, recent work) | M |
| `AssetGallery` | filterable masonry grid + selection overlay + floating bulk bar | M |
| `CastingGrid` / `VenueGrid` | portrait / location card grids for the wizard + matching | S |
| `PaletteStrip` | brand colour + sample-imagery swatch row for DNA Visual pillar | S |
| `EmptyPreview` | faded realistic editorial mockup for empty states (replaces icon-only empties) | S |
| `AIChatDock` | persistent context-aware chat at the base of the workspace (greeting + quick chips + streaming status + black send) | M |

All extend `ui/card.tsx` / use `ImageThumb`; all use the image tokens in `tokens.css`.

---

## Guardrails (so it stays enterprise-fast, not heavy)

- Text-dense, scan-critical views (tables, filters, settings) **stay text** — imagery is for content objects, not chrome.
- One image frame standard everywhere; no mixed radii or ratios within a grid.
- Lazy-load and aspect-ratio skeletons so image-heavy grids stay fast.
- Never let decorative imagery push primary actions below the fold.
- Accessibility: every meaningful image has alt text; status is **also** a label/chip, never colour-on-image alone.
