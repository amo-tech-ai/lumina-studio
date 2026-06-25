---
id: PRD-OPENCLAW-001
title: "OpenClaw Deep Audit & iPix Integration Strategy"
version: "1.0"
status: Audit + recommendation — decision-ready
priority: P2 (deferred Phase 3+ per prd.md §4.10)
date: "2026-06-21"
owner: Principal AI Architect / Venture CTO review
repo_audited: "https://github.com/openclaw/openclaw"
verified_against:
  - prd.md §4.10 (OpenClaw — Orchestration & Automation Layer; already deferred Phase 3+)
  - mvp.md (OpenClaw listed out-of-MVP)
  - docs/prd/shoot-prd.md · docs/prd/campaign-prd.md (Mastra + CopilotKit core)
method: "GitHub README via WebFetch + prd.md §4.10. Star/commit counts from the fetch looked inflated and are treated as UNVERIFIED. Internals are from one README pass — verify against the repo before committing engineering."
task_id_convention: "IPI-XXX · TASK-ID — Full Task Name (never bare IDs)"
---

# OpenClaw Deep Audit & iPix Integration Strategy

> **One-line verdict:** OpenClaw is **B/C — an Agent + Workflow *orchestration* layer for a
> different surface than the iPix app** (multi-channel concierge + internal-ops automation). It
> should **augment, not replace** Mastra/CopilotKit/Supabase, stay **deferred to Phase 3+**, and
> be **isolated per trust boundary** because its trust model is built for personal assistants,
> not multi-tenant SaaS. **Answer to the A–G question: B (Agent Framework) + C (Workflow Engine)
> for the comms/ops layer only — NOT A (Core Runtime), NOT E/D (Memory/Knowledge — that's
> Supabase+pgvector).**

