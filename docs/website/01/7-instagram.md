 Instagram Services Page (Premium FashionOS Style)
Create a **clean, luxury, high-end Instagram Services page** inspired by modern editorial brands and FashionOS design quality.

Remove/ignore any sidebar menu. Produce **full-width responsive layouts** for Desktop + Mobile.

Use:
- Editorial typography (Playfair Display + Inter)
- Premium spacing + large gutters
- High-end photography and social-media imagery
- Rounded cards, soft shadows, clean UI dividers
- Light neutral palette (cream, sand, charcoal, soft blue accents)

Make the design feel **fashion-forward, professional, and conversion-optimized.**

---

# 1. HERO SECTION
Design a premium hero layout with:
- Left side: Large headline

**“Instagram Content That Drives Reach, Trust & Sales.”**
Supporting text:
“High-impact visuals that stop the scroll, grow your brand, and convert viewers into buyers.”

- CTA buttons:
  - **Primary:** “Start Your Instagram Project”
  - **Ghost:** “View Portfolio”

- Right side: Collage of fashion and lifestyle images (vertical stack, subtle rotation, soft shadow)

Optional animation cues:
- Images slide upward slightly on hover
- CTA buttons with micro-hover lift effect

---

# 2. VALUE SECTION — “The Power of Visuals”
Two-column editorial layout.

Left column: Bullet stats with icons
- Reels deliver up to 3× higher reach than static posts  
- High-quality visuals boost purchase intent by 58%  
- 70% of shoppers use Instagram to discover new products  
- Video posts generate 49% more interactions  
- Instagram Shops improve conversions by up to 30%

Right column: Card titled **“Better Content = Better Results.”**
Microcopy explaining benefits.
Include a before/after image frame.

---

# 3. PHOTOGRAPHY SECTION — “Instagram Photography”
Create a **6-card responsive grid** (3x2 desktop, single column mobile).

Each card includes:
- Image block  
- Title  
- Micro-description  

Include these cards:
1. Product Photography  
2. Lifestyle Photography  
3. Lookbook Shoots  
4. Styled Flatlays  
5. Influencer-Style UGC  
6. Model Photography

Design notes:
- Rounded corners  
- Soft beige background  
- Elegant spacing  
- Hover lift + soft glow  

---

# 4. VIDEO SECTION — “Instagram Video”
Create a **high-impact 2×3 vertical card set** with tall video thumbnails.

Cards:
- Reels Production  
- Stories Video  
- Product Demos  
- UGC-Style Videos  
- Carousel Video  
- Ads Video  

Use:
- Subtle glossy overlays  
- Play button icon centered  
- Gradient fade for titles  

---

# 5. FORMAT SECTION — “Built for Every Format”
Horizontal pill-style icons showing:
- Single Posts  
- Carousels  
- Reels  
- Stories  
- Shop Photos  

Below, add four checkmark feature rows:
- Optimized crop ratios  
- Mobile-first grading  
- Trend-aware creative  
- Compression-safe delivery  

---

# 6. SHOP CONTENT SECTION — “Content That Fuels Instagram Shops & Sales”
Left side:
Bullet list of benefits:
- Increase product page engagement  
- Improve tap-through rates  
- Reduce buyer hesitation  
- Drive more saves and shares  
- Strengthen brand identity  

Right side:
Mockup of Instagram Shop product frame (phone-style container).

---

# 7. PORTFOLIO SECTION — “See the Results for Yourself”
Grid of 8 fashion/lifestyle images (2 rows × 4 columns).
Use:
- Large spacing  
- Rounded corners  
- Hover zoom effect  

---

# 8. FEATURES STRIP
Four evenly spaced feature cards:
- Expert Creative Direction  
- Brand Consistency  
- Fast Delivery  
- Built for Ecommerce  

Simple icons above titles.

---

