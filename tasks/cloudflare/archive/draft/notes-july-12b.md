Overall, this is a **good planning review (91/100)**, but I would change several dependencies to better reflect the actual technical flow.

---

# Overall assessment

| Area                |    Score   | Notes                                                 |
| ------------------- | :--------: | ----------------------------------------------------- |
| Critical path       |     94     | Mostly correct                                        |
| Dependency mapping  |     82     | Some blockers are reversed                            |
| Acceptance criteria |     95     | Much clearer                                          |
| Production gates    |     96     | Excellent addition                                    |
| Scheduling          |     84     | Dates should be milestone-driven, not calendar-driven |
| Overall             | **91/100** |                                                       |

---

# 1. Blocking relationships

## ❌ I would NOT add these

### IPI-525 blocks IPI-465

I don't agree.

**IPI-465 · AGENT-002 — Shared AI Tool Registry** is an architecture/design task.

It should start **before** gateway tool implementation, because it defines:

* tool identity
* schemas
* permissions
* HITL
* audit
* ownership

It is not blocked by IPI-525.

Better:

```text
IPI-465
        ↓
helps define
        ↓
IPI-525
```

or

```text
IPI-465
        ↔
IPI-525
```

They can run in parallel.

---

### AC-J blocks IPI-472

I also wouldn't use this dependency.

**IPI-472 · INFRA-001 — Cloudflare Worker Deployment Pipeline** is infrastructure.

Infrastructure should not depend on browser testing.

Instead:

```text
IPI-472
↓

AC-J
```

Infrastructure first.

---

# Better dependency graph

```text
IPI-471
↓

IPI-490
↓

IPI-472
↓

IPI-525
↓

IPI-508

↓

IPI-454 AC-J

↓

IPI-462

↓

IPI-485

↓

CF-MIG-220

↓

IPI-463

↓

CF-MIG-810
```

---

# 2. Critical Path label

✅ I completely agree.

I'd actually create **three labels**.

## CRITICAL-PATH

Production blockers.

Example:

* IPI-525
* IPI-454
* CF-MIG-220
* CF-MIG-810

---

## ARCHITECTURE

Long-term design.

Example:

* IPI-465
* IPI-471

---

## PRODUCTION-GATE

Final verification.

Example:

* IPI-462
* IPI-463
* CF-MIG-220

Those labels make dashboards much more useful.

---

# 3. IPI-490 description

I like this.

I would only change one sentence.

Instead of

> Root cause unresolved

write

> Root cause under investigation.

That's more accurate.

---

# 4. IPI-525 acceptance criteria

Excellent.

I'd add three more.

```text
[ ] Multiple tool calls work

[ ] Invalid tool arguments fail safely

[ ] AI_GATEWAY_ALLOW_TOOL_TIERS=0 keeps existing behaviour
```

Those catch most production regressions.

---

# 5. Deferred status

I would **not** tie these to a fixed date like **2026-08-13**.

Dates become stale.

Instead use milestone dependencies.

Example:

```text
Milestone:

After
CF-MIG-810
```

or

```text
After
Cloudflare Production
```

This survives schedule changes.

---

# Current critical path

I would adjust it slightly.

Instead of

```text
Week 1

IPI-525

↓

Week 2

IPI-490 verify
```

I'd recommend:

```text
Week 1

IPI-490 runtime verification

↓

IPI-525 tool calling

↓

IPI-508 browser journey

↓

IPI-454 AC-J

↓

CF-MIG-220 preview smoke

↓

IPI-462 provider evaluation

↓

IPI-463 failover

↓

CF-MIG-810 DNS
```

Reason:

You want to prove the platform before extending it.

---

# Missing production gates

I'd add these before DNS cutover.

## Load testing

```text
100 concurrent chats

streaming

timeouts

memory
```

---

## Security

Verify

* secrets
* callback hosts
* CORS
* SSRF
* prompt injection
* rate limits

---

## Cost

Measure

* average request

* gateway

* Workers AI

* Gemini fallback

---

## Observability

Verify

* logs

* request IDs

* traces

* error codes

---

## Rollback

Prove

```text
gateway

↓

direct

↓

gateway
```

without redeploy.

---

# Revised roadmap

```text
Architecture
        ↓
Runtime verification
        ↓
Deployment verification
        ↓
Tool calling
        ↓
Browser user journeys
        ↓
Gateway AC-J
        ↓
Provider evaluation
        ↓
Preview smoke
        ↓
Load/security/cost
        ↓
Failover
        ↓
DNS cutover
```

---

# Final recommendation

I would adopt **about 90%** of these suggestions, with these changes:

