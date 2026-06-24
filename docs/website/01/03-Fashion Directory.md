 

---

## 🎯 **Lovable Prompt — FashionOS Fashion Directory UI/UX Design**

**Goal:**
Design a **beautiful, intelligent, and responsive Fashion Directory** for FashionOS that connects **designers, photographers, stylists, models, brands, and venues**.
The page should use a **modern, editorial layout** with clean grids, rounded image cards, balanced white space, and smart filters.

This directory will serve as the visual and functional hub where users can **discover, connect, and book fashion professionals or locations**.

---

### 🧭 **Page Structure & Content**

**1️⃣ Hero Section**

* Headline: “Discover the People Behind the Style.”
* Subtext: “Explore designers, photographers, models, brands, and venues — all in one place.”
* Search bar (centered): *Search by name, city, or category.*
* Background: light pastel gradient (lavender → cream) or blurred fashion imagery.
* Optional CTA buttons: “Join Directory” / “View All Categories.”

**Visual & Layout Notes:**

* Two-column split layout for hero (text + image grid).
* Image grid: fashion portraits, behind-the-scenes shots, runway scenes.
* Rounded image cards (12px radius) with subtle hover zoom effect.

---

**2️⃣ Filter Bar (Sticky Header Section)**

* Filters: **Category**, **City/Location**, **Experience Level**, **Availability**, **Style Tags**, **Rating**.
* Filter chips: rounded, soft pastel accents.
* Search bar integrated (AI CopilotKit auto-suggestions).
* Dropdowns collapse elegantly on mobile.
* Sticky on scroll with shadow and fade background.

**Functions & Interactions:**

* Multi-select filters with smooth animation.
* Real-time filter updates (Supabase backend integration).
* Reset filters button on right side.

---

**3️⃣ Main Directory Grid (Core Section)**

* Responsive card grid:

  * **Desktop:** 4 cards per row
  * **Tablet:** 2–3 cards
  * **Mobile:** 1 card per row
* Each **Profile Card** includes:

  * Circular portrait image
  * Name & title (e.g., “Maria Ortega – Designer”)
  * Tagline (e.g., “Sustainable Couture | Medellín”)
  * Quick-action buttons: “View Profile” / “Message”
  * Hover state: reveal short bio or sample gallery thumbnails.
  * Rating stars + location icon under name.

**Visual & UI Design:**

* Card corner radius: 12px
* Drop shadow (soft, 10–20% opacity)
* Image aspect: 4:5 portrait or 1:1 square
* Subtle gradient overlay on hover for accessibility

---

**4️⃣ Category Tabs Section**
Tabs across top (desktop) / scrollable bar (mobile):

* Designers | Photographers | Stylists | Models | Brands | Venues

Each tab dynamically filters the directory grid.
Use smooth sliding animation when switching tabs.

---

**5️⃣ Directory Profile Page (Dynamic Template)**
Each profile opens a detailed **Portfolio View**:

* Hero banner: user photo + overlay name and title.
* Tabs:

  1. **About** – Bio, city, years of experience, style focus.
  2. **Portfolio** – Image gallery grid with hover expand.
  3. **Services** – Pricing or offered packages.
  4. **Reviews** – 5-star system, short quotes.
  5. **Contact / Booking** – Form + WhatsApp link.

**Layout & Design:**

* Clean vertical flow; pastel section backgrounds alternating per block.
* Rounded gallery images, minimal icons, scroll reveal.

---

**6️⃣ Venue Directory Section**
Special layout for fashion venues:

* Card includes image banner, name, location, capacity, amenities icons.
* CTA: “Book Venue” or “View Details.”
* Interactive map integration (optional).

---

**7️⃣ AI Copilot Integration**
Smart search overlay powered by **CopilotKit AI**:

* Example input: “Find sustainable designers in Medellín available next month.”
* Returns matching cards and suggests similar results.
* Auto-completes tags and filters.

**Visual Behavior:**

* Floating AI search bar with pulsing animation.
* Hover tip: “Ask FashionOS Copilot.”

---

### 🧩 **Wireframe & Layout Overview**

| Section         | Layout                       | Components                                 |
| --------------- | ---------------------------- | ------------------------------------------ |
| Hero            | Split layout (text + images) | Headline, subtext, CTA, image grid         |
| Filters         | Sticky top bar               | Search field, dropdown filters, chips      |
| Directory Grid  | Masonry or standard grid     | Profile cards (responsive)                 |
| Profile Page    | Vertical scroll layout       | Tabs (About, Portfolio, Services, Reviews) |
| Venue Directory | Card grid + map view         | Venue cards with info and booking          |
| AI Assistant    | Floating modal               | Conversational search, suggestions         |

---

### 🎨 **Styling & Visual Identity**

* **Color Palette:**

  * Primary: Lavender `#EBDCFB`
  * Accent: Blush Pink `#FADADD`
  * Neutral: Charcoal `#1F1F1F`
  * Background: Porcelain White `#FAFAFA`

* **Typography:**

  * Headings: Playfair Display, Bold
  * Body: Inter, Regular/Medium
  * Buttons/Tags: Outfit, Semi-Bold, All Caps

* **Design Tokens:**

  * Border radius: 8–12px
  * Section spacing: 80px desktop, 48px mobile
  * Grid gutter: 24px desktop, 16px mobile
  * Button height: 48–56px

* **Imagery:**

  * Real editorial fashion portraits, behind-the-scenes photography, neutral tones.
  * Balanced brightness to match pastel palette.

---

### 📱 **Responsive Design**

**Desktop:**

* Split hero, 4-column grid, sticky filters.
  **Tablet:**
* 2–3 cards per row, collapsible filters.
  **Mobile:**
* 1-column stack, hero compresses vertically.
* Filters turn into dropdowns.
* Floating “AI Search” bar at bottom.

---

### 🔗 **User Journey & Flow**

1. User lands on **Directory Home** → sees hero section + quick search.
2. User selects a **Category Tab** (e.g., Designers).
3. User refines search via **Filters** (e.g., “Location: Medellín,” “Style: Couture”).
4. User clicks a **Profile Card** → opens **Profile Page**.
5. From profile, user can:

   * View **Portfolio** images.
   * Book or contact via WhatsApp.
   * Leave a **Review** or Rating.
6. CopilotKit provides suggestions or related profiles dynamically.

**Interconnections:**

* Directory ↔ Profile ↔ Venue Booking ↔ Event Planner.
* Marketplace and Event modules pull from same profile data (Supabase sync).

---

### 🪄 **Instruction to Lovable**

> Please generate the complete **FashionOS Fashion Directory UI/UX Design**, including the following:
>
> * Hero section with search and image grid
> * Sticky filter bar and responsive directory grid
> * Profile card components for Designers, Photographers, Stylists, Brands, and Venues
> * Dynamic profile page wireframe (About, Portfolio, Services, Reviews, Contact)
> * Venue directory layout with booking CTA
> * CopilotKit AI search interaction
> * Full wireframe diagram, section flow, and user journey map
> * Mobile and desktop responsive layouts
>
> **Lovable’s Job:**
>
> * Create visually consistent layouts with rounded image cards and bright color accents.
> * Use clean spacing, readable typography, and editorial-style imagery.
> * Build section structure with placeholder content and consistent components.
> * Deliver diagrams or flowcharts showing how users navigate from search → profile → booking.
>
> Focus on **clarity, functionality, and elegant simplicity** matching the existing FashionOS UI aesthetic.

---

