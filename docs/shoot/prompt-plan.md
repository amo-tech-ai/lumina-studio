# iPix Booking Marketplace Platform Audit & Architecture Plan

Act as a Principal SaaS Architect, Marketplace Architect, AI Systems Architect, Product Manager, UX Strategist, and Venture CTO.

Your mission is to perform a comprehensive audit of the software platforms, booking systems, studio management tools, scheduling products, AI booking assistants, and open-source repositories listed below.

Then create a complete architecture and implementation plan for the iPix Booking Marketplace.

---

# Context

iPix is evolving beyond Brand Intelligence and Content Planning.

We are building:

## iPix Marketplace

A platform where brands can:

* Book photographers
* Book studios
* Book videographers
* Book models
* Book makeup artists
* Book stylists
* Book content creators
* Book creative services
* Book locations
* Book equipment

Similar to:

* Soona
* Airbnb
* Calendly
* Fiverr
* Upwork
* ClassPass
* Studio Management Platforms

But AI-native from day one.

---

# Existing iPix Vision

Current workflow:

Brand URL
→ Brand Intelligence
→ Lean Canvas
→ Production Package
→ Service Marketplace
→ Booking
→ Shoot Execution
→ Asset Upload
→ Asset DNA Scoring
→ Product Linking
→ Performance Learning

Humans decide.
AI assists.
Nothing happens silently.

---

# Technology Stack

Current preferred stack:

Frontend

* React
* TypeScript
* Vite
* Tailwind
* shadcn/ui

AI

* Gemini 3
* Gemini 2.5 Flash
* Google ADK
* Mastra
* CopilotKit

Backend

* Supabase
* PostgreSQL
* pgvector
* Edge Functions
* Realtime

Payments

* Stripe
* Stripe Connect

Storage

* Cloudinary

Infrastructure

* Vercel
* Supabase

---

# Review These Platforms

## Photography Marketplace

https://soona.co/

---

## AI Booking Platforms

https://bookingsoftware.ai/homepage

https://bookingpro.ai/

https://www.seekda.com/en/ai-booking-chatbot/

https://spaceti.com/spaceti-ai-booking-assistant

https://gopickle.ai/

---

## Studio Management

https://anolla.com/en/best-studio-software

https://www.spacebring.com/solutions/photo-studio-management-software

https://www.fotostudio.io/en

https://starta.one/for/photo-studio

https://www.getstudiodock.com/photo-studio-booking-software

https://www.planfy.com/booking-system-photographers

https://lunacal.ai/

https://lunacal.ai/photography-booking-scheduling-app-software

---

## Scheduling & Calendars

https://citaflow.com/en/

https://www.cal.diy/installation

https://github.com/calcom/cal.diy

---

## AI App Builders

https://www.figma.com/solutions/ai-booking-app-builder/

https://rationalgo.ai/resources/app-builder/ai-app-builder-for-photography-studios-booking-gallery

---

# Deliverable 1

Executive Summary

Explain:

* What each platform does
* Core strengths
* Core weaknesses
* Business model
* Why customers use it
* Why customers leave it

Create:

| Platform | Category | Score | Grade | Recommendation |

---

# Deliverable 2

Feature Matrix

> **Completed from competitive research** — see `docs/shoot/shoot-research.md` for sources and
> per-platform detail. **Tier** = CORE (required for a credible v1 marketplace) vs ADV
> (differentiating / fast-follow), per the research §2 CORE/ADVANCED split.
> Legend: ✓✓ best-in-class · ✓ yes · ~ partial · ✗ no.
> **Soona** was not in the fetched link set; its column reflects known public positioning
> (content-creation marketplace) and should be verified.

| Feature | Tier | Soona | Cal.com | StudioDock | LunaCal | BookingPro | **iPix** |
|---|---|---|---|---|---|---|---|
| Marketplace (two-sided) | **CORE** | ✓ | ✗ | ✗ | ✗ | ✗ | **✓✓ own it** |
| Booking | **CORE** | ✓ | ✓ | ✓ | ✓ | ✓ | **✓** |
| Scheduling | **CORE** | ~ | ✓✓ | ✓ | ✓ | ✓ | **✓** |
| Calendars (2-way sync) | **CORE** | ✗ | ✓✓ | ~ | ✓ | ✓ | **planned** |
| Stripe (deposits/pay) | **CORE** | ✓ | ✓ | ✓ | ✓ | ✓ | **✓ (commerce)** |
| AI assistant (conversational booking) | **CORE** | ✗ | ~ | ✗ | ~ voice | ✓✓ | **✓✓ matching** |
| CRM | **CORE** | ~ | ✗ | ~ | ~ | ✓ | **~ (brands)** |
| Vendors (profiles) | **CORE** | ✓ | ✗ | ✗ | ✓ | ✗ | **✓** |
| Reviews | **CORE** | ~ | ✗ | ✗ | ✗ | ✗ | **planned** |
| Portfolios | **CORE** | ✓ | ✗ | ~ | ✓ | ✗ | **✓** |
| Availability | **CORE** | ✓ | ✓✓ | ✓ | ✓ | ✓ | **✓** |
| Multi-location | **CORE** | ~ | ✓ | ✓ | ✓ | ✓ | **CORE** |
| Brand Intelligence | **CORE** | ✗ | ✗ | ✗ | ✗ | ✗ | **✓✓ moat** |
| AI Planning (shot list / production) | **CORE** | ✗ | ✗ | ✗ | ✗ | ✗ | **✓✓ shoot PRD** |
| Messaging | ADV | ✓ | ~ | ✗ | ~ | ✓ | ADV |
| Quotes | ADV | ~ | ✗ | ✗ | ~ | ~ | ADV |
| Contracts | ADV | ~ | ✗ | ✗ | ✗ | ~ | ADV |
| Multi-vendor (combined cart) | ADV | ✗ | ✗ | ~ add-ons | ✗ | ✗ | ADV |
| Asset delivery (galleries/proofing) | ADV | ✓✓ | ✗ | ✗ | ✗ | ✗ | ADV (+ DNA) |
| Production Packages | ADV | ~ | ✗ | ✗ | ✗ | ✗ | ADV |
| Stripe Connect (payout split) | ADV → CORE pre-launch | ~ | ~ | ✗ | ✗ | ✗ | ADV |
| AI voice (inbound/outbound) | ADV | ✗ | ✗ | ✗ | ✓ | ✓✓ | ADV |
| Model usage-rights / release tracking | ADV | ✗ | ✗ | ✗ | ✗ | ✗ | **ADV — white space** |

