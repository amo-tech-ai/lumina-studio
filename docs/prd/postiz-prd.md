---
id: PRD-POSTIZ-001
title: "Postiz Deep Audit, Hosting Strategy & iPix Publishing PRD"
version: "1.0"
status: Audit + roadmap — decision-ready
priority: P2 (post-MVP; iPix Publishing stage)
date: "2026-06-21"
owner: Principal SaaS / MarTech Architect — Venture CTO review
repos_audited:
  - https://github.com/gitroomhq/postiz-app   (platform, AGPL-3.0)
  - https://github.com/gitroomhq/postiz-agent (CLI for agentic posting, AGPL-3.0)
verified_against:
  - prd.md (Publishing stage; OpenClaw §4.10)
  - docs/progress-tracker.md (POSTIZ-001 — Postiz webhook → asset published; "Not integrated", post-MVP)
  - docs/prd/shoot-prd.md · docs/prd/campaign-prd.md · docs/prd/openclaw-prd.md
method: "GitHub READMEs + docs.postiz.com via WebFetch. Star counts (~32k app / ~305 agent) are plausible but treat as point-in-time. Queue engine and exact channel count vary by version — VERIFY before deploying."
task_id_convention: "IPI-XXX · TASK-ID — Full Task Name (never bare IDs)"
---

# Postiz Deep Audit & iPix Publishing PRD

> **One-line verdict:** Postiz is the right **open-source publishing/scheduling engine** for the
> iPix **Publishing** stage — adopt it, self-host on Hostinger, integrate via the **Postiz Agent
> CLI + Public API** behind Mastra/Gemini/CopilotKit. **But the AGPL-3.0 license is the gating
> constraint on monetization:** internal/self-host use is clean; **reselling or white-labeling it
> to brands requires AGPL compliance (network source disclosure) OR a commercial license from
> Gitroom/Postiz.** Resolve licensing before any paid offering.

> **⚠️ Make-or-break caveat — LICENSE.** Both repos are **AGPL-3.0**. Under AGPL, if you run a
> modified Postiz and let third parties (e.g. designer clients) interact with it over a network,
> you must offer them the corresponding source. Offering Postiz **as a paid SaaS to external
> customers** therefore requires either (a) full AGPL compliance, or (b) a **commercial/white-label
> license** from Gitroom. Deliverables 11–14 are written around this; do not treat white-label as
> free.

---

## Deliverable 1 — Executive Summary

**What is Postiz?** An open-source social-media scheduling & management platform — an
Buffer/Hootsuite/Hypefury alternative. Schedules posts across **15–28+ channels** (X, Instagram,
TikTok, YouTube, LinkedIn, Facebook, Pinterest, Threads, Bluesky, Mastodon, Discord, Slack,
Reddit, Dribbble…), with **AI ("agentic") post generation**, **analytics**, **team
collaboration + approvals**, a **content calendar**, **lead capture**, and a **Public API**.
Stack: Next.js + NestJS + PostgreSQL/Prisma + a job queue + Docker self-host. **AGPL-3.0.**

**What problems it solves:** multi-channel scheduling without per-seat SaaS fees; self-hosted
data ownership; programmatic/agentic posting via API + the **Postiz Agent CLI**; team approval
workflows. **Who it's for:** creators, agencies, SMBs, and devs who want an ownable, extensible
scheduler. **Why companies leave Buffer/Hootsuite/Later/Sprout/Metricool:** cost at scale,
closed ecosystems, weak AI, no self-host/white-label, limited API — Postiz answers all five.

### Scorecard
| Category | Score /100 | Basis |
|---|---:|---|
| Features | 85 | Scheduling, calendar, approvals, analytics, API — full-featured |
| AI Capabilities | 75 | Agentic post gen + the Agent CLI; iPix's Gemini does the heavy lifting |
| Scheduling | 90 | Core strength; multi-channel queue |
| Analytics | 70 | Present; less deep than Sprout/Metricool |
| Multi-Account | 88 | Many channels/accounts per workspace |
| Multi-Tenant | 72 | Workspaces exist; SaaS-grade tenant isolation needs validation |
| White-Label Potential | 65 | Technically yes — **gated by AGPL/commercial license** |
| Open-Source Value | 92 | Active, ~32k stars, MIT-of-its-niche leader (but AGPL copyleft) |
| Fashion Industry Fit | 80 | IG/TikTok/Pinterest-first = exactly fashion's channels |
| iPix Fit | 88 | Drops straight into the Publishing stage (POSTIZ-001) |
| **Overall** | **82** | **Adopt as the publishing engine; resolve licensing before reselling** |