# 9. TESTIMONIAL SECTION
Centered blockquote:
**“Our Instagram engagement increased by 40% after switching to FashionOS content. It's night and day.”**  
— Elena R., Founder, The Modern Edit

Use soft gradient background.

---

# 10. CONTACT FORM — “Let’s Create Content That Sells.”
Form fields:
- Name  
- Email  
- Instagram Handle  
- Website  
- Message  
CTA button: **Start My Instagram Project**

Clean white card with shadow.

---

# 11. FOOTER
Minimal footer with 4 columns:
- About  
- Services  
- Directory  
- Contact  

Typography: small, clean, high contrast.

---

# OUTPUT REQUIREMENTS
- Desktop + Mobile versions
- Group layers clearly (Hero, Photography, Video, Formats, Shop, Portfolio)
- Use auto layout
- Add animation notes for devs
 
Add route for 
Add   to the  dropdown navigation.
 include a direct link to  page footer

Apply the following motion system to the existing **Instagram Services** layout (no sidebar).

### 0. Global Motion System

- Duration: `220–380ms` for most UI motions, `450–650ms` for large scroll reveals
    
- Easing: `easeOutQuint` / `easeOutCubic` for entrances, `easeInOut` for state changes
    
- Stagger: `60–90ms` between sibling elements (cards, bullets, stats)
    
- Max transform: scale `0.96–1.02`, translate Y `8–40px` (keep motion subtle)
    
- Reduced motion: if user prefers reduced motion, **disable transforms** and only use opacity changes.
    

---

## 1. Scroll-Based Animation Spec

### 1.1 Hero – “Instagram Content That Drives Reach, Trust & Sales”

**On page load (first viewport):**

- Headline + subcopy:
    
    - Start: `opacity: 0`, `translateY: 24px`
        
    - End: `opacity: 1`, `translateY: 0` (280ms, easeOut)
        
- CTAs:
    
    - Staggered by `80ms`, scale from `0.96 → 1` and fade in
        
- Hero collage (right side images):
    
    - Parallax: slow upward movement (`translateY: +10px` while scrolling down hero)
        
    - Slight rotation reset on scroll (`rotate: -2° → 0°`)
        

### 1.2 “The Power of Visuals” Section

- Section container: fade in + `translateY: 32px → 0` when 20% visible.
    
- Stat bullets:
    
    - Count-up animation (0 → final value) over 800ms
        
    - Icon + text staggered vertically.
        

### 1.3 “Instagram Photography” Card Grid

- As section enters viewport:
    
    - Row 1 cards slide up (`Y: 40px → 0`, opacity `0 → 1`) with `80ms` stagger
        
    - Row 2 follows with same timing.
        
- On scroll back up, animation should not replay aggressively—only once per session or with light replay.
    

### 1.4 “Instagram Video” – Reels-Style Vertical Transitions

For the tall video cards:

- As user scrolls, whichever card is **closest to center** of viewport becomes “active”:
    
    - Active card: `scale: 1`, `opacity: 1`, subtle glow border
        
    - Inactive cards: `scale: 0.95`, `opacity: 0.6`
        
- Snap feeling: use gentle scroll-snapping hint (cards slow as they reach center).
    
- Play icon on active card: slight pulsing scale `0.96 ↔ 1` (slow, 1.8s loop).
    

### 1.5 “Built for Every Format”

- Format chips (Single Posts, Carousels, Reels, etc.):
    
    - Slide in from alternating sides (left/right) with `translateX: 32px → 0`, `opacity: 0 → 1`.
        
- Feature rows below (Optimized Crop Ratios, etc.):
    
    - Fade-in + small upward translation, grouped as a block.
        

### 1.6 “Content That Fuels Instagram Shops & Sales”

- Left bullet list: standard fade-up.
    
- Right phone mockup:
    
    - Scroll-driven content mask: as user scrolls this section, the “feed” inside the phone slowly moves upward (`translateY: 0 → -40px`) to simulate vertical scrolling.
        

