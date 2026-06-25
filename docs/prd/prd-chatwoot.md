---
title: "iPix FashionOS × Chatwoot — Omnichannel PRD"
version: "1.0"
lastUpdated: "2026-06-21"
status: "Canonical"
owner: "Platform / Growth"
stack: "React 18 · Vite · Supabase · Mastra · Gemini 3.5 Flash · Cloudinary · Chatwoot · WhatsApp Cloud API"
sources:
  - docs/chatwoot/chatwoot-mvp-plan.md (architecture patterns)
  - docs/prd/prd-intelligence.md
  - docs/intelligence/06-ai-native-master-plan.md
  - docs/intelligence/mastra-agent-catalog.md
account: "app.chatwoot.com · account 168430 · admin verified 2026-06-05"
---

# iPix FashionOS × Chatwoot — Omnichannel PRD

> **One-line thesis:** Chatwoot is iPix's brand client channel + human escalation layer;
> Mastra agents are the brain; Supabase is the record. Don't rebuild a client portal —
> meet fashion founders where they already are (WhatsApp + Instagram DM) and route every
> conversation into the existing AI intelligence layer.
>
> **What this is NOT:** a generic support system. Chatwoot in iPix is the **brand
> onboarding funnel**, the **client approval channel**, and the **shoot coordination hub**
> — conversations that start a brand relationship and produce billable shoot packages.

---

## 1. Ground Truth (2026-06-21)

| Layer | Status |
|-------|--------|
| Chatwoot Cloud account 168430 | ✅ Live, admin token valid |
| WhatsApp inbox | ❌ No inboxes provisioned (CHAT-002 needed) |
| Instagram DM inbox | ❌ Not configured |
| Web widget | ❌ Not configured |
| iPix Mastra agent service | ❌ AIOR-001 (services/agent/) |
| Chatwoot webhook bridge | ❌ net-new |
| Chatwoot skills plugin | ✅ Installed (fazer-ai/chatwoot-skills, v1.0.0) |
| CHATWOOT_ACCOUNT_ID | ✅ 168430 in .env.local |
| CHATWOOT_ACCESS_TOKEN | ✅ in .env.local |
| CHATWOOT_BASE_URL | ✅ https://app.chatwoot.com |

**Critical stack note:** iPix is **Vite + React Router v6**, not Next.js. The Chatwoot
webhook bridge runs as part of `services/agent/` (Hono), not a Next.js API route.
The Mastra CopilotKit runtime at port 4111 is the same service that handles WhatsApp.

---

## 2. Why Chatwoot for iPix

Fashion brands and DTC founders are not going to log into an operator portal to onboard
their brand. They message on WhatsApp. They DM on Instagram. They want a reply in minutes,
not a form to fill in.

| Without Chatwoot | With Chatwoot |
|-----------------|---------------|
| Brand emails to book a shoot → 3-day back-and-forth | Brand WhatsApp messages → AI replies in < 5s, books in-thread |
| Operator manually types brand URL into intake form | AI captures URL in chat, runs brand-intelligence, posts draft for approval |
| Assets delivered by WeTransfer email | Cloudinary links shared in WhatsApp thread, client approves with a reply |
| Shoot call sheet emailed to 12 crew members | Call sheet auto-sent to crew WhatsApp thread |
| Client doesn't know DNA rejection reason | AI sends "here's why we flagged this asset + what to reshoot" to client's WhatsApp |

**Build vs Buy decision:** Chatwoot Community Edition (MIT) self-hosted on Hetzner — full
API, no per-seat SaaS, own data. For MVP: Chatwoot Cloud (already live) to ship fast,
self-host post-revenue.

---

## 3. Personas

| Persona | Who | What they need from Chatwoot |
|---------|-----|------------------------------|
| **Brand Founder** | DTC startup CMO, fashion label owner | WhatsApp brand onboarding, asset delivery, approval flows without logging in |
| **Commerce Lead** | Brand's e-commerce/marketing manager | Product-to-asset linking approvals, campaign briefs, performance updates |
| **iPix Operator** | Internal production team | Brand intake queue, shoot confirmations, client comms in one inbox |
| **Production Coordinator** | Shoot planner | Crew WhatsApp thread, call sheet distribution, weather/schedule updates |
| **Shoot Crew Member** | Photographer, stylist, art director | Brief delivery, location updates, day-of coordination |
| **Brand Support** | Client needing help with portal/assets | Fast first-reply, escalation to human operator |

---

## 4. Use Cases & Real-World Examples

### UC-1 — Brand Onboarding via WhatsApp (Core MVP)