---

## Deliverable 2 — Competitive Analysis

| Feature | **Postiz** | Buffer | Hootsuite | Metricool | Winner |
|---|---|---|---|---|---|
| Scheduling | ✅ | ✅ | ✅ | ✅ | tie |
| Calendar | ✅ | ✅ | ✅ | ✅ | tie |
| AI writing | ✅ agentic | ~ | ~ | ~ | **Postiz** |
| AI agents (API/CLI) | ✅ Postiz Agent | ✗ | ✗ | ✗ | **Postiz** |
| Approval workflows | ✅ | ~ (paid) | ✅ | ~ | tie (Postiz/Hootsuite) |
| Team collaboration | ✅ | ✅ | ✅ | ✅ | tie |
| Analytics | ✅ | ✅ | ✅ | ✅✅ | **Metricool** |
| White-label | ✅* (license-gated) | ✗ | ✗ | ~ | **Postiz** |
| Self-hosting | ✅ Docker | ✗ | ✗ | ✗ | **Postiz** |
| Cost | ✅ self-host = infra only | $$ | $$$ | $$ | **Postiz** |
| Extensibility | ✅ API + OSS | ~ | ~ | ~ | **Postiz** |

**Read:** Postiz wins on **AI/agents, self-hosting, white-label potential, cost, extensibility**
— exactly the axes that matter for embedding publishing inside iPix. It trails only on
**analytics depth** (Metricool). `*white-label is license-gated` (Deliverable 11).

---

## Deliverable 3 — Technical Architecture Review

*What · why · real-world example · how iPix uses it.*

- **App architecture (Next.js + NestJS).** *What:* React frontend + Nest API backend, monorepo.
  *Why:* clean UI/API split. *Example:* user schedules a post in the UI → Nest persists + queues.
  *iPix:* run **headless** — drive Postiz via API, render our own cockpit in CopilotKit.
- **Database (PostgreSQL/Prisma).** *What:* posts, channels, workspaces, schedules. *Why:* durable
  relational store. *iPix:* **separate Postiz Postgres** from the iPix Supabase; sync via webhooks,
  don't co-mingle. Supabase stays the iPix system of record.
- **Multi-tenancy (workspaces).** *What:* workspace/org isolation. *Why:* many accounts/teams.
  *iPix:* one workspace per brand/client; **validate isolation** before external multi-tenant use.
- **AI architecture (agentic post gen + Postiz Agent CLI).** *What:* generate/optimize posts;
  CLI exposes a **discovery workflow** so agents adapt to each platform without hardcoded
  knowledge. *iPix:* our Gemini drafts content; the **Agent CLI** executes posting across channels.
- **Scheduling + queue.** *What:* time-based publishing via a job queue (BullMQ/Redis historically;
  newer builds reference Temporal — **verify**). *Why:* reliable timed/retried posting. *iPix:* the
  engine behind "publish approved assets at the optimal time."
- **APIs / integrations.** *What:* Public API + OAuth per channel. *Why:* programmatic control.
  *iPix:* edge functions/Mastra tools call the API; OAuth tokens stored per brand.
- **Agent system (postiz-agent).** *What:* TypeScript CLI for AI agents to post across 28+
  platforms; framework-agnostic (mentions Claude/OpenClaw). *Why:* turns publishing into a tool a
  reasoning agent can call. *iPix:* the wiring layer between Mastra/Gemini and real channels.

---

## Deliverable 4 — Hostinger Deployment Strategy

Postiz needs: Node app + workers, **Postgres**, **Redis/queue**, Docker. Storage mostly DB +
media references (media on **Cloudinary**, not local). Costs below are **indicative — verify
current Hostinger KVM pricing**; treat as planning ranges.