> **Method caveat.** This audit is grounded in `prd.md §4.10` (iPix's existing position) plus a
> single README fetch. The popularity figures returned (claimed ~380k stars / ~61k commits) are
> **implausible and unverified** — do not cite them; verify repo health directly (Deliverable 10)
> before any build decision.

---

## Deliverable 1 — Executive Summary

**What is OpenClaw?** A self-hosted, local-first **personal-AI-assistant framework**: a
**Gateway** (control plane for sessions, channels, tools, events) that routes messages from 20+
channels (WhatsApp, Telegram, Slack, Discord, iMessage, Signal…) to **agents**, which load
**Skills** (`SKILL.md` playbooks) and call **Tools** (`exec`, `browser`, `web_search`,
`message`, `canvas`, `cron`) and **Plugins**. TypeScript/Node, MIT-licensed. It already has a
documented role in `prd.md §4.10`.

**What problems it solves:** (1) a conversational **front door** across many messaging channels;
(2) **cross-system automation** (cron jobs, webhooks, browser/web tools) outside the app UI;
(3) a **skills mechanism** to inject domain playbooks into agents; (4) an always-on assistant /
ops copilot.

**What it does NOT solve:** (1) it is **not the in-app UI runtime** (that's CopilotKit v2);
(2) it is **not the in-app typed workflow/agent engine** with suspend/resume HITL inside React
(that's Mastra); (3) it is **not the system of record or durable memory** (that's Supabase +
pgvector); (4) its **trust model is single-user/personal**, explicitly *not* hostile
multi-tenant SaaS (`prd.md:815`) — a hard constraint for iPix.

**Who should use it / why it exists:** built for individuals/small teams wanting an always-on,
multi-channel personal assistant they self-host. For iPix it fits **internal ops + client
concierge over WhatsApp/Slack**, not the customer-facing product core.

### Scorecard
| Category | Score /100 | Basis |
|---|---:|---|
| Architecture | 82 | Clean gateway→agent→skill→tool model; channel breadth is real |
| Documentation | 78 | Extensive per README; depth unverified beyond one pass |
| Extensibility | 88 | Skills + plugins + 20+ channels is its strongest axis |
| Production Readiness | 60 | Release channels exist, **but personal-assistant trust model ≠ SaaS-grade multi-tenant** |
| Multi-Agent Support | 80 | Channel/account routing to isolated agents — real, but coarse vs Mastra workflows |
| Memory | 55 | Session/history memory only; **not** durable system-of-record memory iPix needs |
| Tooling | 80 | Good built-in tool set + MCP; browser/cron/canvas useful for ops |
| iPix Relevance | 62 | High for comms/ops layer; **low** for the in-app product core |
| Long-Term Fit | 65 | Strong as a deferred comms/ops layer; risky if forced into the core |
| **Overall** | **70** | **Adopt as an augmenting comms/ops layer, Phase 3+, isolated — not the core** |

---

## Deliverable 2 — Architecture Review (beginner-friendly)

For each: *what · why · real-world example · how iPix could use it.*

- **Core (Gateway).** *What:* a local control plane that receives messages, holds sessions,
  dispatches to agents. *Why:* one front door for many channels. *Example:* a WhatsApp message
  and a Slack message both land in the same gateway. *iPix:* the entry point for a WhatsApp
  **client concierge** that takes a brand brief by chat.
- **Agent architecture.** *What:* isolated agents selected by channel/account/context. *Why:*
  different jobs need different behavior and separation. *Example:* a "Sales" agent vs a "Support"
  agent on different numbers. *iPix:* the four agents already named in `prd.md:782` (Sales,
  Creative Strategist, Ops, Client Success) — **internal**, not per-customer in one gateway.
- **Tool architecture.** *What:* typed functions (`exec`, `browser`, `web_search`, `message`,
  `canvas`, `cron`). *Why:* lets the agent *do* things, not just chat. *Example:* agent scrapes a
  brand site with `browser`. *iPix:* research a brand URL, fill a form, schedule a follow-up.
- **Memory architecture.** *What:* session history. *Why:* continuity within a conversation.
  *Example:* remembers what the client said earlier in the thread. *iPix:* **thread memory only**
  — durable Brand/Campaign/Asset memory must stay in Supabase+pgvector (Deliverable 5/6).
- **Workflow architecture.** *What:* cron jobs + webhooks/hooks. *Why:* time- and event-driven
  automation. *Example:* a daily 9am digest. *iPix:* nightly lead scrape, weekly performance
  report, "campaign heartbeat" reminders.
- **MCP support.** *What:* Model Context Protocol client. *Why:* plug external tools/data via a
  standard. *Example:* connect a Supabase MCP. *iPix:* expose read-only Supabase MCP to an ops
  agent for status questions.
- **Context handling.** *What:* per-session/channel context with allowlists. *Why:* keeps agents
  scoped. *iPix:* scope each gateway to one trust boundary (one client tier / internal ops).
- **Human-in-the-loop.** *What:* pairing codes + allowlist approval before an agent acts. *Why:*
  safety. *iPix:* matches the iPix "no silent writes" rule — but note this is **chat-level** HITL,
  weaker/coarser than Mastra's typed suspend/resume + CopilotKit approval cards inside the app.

---

## Deliverable 3 — Compare Against Current Stack

OpenClaw competes on a **different surface** (multi-channel comms + ops automation), so "winner"
is per-capability, not absolute.

| Capability | Mastra | CopilotKit v2 | Google ADK | OpenClaw | Winner (for iPix) |
|---|---|---|---|---|---|
| In-app agents | ✅ typed route agents | (UI for agents) | ✅ | ~ (chat agents) | **Mastra** |
| Workflows | ✅ suspend/resume | — | ✅ long-running | ~ cron/hooks | **Mastra** (in-app); OpenClaw for cron/ops |
| Durable memory | (via Supabase) | — | partial | ✗ session only | **Supabase + pgvector** |
| Tools | ✅ typed | ✅ frontend tools | ✅ | ✅ built-in + MCP | tie (different scopes) |
| HITL | ✅ typed, in-app | ✅ approval cards | ✅ | ~ pairing/allowlist | **Mastra + CopilotKit** |
| Context | ✅ agent context | ✅ readable UI state | ✅ | ~ session/channel | **CopilotKit** (in-app) |
| Observability | ✅ logs/evals | — | ✅ | ~ | **Mastra / ADK** |
| Multi-agent systems | ✅ | — | ✅ strong | ✅ routing | **ADK / Mastra** (orchestration); OpenClaw (channel routing) |
| Learning loop | (via Supabase) | — | partial | ✗ | **Supabase** |
| Extensibility | ✅ | ✅ | ✅ | ✅✅ skills+plugins+channels | **OpenClaw** (channels/skills) |
| Developer experience | ✅ TS | ✅ React | ~ heavier | ✅ TS, self-host ops cost | **Mastra/CopilotKit** |
| **Multi-channel comms (WhatsApp/Slack…)** | ✗ | ✗ | ✗ | ✅✅ | **OpenClaw** |

**Read:** OpenClaw wins exactly one thing the others don't even attempt — **multi-channel
conversational + ops automation**. Everywhere the iPix *product* lives (in-app agents, typed
HITL, durable memory), the current stack wins. They are complements, not substitutes.

---

## Deliverable 4 — iPix Use Cases

| Task | Can OpenClaw help? | How | Replaces? | Improves? | Complexity |
|---|---|---|---|---|---|
| **IPI-18 · AI-001 — Brand Intelligence Engine** | Indirectly | A WhatsApp concierge could *trigger* the existing `brand-intelligence` edge function and return results in chat | Nothing (edge fn stays system of record) | Adds a chat channel for intake | Low–Med |
| **IPI-23 · UI-002 — Brand Intake Screen** | Alternative channel | "Send your brand URL on WhatsApp" → Sales Agent runs intake | Nothing (in-app screen stays canonical) | Reach/convenience; off-app capture | Med |
| **IPI-24 · UI-003 — Asset Library Screen** | No (core) | Asset library is in-app + Cloudinary + Supabase | — | — (maybe ops alerts on DNA fails via Slack) | N/A |
| **IPI-25 · UI-004 — Product Links Screen** | No (core) | In-app commerce linking (Mercur/Medusa) | — | — | N/A |
| **IPI2-104 · SHOOT-UX-001 — Shoot System** | Adjacent only | Ops Agent sends call-sheets/reminders to crew on WhatsApp/Slack after approval; `production-planner` (Mastra) still plans | Nothing in the shoot core | Crew comms + reminders, not planning | Med |
| **IPIX-CAMP-001 — Campaign System** | Adjacent | "Campaign heartbeat" cron nudges, status digests to Slack; Creative Director Agent stays Mastra | Nothing in campaign core | Proactive nudges, async approvals over chat | Med |
| **IPIX-MKT-001 — Booking Marketplace** | Adjacent | Vendor/lead comms, booking reminders, no-show nudges over WhatsApp | Nothing in booking core | Comms + recovery loop (Seekda-style) | Med–High |

**Pattern:** in **every** case OpenClaw is the **comms/automation skin around** an iPix core
that stays on Mastra + CopilotKit + Supabase. It replaces *nothing* in the product core.

---

## Deliverable 5 — Fashion-Specific Opportunities

OpenClaw can power **comms-facing memory and loops** — but the durable memory lives in Supabase;
OpenClaw *reads/triggers* it.

- **Brand DNA / Campaign / Creative / Asset / Shoot / Marketplace memory:** the **system of
  record is Supabase + pgvector** (`brands`, `brand_scores`, shoot/campaign tables, embeddings).
  OpenClaw agents query it via MCP/edge tools and converse about it — they should **not** be the
  store.
- **Learning loops:** OpenClaw cron jobs are a great *trigger* ("weekly: summarize top-performing
  shoot types and DM the operator") that reads `post_analytics`/DNA rollups.
- **Recommendation systems:** matching/recommendation stays the Mastra **Matching Agent** (the
  iPix moat); OpenClaw can *deliver* recommendations to a channel.

**Worked example — "5,000 assets · 200 campaigns · 50 shoots":** the brand's history lives in
Supabase/pgvector. OpenClaw's role is **not** to hold it but to make it *conversational and
proactive*: an Ops Agent answers "which Q3 shoot drove the best Amazon CTR?" by calling a
read-only Supabase MCP, and a cron skill DMs a weekly "3 underperforming PDP images flagged by
DNA — reshoot?" nudge. The intelligence is iPix's; OpenClaw is the **mouth and the alarm clock**,
not the brain or the memory.

---

## Deliverable 6 — OpenClaw + Supabase

| Layer | OpenClaw | Supabase | pgvector |
|---|---|---|---|
| System of record | ✗ | ✅ all brand/shoot/campaign/asset tables | — |
| Durable memory / embeddings | ✗ (session only) | ✅ rows + RLS | ✅ similarity search |
| Retrieval | calls a **read-only Supabase MCP / edge tool** | serves data under RLS | ranks matches |
| Context to agent | injects retrieved rows into session | source | source |
| Writes | only via **approved** edge-function tools (no direct DB) | enforces RLS / service-role boundary | — |

**Design:** OpenClaw agents get a **read-mostly** Supabase MCP and a small set of **write tools
that wrap edge functions** (which keep the HITL + `ai_agent_logs` audit). OpenClaw never holds a
service-role key broadly and never writes tables directly — same boundary the rest of iPix uses.

---

## Deliverable 7 — OpenClaw + CopilotKit

**Can OpenClaw be the backend intelligence while CopilotKit stays the UI?** Partially — but
**only for the chat/comms surface**, not the in-app operator hub. The in-app experience already
has its backend intelligence: **Mastra** (agents/workflows) behind **CopilotKit v2** (UI). Don't
route the in-app hub through OpenClaw — you'd add a hop and lose typed suspend/resume HITL.

Where it *does* fit: a **WhatsApp/Slack** surface where OpenClaw is the runtime and CopilotKit is
absent (no React there).

**Flow — operator says "Generate next month's campaign" (in-app → Mastra; or on WhatsApp → OpenClaw):**
```
In-app path (preferred):
  CopilotKit UI → Mastra Creative Director / Campaign agent → drafts (campaign, brief, deliverables)
   → CopilotKit approval card (HITL) → commit to Supabase → ai_agent_logs

OpenClaw path (comms surface, Phase 3+):
  WhatsApp msg → OpenClaw Gateway → routed Campaign agent (Skill: campaign planning)
   → tools: read Supabase MCP (brand DNA, past perf) → draft campaign
   → HITL: agent posts plan + "approve?" → operator replies "approve"
   → write tool wraps edge function → Supabase + ai_agent_logs
```
Context flow: brand/DNA from Supabase. Agent flow: one routed agent + skill. Memory flow:
durable in Supabase, session in OpenClaw. Approval flow: chat-level confirm → edge-function write
(same audit trail).

---

## Deliverable 8 — OpenClaw + Mastra

Options: (1) OpenClaw replaces Mastra · (2) OpenClaw augments Mastra · (3) Mastra replaces
OpenClaw · (4) Use both.

**Recommendation: (2) OpenClaw augments Mastra — and they own different surfaces.**

- **Mastra** = the **in-app** typed agent/workflow engine with suspend/resume HITL behind
  CopilotKit (shoots, campaigns, matching). This is the product core.
- **OpenClaw** = the **multi-channel comms + ops automation** layer (WhatsApp concierge, cron
  digests, internal ops agents).

Why not replace Mastra: OpenClaw's HITL is chat-level/coarse, its memory is session-only, and its
trust model is single-user — all wrong for the multi-tenant in-app product. Why not drop
OpenClaw: nothing else in the stack does 20+ channel comms + always-on automation. **Use both,
cleanly separated**, sharing Supabase as the system of record.

---

## Deliverable 9 — OpenClaw + Google ADK

| Axis | Google ADK | OpenClaw |
|---|---|---|
| Complexity | Higher (Google ecosystem, infra) | Moderate (self-host ops) |
| Scalability | Strong for orchestrated multi-agent | Strong for channels; coarse orchestration |
| Long-running workflows | ✅ native | ~ cron/hooks |
| Memory | partial/managed | session only |
| Multi-agent orchestration | ✅✅ structured | ✅ channel routing |

**Recommendation: Neither as a core dependency now; Hybrid only if proven.** ADK stays the
**deferred** answer for *long-running, structured multi-agent campaign orchestration* (consistent
with `docs/prd/campaign-prd.md` §1 non-goals) — adopt **only** if a real workflow outgrows Mastra
suspend/resume. OpenClaw remains the deferred **comms/ops** layer. They don't compete: ADK would
orchestrate *inside* the product; OpenClaw orchestrates *across channels*. Default to **Mastra
only** until a concrete need forces one of them in.

---

## Deliverable 10 — Repository Deep Dive (with honesty flag)

From the README pass: MIT license, TypeScript/Node 22+/24, monorepo with bundled `extensions/*`,
release channels (stable/beta/dev), security runbooks, ClawHub skills registry, Discord community.
**Health signals (stars/commits) returned by the fetch were implausibly large (~380k stars) and
are treated as UNVERIFIED — likely a summarizer artifact.**

**Before trusting it for a startup, verify directly:**
```
gh repo view openclaw/openclaw --json stargazerCount,pushedAt,licenseInfo,openIssues
gh api repos/openclaw/openclaw/commits --paginate | ...   # commit velocity
```
**Is it alive / production-ready / experimental?** README presents it as mature with stable
channels — but the **personal-assistant trust model is the real "production" caveat for SaaS**,
not code maturity. **Would I trust it for a startup?** Yes — **for internal ops + a single-tenant
client concierge**, isolated per trust boundary. **No** — as the multi-tenant customer-facing
runtime.

---

## Deliverable 11 — What Should We Actually Build? (3 options)

### Option A — Current stack only (Gemini · Mastra · CopilotKit · Supabase)
- **Pros:** simplest; one trust model; typed HITL; everything in-app; nothing new to self-host.
- **Cons:** no multi-channel comms; no always-on automation; client intake is app-only.
- **Cost:** lowest. **Complexity:** lowest. **Time-to-market:** fastest. **Maintainability:** highest.

### Option B — Current stack + OpenClaw (RECOMMENDED, Phase 3+)
- **Pros:** adds WhatsApp/Slack concierge + cron ops automation **without touching the core**;
  reuses skills; OpenClaw isolated per trust boundary; Supabase stays system of record.
- **Cons:** a self-hosted service to run/secure; per-client isolation discipline required;
  two agent runtimes to reason about (kept on separate surfaces).
- **Cost:** moderate (self-host + ops). **Complexity:** moderate. **Time-to-market:** medium
  (deferred). **Maintainability:** good if surfaces stay separated.

### Option C — Current stack + OpenClaw + Google ADK
- **Pros:** adds heavy structured multi-agent orchestration for future campaign/marketplace scale.
- **Cons:** **three** orchestration paradigms (Mastra + OpenClaw + ADK) = the "agent soup" iPix
  explicitly avoids; highest cognitive + ops load; Google coupling.
- **Cost:** highest. **Complexity:** highest. **Time-to-market:** slowest. **Maintainability:** lowest.

---

## Deliverable 12 — Final Recommendation (CTO answer)

**"If I were CTO of iPix today, how would I use OpenClaw?"**

**Choose Option B, deferred to Phase 3+, scoped tightly.** Keep **Mastra + CopilotKit v2 +
Supabase/pgvector** as the product core (in-app agents, typed HITL, durable memory). Introduce
**OpenClaw as a separate comms/ops layer** — a WhatsApp/Slack concierge + cron automation —
**isolated per trust boundary**, holding **no durable memory** and **no broad write access**
(writes go through audited edge functions). **Do not adopt Google ADK** until a real long-running
multi-agent workflow outgrows Mastra suspend/resume. This is the simplest architecture with the
most leverage: it adds reach + automation without diluting the core or its safety model.

### Architecture
```
                         ┌────────────── iPix Product Core (multi-tenant SaaS) ──────────────┐
  Operator (browser) ──▶ │  CopilotKit v2 UI  ──▶  Mastra agents (shoot/campaign/matching)   │
                         │            ▲                         │ typed HITL suspend/resume    │
                         │            └──── approval cards ──────┘                              │
                         └───────────────────────────┬──────────────────────────────────────┘
                                                      │  (edge functions: HITL + ai_agent_logs)
                                                      ▼
                                   ┌──────────  Supabase  ──────────┐   system of record
                                   │  Postgres · RLS · pgvector     │   (Brand DNA, campaigns,
                                   │  ai_agent_logs · embeddings    │    shoots, assets, perf)
                                   └───────────────┬────────────────┘
                                                   ▲  read-only MCP + audited write tools
        Client / crew (WhatsApp,                   │
        Slack, Telegram) ───────▶  OpenClaw Gateway (Phase 3+, isolated per trust boundary)
                                   └─ routed agents (Sales/Creative/Ops/Client-Success)
                                      + Skills (SKILL.md) + cron/hooks + browser/web tools
```

### Data flow
Channel msg → OpenClaw Gateway → routed agent → **read** Supabase via MCP → draft → chat HITL →
**write** via edge function → Supabase + `ai_agent_logs`. In-app path bypasses OpenClaw entirely
(CopilotKit → Mastra → edge → Supabase).

### Agent flow
In-app: `production-planner` / Creative Director / Matching (Mastra). Comms: Sales / Creative
Strategist / Ops / Client Success (OpenClaw, `prd.md:782`). **Same brand context, different
surface.**

### Memory flow
Durable = Supabase + pgvector (the brain). Session = OpenClaw (conversation continuity only).
OpenClaw never becomes the memory layer.

### Roadmap (aligned to `prd.md §4.10` phases)
- **Now → 8-proof MVP:** Option A. OpenClaw **not** on the critical path. Verify repo health
  (Deliverable 10) opportunistically.
- **Phase 3 (post-core):** Option B Phase 1 — one gateway, internal ops + one WhatsApp Sales
  Agent triggering **IPI-18 · AI-001 — Brand Intelligence Engine** and capturing intake for
  **IPI-23 · UI-002 — Brand Intake Screen**.
- **Phase 3+:** crew comms for **IPI2-104 · SHOOT-UX-001 — Shoot System**, heartbeat nudges for
  **IPIX-CAMP-001 — Campaign System**, lead/no-show recovery for **IPIX-MKT-001 — Booking
  Marketplace** — all as comms/automation around unchanged cores. Per-client isolated gateways.
- **Only if proven:** revisit Google ADK for structured long-running orchestration; otherwise stay
  Mastra.

### Optimized for
1. **Speed to market** — core ships on Option A; OpenClaw deferred.
2. **Low maintenance** — surfaces separated; one system of record.
3. **AI-native workflows** — chat + cron automation extend, don't replace, in-app agents.
4. **HITL safety** — all writes via audited edge functions; OpenClaw isolated, read-mostly.
5. **Fashion-specific intelligence** — stays in Supabase/Mastra (Brand DNA moat); OpenClaw delivers it.
6. **Future marketplace expansion** — OpenClaw is the natural vendor/client comms + recovery layer for **IPIX-MKT-001 — Booking Marketplace**.

---

## Open questions & risks
- Q-1: Verify OpenClaw repo health (stars/commits/issues) — the fetched numbers are unverified.
- Q-2: Multi-tenant isolation model — one gateway per client tier vs per client; cost/ops tradeoff.
- Q-3: Confirm OpenClaw can consume a Supabase **MCP** read-only cleanly (security boundary).
- R-1: Trust model — personal-assistant design in a SaaS context is the top risk; never share a gateway across unrelated clients (`prd.md:815`).
- R-2: "Agent soup" — three runtimes (Mastra/OpenClaw/ADK) is a real maintainability risk; keep surfaces separate and ADK out until forced.
- R-3: Self-host ops burden (security runbooks, updates) — budget for it before Phase 3.

## Definition of Done (audit acceptance)
- [ ] OpenClaw positioned as **augmenting** comms/ops layer (Option B), **not** core runtime, **not** memory layer.
- [ ] Mastra + CopilotKit + Supabase confirmed as the product core; OpenClaw deferred Phase 3+.
- [ ] Google ADK explicitly deferred (no third orchestration layer now).
- [ ] All writes from OpenClaw go through audited edge functions; no broad DB access.
- [ ] Per-trust-boundary isolation mandated before any client-facing use.
- [ ] Repo health verified (Deliverable 10) before engineering commitment.
- [ ] Consistent with `prd.md §4.10`, `docs/prd/shoot-prd.md`, `docs/prd/campaign-prd.md`.
