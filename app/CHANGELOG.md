# Changelog — Lumina Studio Operator App (`app/`)

All notable changes to the Next.js operator app. Format: date · PR · summary.

---

## [Unreleased] — PR #62 (ready to merge)

### Security
- **C3v2** — Replace WeakMap with `AsyncLocalStorage` for per-request operator identity. WeakMap missed when CopilotKit internally wraps the Request object; ALS propagates the resolved user through the full async call-stack without any Request-key dependency. `withOperatorAuth` is now called exactly once per request, at the HTTP boundary (`handler`), never inside agent factory or `identifyUser` callbacks.
- **C1** — `SubmitLeadSchema` now accepts `name`; `buildCaptureLeadPayload` forwards it to `capture-lead`. Visitor names were previously silently dropped at the API layer.
- **C2** — `getAnonId()` wraps `localStorage` in try/catch; module-level `_memoryAnonId` ensures the same anon UUID is reused for the full page session when storage is unavailable (Safari private mode, quota-exceeded).
- **C5** — `publicMarketingAgent` removed from the shared operator Mastra registry. It now lives only in `publicMastra`; the operator runtime never sees it.

### Features
- `src/middleware.ts` wired — Next.js entry point re-exports `proxy` + `config`, completing the IPI2-127 `/app/*` auth gate.
- `marketing-chat-lead.tsx` — extracted lead helpers (`getAnonId`, `LeadSchema`, `submitMarketingLead`, `LeadResultView`) with C2 fix applied.

### Tests (237 passing)
- `marketing-chat.render.test.tsx` — feature-flag render guards for `MarketingChat`
- `marketing-chat.behavior.test.tsx` — `getAnonId` persistence, `submitMarketingLead`, `LeadResultView` states
- `middleware.test.ts` — middleware re-exports proxy + config (IPI2-127 wiring)
- `operator-middleware-contract.test.ts` — file-system contract: `middleware.ts` must exist and export proxy
- `lead-pipeline-contract.test.ts` — cross-layer contract: chat widget ↔ marketing-lead API field agreement (WEB-015.4)
- `locked-state.test.tsx` — `ThreadsPanelGate` feature-flag behaviour
- `route.runtime.test.ts` updated — ALS-aware: `handle` mock invokes factory inside ALS context; two-user isolation verified end-to-end
- `route.test.ts` updated — C3 contract now asserts both `resolveOperatorUser` and `withOperatorAuth` absent from agent factory block

---

## 2026-06-24 — PR #59 (merged)

### Tests
- Operator panel `navigateTo` section contract and production-planner agent wiring
- Agent definitions and `AgentState` schema coverage
- `weatherTool` registry and `LeadPayload` routing tests

---

## 2026-06-24 — PR #58 (merged)

### Chore / Docs
- Trigger fresh Vercel deployment
- Add IPI-92–101 DASH issue specs (`docs/linear/issues/`)

---

## 2026-06-22 — PR #48 (merged) · IPI2-160

### Database
- `chatbot_conversations`, `lead_drafts` tables with RLS
- `claim_lead_draft` RPC
- 6 RLS / claim proofs green (`npm run supabase:verify-rls`)

---

## 2026-06-22 — PR #46 / #47 / #54 (merged) · IPI2-127

### Auth
- Login wired to real Supabase session via `@supabase/ssr`
- `safeRedirect` constraint on `/app*` only
- Email normalise + submit-lock hardening
- Sign-up enumeration guard

---

## 2026-06-22 — PR #37 (merged) · IPI2-127

### Auth
- `src/lib/auth.ts` — `resolveOperatorUser` with real `supabase.auth.getUser`; dev-only fallback; fails closed in production
- `src/lib/operator-gate.ts` — `withOperatorAuth`, `OperatorAuthError`
- `src/proxy.ts` — fast 3-part JWT cookie check; anon `/app/*` → `/login` redirect
- `src/app/api/copilotkit/[[...slug]]/route.ts` — dual-layer gate: outer 401 + inner `resourceId: user.id` via `RequestContext`
- Closed the unauthenticated SSE bypass

---

## 2026-06-21 — PR #32 (merged) · IPI2-82

### Features
- Reusable Operator Panel shell (AIOR-002)
- Command Center, Brand Hub, Assets, Products, Analytics, Settings navigation

---

## 2026-06-21 — PR #30 (merged) · IPI2-84

### Features
- Agent Tool Registry (`agentTools` single discoverable export)
- `callEdgeFunction` HITL-gated write surface with timeout + auth headers
- `weatherTool` as the initial registry entry (proof-of-concept)