* ✅ Add **CRITICAL-PATH**, **ARCHITECTURE**, and **PRODUCTION-GATE** labels.
* ✅ Expand **IPI-525** acceptance criteria with multi-tool, invalid-input, and feature-flag tests.
* ✅ Improve **IPI-490** wording ("under investigation" rather than "unresolved").
* ❌ Do **not** make **IPI-465** depend on **IPI-525**; run them in parallel.
* ❌ Do **not** tie deferred work to a specific calendar date; use milestone dependencies instead.
* 🔄 Keep infrastructure tasks (like **IPI-472**) ahead of browser validation rather than blocked by it.

That gives you a dependency graph that is easier to maintain and better reflects how the platform is actually being built.
## Review verdict

The cleanup direction is correct, but **four items still need correction**.

### 1. IPI-525 is correctly unblocked

**IPI-525 · CF-AI-011 — Workers AI Tool Calling** currently has **no blocked-by relationships**, so there is nothing to remove. It is correctly In Progress and linked to PR #333. 

Before Done, require:

* live tool round-trip;
* streaming tool calls;
* tool-result second turn;
* safe fallback;
* no production tool-tier rollout yet.

### 2. Do not move IPI-490 to Done yet

**IPI-490 · CF-MIG-210 — Runtime Compatibility — Hono, OAuth & Groq Bundle** explicitly says remote non-local Cloudflare preview testing has not been performed and recommends waiting for that proof before Done. The PostgresStore hang is bounded, not resolved. 

Correct action:

```text
Remote workers.dev preview
→ OAuth allowlist proof
→ operator stream proof
→ then Done
```

Move the Postgres hang into a separate follow-up task after that.

### 3. IPI-454 acceptance criteria are mislabeled

Your text says:

* AC-F = KV
* AC-G = E2E
* AC-J = browser

That is incorrect.

Correct mapping:

| AC       | Meaning                                              |
| -------- | ---------------------------------------------------- |
| **AC-F** | Mastra gateway on-ramp — already merged              |
| **AC-G** | Optional KV registry                                 |
| **AC-I** | Production deployment/rollout                        |
| **AC-J** | End-to-end verification, including browser/streaming |

So keep **IPI-454 · CF-AI-001 — AI Gateway — Cloudflare Provider Routing** In Progress, but do not reopen AC-F.

### 4. Smoke tests are not fully blocked by IPI-525

Tool-bearing smoke tests depend on IPI-525, but tool-free tests do not.

Run now:

* gateway health;
* embeddings;
* public marketing fast-tier chat;
* streaming;
* cancellation;
* direct-mode rollback.

Wait for IPI-525 only for:

* `tool_calls`;
* Production Planner;
* booking tools;
* brand-intelligence tools.

## Correct Linear actions

| Task                                                                         | Correct action                                                                                  |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **IPI-525 · CF-AI-011 — Workers AI Tool Calling**                            | 🟡 Keep In Progress                                                                             |
| **IPI-490 · CF-MIG-210 — Runtime Compatibility — Hono, OAuth & Groq Bundle** | 🟡 Keep In Progress until remote preview proof                                                  |
| **IPI-471 · AGENT-001 — AI Agent Architecture**                              | 🟢 Move to Done based on architecture document on `main`                                        |
| **IPI-465 · AGENT-002 — Shared AI Tool Registry**                            | 🟡 Keep In Progress only if design is active; otherwise Todo                                    |
| **IPI-454 · CF-AI-001 — AI Gateway — Cloudflare Provider Routing**           | 🟡 Keep In Progress; AC-F done, AC-G optional, AC-J open                                        |
| **IPI-515 · PR-AGENT-000 — Epic: PR-Agent on Bedrock Qwen3 Coder Next**      | Keep as a separate parallel track; do not mark Deferred solely because it is outside Cloudflare |

## Correct execution order

```text
1. Confirm CI green
2. Live-test PR #333
3. Merge PR #333
4. Run IPI-508 tool-free browser journey
5. Complete IPI-525 tool round-trip
6. Run remote IPI-490 preview proof
7. Design IPI-465 shared registry
8. Run security/load/cost/observability/rollback gates
9. Run full preview smoke
10. DNS cutover last
```

## Status-document cleanup

Use `status-cloudflare.md` as the working source of truth.

Mark these historical instead of deleting:

* `status.md`
* `todo.md`
* `july-12-verification.md`

Using status colors as the primary signal is sensible. Keep objective counts such as “7 of 9 journeys passed” where useful.

## Final verdict

Your correction is about **90% right**.

The remaining fixes are:

* keep IPI-490 open until remote preview proof;
* correct the IPI-454 AC labels;
* do not block all smoke tests on tool calling;
* keep IPI-515 as a parallel roadmap rather than automatically deferring it.
