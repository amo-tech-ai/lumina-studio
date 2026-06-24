# Figma Make AI — Create a High-End Ecommerce Image Slider  
Design a **luxury, cinematic, and responsive image slider** for a fashion ecommerce studio website.  
This slider should feel premium, minimal, and editorial — similar to top fashion brands.

---

# 1. VISUAL STYLE  
- Clean white background with soft edges  
- Full-width carousel with centered vertical alignment  
- Editorial spacing (large margins, elegant breathing room)  
- Drop subtle shadow under each image card  
- Rounded corners: 8–12px  
- Neutral color palette (white, soft gray, black text)  

---

# 2. SLIDER LAYOUT  
Create a **horizontal track** containing **6–8 large rectangular image frames**, similar to:

- Fashion apparel photography  
- Jewellery photography  
- Still life product shots  
- Creative ecommerce photography  
- Watch close-ups  
- Model lifestyle shots  

**Each slide frame must include:**  
- Large image placeholder  
- Soft shadow  
- Clean inset padding  

Place left/right **arrow controls** outside the track, vertically centered.

---

# 3. ANIMATION & INTERACTIONS  
Apply **premium motion** that feels like a modern fashion brand:

### A. Autoplay Motion  
- Slow, smooth autoplay  
- Ease-in-out cubic-bezier (0.22, 1, 0.36, 1)  
- 6–7 seconds per slide  

### B. Hover on Slide  
- Slide lifts 4px  
- Shadow deepens  
- Slight image zoom (1 → 1.03)  
- Cursor becomes pointer  

### C. Drag Interaction  
- User can drag the slider on desktop  
- Swipe on mobile  
- Elastic feel when released  

### D. Arrow Controls  
- Fade in only when hovering over slider section  
- Animate with soft pulse on hover  

### E. Scroll Trigger  
When the slider comes into viewport:  
- Fade-in + slide-up 20px  
- Stagger appear for each slide frame (120ms stagger)  

---

# 4. RESPONSIVE RULES  
### Desktop  
- 5–6 images visible in horizontal track  
- Smooth wide spacing  

### Tablet  
- 3–4 images visible  
- Arrows move closer to edges  

### Mobile  
- 1 full-width image per slide  
- Swipe gestures enabled  
- Minimal padding  

---

# 5. COMPONENT STRUCTURE  
Generate the slider as components:

- `Slider.Container`  
- `Slider.Track`  
- `Slider.Slide` (each image card)  
- `Slider.ArrowLeft`  
- `Slider.ArrowRight`  
- `Slider.Indicators` (optional)  

Add **auto-layout** for easy adjustments.

---

# 6. IMAGE PLACEHOLDERS  
Use placeholders labeled:

- “Fashion Model Photography”  
- “Jewellery Close-Up”  
- “Still Life Creative Shot”  
- “Product Photography — Luxury Watch”  
- “Apparel Flat Lay”  
- “Ecommerce Brand Image”  

Each with 3:2 ratio.

---

# 7. FINAL OUTPUT  
Deliver:  
- Desktop, Tablet, and Mobile versions  
- Clean layers and naming  
- Animation notes documented in component descriptions  

The final slider must feel:  
**Luxury, premium, editorial, smooth, modern SaaS, fashion-forward.**
