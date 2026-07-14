# Pre-merge / merge-readiness audit — PR #317

**Audit date:** 2026-07-10  
**PR:** [#317](https://github.com/amo-tech-ai/lumina-studio/pull/317) — **IPI-454 · CF-AI-001 — Safe on-ramp: Mastra agents → AI Gateway (opt-in)**  
**Branch:** `ipi/454-ac-f-gateway`  
**Worktree:** `/home/sk/wt-ipi-454-ac-f-gateway`  
**HEAD (rebased + pushed):** `f9c66c84`  
**Tier (cloudflare-workflow):** **C — Platform / AC-F**  
**Verification level:** Local Runtime Verified (unit + Worker + `resolveModel`→gateway `generateText`)  
**Not claimed:** Production Verified · Remote Preview · full browser `UJ-OP-CHAT` / `UJ-MKT-CHAT`

| Related | Status |
|---------|--------|
| **#319 · IPI-492** embed contracts | **Merged** `c9086000` — #317 rebased onto it this audit |
| **#318** docs | Merged earlier |
| Linear AC-F | This PR |

---

## Executive summary (plain English)

#317 adds an **opt-in** switch (`AI_ROUTING_MODE=gateway`) so Mastra’s `resolveModel()` can send **Worker-safe text tiers** through the AI Gateway (`@ai-sdk/openai-compatible`), instead of always hitting Gemini/Groq SDKs directly. Default remains **`direct`** (safe rollback). Only **`fast`** routes via gateway in production-shaped gateway mode; tool tiers need `AI_GATEWAY_ALLOW_TOOL_TIERS=1` (experimental); **vision stays direct**.

**Merge recommendation:** **Merge after CI green on rebased HEAD** — with explicit waiver that browser CopilotKit journeys were not re-run under `AI_ROUTING_MODE=gateway` (stand-in: live `generateText` via `resolveModel("fast")` → Worker → PONG).

| Scorecard | Score | Notes |
|-----------|------:|-------|
| **AC-F code correctness** | **92%** | Allowlist, options guard, tier keys, sticky header fix all sound |
| **Journey proof (Tier C)** | **78%** | UJ-HEALTH + UJ-EMBED + resolveModel stand-in Pass; browser UJ-OP/MKT **not** run |
| **Safety / rollback** | **95%** | Default `direct`; tool tiers gated; vision never gateway |
| **Ready to merge (process)** | **88%** | Was behind #319; rebased clean; push + CI must finish |

---

## Merge blockers (at audit start → after this session)

| Item | At start | After audit |
|------|----------|-------------|
| Behind `main` (#318 + #319) | **Yes (2)** | **Rebased** — conflicts: **none** |
| Unresolved review threads | **0** | **0** |
| Required CI | Green on old HEAD | **Re-run after push** (wait for green) |
| Codacy complexity | ACTION_REQUIRED | Soft — waive if same class as #319 |
| Critical code bug | None open (`resolveProviderOptions` already fixed) | Still fixed |

**Critical fixes required before merge:** none beyond **finish push + green CI on rebased SHA**.

---

## What the PR does (scope check)

| File | Change |
|------|--------|
| `app/src/lib/ai/provider.ts` | `AI_ROUTING_MODE`, `shouldRouteTierViaGateway`, `resolveGatewayModelId`, gateway `createOpenAICompatible`, options `{}` when gateway |
| `app/src/lib/ai/provider.test.ts` | Routing / options / allowlist tests |
| `app/src/lib/ai/provider-adapter.ts` | Comment only (Mastra uses `resolveModel`) |
| `app/src/mastra/models.ts` | Re-exports |
| `social-discovery` / `suggestShootBrief` / `visual-identity` | Pass **tier** into `resolveProviderOptions(...)` |
| `package.json` | `@ai-sdk/openai-compatible` |

**Does not:** deploy Worker, enable gateway by default, implement Worker tool bridge, change embed contracts (#319), docs-only mix.

---

## Tests run this audit

### Unit

| Gate | Result |
|------|--------|
| `provider.test.ts` | **Pass — 33** |
| `provider-adapter.test.ts` (post-#319) | **Pass — 25** |
| Combined | **58/58** |
| Pre-push full app suite | Running at push time (typecheck + vitest) |

### Live journeys (`worker-user-journeys.md`)

| Journey | Result | Evidence |
|---------|--------|----------|
| **UJ-HEALTH** Worker | **Pass** | `GET :8787/health` → `ok` |
| **UJ-HEALTH** app | **Pass** | `GET :3002/api/ai/health` → `gatewayUrl` localhost:8787, adapterAvailable |
| **UJ-EMBED** happy | **Pass** | dims **768** |
| **UJ-EMBED** empty | **Pass** | **400** `invalid_request` (#319 on main) |
| **UJ-MKT-CHAT** (stand-in) | **Pass** | `AI_ROUTING_MODE=gateway` + `resolveModel("fast")` + `generateText` → **PONG** via `ipix-ai-gateway.chat` / modelId `fast` (~1.2s) |
| **UJ-OP-CHAT** browser | **Not run** | Waiver: needs app restart with `AI_ROUTING_MODE=gateway` (agents bind model at module load) |
| **UJ-MKT-CHAT** browser | **Not run** | Same waiver; stand-in above covers Worker path for `fast` |
| **UJ-VISION** | **Unit Pass** | `shouldRouteTierViaGateway("vision") === false` with gateway mode on |
| **UJ-BOOK / UJ-CRM** | **Not run** | Tool tiers stay **direct** unless experimental flag |

Raw notes: `/tmp/pr-317-audit-evidence.txt`

### AI SDK note (non-blocking)

Live gateway call logged: *specificationVersion v2 compatibility mode* for `ipix-ai-gateway.chat`. Request still succeeded. Track as soft follow-up if streaming features misbehave.

---

## Errors / red flags / failure points

### Critical (would block merge)

| ID | Finding | Status |
|----|---------|--------|
| C1 | Branch behind #319 / adapter conflict risk | **Cleared** — rebase clean onto `c9086000` |
| C2 | Gemini `providerOptions` on gateway model | **Already fixed** (`resolveProviderOptions` returns `{}` when tier routes via gateway) |

### High (ops / product)

| ID | Finding | Mitigation |
|----|---------|------------|
| H1 | Agents call `resolveModel()` at **module load** — env must be set **before** `next`/`mastra` boot | Document in PR / Infisical; restart after flipping flag |
| H2 | `AI_GATEWAY_ALLOW_TOOL_TIERS=1` without Worker tool bridge → tool calls can fail | Keep flag **off** for normal approval; experimental only |
| H3 | Browser UJ-OP / UJ-MKT not proven under gateway | Stand-in Pass; optional post-merge smoke with flag on |
| H4 | Running `:3002` may still be **direct** mode | Expected until ops sets `AI_ROUTING_MODE=gateway` |

### Medium

| ID | Finding |
|----|---------|
| M1 | Dual registries (app Groq SSOT vs Worker model-registry) still diverge |
| M2 | Chat Worker errors still unsanitized (#319 residual / **IPI-495**) — not introduced by #317 |
| M3 | Codacy complexity soft fail |

---

## What’s missing

1. **Browser** marketing + operator chat with `AI_ROUTING_MODE=gateway` (true UJ-MKT / UJ-OP).  
2. **Stream** proof through CopilotKit (stand-in used non-stream `generateText`).  
3. **Remote / prod** Worker + env — **IPI-472**.  
4. Worker **tools** bridge before enabling tool tiers.  
5. PR body journey IDs in test plan (Outcome Grader) — recommend adding `UJ-HEALTH`, `UJ-MKT-CHAT` (stand-in), `UJ-EMBED`.

---

## Suggested improvements (follow-ups, not this PR)

| Priority | Item |
|----------|------|
| Before flip in staging | Restart app with `AI_ROUTING_MODE=gateway` + `AI_GATEWAY_URL`; smoke marketing chat in browser |
| Soon | Document module-load env requirement in `AGENTS.md` / Infisical notes |
| Later | Lazy `resolveModel` inside agent handlers (avoid frozen model at import) — separate concern |
| Later | Worker OpenAI `tools` bridge → then reconsider `AI_GATEWAY_ALLOW_TOOL_TIERS` |
| Separate | **IPI-495** chat error envelope |

---

## Percent correct

| Lens | % |
|------|--:|
| AC-F implementation vs intent | **92** |
| Tier C journey bar (strict) | **78** |
| Safe-to-merge with default `direct` | **94** |
| “AC-F Done / Production” claim | **0** — Local Runtime only; flag off by default |

---

## Outcome Grader (cloudflare-workflow)

| Criterion | Pass? |
|-----------|:-----:|
| iPix journey proof (Tier C) | 🟡 Partial — stand-in + UJ-HEALTH/EMBED; browser waived |
| Docs/MCP for runtime claims | ✅ openai-compatible + Worker registry keys |
| Verify level named | ✅ Local Runtime |
| One concern | ✅ AC-F only |
| Embed contract (touched lightly) | ✅ #319 on base; UJ-EMBED Pass |
| Linear / PR match | 🟡 Update test plan with journey IDs |

---

## Recommendation

| Action | Decision |
|--------|----------|
| Merge now? | **Yes, after rebased CI green** — default `direct` means merge is low risk |
| Enable `AI_ROUTING_MODE=gateway` in prod? | **No** until browser UJ-MKT + UJ-OP smoke |
| Enable `AI_GATEWAY_ALLOW_TOOL_TIERS=1`? | **No** |
| Reopen for critical code? | **No** |

### Reproduce AC-F stand-in

```bash
# Worker on :8787
export AI_ROUTING_MODE=gateway AI_GATEWAY_URL=http://127.0.0.1:8787
cd app && npx vitest run src/lib/ai/provider.test.ts
# live: resolveModel("fast") + generateText → PONG (see audit session)
```
