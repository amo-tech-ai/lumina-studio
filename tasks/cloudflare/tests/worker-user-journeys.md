# Cloudflare Workers — iPix user-journey tests

**Purpose:** Prove the AI Gateway Worker works **inside real iPix product flows**, not only in isolated unit tests.  
**Rule:** `.cursor/rules/cloudflare-workflow.mdc`  
**Product hub:** `.claude/skills/cloudflare`  
**Related:** **IPI-454 · CF-AI-001** AC-J · **IPI-492 · CF-AI-004c** embed contracts · **IPI-461 · CF-AI-004** adapter

---

## North star

> Unit tests can pass while the operator app is broken.  
> **Pass = a real iPix persona completes a journey that hits the Worker and gets a correct, usable result.**

| Layer | What it proves | Not enough alone |
|-------|----------------|------------------|
| Worker unit / vitest | Contract math (400/allowlist/768-d) | App never called the Worker |
| Adapter unit | Client parses envelopes | Mastra still on direct Gemini |
| **Journey (this doc)** | Operator / marketing / BI path → gateway → provider → UI | — |
| Remote preview / prod | Same on `workerd` + real DNS | Local-only green |

**Minimum claim language:** always name the journey ID below (e.g. `UJ-OP-CHAT`) + verify level (`Local Runtime` / `Remote Preview` / `Production`).

---

## Stack under test (happy path)

```text
Browser (operator / marketing)
  → Next.js app (:3002)  CopilotKit / API route
  → Mastra agent  resolveModel() / providerAdapter
  → AI Gateway Worker (:8787)  /v1/chat/completions | /v1/embeddings
  → Gemini | Workers AI (BGE)
```

**Env (local):**

```bash
# Worker
cd services/cloudflare-worker && infisical run --env=dev -- npx wrangler dev   # :8787

# App — point at Worker, not Mastra :4111
export AI_GATEWAY_URL=http://127.0.0.1:8787
export AI_GATEWAY_API_KEY=<gateway key if required>
# After AC-F:
export AI_ROUTING_MODE=gateway   # or project’s current flag name

cd app && infisical run --env=dev -- npm run dev   # :3002
```

QA login: `qa@ipix.test` / password from Infisical or `.env.local` (`QA_PASSWORD`).

---

## Journey catalog

### UJ-HEALTH — Gateway reachable from the app

| | |
|--|--|
| **Persona** | Engineer / on-call |
| **Why** | Fast fail before any chat journey |
| **Steps** | 1. Worker up on `:8787` 2. `GET /api/ai/health` (when present) or curl Worker `/v1/models` / health if exposed 3. Confirm URL is **8787**, not Mastra **4111** |
| **Pass** | Health reports gateway OK; base URL is Worker |
| **Fail** | Default `:4111`, connection refused, wrong key → opaque 502 |
| **Tier** | B+ before any chat/embed journey |

```bash
curl -sS -H "Authorization: Bearer $AI_GATEWAY_API_KEY" \
  "$AI_GATEWAY_URL/v1/embeddings" \
  -H 'Content-Type: application/json' \
  -d '{"model":"embedding","input":["ping"]}' | jq '.data[0].embedding | length'
# expect 768
```

---

### UJ-OP-CHAT — Operator sidebar chat (Creative Director / default agent)

| | |
|--|--|
| **Persona** | Brand operator on `/app/*` |
| **Surface** | Operator chat dock (CopilotKit + Mastra) |
| **Worker path** | `/v1/chat/completions` (stream) |
| **Steps** | 1. Log in as QA 2. Open Command Center or Brand Hub 3. Send: “Summarize the next best action for this brand in one sentence.” 4. Watch stream tokens appear (no blank spinner forever) |
| **Pass** | Stream completes; answer is on-brand / useful; no client crash; Worker logs show chat request |
| **Fail** | Hang, `RUN_ERROR` without recovery, direct Gemini bypass when `AI_ROUTING_MODE=gateway`, CORS/auth 401 loop |
| **Observability** | Worker request log + app CopilotKit network tab → gateway host |
| **Depends on** | AC-F (`resolveModel` → gateway) for true Worker proof |

