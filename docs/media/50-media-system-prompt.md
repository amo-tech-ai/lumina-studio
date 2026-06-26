# Build the Complete AI-Native FashionOS System

> ⚠️ **Scope is already decided — ground every answer in it, do not expand past it.** This brief enumerates the full ambition; the binding scope lives in [`prd-media.md`](prd-media.md) §10 and [`roadmap-media.md`](roadmap-media.md). Before generating any deliverable below, honour these cuts:
> - **Agents:** 6 existing agents only (`production-planner`, `creative-director`, `social-discovery`, `public-marketing`, `visual-identity`, + 1 conditional `media-advisor`). The long role list below maps to those agents and to `industry_playbooks` seed rows — **do not design 18 agents.**
> - **Integrations:** Cloudinary + Postiz + Stripe + Shopify/Amazon **export** only. Other channel publishing routes **through Postiz**, not direct integrations. WhatsApp/Chatwoot/Calendar are cut.
> - **Phasing:** MVP = grounded image specs; everything else is Phase 2/3 per the roadmap. The "Challenge every feature" rule at the end applies to every section — reuse existing schema/agents before proposing new ones.

## Objective

Using all available Claude Code skills, build a complete, production-ready plan for an AI-native FashionOS platform.

**Always use the most appropriate Claude skills before writing the solution.**

Examples include:

* PRD generation
* Feature planning
* MVP planning
* System architecture
* Supabase
* CopilotKit
* Mastra
* Gemini
* Cloudinary
* PostgreSQL
* pgvector
* UI/UX
* Workflow planning
* Task breakdown
* File organization

Use skills whenever they improve the result.

---

# Core Principles

* Keep the architecture simple.
* MVP first.
* Do NOT over-engineer.
* Do NOT introduce unnecessary microservices.
* Prefer a modular monolith.
* Human approval before important AI actions.
* Reuse existing patterns whenever possible.
* AI assists, humans decide.
* Every recommendation should have a clear business value.

---

# Technology Stack

Design the complete system using:

Frontend

* React
* Vite
* TypeScript
* Tailwind
* shadcn/ui
* CopilotKit

Backend

* Supabase
* PostgreSQL
* pgvector
* Edge Functions
* Mastra
* Gemini
* Cloudinary
* Postiz integrations

---

# AI Architecture

Design:

* CopilotKit integration
* Mastra workflows
* Gemini prompts
* AI tools
* AI memory
* AI recommendation engine
* Human approval workflow
* Agent communication
* Context management
* Streaming responses
* RAG using pgvector
* Image and video recommendation engine

---

# AI Agents

> **Constraint (per [`prd-media.md`](prd-media.md) §10):** implement only the 6 existing agents. The roles below are capabilities of those agents or `industry_playbooks` seed rows — consultant-style roles (Jewelry/Beauty/Fashion Consultant, etc.) are playbook rows, **not** separate agents.

Design specialized agents including:

* Booking Agent
* Sales Agent
* Creative Director
* Brand Strategist
* Campaign Planner
* Production Manager
* Shoot Planner
* Photographer Assistant
* Videographer Assistant
* Fashion Consultant
* Jewelry Consultant
* Beauty Consultant
* Ecommerce Specialist
* Marketplace Specialist
* Publishing Manager
* Analytics Agent
* Customer Success
* Finance Agent

For each agent define:

* Responsibilities
* Inputs
* Outputs
* Tools
* Workflows
* Human approval points

---

# Business Types

Support:

Fashion Designers

Jewelry

Luxury

Beauty

Cosmetics

Accessories

Shoes

Handbags

Swimwear

Streetwear

Bridal

Menswear

Womenswear

Kids Fashion

Sportswear

Home Decor

Furniture

Food

Restaurants

Hotels

Real Estate

Automotive

Healthcare

Technology

Creators

Influencers

Agencies

Local Businesses

---

# Production Services

Support:

Photography

Videography

Drone

UGC

Editorial

Campaign

Lifestyle

Product

Ecommerce

Studio

Outdoor

Runway

Lookbook

Catalog

Commercial

Advertising

Social Media

Events

Livestream