### 1.7 Portfolio Grid – “See the Results for Yourself”

- Grid appears with staggered zoom-in:
    
    - Each tile: `scale: 0.96 → 1`, `opacity: 0 → 1`, stagger `60ms`.
        

### 1.8 Testimonial Strip

- Background gradient subtly shifts on scroll (y-position of gradient moves 5–10%).
    
- Quote + avatar fade in together.
    

### 1.9 Contact Form – “Let’s Create Content That Sells”

- Form card rises slightly as it enters viewport:
    
    - `translateY: 32px → 0`, `opacity: 0 → 1`.
        
- CTA button gains a soft shadow / glow only after full section is visible.
    

---

## 2. Hover Motion Rules

### 2.1 Cards (Photography, Video, Feature, Portfolio)

On hover (desktop):

- `translateY: -6px`
    
- `box-shadow`: stronger, soft spread (luxury, not harsh)
    
- `scale: 1.01` max
    
- Image: slight brightness increase (`+5–8%`)
    
- Text: no movement, just subtle color shift for title.
    

### 2.2 Buttons

Primary button hover:

- Background: from solid navy/ink → slightly lighter / gradient
    
- `scale: 1.02`, `translateY: -2px`
    
- Shadow: soft elevation; duration ~160ms
    
- Focus state: add clear outline or inner glow.
    

Ghost button hover:

- Border becomes more prominent; background gains 6–8% tint.
    

### 2.3 Links & Chips

- Underline slide animation: underline grows from center to full width.
    
- Color change to highlight tone.
    

---

## 3. Reels-Style Vertical Transitions (Detail)

For **Instagram Video** section:

- Cards stacked in two columns on desktop, single column on mobile.
    
- As user scrolls, use a **“spotlight”** behavior:
    
    - Card entering center:
        
        - `scale: 0.94 → 1`
            
        - `opacity: 0.6 → 1`
            
        - Background behind text becomes slightly darker to mimic Reels UI.
            
    - Card leaving center: reverse the animation.
        
- Optional: add a very subtle background blur behind the active card (like an overlay).
    

---

## 4. Glassmorphism Overlays

Use glassmorphism in a few key places (not everywhere):

1. **Metrics/Badges Overlay** in hero (“+40% engagement”, “High-Performing Reels” etc.)
    
    - Semi-transparent white panel (`background: rgba(255,255,255,0.12)`)
        
    - `backdrop-filter: blur(16px)`
        
    - Soft border (`rgba(255,255,255,0.25)`)
        
2. **Active Video Card Overlay**
    
    - Glass panel at bottom with title + length (e.g., “Reels Production · 15s–30s”)
        
3. **Testimonial Bubble**
    
    - Glass card over a darker gradient strip.
        

Make sure text contrast remains AA-compliant.

---

## 5. Hero Collage Animation (Detail)

- On load:
    
    - Backmost image: fade in first (`opacity 0 → 1`, `Y: 24px → 0`)
        
    - Middle image: slight delay (80ms), `Y: 32px → 0`
        
    - Foreground image: last, with slight `scale: 0.95 → 1`
        
- On hover over collage (desktop):
    
    - Entire cluster tilts (`rotateX: 2°`, `rotateY: -3°`)
        
    - Each image moves `2–4px` differently to create parallax.
        
- On scroll:
    
    - Very gentle parallax offset (`translateY` a few pixels relative to scroll) to keep the hero feeling alive.
        

---

## 6. Dev Notes (Implementation-Hints)

If needed for dev handoff, suggest:

- Use **Framer Motion** or similar library for React/Vue, or CSS `@keyframes + intersection observer`.
    
- Centralize timing + easing tokens:
    
    - `--motion-fast: 180ms`, `--motion-normal: 260ms`, `--motion-slow: 360ms`
        
- Respect `prefers-reduced-motion: reduce` by disabling transforms and only animating opacity.