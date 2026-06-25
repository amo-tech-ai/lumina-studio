---
id: SHOOT-RESEARCH-001
title: "Booking Marketplace Research — Competitive Scan, Feature Matrix, Agent Catalog"
version: "1.0"
status: Research / input to PRD
date: "2026-06-21"
owner: Product + Engineering
scope: "AI-native marketplace for booking studios · photographers · locations · equipment · stylists · models"
feeds:
  - docs/shoot/prd-shoot.md           # shoot execution PRD (sibling)
  - docs/shoot/prompt-plan.md          # marketplace audit brief (this research answers Deliverables 1–2, 4, 6)
  - docs/shoot/00-ai-native-shoot-system.md
method: "Direct WebFetch of vendor pages + WebSearch fallback where hosts 403'd. Vendor claims are marketing, not verified capability."
---

# Booking Marketplace Research

## 0. Purpose & scope

iPix is extending past Brand Intelligence + shoot execution into a **two-sided creative
booking marketplace**: brands book **studios, photographers, locations, equipment, stylists,
and models**, AI-native from day one (humans decide, AI assists, nothing books silently).

This doc reads the shared competitive set and distills:
1. A **platform landscape** (what each tool is, AI, pricing, relevance).
2. A **CORE vs ADVANCED feature matrix** for the marketplace.
3. **Booking workflows** (the lifecycle every vertical shares).
4. The **AI agent catalog** (inputs/outputs/tools, core vs advanced), mapped to the iPix
   Mastra + CopilotKit v2 stack.
5. **Build-on repo** guidance.
6. A **strategic recommendation**.

**Boundary:** this is the *marketplace/booking* track. Production execution (wizard, shot
list, DNA) lives in the sibling PRD `prd-shoot.md`. The seam between them is the **brief →
creator-match → book → shoot** handoff (§5, §8).

> **Method caveat.** Some vendor hosts blocked direct fetch and were read via search snippets.
> Pricing and "AI" claims are vendor-stated; treat figures as directional. Items reconstructed
> from search are flagged where it matters. cal.com licensing has a live risk (see §5).

---

## 1. Platform landscape

Grades are iPix-relevance (how much we should learn from / build on them), not product quality.