---

### UJ-MKT-CHAT — Public marketing chat

| | |
|--|--|
| **Persona** | Prospect on marketing site |
| **Surface** | Marketing chat (`public-marketing` / `fast` tier) |
| **Worker path** | `/v1/chat/completions` |
| **Steps** | 1. Open marketing home / services page with chat 2. Ask: “What does iPix do for DTC fashion brands?” 3. Confirm reply streams |
| **Pass** | Reply streams; mailto/error boundary not shown; gateway host in network |
| **Fail** | Error boundary mailto fallback; timeout; wrong agent id |
| **Notes** | Often the first public proof of gateway `fast` tier |

---

### UJ-BI — Brand Intelligence draft (AI drafts, human decides)

| | |
|--|--|
| **Persona** | Operator running brand analysis |
| **Surface** | Brand Hub detail / BI workflow |
| **Worker path** | Chat + structured (and later embed for retrieval) |
| **Steps** | 1. Open a brand with crawl/intel data 2. Trigger or continue Brand Intelligence (agent or workflow UI) 3. Confirm a **draft** profile/suggestion appears (not silent auto-write to prod fields without gate) |
| **Pass** | Draft visible; Evidence / scores still load; no unstructured 500 from gateway |
| **Fail** | Workflow hangs on model call; empty draft; provider body leaked to UI |
| **Depends on** | Mastra BI agent + gateway routing |

---

### UJ-EMBED — Embeddings for retrieval / DNA-adjacent search

| | |
|--|--|
| **Persona** | Operator (or future RAG tool) needing vectors |
| **Surface** | Today: adapter/`providerAdapter.embed` + Worker; later: retrieval tools on agents |
| **Worker path** | `/v1/embeddings` → Workers AI BGE |
| **Steps** | 1. Happy: embed `["spring campaign moodboard"]` → **768** dims 2. Empty `[]` / `""` → **400** `invalid_request`, **no** provider fetch 3. Model `gemini-3.1-flash-lite` → **400** `unsupported_embedding_model` 4. App adapter throws typed `AiGatewayError` with `code` |
| **Pass** | All four; UI/tool shows friendly message on 400, not raw CF JSON |
| **Fail** | Silent remap to chat `default`; opaque 502; wrong dims |
| **SSOT** | **IPI-492 · CF-AI-004c**; `tasks/cloudflare/tasks/492-audit.md` |

---

### UJ-VISION — Visual identity (often **direct**, not gateway)

| | |
|--|--|
| **Persona** | Operator auditing brand visuals |
| **Surface** | Visual identity agent (`resolveModel("vision")`) |
| **Worker path** | Usually **none** (ImageParts / vision stay direct until gateway supports them) |
| **Steps** | 1. Run a vision-capable prompt with an image 2. Confirm still works when gateway mode is on for text tiers |
| **Pass** | Vision still works; gateway mode does not break it by forcing unsupported ImageParts through Worker |
| **Fail** | Vision routed to gateway and 400/hang |
| **Note** | Document as **expected direct** until product supports vision on gateway |

---

### UJ-BOOK / UJ-CRM — Booking & CRM assistants

| | |
|--|--|
| **Persona** | Producer / sales |
| **Surface** | Booking agent, CRM assistant on `/app/bookings`, CRM routes |
| **Worker path** | Chat (+ tools) via Mastra → gateway after AC-F |
| **Steps** | 1. Open booking or deal 2. Ask agent for next step / draft (draft-only where policy requires) 3. Confirm tool calls still work (HITL gates unchanged) |
| **Pass** | Agent answers with page context; tools execute; no double-write |
| **Fail** | Agent “not found”; tools skipped; gateway timeout mid-tool |