**Scenario:** A DTC skincare founder, Priya, discovers iPix on Instagram.
She clicks the WhatsApp link in the bio.

```
Priya → WhatsApp: "Hi, I want to book a content shoot for my brand"

iPix Bot: "Welcome to iPix! I can help get you started. 
What's your brand website? I'll run an instant analysis 
and have a proposal ready in 2 minutes."

Priya → "www.pureglowskincare.com"

[Mastra brand-intelligence agent runs: URL context + Gemini → 
brand profile draft: positioning, 5 DNA pillars, 3 competing brands]

iPix Bot: "Here's your brand intelligence snapshot:
- Positioning: Clean beauty, Gen-Z, minimalist
- DNA pillars: Natural, Authentic, Minimalist, Scientific, Sustainable  
- Brand score: 78/100 (strong visual identity)

Does this capture your brand? Reply YES to confirm or 
EDIT to adjust any field."

Priya → "YES"

[Mastra writes to brands table via human-approved draft path]
[Operator gets Chatwoot notification: new brand onboarded, ready for intake call]
```

**Business value:** Brand onboarding in < 5 minutes vs. 2-day email cycle.
Every onboarded brand is a shoot package sale ($2,000–$15,000).

---

### UC-2 — Asset DNA Approval via WhatsApp

**Scenario:** iPix completes a shoot for Priya's brand. The AI DNA scorer
flags 3 images as `review` status (lighting inconsistency with brand pillars).

```
iPix Operator Bot → Priya's WhatsApp:
"Hi Priya! Your PureGlow shoot assets are ready for review.

3 images need your input — our AI flagged a lighting 
style that differs from your minimalist DNA pillar:

[Asset 1] ❌ DNA Review — warm orange tones conflict 
  with your clean/scientific pillar
  → Suggested fix: Cool white balance, reduce warmth by 15%

[Asset 2] ❌ DNA Review — background texture too busy
  → Suggested fix: Switch to solid white/cream backdrop

[Asset 3] ✅ DNA Approved — perfect match

Reply:
APPROVE ALL — accept flagged assets as-is
RESHOOT 1, RESHOOT 2 — request retake for flagged items
EDIT 1 — post-process fix (we'll handle it)"

Priya → "RESHOOT 1, APPROVE 2"

[Mastra asset-dna agent logs approval decision]
[Supabase: assets[1].dna_status = review_approved, assets[2] = reshoot_requested]
[Operator gets task in Chatwoot: schedule Asset 1 reshoot for Priya]
```

**Business value:** Client approvals that used to take 3 email threads resolved in
one WhatsApp exchange. Reshoot requests tracked with accountability.

---

### UC-3 — Shoot Booking & Call Sheet Distribution

**Scenario:** A fashion label (Vela Studios) books a 2-day lookbook shoot.

```
Brand Manager → WhatsApp: "We need a lookbook shoot, 
8 looks, mid-July, downtown Toronto"

iPix Bot: "Got it — lookbook, 8 looks, Toronto, July.
A few quick questions:

1. Product type? (clothing / accessories / both)
2. Vibe? (editorial / commercial / social-first)
3. Any specific models in mind or shall we suggest?"

Brand Manager → "Clothing + accessories, editorial, 
we have 2 models already"

[Mastra production-planner creates shoot brief draft]
[Operator reviews + books studio + confirms crew]

iPix Bot: "Your shoot is confirmed:
📅 July 14–15, 2026
📍 Queen West Studio, Toronto
👗 8 looks — editorial
👥 2 x your models + iPix art director + photographer

Call sheet sent to your WhatsApp ↓
[PDF: VelaStudios_Lookbook_Callsheet_Jul14.pdf]

Your crew will receive their briefs by end of day.
Any questions?"
```

**For Crew (separate WhatsApp thread):**
```
Photographer → Chatwoot assigned thread:
[PDF brief]
"Vela Studios lookbook — Moodboard, lighting specs, 
shot list attached. Location: 123 Queen W. Call time 8am.
Reply CONFIRMED to lock in."

Photographer → "CONFIRMED"
[Supabase: production_packages.crew_confirmations updated]
```

---

### UC-4 — Product-to-Asset Linking Approval

**Scenario:** After shoot, Mastra product-linking agent proposes Mercur SKU
matches for completed assets. Commerce lead needs to confirm.