| Platform | Category | What it is | AI | Pricing model | iPix relevance | Grade |
|---|---|---|---|---|---|---|
| **Seekda** | AI booking (hotels) | Agentic booking engine grounded in **live inventory** that *completes* the transaction + recovers abandoned bookings; cross-channel (chat→phone→web) | Agentic, inventory-grounded chatbot + voice; abandoned-booking recovery | Demo/sales (hospitality SaaS) | **Closest architecture** to emulate | **A** |
| **GoPickle** | Photographer studio mgmt | Multi-event bookings with per-event **location/time/deliverables/crew**, staged payments, branded galleries | AI face-recognition galleries; conflict alerts; smart reminders | Freemium | **Closest data model** to a shoot | **A** |
| **Anolla** | Studio mgmt | Multi-room/booth booking for recording/photo/dance studios; **equipment inventory + kit allocation**, role-based access | 24/7 AI assistant (25 langs, ~79% inquiry resolution), dynamic pricing, predictive occupancy | Free + pay-as-you-go + Plus (per-room) | High — equipment + room model | **A−** |
| **Citaflow** | AI booking (local services) | Appointment platform with **AI voice receptionist** (ES/EN) + chatbot; resource mgmt (staff/rooms/equipment) | Inbound AI voice books+confirms; WhatsApp/Telegram chatbot w/ human-approval | €29/mo + AI add-ons (chat €12–109, voice €30–170); Stripe Connect | High — inbound capture + Stripe Connect pattern | **A−** |
| **Lunacal** | AI scheduling (photographers) | Branded booking page, round-robin/collective, travel buffers, intake questionnaires | **AI voice agent** for reminder calls + NL reschedule/cancel | $9 / $15 / $25 per user/mo | High — photographer scheduling + voice reschedule | **B+** |
| **Spacebring** | Studio/coworking mgmt | Self-service room **+ equipment rental** booking, subscriptions/credits/day passes, access control, white-label apps, multi-location | "Lem AI" (under-described) | SaaS (opaque); 500+ spaces / 50+ countries | High — equipment rental + access control + memberships | **B+** |
| **StudioDock** | Studio booking | Hourly-rental photo studios; pricing rules/overtime/buffers; **add-ons (lights/backdrops/assistants) at checkout**; 0% platform fee | None | Fixed subscription, 0% platform fees | Medium-high — add-on checkout boosts AOV (€65→€100) | **B+** |
| **Booking Pro AI** | AI booking (salon/spa) | AI receptionist across phone/WhatsApp/SMS/web (50+ langs); POS/CRM/inventory/payroll | Multi-channel voice + chat receptionist | Free tier + month-to-month | Medium — multi-channel agent reference | **B** |
| **BookingSoftware.AI** | AI booking (charters) | AI **voice** agents (inbound+outbound), **auto-matching** flexible-date customers into full trips, payment-chase/waitlist backfill | Conversational voice; auto-matching; payment automation | Performance-based; 30-day trial | Medium — group-matching + payment-chase logic | **B** |
| **Spaceti** | AI workplace booking | NL resource booking (desks/rooms) with clarifying questions + **policy enforcement**; analytics advisor | NL→availability→confirm; policy guard | Enterprise SaaS | Medium — NL interaction design + policy guard | **B** |
| **Fotostudio.io** | Photographer business platform | CRM/invoice/contract/gallery/gift cards; **AI does actions via MCP** (Claude/ChatGPT/Mistral) | MCP agent that performs business actions (estimates, contracts, reports) | Free 2-mo trial; paid (opaque) | Medium — MCP "AI that does things" pattern | **B** |
| **cal.com / cal.diy** | Open-source scheduling | MIT (⚠️ tightening) Next.js + Postgres + Prisma scheduling **engine**: event types, calendar sync, webhooks (`BOOKING_*`), API v2 | Docs for building agents on the API | Self-host (OSS) / cloud | **Strongest build-on base** for the scheduling primitive | **B+ (with caveat)** |
| **MotoPress roundup tools** | Photographer SaaS | Pixieset, Studio Ninja, ShootProof, Sprout Studio, Iris Works, Light Blue, VSCO, Dubsado, Bloom, Appointment Booking | Mostly templated automation; no true AI | $7–35/mo | Low-medium — feature checklist for galleries/contracts | **C+** |
| **RationalGo / Figma Make** | AI app *builders* | Generate a booking+gallery app from a prompt (build-time, not a runtime engine) | Build-time generation | Free tier+ | Low — feature checklist only; iPix owns its app | **C** |

**One-line takeaways**
- **No competitor is AI-native end-to-end.** AI tools bolt voice/chat onto conventional booking; studio CRMs have deep features but zero AI.
- **None is a true two-sided creative marketplace** → brief→creator matching on Brand DNA is iPix's defensible, uncopied differentiator.
- **Seekda** (agentic, inventory-grounded, recovers carts) + **GoPickle** (multi-event/crew data model) + **cal.com** (scheduling engine) are the three references to triangulate.

---

## 2. Feature matrix — CORE vs ADVANCED

CORE = required for a credible v1 marketplace. ADVANCED = differentiating / fast-follow.
"Seen in" cites where the pattern is proven.

### 2.1 Marketplace & vendor management
| Feature | Tier | Seen in |
|---|---|---|
| Two-sided marketplace (brand demand ↔ creator supply) | **CORE** | (none — iPix gap to own) |
| Vendor profiles + portfolios (photographer/studio/model/stylist) | **CORE** | GoPickle, Lunacal, ShootProof |
| Search & filter by type/location/style/price/availability | **CORE** | Anolla, StudioDock |
| Reviews & ratings | **CORE** | Studio CRMs |
| Brief → creator **matching** (Brand-DNA scored) | **CORE** (differentiator) | (iPix-only) |
| Vendor onboarding / KYC / verification | ADVANCED | BookingSoftware.AI (crew rosters) |
| Multi-vendor cart (book studio + photographer + model together) | ADVANCED | StudioDock (add-ons) |
| Vendor payout / Stripe **Connect** split | ADVANCED (CORE before launch) | Citaflow (Connect, single-tenant) |