| Tier | Brands | VPS (Hostinger KVM) | Specs | ~Monthly | Risks | Scaling |
|---|---|---|---|---|---|---|
| **Small** | ~10 | KVM 2 | 2 vCPU / 8 GB / 100 GB | ~$8–12 | single point of failure; queue + DB on one box | vertical bump first |
| **Medium** | ~100 | KVM 4 | 4 vCPU / 16 GB / 200 GB | ~$15–25 | queue contention; backup discipline | split DB to managed Postgres; separate worker node |
| **Large** | ~1,000 | KVM 8 ×N or managed | 8+ vCPU / 32 GB+ / 400 GB+ | ~$40–80+ (multi-node) | multi-tenant isolation, OAuth rate limits, on-call | managed Postgres + Redis, horizontal workers, per-tier gateways |

**Cross-cutting:** automated Postgres backups (daily + PITR at scale), uptime/queue-depth
monitoring, Redis persistence, log shipping. At **Large**, prefer **managed Postgres/Redis** over
self-managed on the VPS; the ops burden is the real cost, not the VPS.

---

## Deliverable 5 — Can Postiz Become an iPix Service? (per stakeholder)

| Stakeholder | Problem | Postiz solution | Pricing opportunity | Upsell |
|---|---|---|---|---|
| **Fashion Designer** | Manual posting to IG/TikTok/Pinterest/FB | Scheduled multi-channel calendar from shoot assets | $/mo scheduling plan | AI captions, campaign packs, analytics |
| **Photographer** | Portfolio promotion, inconsistent cadence | Auto-schedule delivered galleries to channels | $/mo creator plan | DNA-scored "best shot" auto-posts |
| **Model** | Personal-brand content calendar | Branded calendar + reminders | $/mo personal plan | trend/hashtag AI, growth analytics |
| **Agency** | Many clients, approvals, teams | Workspaces + approval workflows | $/seat or per-client | white-label (license-gated), managed service |
| **Event Organizer** | Campaign + event promotion across channels | Campaign calendar + scheduled rollout | per-campaign or $/mo | sponsor co-posting, post-event analytics |

---

## Deliverable 6 — iPix Integration Map

| iPix Module | Postiz Role | Priority |
|---|---|---|
| **IPI-18 · AI-001 — Brand Intelligence Engine** | None (upstream); supplies channel/voice context to caption gen | — |
| **IPIX-CAMP-001 — Campaign System** | Campaign → content calendar → scheduled rollout | High |
| Creative Planning | None (Mastra Creative Director); Postiz consumes outputs | — |
| **IPI2-104 · SHOOT-UX-001 — Shoot System** | Approved/DNA-passed assets become schedulable posts | High |
| Asset Library | Source of media (via Cloudinary) for posts | High |
| **Publishing (POSTIZ-001 — Postiz webhook → asset published)** | **The engine** — scheduling, posting, retries | **Critical** |
| Analytics | Pulls per-post performance back into the learning loop | Med |
| **IPIX-MKT-001 — Booking Marketplace** | Vendor/creator self-promotion as a marketplace add-on | Med (later) |

---

## Deliverable 7 — AI-Powered Publishing Workflow

```
Brand URL
 → IPI-18 · AI-001 — Brand Intelligence Engine  (Brand DNA, voice, channels)
 → IPIX-CAMP-001 — Campaign System              (goal, deliverables, calendar)
 → IPI2-104 · SHOOT-UX-001 — Shoot System       (shots → assets)
 → Asset DNA Scoring                            (only DNA-passed assets are publishable)
 → AI Content Generation (Gemini)               (captions, hashtags, per-channel variants)
 → HITL approval (CopilotKit card)              (operator approves the post + time)
 → Postiz (POSTIZ-001 — Postiz webhook → asset published)  (schedule + publish via Agent CLI/API)
 → Channels                                     (IG/TikTok/Pinterest/…)
 → Analytics                                    (per-post metrics → Supabase)
 → Learning Loop                                (feeds next campaign's brief & DNA)
```
**Every step:** DNA gates what's publishable → Gemini drafts channel-specific copy → operator
approves (no silent posting) → Postiz schedules/publishes → metrics return to Supabase → the loop
improves the next brief. Postiz owns *only* schedule+publish+retry; iPix owns intelligence, DNA,
approval, and the system of record.

---

## Deliverable 8 — Postiz + Gemini

| Function | Gemini (intelligence) | Postiz (execution) |
|---|---|---|
| Caption generation | ✅ drafts per-channel copy from Brand DNA + asset | renders/schedules the post |
| Hashtag generation | ✅ trend/brand-aware tags | attaches to post |
| Campaign generation | ✅ via Campaign System | turns into a scheduled calendar |
| Trend recommendations | ✅ analysis | — |
| Content calendar generation | ✅ proposes cadence/timing | enforces the schedule/queue |
| Performance analysis | ✅ interprets metrics → next brief | provides raw analytics |

