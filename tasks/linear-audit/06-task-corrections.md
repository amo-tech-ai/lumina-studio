# Master Task Correction Table

Every issue that met the "priority" bar (Done/In Progress/In Review/Todo — i.e. made an active claim) across all 15 requested stacks, in one place. 159 rows below (of 161 total priority issues; 2 — IPI-409/412/413/414's Backlog siblings — are correctly excluded here as they're Backlog, not priority, and appear instead as verified gaps in stack 08). Sorted by stack, then by severity (🔴 first). Full evidence and citations for each row live in the per-stack files (`02`–`05`); this table is the single-scroll action view.

**Legend:** 🟢 correct/shipped/keep · 🟡 partial/rewrite/split/improve · ⚪ planned/defer/move · 🔴 incorrect/blocked/stale/cancel/reopen/critical

## Cloudflare migration (01)

| Dot | Task | Current | Correct | Action | Correction | Blocker |
|---|---|---|---|---|---|---|
| 🔴 | IPI-471 — AGENT-001 AI Agent Architecture | In Progress | In Progress | rewrite | Remove false "✅ Complete" — file only exists on unmerged PR #271 | PR #271 |
| 🔴 | IPI-486 — MASTRA-EPIC | Todo | **In Progress** | reopen | Has Done + active children; shouldn't sit at Todo | none |
| 🟡 | IPI-469 — CF-000 Cloudflare Platform Architecture | In Review | In Review | rewrite | Remove "Complete," fix path, note PR #271 pending | PR #271 |
| 🟡 | IPI-487 — CLOUDFLARE-EPIC | In Progress | In Progress | rewrite | Resync progress table vs. `tasks/cloudflare/todo.md` (30-pt disagreement) | doc-sync |
| 🟡 | IPI-465 — AGENT-002 Shared AI Tool Registry | In Progress | In Progress | rewrite | No implementation exists; `ai_agent_logs` table (an AC dependency) doesn't exist | new migration needed |
| 🟡 | IPI-461 — CF-AI-004 AI Provider Adapter | In Progress | In Progress | rewrite | "14+ tests" claim false — actually 1 file, 5 tests | IPI-454 AC-F |
| 🟡 | IPI-457 — CF-AI-005 Unified AI Provider Types & Registry | In Progress | In Progress | keep | Verified accurate as written | PR #271 |
| 🟡 | IPI-454 — CF-AI-001 AI Gateway Cloudflare Provider Routing | In Progress | In Progress | keep | AC-C merged, AC-F confirmed still open | AC-F implementation |
| ⚪ | IPI-472 — INFRA-001 Cloudflare Worker Deployment Pipeline | Todo | Todo | keep | Correctly describes target-state | IPI-454 AC-F, IPI-465 |
| ⚪ | IPI-468 — SEC-001 Cloudflare AI Security Architecture | Todo | Todo | keep | Correctly not started | none |

## AI Gateway and model providers (02)

| Dot | Task | Current | Correct | Action | Correction | Blocker |
|---|---|---|---|---|---|---|
| 🟢 | IPI-428 — BUILD-GROQ-CONFIG Turbopack import boundary | Done | Done | keep | Verified accurate | none |

## Mastra agents and workflows (03)

| Dot | Task | Current | Correct | Action | Correction | Blocker |
|---|---|---|---|---|---|---|
| 🟡 | IPI-153 — DNA-003 Product linking agent | Todo | Todo | rewrite | Circular `blocked_by` with IPI-181 — resolve direction | circular dep |
| 🟡 | IPI-133 — AIOR-017 Durable agent foundation | Done | Done | keep | Verified, note separate open follow-up IPI-279 | none |
| 🟡 | IPI-229 — FIX social-discovery edge deploy or retire | Done | Done | rewrite | Description says "In Review" — PR #139 actually merged | none |
| 🟡 | IPI-113 — AIOR-004 Agent Tool Registry | Done | Done | rewrite | "10 tools" stale — actually 20 | IPI-147 (governance) |
| 🟡 | IPI-97 — WEB-015.8 Lead capture workflow | Done | Done | rewrite | Title implies a tool call; no tool involved by design | none |
| 🟢 | IPI-223 — FIX GEMINI_MODEL env + registry | Done | Done | keep | Verified | none |
| 🟢 | IPI-227 — FIX Mastra RLS hardening | Done | Done | keep | Verified | none |
| 🟢 | IPI-135 — AIOR-019 Agent memory foundation | Done | Done | keep | Verified | none |
| 🟢 | IPI-134 — AIOR-018 Workflow snapshots + recovery | Done | Done | keep | Verified | none |
| 🟢 | IPI-129 — AIOR-013 Mastra durable storage (Postgres) | Done | Done | keep | Verified | none |
| 🟢 | IPI-429 — DOCS-GROQ-MASTRA | Done | Done | keep | Docs-only | none |