### 2.2 Booking & scheduling
| Feature | Tier | Seen in |
|---|---|---|
| Booking page / time-slot picker | **CORE** | all |
| 2-way calendar sync (Google/Outlook/Apple) | **CORE** | Lunacal, Citaflow, cal.com |
| Availability rules / event/session types | **CORE** | Lunacal, cal.com, Anolla |
| Double-booking prevention / conflict alerts | **CORE** | Anolla, GoPickle |
| Auto-confirm vs accept/reject | **CORE** | Planfy |
| Reschedule / cancel (self-serve) | **CORE** | all |
| Reminders — email/SMS/WhatsApp | **CORE** | Citaflow, Lunacal, Planfy |
| Buffers / setup-teardown / travel time | **CORE** for shoots | Anolla, Lunacal |
| Round-robin / collective / group booking | ADVANCED | Lunacal |
| Multi-event booking (per-event location/time/crew/deliverables) | **CORE** for shoots | **GoPickle** |
| Recurring bookings / repeat profiles | ADVANCED | Anolla |

### 2.3 Resource types (the six verticals)
| Resource | Key fields/needs | Tier | Seen in |
|---|---|---|---|
| **Studios** | rooms/booths, hourly rate, overtime, amenities, multi-location | **CORE** | Anolla, StudioDock, Spacebring |
| **Photographers** | session types, specialty, day/hourly rate, portfolio, contracts | **CORE** | GoPickle, Lunacal, studio CRMs |
| **Equipment** | inventory/kit allocation, per-item availability, rental add-ons | **CORE** | Anolla, Spacebring, StudioDock |
| **Locations** | geo/scouting, permits, day rate, travel buffers, gallery | ADVANCED | (gap — Lunacal travel buffers only) |
| **Stylists** | portfolio, specialty, rate, kit, availability | ADVANCED | (gap — generic vendor record) |
| **Models** | measurements/sizing, portfolio, day rate, **usage rights/release**, availability | ADVANCED | (gap — usage rights uncovered) |

> **Insight:** studios + equipment + photographers are well-served by existing tools and map
> cleanly to CORE. **Locations, stylists, and models are underserved** — especially **model
> usage-rights/release tracking**, which *no* surveyed tool handles. That's white space iPix
> can own, but it can stay ADVANCED for v1.

### 2.4 Payments
| Feature | Tier | Seen in |
|---|---|---|
| Deposits / partial prepay at booking | **CORE** | Citaflow, Lunacal, Planfy |
| Stripe / PayPal in booking flow | **CORE** | Lunacal, Citaflow |
| Packages / bundles | **CORE** | Lunacal, StudioDock add-ons |
| Stripe **Connect** marketplace split + payouts | ADVANCED (CORE before launch) | Citaflow |
| Invoices / quotes / contracts e-sign | ADVANCED | studio CRMs, Fotostudio |
| Commission-free / funds-direct-to-bank | ADVANCED | Citaflow, StudioDock (0% fee) |
| Gift cards / loyalty / credits / day passes | ADVANCED | Spacebring, Fotostudio |

### 2.5 Creative-production & delivery (bridge to `prd-shoot.md`)
| Feature | Tier | Seen in |
|---|---|---|
| Intake questionnaire / brief capture | **CORE** | Lunacal, studio CRMs |
| Shot list / shoot plan | **CORE** (shoot PRD) | iPix shoot system |
| Crew assignment per shoot | **CORE** for shoots | GoPickle |
| Proofing galleries / asset delivery | ADVANCED | GoPickle, ShootProof, Pixieset |
| DNA / brand-compliance scoring of assets | **CORE** (iPix) | iPix-only |
| Contracts / call sheets / production package | ADVANCED | studio CRMs |