**Rule:** Gemini **thinks**, Postiz **acts**. Never ask Postiz's built-in AI to be the brain —
the Brand-DNA-aware intelligence is iPix's moat and stays in Gemini/Mastra.

---

## Deliverable 9 — Postiz + CopilotKit (publishing cockpit)

**Yes — Postiz becomes the execution backend behind a CopilotKit cockpit.** No Postiz UI is
exposed to the operator; iPix renders the calendar/approval in CopilotKit.

**"Create next month's swimwear campaign":**
```
CopilotKit UI → Mastra Campaign/Creative agents
  → Gemini: campaign plan + per-channel captions + calendar
  → CopilotKit renders editable calendar artifact (L4)
  → operator approves (HITL, L5)
  → edge-function/Mastra tool → Postiz Agent CLI/API: schedule posts
  → webhook (POSTIZ-001) on publish → Supabase + ai_agent_logs
```
Context: Brand DNA + assets (Supabase). Agents: Mastra. Memory: Supabase. Approval: CopilotKit
card before any post is scheduled.

---

## Deliverable 10 — Postiz + Mastra (responsibilities)

| Capability | Owner |
|---|---|
| Generate content (captions/hashtags) | **Gemini**, invoked by Mastra |
| Generate campaigns | **Mastra** Campaign/Creative agents (IPIX-CAMP-001) |
| Schedule content | **Postiz** (via Mastra tool → Agent CLI/API) |
| Analyze performance | **Gemini/Mastra** read Postiz analytics → Supabase |

**Mastra orchestrates and gates; Postiz executes scheduling.** Mastra never re-implements
scheduling; Postiz never makes brand decisions. One tool call (`schedulePosts`) bridges them,
behind HITL.

---

## Deliverable 11 — Marketplace Opportunity (license-aware)

| Option | What | License reality | Verdict |
|---|---|---|---|
| **A — Included with iPix** | Publishing is a built-in iPix feature, single internal Postiz | AGPL fine for internal/first-party use | ✅ **Phase 1–2** |
| **B — Paid add-on** | Brands pay for the scheduler tier | If brands interact with Postiz over network → AGPL source-disclosure applies, **or** commercial license | ⚠️ **needs licensing resolved** |
| **C — Standalone product** | Sell Postiz-as-a-service separately | Same AGPL trigger as B | ⚠️ licensing-gated |
| **D — White-label SaaS** | Rebranded Postiz resold | **Almost certainly requires a Gitroom commercial/white-label license** | ⚠️ buy the license first |

**Recommendation: A → B.** Ship publishing **included** (internal Postiz, first-party feature)
to prove value, then graduate to a **paid add-on (B)** *only after* resolving licensing — get a
**commercial/white-label agreement from Gitroom** (cleanest), or architect strict AGPL compliance.
Do **not** launch D (white-label) without the license in hand.

---

## Deliverable 12 — 10 Revenue Streams

| # | Stream | Difficulty | Revenue potential | Time to launch |
|---|---|---|---|---|
| 1 | Designer Social Plan (scheduler tier) | Low | Med | Short (post-license) |
| 2 | Creator Plan (photographer/model) | Low | Med | Short |
| 3 | Agency / multi-client Plan | Med | High | Medium |
| 4 | AI Content Packs (Gemini caption/hashtag bundles) | Low | Med | Short |
| 5 | Campaign-as-a-Service (done-for-you calendar) | Med | High | Medium |
| 6 | Event Promotion Plan | Med | Med | Medium |
| 7 | Analytics/Insights premium tier | Med | Med | Medium |
| 8 | White-Label accounts (agencies) | High | High | Long (license) |
| 9 | Managed Service (we run it for you) | Med | High | Medium |
| 10 | Marketplace add-on for IPIX-MKT-001 — Booking Marketplace creators | Med | High | Long |

Quickest leverage: **#1, #2, #4** (publishing tier + AI content packs) once licensing clears.

---

## Deliverable 13 — Implementation Roadmap