Podcast

---

# Resources

Model:

Photographers

Videographers

Producers

Creative Directors

Art Directors

Stylists

Hair Stylists

Makeup Artists

Models

Assistants

Editors

Retouchers

Motion Designers

Graphic Designers

Studios

Locations

Indoor Locations

Outdoor Locations

Equipment

Lighting

Audio

Wardrobe

Props

Vehicles

Travel

Accommodation

---

# Booking System

Design:

Customer Discovery

Consultation

AI Recommendations

Quotation

Proposal

Booking

Scheduling

Contracts

Deposits

Production Planning

Crew Assignment

Location Selection

Equipment Planning

Call Sheets

Production

Editing

Review

Approval

Delivery

Publishing

Performance Tracking

Repeat Business

---

# Campaign Intelligence

The AI should recommend:

Images

Videos

Reels

Stories

Ads

Carousels

Product Images

Lifestyle Images

UGC

Editorial

Landing Pages

Marketplace Assets

Amazon Assets

Shopify Assets

Pinterest Assets

Facebook Assets

Instagram Assets

TikTok Assets

Email Assets

Website Assets

---

# User Journeys

Create journeys for:

Brand Owner

Marketing Manager

Creative Director

Photographer

Videographer

Stylist

Model

Editor

Customer Success

Operations

Finance

Administrator

---

# User Stories

Write complete user stories and acceptance criteria for every module.

---

# Database Design

Design:

* PostgreSQL schema
* Supabase schema
* pgvector tables
* RLS policies
* Edge Functions
* Triggers
* Views
* Materialized Views
* Storage buckets
* Cloudinary integration
* TypeScript types
* Zod schemas

---

# Frontend

Design:

* Dashboard
* Booking Wizard
* Campaign Wizard
* Shoot Wizard
* Creative Brief
* Moodboards
* Calendar
* Resource Planning
* Production Dashboard
* Asset Library
* Ecommerce Dashboard
* Publishing Dashboard
* Analytics Dashboard
* Finance Dashboard

---

# Backend

Design:

* APIs
* Edge Functions
* AI workflows
* Background jobs
* Queues
* Notifications
* Webhooks
* Integrations

---

# Integrations

> **Constraint (per [`prd-media.md`](prd-media.md) §10):** direct integrations are Cloudinary, Postiz, Stripe, and Shopify/Amazon **export** only. All social/channel publishing fans out **through Postiz** — do not design direct IG/TikTok/FB/Pinterest/YouTube integrations. WhatsApp/Chatwoot/Calendar are deferred.

Design integrations for:

* Cloudinary
* Shopify
* Amazon
* Facebook
* Instagram
* TikTok
* Pinterest
* YouTube
* Google Business
* Postiz
* Stripe
* Google Calendar
* WhatsApp
* Chatwoot

Include import/export workflows and automated publishing.

---

# Phases

Organize everything into:

## Phase 1 — Core MVP

Only essential features required to launch.

## Phase 2 — Enhanced

Automation, AI recommendations, advanced planning, ecommerce.

## Phase 3 — Advanced

Multi-agent orchestration, predictive analytics, optimization, enterprise capabilities.

Each phase should include:

* Goals
* Features
* Database changes
* AI agents
* Workflows
* APIs
* UI
* Acceptance criteria

---

# Deliverables

Produce:

1. Complete Product Architecture
2. PRD
3. Technical Architecture
4. Frontend Architecture
5. Backend Architecture
6. AI Architecture
7. Database Design
8. User Journeys
9. Stakeholder Journeys
10. User Stories
11. Workflow Diagrams
12. Agent Specifications
13. Integration Specifications
14. API Design
15. AI Prompt Library
16. Implementation Roadmap
17. MVP Checklist
18. Phase 2 Roadmap
19. Phase 3 Roadmap
20. Risks, assumptions, and simplification recommendations.

## Final Requirement

Challenge every feature before including it.

Ask:

* Is this needed for the MVP?
* Can it be simpler?
* Can an existing component be reused?
* Does it provide measurable business value?

Prefer the simplest solution that delivers the greatest customer value while leaving a clear path for future expansion.
