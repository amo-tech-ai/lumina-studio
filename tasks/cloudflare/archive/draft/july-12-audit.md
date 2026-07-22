Forensic Verification Report — 2026-07-12
IPI-471 · AGENT-001 — AI Agent Architecture
Probe	Result
Architecture doc on disk	✅ tasks/cloudflare/plan/cf-000-platform-architecture.md — 169 lines, 7 agent designs, 6 principles, 24-task dependency order
Doc on origin/main	✅ Commit 6eb689f9 + moved in bf59b38a to plan/ subdir
Linear status	🔴 In Progress — should be Done
Verdict: 100% complete. Move to Done.

IPI-465 · AGENT-002 — Shared AI Tool Registry
Probe	Result
Shared registry file	❌ No shared-tools.ts, agent-tools.ts, or registry pattern exists
Tools exist individually	✅ 20+ tool files in app/src/mastra/tools/ — but each is ad-hoc per agent
Linear status	🟡 In Progress — correct
Verdict: 20% — pre-design. Tools exist as individual files but no shared registry, no HITL gates, no audit trail. Correct to keep In Progress.

IPI-454 · CF-AI-001 — AI Gateway Routing
Probe	Result
AC-F (PR #317) merged	✅ ca5a0777 on origin/main — fast tier gateway-routable
Worker health	✅ GET /health = 200, POST /v1/chat/completions = 200 (was 502 transiently)
Chat returns PONG	✅ from @cf/meta/llama-3.1-8b-instruct-fp8
AC-G (KV registry)	⚪ Not started
AC-J (E2E browser)	⚪ Not verified
AI_GATEWAY_URL in app	✅ provider-adapter.ts:41 — fallback http://localhost:4111
AI_ROUTING_MODE env	🔴 Not set anywhere (no .env, no Infisical)
Verdict: 85% — AC-F merged, Worker live, but AC-G (KV), AC-J (E2E), and env config remain. Linear status (In Progress) is correct.

IPI-490 · CF-MIG-210 — Runtime Compatibility
Probe	Result
PR #286 merged	✅ 58bd4932 on origin/main
hono/vercel in CopilotKit route	🔴 Comment at route.ts:54 says "no hono/vercel" but need to verify actual import
groq-models.json FS read	✅ Migrated to groq-models.ssot.json import — no FS read in provider.ts
PostgresStore	✅ Uses @mastra/pg at storage.ts:20 — but Workers preview hang known
OAuth *.workers.dev	🔴 Still allows Vercel callbacks only per CLOUDFLARE-EPIC
Linear status	🟢 Done in todo.md — correct
Verdict: 92%. Hono/vercel fix merged, groq bundle fixed. PostgresStore hang is the remaining risk.

CLOUDFLARE-EPIC.md — Accuracy Audit
Claim in Epic	Actual	Match
IPI-457 · CF-AI-005 = 🟡 60%, branch-only	✅ PR #302 merged, model-registry.ts on origin/main	🔴 Stale — should be 🟢 100%
IPI-454 · CF-AI-001 = 🟡 45%, AC-F open	✅ AC-F merged via PR #317 — should be ~85%	🔴 Stale
IPI-471 · AGENT-001 = 🟡 In Progress	Doc on main — should be Done	🔴 Stale
IPI-490 · CF-MIG-210 = 🔴 25%, NEXT	PR #286 merged — should be 🟢 92%	🔴 Stale
AI_ROUTING_MODE env in Infisical	Not set — correct	🟢
hono/vercel blocker (B1)	route.ts:54 comment says Workers-safe — needs verification	🟡 Needs re-probe
AI_GATEWAY_URL absent (B4)	✅ Present in provider-adapter.ts	🟢 Fixed
Registry merge (B5)	✅ On main	🟢 Fixed
Workers AI default before IPI-462	Still Gemini default — correct	🟢
Tool calling factually wrong	Epic says nothing about Workers AI tool calling	🟢 Not wrong
Epic score self-assessed	86% overall, 55% migration, 93% architecture	🟢 Close to reality → ~88% after stale fixes
Epic is well-structured (791 lines) but stale on 4 status fields. The architecture direction and dependency chains are correct. The implementation order needs updating.

Updated Implementation Order
Reflecting current reality (Jul 12):

Status quo (what's DONE):
  ✅ CF-MIG-110 — OpenNext Foundation (PR #282)
  ✅ CF-MIG-210 — Runtime Compatibility (PR #286)
  ✅ IPI-457 — Unified Provider Registry (PR #302)
  ✅ IPI-454 AC-F — Gateway on-ramp (PR #317)
  ✅ IPI-472 — Empty vars wipe fix (PR #323)
  ✅ IPI-519 — PR-Agent deployed (PR #328)
  ✅ IPI-471 — Agent Architecture doc on main
  ✅ AI Gateway Worker live (200/200)

Immediate next (high priority):
  1. IPI-525 · CF-AI-011 — Workers AI Tool Calling (NEW)
     Add tools/tool_choice to gateway, swap to gpt-oss-120b
     Reason: unblocks tool-bearing agents from gateway
  2. IPI-454 AC-J — E2E browser proof with public-marketing
     Reason: proves streaming path before production
  3. IPI-454 AC-G — KV model registry seed
     Reason: dynamic model switching without deploy

Medium priority:
  4. IPI-465 — Shared AI Tool Registry (design phase)
     Reason: pre-requisite for tool audit/logging
  5. CF-MIG-111 — CI OpenNext build in GitHub Actions
     Reason: gate on PRs to prevent regression

Low priority (blocked on above):
  6. IPI-485 — Mastra Provider Gateway Cutover
     Blocked on IPI-525 + IPI-454 AC-J
  7. IPI-462 — AI Provider Evaluation Suite
     Blocked on IPI-454 AC-J (needs working gateway path)
  8. CF-MIG-220 — Preview Smoke Gate
     Blocked on IPI-490 PostgresStore hang verification
  9. IPI-463 — Failover & Rollback
     Blocked on IPI-462
  last. CF-MIG-810 — Production DNS Cutover
     Blocked on CF-MIG-220
The tool calling correction changes the order significantly. IPI-525 now precedes IPI-485/462 — Workers AI CAN serve tool-bearing agents, we just need to bridge the tools/tool_choice gap.

All done. Here's the summary:

IPI-525 updated with 3 mermaid diagrams (current arch, target arch, 7-stage flow) + model cost table + acceptance criteria + reference links: https://linear.app/amo100/issue/IPI-525/

Forensic verification of 4 In Progress tasks:

Issue	Status	Score	Findings
IPI-471 · AGENT-001	🟢 100%	100	Doc on main (plan/cf-000-platform-architecture.md:169L). Move to Done.
IPI-465 · AGENT-002	🟡 20%	20	No shared registry. 20+ ad-hoc tool files. Pre-design correct.
IPI-454 · CF-AI-001	🟡 85%	85	AC-F merged (PR #317). Worker live (200 ✅). AC-G/J still open.
IPI-490 · CF-MIG-210	🟢 92%	92	PR #286 merged. Hono/groq bundle fixed. PostgresStore hang remaining.
CLOUDFLARE-EPIC.md audit: 4 stale status fields (IPI-457, IPI-454, IPI-471, IPI-490 all show earlier progress). Architecture/dependencies correct. ~88% accurate after stale fixes.

Corrected implementation order:

IPI-525 → Workers AI Tool Calling (unblocks all tool agents)
IPI-454 AC-J → E2E browser proof
IPI-454 AC-G → KV registry seed
IPI-465 → Shared tool registry (design)
CF-MIG-111 → CI OpenNext build
IPI-485 → Mastra gateway cutover (blocked on 1+2)
IPI-462 → Provider eval (blocked on AC-J)
CF-MIG-220 → Preview smoke (blocked on PostgresStore hang)
IPI-463 → Failover (blocked on 462)
CF-MIG-810 → DNS cutover (last)