```
iPix Bot → Commerce Lead's WhatsApp:
"Hey! Your PureGlow shoot assets are ready for product linking.

Mastra matched 12 assets to your Mercur catalog:

HERO SHOT #1 — Glow Serum 30ml (SKU: PG-SER-30)
  Confidence: 94% ✅ 
  
HERO SHOT #2 — Toner Mist (SKU: PG-TON-100)  
  Confidence: 87% ✅

LIFESTYLE #3 — No match found
  → Manual SKU entry needed

Reply:
APPROVE ALL — confirm all 94%+ matches
REVIEW — see full list with alternatives
MANUAL for asset 3 — we'll reach out about the SKU"

Commerce Lead → "APPROVE ALL, MANUAL for 3"

[Supabase: commerce_product_links rows inserted with approver_id]
[Asset 3 tagged for manual review in operator queue]
```

---

### UC-5 — Brand Performance Update (Scheduled)

**Scenario:** Weekly automated performance summary sent to brand leads.

```
iPix Bot → Brand Manager WhatsApp (every Monday 9am):
"📊 PureGlow Weekly Report — week of Jun 16

Your iPix assets this week:
✅ 24 assets active on Mercur
📈 Top performer: Glow Serum hero shot
   → 340 clicks, 4.2% CTR (above 2.1% avg)
⭐ DNA score trend: 82 → 85 (+3 pts)

💡 AI Recommendation:
Your minimalist flatlays are outperforming lifestyle shots 3:1.
Next shoot brief updated to weight flatlays heavier.

Reply BRIEF to see the updated shoot recommendation."
```

---

### UC-6 — Contest/Campaign Entry Intake

**Scenario:** iPix runs a fashion photography contest. Brands submit via WhatsApp.

```
Brand Owner → WhatsApp: "I want to enter the #LuminaLooks contest"

iPix Bot: "Welcome to #LuminaLooks! To enter:

1. Send your brand name
2. Send 3–5 hero images (WhatsApp media)
3. Tell us: what's the story behind this shoot?

We'll score your entry on DNA alignment, creativity, 
and commercial viability. Results by July 30."

Brand Owner → [sends images + caption]

[Chatwoot saves media attachments]
[Mastra asset-dna scores each image automatically]
[Contest entry row created in Supabase]
[Bot confirms: "Entry received! Your DNA scores: 91/100 avg. 
Watch this space for the announcement."]
```

---

## 5. Architecture

### 5.1 Responsibility Split

| Layer | Owner | What it owns |
|-------|-------|-------------|
| Channel (WhatsApp / Instagram / web widget) | Chatwoot | Transport, inboxes, routing, labels, CSAT |
| Human console + escalation | Chatwoot | Operator inbox, mobile app, team assignment |
| AI reasoning + agent orchestration | Mastra (`services/agent/`) | brand-intelligence, asset-dna, product-linking, production-planner agents |
| Structured output + grounding | Gemini 3.5 Flash | Brand profiles, DNA scores, match reasoning |
| System of record | Supabase | brands, assets, ai_drafts, approvals, commerce_product_links |
| Media management | Cloudinary | Asset upload, transformation, secure URLs |
| Commerce catalog | Mercur/Medusa | SKUs, products, inventory |
| HITL approval data model | Supabase ai_drafts → approvals | Every AI-proposed action needs human approver_id |

**One-sentence invariant:** Chatwoot owns the conversation; Supabase owns the business object;
AI proposes; humans decide; nothing writes durably without an `approver_id`.

### 5.2 System Topology

```
WhatsApp / Instagram DM / Web Widget
  └── Chatwoot Cloud (acct 168430)
        ├── Inboxes (WhatsApp + IG + web)
        ├── Agent Bot → webhook → services/agent/ (Hono :4111)
        ├── Human Operators (iPix team)
        └── Teams: Brand Intake · Production · Commerce · Support
              │
              │ Agent Bot webhook (POST /api/chatwoot/webhook)
              ▼
services/agent/ (Hono, Mastra runtime)
  ├── ChatwootTransport (receive/send/canReply)
  ├── Mastra agents:
  │     ├── brand-intelligence  (UC-1: onboarding)
  │     ├── asset-dna           (UC-2: approval flows)
  │     ├── product-linking     (UC-4: SKU matching)
  │     ├── production-planner  (UC-3: shoot briefs)
  │     └── analytics           (UC-5: performance reports)
  └── Tools → Supabase Edge Functions (write surface)
              │
              ▼
Supabase (system of record)
  ├── brands, brand_scores
  ├── ai_drafts + approvals (HITL spine)
  ├── assets (dna_status, dna_score, dna_pillars)
  ├── commerce_product_links
  └── ai_agent_logs
```

### 5.3 Chatwoot Bot → Mastra Bridge

