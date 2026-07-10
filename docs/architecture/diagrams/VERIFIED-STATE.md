# iPix / FashionOS — Verified Implementation State

**Date:** 2026-07-09 · Compiled from the 16-diagram consolidated architecture set, each independently re-verified against `app/`, `supabase/`, `services/cloudflare-worker/`, `prd.md`, and `roadmap.md` during this pass — not carried forward from documentation claims alone.

## Current implementation (🟢 Built — real, shipped, verified in code)

- **Brand, CRM, Booking, Shoot** — all four have real Mastra agents, real API routes, real Supabase schemas. This is the platform's solid core.
- **Assets / Cloudinary pipeline** — upload → signed URL → transform → deliver, confirmed working.
- **Supabase Postgres** — system of record, 157+ real migrations, confirmed as the only persistent store in use.
- **AI Gateway Worker** (`services/cloudflare-worker/`) — deployed and real, though see Partial section for what it's *not yet* connected to.
- **CI pipeline** — 4 real jobs (`supabase-web015`, `app-build`, `booking-gate-check`, `booking-gate`).
- **HITL pattern** — enforced via `ApprovalCard` (UI) + Mastra `suspend/resume` (workflow) + RLS-scoped writes via a user-authenticated client (data layer) — this last mechanism was corrected during verification (see Documentation Assumptions below).
- **Audit logging** — `planner.events` and `ai_agent_logs` both real, both confirmed directly in migration SQL.
- **Feature Dependency Graph / Roadmap Timeline** — both diagrams matched `prd.md` §14 / `roadmap.md` §6 with zero drift.

## Partial implementation (🟡 — some real, some not)

- **Cloudflare hosting migration** (~55-58%) — OpenNext scaffolding exists and the preview script now serves a real `*.workers.dev` URL, but Vercel remains the actual production host; no CI job builds the OpenNext bundle yet.
- **AI Gateway wiring** — the Gateway Worker is deployed, but Mastra agents don't call it. `provider.ts` resolves Gemini/Groq directly; zero `AI_GATEWAY_URL` references anywhere in the app. This is the platform's single biggest infrastructure gap.
- **Model provider registry** — the deployed `model-registry.ts`'s `DEFAULT_REGISTRY` uses Gemini for the `default`/`fast`/`structured` tiers, not Workers AI as `prd.md` §4.4 originally stated (now corrected). KV's binding is commented out despite being marked "Use now."
- **Agent/tool registry** — `agentTools` is a working barrel file (20 tools) but not yet a declarative, HITL-classified registry (`IPI-465`). A 9th real agent, `public-marketing-agent`, runs outside the main registry entirely. `production-planner` holds 17 of 20 tools, not the "10" previously documented.
- **Planner backend** — schema + engine are real and in 2 open, CI-green PRs (#283/#284), not yet merged to `main`.
- **Notifications** — the API/DB layer is real, but the table is not in the `supabase_realtime` publication (frontend polls REST), and **no `NotificationCenter` component exists in the codebase at all** — this was previously documented as an existing dropdown, corrected.
- **CRM approval gates** — real tools exist, but approval is conversational, not a stored/enforced gate like Booking's.
- **Authentication** — real OAuth flow via Supabase Auth, but the host-trust allowlist doesn't yet include the eventual Cloudflare production domain — a live blocker for cutover, not just a gap.

## Planned / target state (⚪ — documented, zero code)

- **Planner UI** — all 4 routes (`/app/planner`, `/app/planner/[instanceId]`, `/app/planner/dashboard`, `/app/planner/[instanceId]/settings`) have Claude Design prompts (`SCR-32`–`35`) but zero implementation code.
- **Campaign** — database schema deployed; no lib module, no API route, no agent, no UI beyond a stub.
- **Cloudflare Durable Objects** (Planner presence/cursor sync, `IPI-480`) — zero code anywhere on disk, no `cloudflare/planner-*` directories exist.
- **Cloudflare Queues** (notification fan-out, `IPI-481`) — same, zero code.
- **Prompt Registry** (`IPI-473`) — zero code anywhere in `app/src/mastra`.
- **Provider Registry/Adapter as a class** — doesn't exist; provider resolution is still ad hoc in `provider.ts`.
- **R2, Vectorize** — genuinely undecided per `prd.md` §4.1 ("Evaluate"/"Defer"), not provisioned.
- **Intelligence standalone page** — an open product question, not even a committed target yet.

## Documentation assumptions found to be wrong (and what's true instead)

All of the following were corrected in `prd.md` directly (dated 2026-07-09) during this diagramming effort, or noted inline in the relevant diagram where the source doc was outside this session's ownership:

| Assumption | Reality |
|---|---|
| Writes only ever go through service-role edge functions | Mastra tools call Supabase RPCs directly via a user-scoped client, RLS-enforced |
| Workers AI is the MVP default provider | Deployed code defaults to Gemini for 3 of 5 tiers |
| production-planner has "10 tools" | Actually 17 of 20 registered tools |
| `campaign_deliverables` "needs schema" | Already deployed, different columns than assumed |
| `NotificationCenter` exists, reuses `SCR-15` | Doesn't exist in code at all |
| `public.notifications` is "Realtime-enabled" | Polled via REST; only brand-crawl progress is actually live-Realtime |
| KV is "Use now" (implying provisioned) | Binding commented out in `wrangler.jsonc` |
| `campaigns.status` is a plain text column | It's a real Postgres enum (`campaign_status`) |
| Brand Agent has 2 separate approval points | One combined suspend/resume gate |
| `PlannerEngine.createInstance()` exists | Not in the real engine — it's intentionally pure/no-writes |
| `AtRisk` is a real Planner instance status | It's a computed UI overlay, never persisted |