---

### UJ-ERR — Failure UX (still a product journey)

| | |
|--|--|
| **Persona** | Operator when provider is down |
| **Steps** | 1. Stop Worker or force 503 from provider mock 2. Send operator chat message 3. Confirm UI shows recoverable error (retry / mailto / bounded `RUN_ERROR`), not infinite spinner |
| **Pass** | Typed/sanitized error; retryable flagged when 503; no API keys in message |
| **Fail** | Raw provider body; hung dock; secret leak |

---

## Suggested real-world prompts (copy/paste)

| Journey | Prompt |
|---------|--------|
| UJ-OP-CHAT | “You’re on Command Center. What’s the single next action for the active brand?” |
| UJ-MKT-CHAT | “How does iPix help a DTC fashion brand plan a shoot?” |
| UJ-BI | “Draft three brand voice adjectives from the current evidence — mark as draft.” |
| UJ-BOOK | “Draft a booking request summary for this shoot — do not confirm.” |
| UJ-CRM | “What stage is this deal in, and what’s the next CRM action?” |

---

## Evidence pack (attach to PR / Linear)

For each journey you claim:

```text
[ ] Journey ID (e.g. UJ-OP-CHAT)
[ ] Env: AI_GATEWAY_URL=… (must be Worker)
[ ] Verify level: Local Runtime | Remote Preview | Production
[ ] Screenshot or HAR showing request host = gateway
[ ] Worker log line (request id / model / status)
[ ] Pass/fail + one-line residual risk
```

**AC-J style gate (IPI-454):** do not mark gateway “Done” until **UJ-HEALTH + UJ-OP-CHAT + UJ-MKT-CHAT + UJ-EMBED** pass at least at **Local Runtime**, and preferably **Remote Preview**.

---

## When unit tests are enough vs not

| Change | Unit OK | Must add journey |
|--------|---------|------------------|
| Typo in error message string | Yes (Tier A) | No |
| Embed allowlist / mapProviderFailure | Worker + adapter tests | UJ-EMBED curls minimum |
| `resolveModel` → gateway (AC-F) | Provider unit | **UJ-OP-CHAT + UJ-MKT-CHAT** |
| Streaming / SSE / CopilotKit | Partial | **UJ-OP-CHAT** stream |
| OpenNext / wrangler bindings | Build | UJ-HEALTH on preview URL |
| Prod cutover | — | All core journeys at **Production Verified** |

---

## Anti-patterns

| Don’t | Do |
|-------|-----|
| “Worker tests green” ⇒ ship | Run at least one chat journey through the app |
| Curl only `/v1/chat` and skip CopilotKit | Prove the dock path (auth + agent id + stream) |
| Point `AI_GATEWAY_URL` at Mastra `:4111` | Point at Worker `:8787` / preview URL |
| Claim Production Verified from local | Use prod URL + smoke checklist |
| Mix OpenNext hosting proof with gateway contract in one PR | One concern; journeys still named |

---

## Quick matrix (print for PR body)

| ID | Journey | Local | Preview | Prod |
|----|---------|:-----:|:-------:|:----:|
| UJ-HEALTH | Gateway reachable | ☐ | ☐ | ☐ |
| UJ-OP-CHAT | Operator dock stream | ☐ | ☐ | ☐ |
| UJ-MKT-CHAT | Marketing chat | ☐ | ☐ | ☐ |
| UJ-BI | Brand Intelligence draft | ☐ | ☐ | ☐ |
| UJ-EMBED | Embed 768 + reject bad input | ☐ | ☐ | ☐ |
| UJ-VISION | Vision still direct/OK | ☐ | ☐ | ☐ |
| UJ-BOOK / UJ-CRM | Domain agents + tools | ☐ | ☐ | ☐ |
| UJ-ERR | Provider down UX | ☐ | ☐ | ☐ |
