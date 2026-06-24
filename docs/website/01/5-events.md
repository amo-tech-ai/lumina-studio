
---

## 🎨 **Lovable Prompt — FashionOS Event System UI/UX Design**

**Goal:**
Design a **beautiful, intelligent, and responsive event system** for FashionOS — a platform where users can discover, plan, and manage fashion events. The system should combine **AI search, ticketing, and media integration** with clean, editorial-style layouts and an intuitive flow.

---

### 🧩 **Main Pages to Design**

1. **Events Listing Page** (with filters + masonry cards)
2. **Event Detail Page** (overview, tickets, media, and sponsors)
3. **Create Event Wizard** (AI-powered 6-step flow)
4. **Event Dashboard** (for organizers)
5. **Ticket Purchase / Checkout Page**

---

### 🧱 **Page Layout & Components**

#### **1️⃣ Events Listing Page**

* **Header:** “Discover Fashion Events Near You”
  *Subline:* “AI-curated shows, exhibitions, and experiences — all in one place.”
* **Filters:**

  * Category (Runway, Pop-up, Workshop, Photoshoot)
  * Date Range
  * City
  * Ticket Price (slider)
  * Availability (Upcoming, Live, Past)
* **AI Copilot Search Bar:**
  *Placeholder:* “Find fashion shows in Medellín this weekend…”
* **Cards Layout:** Masonry grid of event cards (2–4 columns desktop, 1–2 mobile)

  * Hero image
  * Event title
  * Date + Venue
  * Tags (AI, Designer, Free Entry, etc.)
  * “Get Tickets” CTA button
* **Interactions:**

  * Hover = subtle zoom + gradient overlay
  * Filter chips animate as selected
  * Scroll-triggered fade-in transitions

---

#### **2️⃣ Event Detail Page**

**Hero Section**

* Full-width banner image (event cover)
* Overlay gradient with event title + date + CTA
* Buttons: “Book Tickets” / “Add to Calendar” / “Share”

**Sections**

1. **Event Overview:**

   * Short description + fashion industry context
   * *AI tagline suggestion example:*
     “A celebration of emerging designers redefining sustainable fashion.”
2. **Venue & Map:**

   * Interactive mini map
   * Venue details (capacity, amenities, directions)
3. **Schedule:**

   * Accordion-style list of sessions or fashion shows
4. **Ticketing Section:**

   * Cards for each tier (General, VIP, Press)
   * Quantity selector, price, and “Buy Now” CTA
5. **Gallery:**

   * Carousel of event photos and media (Cloudinary)
6. **Sponsors & Partners:**

   * Logo grid with hover captions
7. **Reviews & Ratings:**

   * 5-star average + social proof quotes
8. **Related Events:**

   * Horizontal scroll of similar or upcoming events

---

#### **3️⃣ Create Event Wizard**

* Based on the **6-stage CopilotKit state machine** (from your PRD):
  Event Basics → Venue → Schedule → Ticketing → Payments → Review & Publish
* **Smart Copywriting Example:**

  * “Name your event” → “What’s your show called?”
  * “Select venue” → “Choose your stage — real or virtual.”
* **Visual Style:**

  * Progress bar at top
  * Sidebar showing AI recommendations (venues, tags, description)
  * Real-time validation and auto-save
* **CTA Buttons:**

  * “Next Step” / “Preview Event” / “Publish Now”

---

#### **4️⃣ Event Dashboard (Organizer View)**

* **Cards:** Upcoming Events, Ticket Sales, Media Library, AI Insights
* **Graph Modules:** Revenue, Engagement, Attendance
* **Action Buttons:**

  * “Duplicate Event”
  * “Send WhatsApp Update”
  * “Add New Sponsor”
* **Sidebar Filters:** Active, Draft, Completed

---

#### **5️⃣ Ticket Purchase Page**

* **Checkout Steps:** Select Ticket → Login/Guest → Payment → Confirmation
* **Payment:** Stripe Connect (multi-party payouts)
* **Confirmation Message:**
  “You’re in! A WhatsApp message with your ticket has been sent.”
* **Visual Cue:** QR code preview and “Add to Wallet” button

---

### 🪄 **Design & Style Guidelines**

**Visual Style:**

* Editorial modern luxury (mix of white space and fashion imagery)
* Rounded corners (8–12px), light pastel palette (blush, cream, charcoal, gold accent)
* High-contrast serif headlines + geometric sans body
* Consistent spacing and hierarchy (64px desktop, 16px mobile gutters)

**Image Use:**

* Showcase real fashion moments — runway shots, designers, textiles, models
* Mix portrait (4:5) and landscape (16:9) for balance
* Maintain <150KB optimized images with lazy-load

---

### 💬 **Sample Copywriting & Taglines**

| Section         | Example Text                                                           |
| --------------- | ---------------------------------------------------------------------- |
| Hero            | “Plan your next show in minutes — powered by AI.”                      |
| Overview        | “FashionOS brings your creative vision to life — from idea to runway.” |
| CTA             | “Start Planning Now” / “Join the Directory” / “Book My Space”          |
| Gallery Caption | “Captured moments from last season’s top shows.”                       |
| Empty State     | “No events yet — your next masterpiece starts here.”                   |

---

### 📱 **Responsive Guidelines**

* **Desktop:** Split layouts (text + imagery) and multi-column grids
* **Tablet:** 2-column adaptive grids
* **Mobile:** Vertical stacking, carousels for tickets and related events
* **Performance:** Lazy-load non-critical images, compress hero images

---

### 🧭 **User Journey Summary**

1. Visitor explores events using AI filters.
2. Clicks on an event → reads details, views media.
3. Purchases ticket (Stripe flow).
4. Gets confirmation via WhatsApp + email.
5. Optionally shares or reviews the event.

---

### 🧠 **Lovable’s Job**

> Generate the complete **FashionOS Event System UI/UX**, including all five pages above.
>
> * Build layouts, structure, and content flow.
> * Include wireframes, flowcharts, and mobile + desktop variants.
> * Use placeholder content and imagery that fits a fashion event theme.
> * Focus on clarity, conversion, and elegance.
> * Match all typography, spacing, and color tokens from the existing FashionOS brand system.

---