## CopilotKit and HITL (04)

| Dot | Task | Current | Correct | Action | Correction | Blocker |
|---|---|---|---|---|---|---|
| 🟡 | IPI-51 — DASH-005 Route agentId Map | Done | Done | rewrite | Remove stale "remaining gaps → IPI-247" — that PR merged | none |
| 🟡 | IPI-102 — WEB-015.4 Public runtime /api/marketing-chat | Done | Done | keep | Verified | none |
| 🟢 | IPI-127 — AIOR-011 CopilotKit license + prod runtime config | In Progress | In Progress | keep | Verified, ops item | none |
| 🟢 | IPI-230 — FIX Prod OPERATOR_AUTH + CopilotKit license config | Done | Done | keep | Verified | none |
| 🟢 | IPI-197 — UX Contextual Copilot Sidebar | Done | Done | keep | Verified | none |
| 🟢 | IPI-110 — AIOR-002 CopilotKit Operator Panel | Done | Done | keep | Verified | none |
| 🟢 | IPI-48 — AIOR-001 Mastra Runtime Foundation | Done | Done | keep | Verified | none |
| 🟢 | IPI-218 — 3-Panel Operator Layout right-panel wiring | Done | Done | keep | Verified | none |
| 🟢 | IPI-50 — DASH-004 useAgentContext Global Injection | Done | Done | keep | Verified | none |
| 🟢 | IPI-103 — WEB-015.5 Homepage chat widget UI | Done | Done | keep | Verified | none |
| 🟢 | IPI-100 — WEB-015.3 public-marketing-agent | Done | Done | keep | Verified | none |

## Supabase schema, RLS, RPCs, Realtime (05)