- **Phase 1 — Internal use.** Self-host Postiz (Small VPS); use it for **iPix's own** marketing.
  Wire **POSTIZ-001 — Postiz webhook → asset published**. Validate scheduling, OAuth, analytics.
  No external customers → AGPL clean. (Prereqs: Asset Library + DNA + Cloudinary.)
- **Phase 2 — Designer accounts (included feature).** Offer scheduling **inside iPix** to brands
  as a first-party feature. Gemini caption gen + CopilotKit calendar + HITL. **Resolve licensing
  before any external billing.**
- **Phase 3 — Agency & multi-brand.** Workspaces, approvals, per-client isolation; validate
  multi-tenant security; Medium/Large VPS or managed Postgres/Redis. Commercial license for
  white-label if pursued.
- **Phase 4 — AI Publishing OS.** Gemini + CopilotKit + Mastra + Postiz: "describe the campaign →
  approve → it publishes and learns." Ties IPIX-CAMP-001 — Campaign System and IPIX-MKT-001 —
  Booking Marketplace into one publishing+performance loop.

---

## Deliverable 14 — Final Recommendation (CTO answer)

**"If I were launching iPix today, how would I use Postiz?"**

Adopt Postiz as the **open-source publishing engine for the iPix Publishing stage** — never as the
brain or the UI. **Self-host on Hostinger** (Small VPS now, managed Postgres/Redis at scale), run
it **headless**, and drive it through the **Postiz Agent CLI + Public API** behind **Mastra**
tools, with **Gemini** generating content and **CopilotKit** providing the approval cockpit.
Keep **Supabase** the system of record; sync via the **POSTIZ-001 — Postiz webhook → asset
published**. Gate every post behind **HITL** (no silent posting) and only publish **DNA-passed**
assets. **Monetize A → B:** ship publishing included first, then a paid add-on **after** securing
a Gitroom **commercial/white-label license** — do not resell or white-label under AGPL without it.

- **Architecture:** headless Postiz ← Mastra tools ← CopilotKit cockpit; Gemini for content; Supabase system of record; Cloudinary media.
- **Hosting:** Hostinger VPS (Small→Large), managed DB/Redis at scale, backups + monitoring.
- **Pricing/Monetization:** included (Phase 2) → paid add-on (Phase 3) → managed/white-label (Phase 4, licensed).
- **AI integration:** Gemini thinks, Mastra orchestrates, CopilotKit approves, Postiz executes.
- **Marketplace:** publishing add-on for IPIX-MKT-001 — Booking Marketplace creators.
- **Roadmap:** internal → designer → agency → AI Publishing OS.

**Optimized for:** speed (self-host today), low cost (OSS + small VPS), open-source leverage,
fashion fit (IG/TikTok/Pinterest-first), recurring revenue (scheduler tiers), AI-native (Gemini +
Mastra + CopilotKit + Postiz).

---

## Open questions & risks
- **R-1 (top): AGPL-3.0.** Reselling/white-label requires source disclosure or a Gitroom commercial license. **Resolve before any paid external offering.**
- R-2: Verify queue engine (BullMQ/Redis vs Temporal) and exact channel count in the version you deploy.
- R-3: Multi-tenant isolation — validate workspace isolation is SaaS-grade before external clients.
- R-4: OAuth/app review per channel (Instagram/TikTok/etc.) — each platform has its own approval + rate limits.
- R-5: Self-host ops burden (backups, upgrades, monitoring) — budget for it; consider managed DB/Redis early.
- Q-1: Separate Postiz Postgres vs shared infra — recommend separate, synced by webhook.
- Q-2: Per-brand OAuth token storage + rotation strategy.

## Definition of Done (audit acceptance)
- [ ] Postiz positioned as the **Publishing engine** (POSTIZ-001), headless, behind Mastra/CopilotKit/Gemini.
- [ ] Supabase remains system of record; Postiz DB separate, synced by webhook.
- [ ] Every post gated by HITL; only DNA-passed assets publishable.
- [ ] **Licensing resolved (AGPL compliance or commercial license) before any paid/white-label offering.**
- [ ] Hosting plan sized (Small/Medium/Large) with backups + monitoring.
- [ ] Consistent with prd.md, docs/prd/campaign-prd.md, docs/prd/shoot-prd.md, docs/prd/openclaw-prd.md.
- [ ] No production code, migrations, or schema changed by this PRD pass.