### 2.6 AI layer
| Feature | Tier | Seen in |
|---|---|---|
| Conversational booking (chat) grounded in live availability | **CORE** | Seekda, Booking Pro AI |
| Brief→creator matching / recommendations | **CORE** (differentiator) | (iPix-only) |
| Abandoned-booking recovery / follow-up | ADVANCED | Seekda |
| AI voice receptionist (inbound) | ADVANCED | Citaflow, Booking Pro AI |
| AI voice agent (outbound reminders + NL reschedule) | ADVANCED | Lunacal, BookingSoftware.AI |
| Dynamic pricing / best-offer | ADVANCED | Anolla, Seekda |
| Policy/compliance guard on bookings | ADVANCED | Spaceti |
| No-show risk prediction | ADVANCED | (claimed by none; white space) |

---

## 3. Booking lifecycle workflows

Every vertical shares one spine; AI augments each step (always behind HITL for writes).

```
Discover ─→ Brief/Intake ─→ Match ─→ Availability ─→ Propose ─→ Approve(HITL)
   └─ search/filter, portfolios
                                                        ↓
Confirm ─→ Deposit/Pay ─→ Calendar sync ─→ Reminders ─→ Shoot(prd-shoot.md)
                                                        ↓
Deliver galleries ─→ DNA score ─→ Invoice/payout ─→ Review ─→ Performance loop
```

**Reference patterns proven in the field**
1. **Conversational book** (Seekda/Booking Pro): user asks in chat → agent queries live
   inventory → proposes slots/creators → on confirm, holds + collects deposit + confirms.
2. **Brief → match → book** (iPix-unique): brand submits brief → matching agent ranks creators
   by Brand DNA + budget + style → operator picks → booking flow.
3. **Inbound capture** (Citaflow): missed call/chat → AI receptionist qualifies shoot type →
   checks availability → books → links payment.
4. **Reduce no-show** (Lunacal): automated reminders + AI voice call with NL reschedule.
5. **Payment-completion loop** (BookingSoftware.AI): hold → request deposit/balance → drop
   non-payers, backfill from waitlist until confirmed.
6. **Multi-resource shoot** (GoPickle): one booking spans studio + photographer + crew +
   equipment, each with its own time/location/deliverables and staged payments.
7. **Post-shoot delivery** (GoPickle/ShootProof): publish proofing gallery → favorites/orders
   → review request → feeds performance loop.

---

## 4. AI agent catalog

Mapped to the iPix stack: **Mastra** owns agent/tool/workflow orchestration; **CopilotKit v2**
owns visible context + rendered artifacts + HITL; **Supabase Edge** functions are secure tool
wrappers. Every write-capable agent gates on human approval (the shipped `*_drafts` pattern).

| Agent | Tier | Inputs | Outputs | Tools |
|---|---|---|---|---|
| **Conversational Booking Agent** | CORE | NL request, brand, scope, date range | Proposed slots/creators, ready-to-confirm booking | availability search, hold-slot, calendar sync, intent parse |
| **Availability Search Agent** | CORE | NL constraints (date, type, location, amenities, budget) | Ranked available creators/slots | inventory/calendar query, filter engine |
| **Matching / Recommendation Agent** ⭐ | CORE (moat) | Brief, **Brand DNA**, budget, style, location | Ranked creator/package suggestions + rationale | portfolio index, vector search, scoring, brand-DNA lookup |
| **Scheduling / Orchestration Agent** | CORE | Confirmed booking, crew/asset/studio calendars, rules | Conflict-free reservation + multi-resource assignment | double-booking check, calendar write, reschedule, round-robin |
| **Payments Agent** | CORE | Booking, deposit policy, payer status | Payment request, confirmation, (waitlist backfill) | Stripe/Connect charge, reminder send |
| **Intake / Brief Agent** | CORE | Session brief, style prefs, questionnaire | Structured brief draft (HITL) | form capture, brand-intake reuse |
| **Notification Agent** | CORE | Booking events, client+crew contacts | Confirmations, reminders, review requests | email/SMS/WhatsApp send |
| **Lead Capture Agent** | CORE | Enquiry from portfolio/site | CRM lead, auto-reply, draft quote | CRM write, template responder |
| **Follow-up / Recovery Agent** | ADV | Abandoned/incomplete booking | Personalized nudge, resume link | sequence scheduler, send |
| **Inbound Receptionist Agent** (voice) | ADV | Inbound call/chat | Qualified+booked appointment | voice/IVR, availability, book |
| **Pricing Agent** | ADV | Inventory, demand, rate rules, scope | Suggested rate/best offer | rate-rules engine, demand signals |
| **Policy Guard Agent** | ADV | Proposed booking, marketplace rules | Approve/block + reason | rules engine |
| **Delivery / Gallery Agent** | ADV | Deliverables, client access | Proofing gallery, orders | gallery store, access control |
| **Risk / No-show Agent** | ADV | Booking + client history | Risk score → deposit/overbook action | history features, scoring |