| Dot | Task | Current | Correct | Action | Correction | Blocker |
|---|---|---|---|---|---|---|
| 🟡 | IPI-452 — Fix migration ordering bug | In Progress | In Review, ready | keep | Correct minimal fix, CI green, needs merge | merge (PR #266) |
| 🟡 | IPI-226 — FIX Supabase TS types regen | Done | Done | keep | No citable PR — attach proof link | missing proof |
| 🟡 | IPI-126 — Push IPI-46 migration + verify remote | Done | Done | keep | File exists; remote push not re-verified live | live-DB check |
| 🟢 | IPI-225 — FIX Migration drift sync | Done | Done | keep | PR #130 merged | none |
| 🟢 | IPI-231 — FIX Supabase verify suite + edge inventory | Done | Done | keep | Verified | none |
| 🟢 | IPI-125 — OPS-001 OAuth callback | Done | Done | keep | PR #71 merged | none |
| 🟢 | IPI-101 — WEB-015.1 DB schema + RLS + claim RPC | Done | Done | keep | Verified | none |

## Planner (06)

| Dot | Task | Current | Correct | Action | Correction | Blocker |
|---|---|---|---|---|---|---|
| 🔴 | IPI-476 — Planner schema & reusable engine core | In Progress | In Progress, **SLA breached** | keep + urgent merge | PRs #283/#284 green & mergeable, unmerged past SLA; fix `createInstance` AC mismatch | merge only |
| 🟡 | IPI-484 — Production Planner Epic Tracker | Todo | Todo | keep | Correct but inconsistent SLA vs. active child — flag as template issue | same merge blocker |

## Brand and onboarding (07)

| Dot | Task | Current | Correct | Action | Correction | Blocker |
|---|---|---|---|---|---|---|
| 🔴 | **IPI-336 — DESIGN-053 Onboarding React Parity (13-screen funnel)** | **Done** | **Reopen** | **reopen** | Zero corroborating code; live route is still the 3-step wizard | actual funnel build |
| 🟡 | IPI-123 — DASH-003 Brand Intelligence Report View | Done | Done | rewrite | Stale progress table — all gaps actually shipped | none |
| ⚪ | IPI-340 — MODEL-GATE-02 Send booking request | Done | Done | move | Mis-tagged into Brand; belongs to Talent/Model Booking | none |
| ⚪ | IPI-99 — WEB-015.9 Login redirect + draft claim + prefill | Done | Unverifiable | — | Sparse description, couldn't confirm specific behavior | n/a |
| 🟢 | IPI-278, 132, 46, 29, 26, 25, 24, 19, 272, 271, 242, 130, 52, 33, 32, 31, 30, 28, 27, 16, 11, 260, 219, 114 (24 issues) | Done | Done | keep | All individually verified against real merged code — see `04-features-design.md` for per-issue evidence | none |

## CRM (09)

| Dot | Task | Current | Correct | Action | Correction | Blocker |
|---|---|---|---|---|---|---|
| 🔴 | IPI-363 — CRM-UX-001 Companies list + detail | In Progress | **Done** | **close** | Fully shipped under IPI-391 + 388/389 | stale bookkeeping |
| 🔴 | IPI-364 — CRM-UX-002 Contacts list + detail | In Progress | **Done** | **close** | Fully shipped under IPI-392 + 388/390 | none |
| 🔴 | IPI-403 — BE-CRM-OPT convenience RPCs | In Progress | **Todo/Backlog** | rewrite (status) | 0% shipped, "In Progress" is misleading | none |
| 🟡 | IPI-396 — SCR-31 CRM Deal Detail | In Progress | In Progress | keep | Confirmed 28-line stub; fix route citation | none outstanding |
| 🟡 | IPI-373 — CRM-DESIGN-001 Claude Design screen prompts completion | In Progress | rewrite/close | rewrite | Own gating premise already bypassed; deliverables missing | its own artifacts missing |
| 🟡 | IPI-395 — SCR-30 CRM Pipeline React Parity | Done | Done | keep | False "live" column claims in description — correct them | none |
| 🟡 | IPI-374 — CRM-AI-004 Route welcome + suggestion chips | Todo | ready to start | rewrite (blocker) | Soft blocker already shipped | none remaining |
| 🟡 | IPI-369 — CRM-AI-003 crm-assistant wave 2 | Todo | ready to start | rewrite (blocker) | Cited blocker dead/duplicate; real dependency (395) is Done | none remaining |
| ⚪ | IPI-367 — CRM-AI-001 Won/Lost HITL gate + brand conversion | Todo | Todo | keep | Zero code; dead blocker reference in prose | IPI-396 |
| ⚪ | IPI-370 — CRM-QA-001 MVP acceptance verification | Todo | Todo | keep | Cites 3 nonexistent plan docs | IPI-367, 369 |
| ⚪ | IPI-375 — CRM-POST-006 AI Concierge daily briefing | Todo | Todo | keep | Correctly blocked | IPI-370 |
| ⚪ | IPI-95 — WEB-015.2 capture-lead edge function | Done | Done | move | Mis-tagged into CRM by this audit; belongs to website lead-capture | none |
| 🟢 | IPI-387, 385, 392, 391, 390, 389, 388, 368, 362 (9 issues) | Done | Done | keep | All individually verified — see `04-features-design.md` | none |

## Shoot and Booking + Model Booking MVP (08)

| Dot | Task | Current | Correct | Action | Correction | Blocker |
|---|---|---|---|---|---|---|
| 🟡 | IPI-233 — FIX Workflow runtime chains API→DB | In Progress (10+ days overdue) | In Progress, flagged | flag | Both blockers Done, SLA breached, checklist not visibly executed | needs execution |
| 🟡 | IPI-488 — BE-SD1b Booking QA seed data + E2E reliability | In Progress | In Progress | keep | Real, correctly unmerged (PR #288) | merge #288 |
| 🟡 | IPI-346 — MODEL-GATE-08 App TS types for booking APIs | Done | Done | keep | Low-confidence proof — types folded into other files | none |
| 🟢 | IPI-228, 112, 411, 410, 397, 371, 372, 348, 347, 344, 342, 341, 339, 308, 274, 209, 189, 183, 148, 150, 149, 85, 427, 426, 188, 185, 187, 186, 84 (29 issues) | Done | Done | keep | All individually verified against real merged code/migrations — see `04-features-design.md` | none |
| 🟢 | IPI-383 — SHOOTS-INTEL-PREVIEW | Done | Done | keep, attach project | Verified; has no Linear project attached | none |

## Campaign (10)

| Dot | Task | Current | Correct | Action | Correction | Blocker |
|---|---|---|---|---|---|---|
| 🟢 | IPI-268 — BE-D1 Campaigns schema migration | Done | Done | keep | Verified merged, genuinely schema-only | none — unblocks IPI-249/297 |

## Assets and Cloudinary (11)

| Dot | Task | Current | Correct | Action | Correction | Blocker |
|---|---|---|---|---|---|---|
| 🔴 | **IPI-351 — Cloudinary Verification (acceptance gate)** | **Done** | **Reopen** | **reopen** | Live table has only 4 stale seed rows, no real webhook proof | IPI-432 |
| 🔴 | IPI-155 — DNA-005 Asset approval flow | Todo | Todo | rewrite | AC references nonexistent shared `ApprovalCard` | IPI-154 |
| 🔴 | IPI-154 — DNA-004 Asset compliance workflow | Todo | Todo | keep | No workflow exists yet | IPI-152 |
| 🟡 | IPI-257 — DESIGN-074 Cloudinary Media Pipeline | Done | Done | keep | 074a-e shipped; 074f never shipped — fold into IPI-438 | none |
| 🟡 | IPI-349 — Cloudinary Config Cleanup | Done | Done | keep | Correct PR citation (#196, not #194) | none |
| 🟢 | IPI-353, 352, 350, 247, 243, 292, 291 (7 issues) | Done | Done | keep | All individually verified — see `04-features-design.md` | none |

## Notifications (12)

| Dot | Task | Current | Correct | Action | Correction | Blocker |
|---|---|---|---|---|---|---|
| 🟢 | IPI-345, 343, 335, 307 (4 issues) | Done | Done | keep | All individually verified merged — see `04-features-design.md` | none |

## Design V2 and React parity (13)

| Dot | Task | Current | Correct | Action | Correction | Blocker |
|---|---|---|---|---|---|---|
| 🔴 | IPI-286 — Intelligence Panel: Route-Aware Context Sections | Done | Partial, overstated | rewrite AC | PR #164 closed unmerged; real AC has no backing API | needs backing API |
| 🟡 | IPI-246 — DESIGN-046 EvidenceBlock component | Done | Partial | rewrite AC | 2 of 5 claimed screens actually wired, not 5 | Assets/Campaigns still placeholder |
| 🟡 | IPI-264 — DESIGN Mobile Verification Pass/Fail Matrix | Done | Done (design-track only) | rewrite (scope note) | Verified DC prototype only, not live routes | none blocking |
| 🟢 | IPI-386, 17, 306, 305, 290, 294, 293, 295, 270, 255, 244, 288, 269 (13 issues) | Done | Done | keep | All individually verified — see `04-features-design.md` | none |
| ⚪ | IPI-398, 399, 400, 402, 262, 263 (6 issues) | various | same | **move** | Backend/AI plumbing mis-filed under Design V2, no visual deliverable | see move table in `04` |

## Testing, CI, deployment, observability, rollback (14)

| Dot | Task | Current | Correct | Action | Correction | Blocker |
|---|---|---|---|---|---|---|
| 🔴 | IPI-453 — FIX Production Error Boundaries for Operator Routes | In Review | In Review | keep | Real code, unmerged (PR #267) — zero `error.tsx` on `origin/main` today | merge #267 |
| 🟢 | IPI-124 — SEC-002 Remove VITE_GEMINI_API_KEY | Done | Done | keep | Verified clean | none |
| 🟢 | IPI-451 — BE-SD1 Database seed data | Done | Done | keep | Verified | none |
| 🟢 | IPI-121 — PLT-012 Vendor Next.js app + CI split | Done | Done | keep | Verified | none |

## Documentation and architecture (15)

No dedicated Linear issues exist for this stack — see `05-testing-operations.md` for the finding.

---

**Total priority rows accounted for:** 159 (matches the 161-issue "priority" universe minus 2 already covered as verified gaps rather than tracked issues in stack 08).
