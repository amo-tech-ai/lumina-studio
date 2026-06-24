---
feature: thumbnails/external/a76caeb48752e8052c7208d1181e52e3.failed.png
thumbnail: thumbnails/resized/cccbf14100c5bd7d33c65e5d46ce3612_86cf658e.webp
---
## Prompts & Visual Reference for the Organizer Dashboard (Lovable)

![Image](https://cdn.dribbble.com/userupload/23436747/file/original-665dd685526f63ead9b7607435aecad9.png?format=webp\&resize=400x300\&vertical=center)

![Image](https://elements-resized.envatousercontent.com/elements-cover-images/c28c4516-e81b-4aa7-91d4-0fb032c98d78?cf_fit=scale-down\&format=auto\&q=85\&s=1fdcafe98c0a95302564a7e41ade7404c16b60ec73cb5c6dcd6c10c3816d4014\&w=433)

![Image](https://www.slideteam.net/wp/wp-content/uploads/2024/01/SLA-dashboard-illustrating-ticket-incident-and-service-request.png)

Here’s a **clean natural-language prompt** you can paste into Lovable to generate the **Dashboard view for event creators/organizers** in your EventOS platform — where they manage schedules, ticket sales, WhatsApp updates, and more.
It follows best-practice dashboard design guidelines (structure, clarity, hierarchy) from UI/UX sources. ([Justinmind |][1])

---

### 🎯 Prompt: EventOS Organizer Dashboard UI/UX Design

**Goal:**
Design a **responsive Organizer Dashboard** for EventOS where event creators manage all key workflows: schedule, ticketing, WhatsApp updates, analytics, and vendor/venue coordination — all in one centralized control panel.

---

### 🎨 Overall Look & Feel

* Visual style: Clean, modern, mission-control vibe. Use some of the colours and editorial feel of the main FashionOS brand (pastels + charcoal) but with a more structured dashboard layout.
* Layout: Sidebar navigation + top header + main content area with cards, charts, tables.
* Typography: Same as main brand (serif for titles, sans for body) for consistency.
* Mood: Professional, actionable, calm — organizer feels in control.
* Tone: “Your event dashboard — one screen, endless command.”

---

### 🧩 Dashboard Structure & Components

**1. Sidebar Navigation**

* Items: *Overview, Events, Schedule, Ticketing, Attendees, Vendors, WhatsApp, Analytics, Settings.*
* Collapsible sidebar for mobile.
* Icon + label for each item.

**2. Top Header**

* Event selector (dropdown to switch between events).
* Quick-action button: “Create New Event”.
* Notification bell, user profile avatar, settings gear.

**3. Overview / Home Tab**

* Hero KPIs at top: *Total Tickets Sold*, *Revenue*, *Attendees Checked-in*, *WhatsApp Messages Sent* (4 large cards).
* Below: Quick links to upcoming events, recent activity feed (vendor bookings, ticket refunds, message logs).

**4. Schedule Tab**

* Interactive timeline / calendar view of event agenda.
* Drag-and-drop sessions: time slots, speakers/designers, venue rooms.
* Sidebar with list of sessions, ability to add session, assign host, set room.

**5. Ticketing Tab**

* Ticket types table: *General, VIP, Press*, showing quantity, sold, remaining, revenue.
* Button “Create Ticket Type”.
* Chart showing ticket sales over time (line or bar).
* Integration: “Send WhatsApp Reminder” button next to each ticket type for automatic message flows.

**6. WhatsApp Tab**

* List of message templates (e.g., “Your ticket is confirmed”, “Reminder: Show starts in 24h”).
* Button “Send new message” opens modal: select recipients (All ticket holders, VIPs, Press), choose template, schedule send.
* Activity feed: messages sent, open rate, click-through rate.

**7. Vendors & Venue Tab**

* Directory table: vendors/venue entries, status (booked/available), contact details, contract status.
* Filter by category (photographer, catering, lighting, venue).
* Button “Add Vendor” and “Match with AI” (invokes CopilotKit logic to match best vendor for budget and date).

**8. Analytics Tab**

* Dashboard of visualizations: Revenue vs target, attendee demographics pie chart, vendor spend table, WhatsApp message performance.
* Export to CSV or share as report.
* Filters: date range (pre-event, live, post-event).

**9. Create New Event Modal**

* Form fields: *Event Name, Date, Venue*, *Expected Attendees*, *Ticket Types*, *Budget*.
* Step-by-step wizard: Venue selection (suggested by AI), vendor matching, ticketing setup, WhatsApp message scheduling.
* Progress bar across steps.

---

### 📱 Responsive Behavior

* Mobile: Sidebar collapses to top-hamburger. Cards stack vertically. Timeline becomes list view.
* Tablet: Two-column layout for cards/charts.
* Desktop: Full grid view; charts and tables side by side.

---

### 👥 User Journey (Organizer)

1. Organizer logs in → lands on Overview → sees KPIs.
2. Switches to “Create New Event” → fills wizard → launches event.
3. Goes to Schedule → assigns sessions & vendors.
4. Goes to Ticketing → monitors sales, sends WhatsApp reminder.
5. Uses Analytics → views post-event revenue, attendee breakdown, vendor ROI.

---

### 🪄 Instruction to Lovable

> Use this prompt to build the **Organizer Dashboard UI/UX for EventOS**. Include all tabs, components, wireframes, responsive states (desktop/tablet/mobile), and high-level flow diagrams. Use the visual guidelines and structure outlined above.

---

Would you like me to **generate a version of this prompt specifically tailored for mobile-first design** (with mobile-UI mockups and interactions)?

[1]: https://www.justinmind.com/ui-design/dashboard-design-best-practices-ux?utm_source=chatgpt.com "Dashboard Design: best practices and examples - Justinmind"