**Reading of the matrix:** the CORE rows where every competitor is ✗ — **Marketplace (two-sided),
Brand Intelligence, AI Planning** (and the ADV white-space **model usage-rights**) — are exactly
where iPix is uncontested. Conversely, scheduling/calendars/Stripe/availability are commoditized
CORE table-stakes (Cal.com / Lunacal / BookingPro lead) that iPix should adopt, not reinvent.

---

# Deliverable 3

Marketplace Analysis

Determine whether iPix should become:

Option A

Marketplace only

Like Fiverr

Option B

Booking platform only

Like Calendly

Option C

Marketplace + Booking

Like Airbnb

Option D

Marketplace + Booking + AI Operating System

Like Soona + Airbnb + Copilot

Explain pros and cons.

Recommend one.

---

# Deliverable 4

AI Architecture

Review:

* Gemini
* Gemini Flash
* Google ADK
* Mastra
* CopilotKit

Explain exactly where each belongs.

Create:

| Layer | Technology | Purpose |

Examples:

* Brand Intelligence
* Marketplace Search
* Booking Assistant
* Scheduling Agent
* Recommendation Engine
* Vendor Matching
* Pricing Intelligence
* Asset DNA
* Production Planning

---

# Deliverable 5

Supabase Architecture

Design complete schema.

Include:

## Core

organizations
users
profiles

## Marketplace

vendors
vendor_services
vendor_portfolios
vendor_reviews

## Booking

bookings
availability
calendar_events
reschedules

## Payments

quotes
invoices
payments
stripe_accounts

## Production

projects
briefs
production_packages
assets

## AI

brand_profiles
brand_scores
ai_recommendations
agent_conversations
embeddings

For every table include:

* Purpose
* Relationships
* Indexes
* RLS requirements

---

# Deliverable 6

AI Agent Catalog

Design all agents.

Examples:

## Brand Intelligence Agent

Analyzes URLs.

## Marketplace Matching Agent

Matches brands with vendors.

## Scheduling Agent

Finds time slots.

## Pricing Agent

Suggests pricing.

## Production Planner Agent

Creates shot lists.

## Asset DNA Agent

Scores assets.

For each:

* Inputs
* Outputs
* Tools
* Memory
* Workflows

---

# Deliverable 7

CopilotKit Architecture

Design:

* Operator Hub
* Booking Copilot
* Marketplace Copilot
* Vendor Copilot
* Project Copilot

Explain:

* useAgentContext
* useCopilotReadable
* HITL
* CoAgents
* RenderTool

Show exactly where they are used.

---

# Deliverable 8

Mastra Architecture

Design:

Agents

Workflows

Tools

Memory

Evaluation

Observability

Show:

* Which workflows should be Mastra
* Which should remain Edge Functions
* Which should use Google ADK

---

# Deliverable 9

Google ADK Architecture

Review latest Google ADK capabilities.

Explain:

* Multi-agent orchestration
* Long-running workflows
* Memory
* Human approval
* Structured outputs

Recommend where ADK is better than Mastra.

Recommend where Mastra is better than ADK.

Recommend hybrid architecture.

---

# Deliverable 10

Booking Marketplace Roadmap

Create:

## Phase 1

MVP

0-60 days

Goals:

* Vendor directory
* Booking
* Stripe
* Calendar

---

## Phase 2

Assisted Intelligence

60-120 days

Goals:

* AI matching
* AI scheduling
* AI recommendations

---

## Phase 3

Marketplace Intelligence

120-240 days

Goals:

* Pricing intelligence
* Demand forecasting
* Vendor ranking
* AI concierge

---

## Phase 4

Autonomous Marketplace

240-365 days

Goals:

* Multi-agent workflows
* Automated proposals
* Automated planning
* Intelligent operations

---

# Deliverable 11

Repository Recommendations

Recommend additional repositories for:

* Booking
* Scheduling
* Marketplace
* Vendor Management
* AI Search
* Portfolio Management
* Reviews
* Messaging
* Contracts
* Stripe Connect
* Google ADK
* Mastra
* CopilotKit

Use:

| Repository | Purpose | Score | Use Level |

---

# Deliverable 12

Final Recommendation

Answer:

"If you were launching iPix today, what exact architecture, repositories, agents, workflows, database schema, and roadmap would you choose?"

Be opinionated.

Optimize for:

1. Speed to market
2. AI-native experience
3. Low maintenance
4. Scalability
5. Competitive advantage
6. Future marketplace expansion

Do not summarize websites.

Perform deep product analysis, architecture analysis, and startup-level technical due diligence.

Think like the CTO of a venture-backed AI marketplace company.