⭐ The **Matching/Recommendation Agent** is the only agent none of the 13 competitors have. It
is iPix's defensible advantage because it reuses Brand Intelligence (Brand DNA) that the
marketplace players have no equivalent of. Make it CORE and excellent.

**Relationship to the shoot system:** the marketplace's CORE agents *precede* the shoot
system's `production-planner`. Flow: marketplace agents (discover→match→book) → handoff →
`production-planner` (plan→shot list→execute→DNA). Keep them as distinct Mastra agents sharing
brand context, not one mega-agent.

---

## 5. Build-on repos

| Repo / base | Use for | Tier | Caveat |
|---|---|---|---|
| **cal.com / cal.diy** | Scheduling primitive — event types, calendar sync, availability, webhooks (`BOOKING_*`), API v2; Next.js + Postgres + Prisma | **Evaluate as core scheduling engine** | ⚠️ **License risk** — cal.com is reportedly moving open→closed-source. Confirm current MIT status & repo state before committing. If closed, treat as design reference only. |
| **Stripe Connect** | Marketplace payouts / split payments | CORE before launch | Standard; aligns with existing Stripe in iPix commerce |
| **Mastra** | Agent/tool/workflow orchestration + suspend/resume HITL | CORE | Already the iPix agent runtime |
| **CopilotKit v2** | Visible context, render tools, HITL cards | CORE | Already the iPix UI runtime |
| **Supabase (Postgres + pgvector + Edge)** | Marketplace data, vector search for matching, secure tool wrappers | CORE | Existing platform; `brands`/DNA already here |
| **Cloudinary** | Portfolios, proofing galleries, asset delivery | ADV | Existing; ties to DNA pipeline |

> **Recommendation:** build the scheduling layer on Supabase + a thin availability model rather
> than adopting cal.com wholesale, *unless* its license is confirmed safe — the webhook/API
> surface is attractive but the license-direction risk plus the need to wrap everything in
> Mastra agents reduces the payoff. Borrow cal.com's **data model** (event types, availability
> rules, booking webhooks) regardless.

---

## 6. Strategic recommendation for iPix

1. **Position: Marketplace + Booking + AI Operating System** (the "Soona + Airbnb + Copilot"
   option in `prompt-plan.md` Deliverable 3). The market has booking tools and studio CRMs but
   **no AI-native two-sided creative marketplace** — that's the wedge.

2. **Lead with the one agent nobody else has:** brief → **Brand-DNA-scored creator matching**.
   It reuses shipped Brand Intelligence and is uncopyable by horizontal booking tools. Make it
   the headline.

3. **Sequence the verticals by readiness, not ambition:**
   - **v1 CORE:** studios, photographers, equipment (well-understood data models; map to
     Anolla/StudioDock/GoPickle).
   - **Fast-follow:** locations, stylists, models — with **model usage-rights/release tracking**
     as deliberate white space no competitor covers.

4. **Adopt GoPickle's multi-event booking data model** (one booking → many resources, each with
   location/time/crew/deliverables/staged payments). It maps almost 1:1 to a shoot and avoids
   reinventing the schema.

