 

---

# ⭐ **MEGA PROMPT — Clothing Photography Page (Figma + Google Studio AI)**

### *Paste this directly. It contains structure, style, animations, copy, and developer specifications.*

---

````markdown
# MEGA PROMPT — CREATE FULL HIGH-FIDELITY "CLOTHING PHOTOGRAPHY" PAGE  
### For Figma Make AI + Google Studio AI  
Generate a **luxury, editorial, modern SaaS-style page** for a Clothing Photography service.  
Include:  
- Full responsive layout (desktop, tablet, mobile)  
- High-fidelity imagery direction  
- Illustrated elements  
- Motion specification  
- Flowchart of photography steps  
- UX copy (provided below)  
- Color palette  
- Developer notes  
- Component structure  
- Animation logic  
- Premium typography + spacing  

------------------------------------------------------------------

# 1. GLOBAL STYLE + ART DIRECTION

### Visual Style
Use an aesthetic that blends:
- **Luxury editorial fashion**
- **Modern SaaS clarity**
- **Soft gradients**
- **Glassmorphism accents**
- **Cinematic spacing**

### Color Palette
Use these tones:
- Soft Ivory: #F7F5F3  
- Champagne Rose: #F6E9E4  
- Lavender Mist: #EDE7FF  
- Powder Violet: #D7D6F5  
- Deep Charcoal: #111111  
- Pure White (glassmorphism overlay): rgba(255,255,255,0.15)  
- Metallic Gold Accent: #E5D7A4  

### Typography
- **Headings:** Editorial Serif (e.g., Playfair Display, Spectral)  
- **Body:** Modern Sans (e.g., Inter, Neue Haas, Söhne)  
- Balance large cinematic spacing with tight content rhythm.

### Imagery Direction
Use:
- High-end fashion photography  
- Rich blacks, strong shadows  
- Pops of color for apparel  
- Macro detail shots  
- Studio-lit ghost mannequin imagery  
- Still-life accessories  

---

# 2. PAGE LAYOUT — SECTION BY SECTION

Rebuild the full page structure inspired by the reference:

---

## Section 1 — HERO  
- Large editorial title: **"Clothing Photography."**  
- Subtitle: **Clothing and accessory photography that delivers results.**  
- Subtext categories: Creative // Pinned // Ghost Mannequin  
- CTA button: “Get a Quote”  
- Right side: hero collage with 3–5 fashion imagery blocks  
- Soft animated gradients behind images  
- Add micro parallax on images  

---

## Section 2 — BRAND TRUST STATEMENT  
Title: **20+ Years of Clothing Photography. Trusted by Leading Fashion Brands.**  
Paragraph:  
“At Blend Studios, we specialise in premium clothing and accessory photography tailored to the needs of fashion and retail brands…”  
- Add two-column layout with image collage on right  
- Clean editorial spacing  

---

## Section 3 — CATEGORY GRID  
Create 5 service blocks with imagery + text:  
- **Ghost Mannequin**  
- **Clothing Flats**  
- **Apparel Still Life**  
- **Details**  
- **Accessories**  

Each block:  
- Illustrated icon or subtle 3D card header  
- Fashion-photo thumbnail  
- Title + description (use UX copy below)  
- Hover lift + glow  

---

## Section 4 — WHY CHOOSE US  
Create a 2-row grid with 6 feature cards:  
- Specialist Fashion Studio  
- Consistent Quality, Every Time  
- Experienced Friendly Team  
- In-House Retouching  
- Top-tier Studio Facilities  
- Fast Turnarounds  

Each card includes:  
- Minimal icon  
- Title  
- Short microcopy  
- Hover microinteraction  

---

## Section 5 — FEATURED IMAGE BLOCK  
Large full-width editorial shot (bag example).  
Text overlay: bold serif headline.  

---

## Section 6 — TESTIMONIALS  
Carousel layout  
- Clean serif quotes  
- Customer name + title  
- Subtle slide/fade transitions  

---

## Section 7 — FAQ ACCORDION  
Clothing Ghost Mannequin & Flats FAQs  
- 8–10 accordion items  
- Smooth expand/collapse  
- Soft border radiuses  

---

## Section 8 — LOGO STRIP  
Grid of brands (Selfridges, Dune, North Face, etc.)  
Use grayscale logos to keep premium feel.  

---

## Section 9 — “Invisible Mannequin – The Process”  
Large cinematic hero explaining the ghost mannequin technique.  
Add overlay text + soft vignette.  

---

## Section 10 — Behind the Scenes  
Grid of studio shots (4–6)  
Add small captions  
Use parallax or slow zoom on hover  

---

## Section 11 — Footer  
3-column minimal layout  
- Logo  
- Menu links  
- Contact info  
- Social icons  

Use deep charcoal background.

------------------------------------------------------------------

# 3. UX COPYWRITING (USE EXACT WORDING)

Insert the full provided text from the Clothing Photography description.  
Make type hierarchy clean and easy to skim.

------------------------------------------------------------------

# 4. FLOWCHART — PRODUCT PHOTOGRAPHY PROCESS  
Create a premium flowchart with **6 illustrated steps**:

### STEPS (include icons + illustrations)
1. Product Intake  
2. Creative Direction  
3. Studio Setup  
4. Photography  
5. Retouching & Post  
6. Final Delivery  

### Design Requirements
- Curved animated connector lines  
- Dots traveling across paths  
- Glassmorphism panels  
- Scroll-triggered reveal  

### Mermaid version (developer-ready)
```mermaid
flowchart LR
    A[Product Intake] --> B[Creative Direction]
    B --> C[Studio Setup]
    C --> D[Photography]
    D --> E[Retouching & Post]
    E --> F[Delivery]

    subgraph KPIs
        K1(Quality)
        K2(Turnaround)
        K3(Consistency)
        K4(Accuracy)
    end

    D --> K1
    E --> K4
    F --> K2
    B --> K3
````

---

# 5. MOTION SPECIFICATION (DEVELOPER-READY)

### On Scroll

* Title fade-in + slide-up
* Images parallax
* Cards stagger reveal (100ms per card)
* Connector lines draw one-by-one

### On Hover

* Card scale: 1 → 1.04
* Glow: subtle gradient
* Icon pulse: scale 1 → 1.08

### Charts (if included)

* Circular arcs animate from 0% → final value

### Buttons

* Gradient sweep on hover
* Arrow icon micro-slide (4px)

---

# 6. COMPONENTS TO GENERATE

* Section wrappers
* Content blocks
* Image collage component
* Service card component
* Testimonial card
* Flowchart card
* FAQ accordion
* Logo strip
* Footer grid

Each should be grouped and named cleanly.

---

# 7. RESPONSIVE RULES

* Mobile: stack vertically, remove parallax
* Tablet: reduce spacing, 2-column grids convert to stacked
* Desktop: full cinematic spacing

---

# 8. OUTPUT REQUIREMENTS

Deliver:

* Desktop frame
* Tablet frame
* Mobile frame
* High-fidelity components
* Animation notes inside layer descriptions
* No lorem ipsum — use the provided real UX copy
* Visual hierarchy should be premium, modern, and editorial

---

# GOAL

The final result must feel:
**Luxury fashion. Editorial. Intelligent. Cinematic. Modern SaaS. Developer-ready.**

```
 