```
POST /api/chatwoot/webhook
  │
  ├── Verify HMAC (X-Chatwoot-Signature)
  ├── Filter: skip agent_bot sender (self-loop guard)
  ├── Dedupe: message.id idempotency
  ├── Parse: event type (message_created / conversation_created)
  │
  └── Route by intent:
        brand_url_detected    → brand-intelligence agent
        asset_approval_cmd    → asset-dna approval handler
        shoot_booking_intent  → production-planner agent
        product_link_cmd      → product-linking agent
        performance_request   → analytics agent
        unrecognized / low_conf → assign to Brand Intake team + private note
```

### 5.4 HITL in WhatsApp Conversations

Every AI-proposed change follows the same pattern:

```
AI drafts proposal → ai_drafts row (status: pending)
  → Chatwoot sends human-readable summary to client WhatsApp
  → Client replies YES / EDIT / REJECT
  → Bridge maps reply → approvals row (approver_id = client or operator)
  → Supabase trigger applies draft to durable table
```

**Invariant honored:** no agent writes durable tables directly. The WhatsApp reply IS
the approval action, logged with the client's Chatwoot contact ID as the external approver.

---

## 6. Inboxes & Team Structure

### Inboxes (to create in Chatwoot)

| Inbox | Channel | Purpose | Bot? |
|-------|---------|---------|------|
| **iPix Brands** | WhatsApp | Brand onboarding, client comms, asset delivery | ✅ AI first |
| **iPix Production** | WhatsApp | Shoot crew coordination, call sheets, confirmations | ✅ AI first |
| **iPix Commerce** | WhatsApp | Product linking approvals, Mercur catalog updates | ✅ AI first |
| **@ipixstudio Instagram** | Instagram DM | Brand discovery, contest entries, new leads | ✅ AI first |
| **iPix Web Widget** | Web (on ipixstudio.com) | Support, demo requests, pricing questions | ✅ AI first |

### Teams

| Team | Members | Conversations routed |
|------|---------|---------------------|
| **Brand Intake** | Operators | New onboarding, low-confidence AI responses |
| **Production** | Coordinators | Shoot bookings, crew issues, rescheduling |
| **Commerce** | Commerce leads | Product linking escalations, Mercur issues |
| **Client Support** | All operators | Complaints, refund requests, portal access issues |

### Labels

| Label | When applied | Used for |
|-------|-------------|----------|
| `intent:onboarding` | Brand URL shared | Route to brand-intelligence |
| `intent:asset-approval` | Client reviewing assets | Route to asset-dna handler |
| `intent:shoot-booking` | Dates / brief requested | Route to production-planner |
| `intent:product-link` | Commerce SKU work | Route to product-linking |
| `stage:lead` | First contact, no brand profile yet | CRM / pipeline tracking |
| `stage:onboarded` | Brand profile approved | Confirmed client |
| `stage:active-shoot` | Shoot booked or underway | Production tracking |
| `stage:delivered` | Assets delivered | Post-shoot |
| `needs-human` | AI confidence low / payment / complaint | Operator assignment |
| `priority:vip` | High-value brand (>$10k package) | Senior operator |

---

## 7. WhatsApp Message Templates (Outside 24h Window)

Meta requires pre-approved templates for messages sent outside the 24h customer-care window.

| Template ID | Trigger | Content |
|-------------|---------|---------|
| `brand_intake_followup_v1` | 48h after URL captured, no approval | "Your brand intelligence report is ready. Review and approve: [link]" |
| `shoot_confirmation_v1` | Shoot booked | "Your iPix shoot is confirmed for [date] at [location]. Call sheet attached." |
| `asset_ready_v1` | Assets delivered post-shoot | "Your [brand] assets are ready! Review and approve: [Cloudinary link]" |
| `weekly_performance_v1` | Every Monday 9am (UC-5) | "Your weekly iPix performance report is ready." |
| `contest_result_v1` | Contest winner announcement | "Results are in! See how #LuminaLooks entries ranked." |

---

## 8. Requirements

### Functional

| ID | Requirement |
|----|-------------|
| FR-1 | Inbound WhatsApp / IG message → Chatwoot inbox → Agent Bot triggers in < 3s |
| FR-2 | Bot routes by intent (brand URL → brand-intelligence; approval keyword → HITL handler; booking request → production-planner) |
| FR-3 | Every AI-proposed brand profile, asset approval, or product link goes through `ai_drafts` → `approvals` spine; no direct durable writes |
| FR-4 | Client reply (YES/APPROVE/REJECT) maps to an `approvals` row with `approver_id = chatwoot_contact_id` |
| FR-5 | Low-confidence or payment/contract conversation → label `needs-human` + assign Brand Intake team + AI private note with reasoning |
| FR-6 | Asset media shared in WhatsApp → Cloudinary upload → asset row created |
| FR-7 | Shoot call sheets generated by production-planner → distributed to crew WhatsApp threads |
| FR-8 | Weekly performance reports sent on schedule to onboarded brands |