5. **Emulate Seekda's *agentic, inventory-grounded* model** over a "chatbot that answers FAQs":
   the agent must read live availability and *complete the transaction*, plus recover abandoned
   bookings — but always with the iPix HITL gate before any write.

6. **Keep AI voice ADVANCED.** Voice receptionist/reschedule (Citaflow/Lunacal/Booking Pro) is a
   strong fast-follow, but chat + matching + scheduling deliver the v1 value; voice adds telephony
   cost and ops load.

7. **Payments: deposits + Stripe Connect.** Deposits at booking are table stakes; Connect splits
   are required before a real two-sided launch. Consider StudioDock's **0% platform fee + add-on
   checkout** as a positioning lever (charge SaaS, not commission, early).

8. **Don't fork the agents.** Marketplace agents (discover→match→book) hand off to the shoot
   `production-planner` (plan→execute→DNA). Two PRDs, two agent clusters, shared brand context.

### iPix vs the field (self-assessment for the matrix)
| Capability | Best-in-class today | iPix plan |
|---|---|---|
| Two-sided creative marketplace | — (none) | **CORE — own it** |
| Brand-DNA creator matching | — (none) | **CORE — moat** |
| Agentic inventory-grounded booking | Seekda | CORE (HITL-gated) |
| Multi-resource shoot booking | GoPickle | CORE (adopt model) |
| Equipment/room management | Anolla, Spacebring | CORE |
| Deposits + Connect payouts | Citaflow | CORE before launch |
| Galleries/proofing/DNA delivery | GoPickle + iPix DNA | ADV (DNA is iPix-unique) |
| AI voice | Citaflow, Lunacal | ADV |
| Model usage-rights tracking | — (none) | ADV white space |

---

## 7. Open questions & risks

- **Q-1:** v1 vertical cut — confirm studios + photographers + equipment as CORE; locations/
  stylists/models ADVANCED?
- **Q-2:** Build scheduling on cal.com vs Supabase-native? **Blocked on cal.com license
  verification** (open→closed risk).
- **Q-3:** Marketplace monetization — SaaS subscription (StudioDock 0% fee) vs commission
  (Connect split) vs hybrid?
- **Q-4:** Does marketplace crew supply feed the shoot `shoot_crew`, or stay a separate vendor
  pool? (ties to `prd-shoot.md` Q-4.)
- **R-1:** Voice AI adds telephony cost/ops — keep ADVANCED.
- **R-2:** All "AI" claims here are vendor marketing, read partly via search snippets; verify
  before quoting externally.
- **R-3:** Two-sided liquidity (supply before demand) is the classic marketplace cold-start risk
  — not a software problem; needs a go-to-market answer.

---

## 8. Sources

Studio mgmt: [Anolla](https://anolla.com/en/best-studio-software) · [Spacebring](https://www.spacebring.com/solutions/photo-studio-management-software) · [Fotostudio.io](https://www.fotostudio.io/en) · [StudioDock](https://www.getstudiodock.com/photo-studio-booking-software)
Photographer booking: [MotoPress roundup](https://motopress.com/blog/booking-software-for-photographers/) · [Lunacal](https://lunacal.ai/photography-booking-scheduling-app-software) · [Planfy](https://www.planfy.com/booking-system-photographers) (403, via search) · [Citaflow](https://citaflow.com/en/)
AI booking: [BookingSoftware.AI](https://bookingsoftware.ai/homepage) · [Booking Pro AI](https://bookingpro.ai/) · [Seekda](https://www.seekda.com/en/ai-booking-chatbot/) · [Spaceti](https://spaceti.com/spaceti-ai-booking-assistant) · [GoPickle](https://gopickle.ai/)
App builders: [RationalGo](https://rationalgo.ai/resources/app-builder/ai-app-builder-for-photography-studios-booking-gallery) · [Figma Make](https://www.figma.com/solutions/ai-booking-app-builder/)
Open-source: [cal.diy](https://www.cal.diy/installation) · [cal.com/cal.diy GitHub](https://github.com/calcom/cal.diy) (verify license)