### Non-Functional

| ID | Requirement |
|----|-------------|
| NFR-1 | WhatsApp 24h window enforced — bridge checks `canReply()` before free-form; uses templates outside window |
| NFR-2 | Bridge security: HMAC verify, self-loop guard (skip `sender.type='agent_bot'`), idempotency on `message.id` |
| NFR-3 | Single sender: Chatwoot is the only WhatsApp egress. No direct Cloudinary → WhatsApp or Supabase → WhatsApp sends |
| NFR-4 | PII handling: client phone numbers in Supabase mirror with RLS `service_role_only`. CASL/PIPEDA compliant (Canada) |
| NFR-5 | Bot silence after human assignment: once a conversation is assigned to an operator, the bot sends nothing |
| NFR-6 | Transport-agnostic Mastra: brand-intelligence agent runs identically whether called from CopilotKit (web) or Chatwoot (WhatsApp) |

---

## 9. Acceptance Criteria (MVP Exit)

1. A WhatsApp message with a brand URL → AI brand profile draft in Chatwoot within 10s.
2. A "YES" reply from the client → `brands` row created with `approver_id` set (no self-approval).
3. Asset DNA approval keywords (APPROVE / RESHOOT) correctly flip `assets.dna_status` via `approvals` table.
4. A low-confidence or "talk to a person" message → labeled `needs-human`, assigned to Brand Intake team, bot silent after.
5. No free-form WhatsApp message sent outside the 24h window (Vitest with mocked window check).
6. `npm run build` exits 0; Vitest suite stays green.

---

## 10. Revenue Streams Enabled by Chatwoot

| Stream | How Chatwoot enables it | Value |
|--------|------------------------|-------|
| **Brand package sales** | WhatsApp onboarding funnel converts discovery → booked shoot | $2,000–$15,000/shoot |
| **Rush/premium shoots** | VIP label routes to senior coordinator; upsell in-thread | +30% package premium |
| **Subscription retainers** | Monthly content packages sold via conversation, billed via Stripe link | $1,500–$5,000/mo |
| **Contest entry fees** | Contest intake via WhatsApp; Stripe payment link in-thread | $99–$499/entry |
| **Crew marketplace** | Production crew get briefs + confirm via WhatsApp; platform takes coordination fee | 10–15% |
| **Brand intelligence reports** | One-off report ordered via WhatsApp, delivered in-thread | $299–$999/report |

---

## 11. Anti-Patterns

| ❌ Don't | ✅ Do |
|---------|-------|
| Replace the Operator Hub with WhatsApp-only | Hub = internal operators; Chatwoot = external brand clients |
| Build a separate AI for WhatsApp | Same Mastra agents serve both CopilotKit and Chatwoot |
| Write durable rows from the bridge directly | All writes via `ai_drafts` → `approvals` → edge function apply |
| Send raw Cloudinary URLs without expiry | Use Cloudinary signed URLs with 7-day expiry in WhatsApp |
| Auto-approve brand profiles without human sign-off | `approver_id` is required — client's reply is the approval action |
| Use Chatwoot Captain AI | Mastra is the brain; Captain is Ruby/Enterprise-gated/OpenAI-only |
| Send WhatsApp blasts to cold contacts | Opt-in only, CASL compliant; template-only outside 24h |
| Deploy Chatwoot for MVP before agents are ready | Phase 1 deploys Chatwoot + bot stub; AI agents layer in Phase 2 |

---

## 12. Key References

| Doc | What it adds |
|-----|-------------|
| `docs/prd/prd-intelligence.md` | Agent registry, HITL data model, Mastra workflow catalog |
| `docs/intelligence/06-ai-native-master-plan.md` | Unified architecture, route map |
| `docs/intelligence/mastra-agent-catalog.md` | 7 agents — inputs, outputs, tools |
| `docs/chatwoot/roadmap-chatwoot.md` | Phase-by-phase delivery sequencing |
| `docs/chatwoot/chatwoot-mvp-plan.md` | CHAT-001…015 task specifications (architecture reference) |
| `https://docs.copilotkit.ai/integrations/mastra/human-in-the-loop/interrupt-flow` | HITL interrupt pattern |
| `https://developers.chatwoot.com` | Chatwoot API reference |
