<!-- RECONSTRUCTION NOTE (2026-07-15): this file was wiped, along with 02/04/05/06/07/09/10, when a
     concurrent process switched branches in the shared /home/sk/ipix worktree. Unlike 07/09/10
     (recovered in full from this session's own Read-tool history), this file was only ever seen
     truncated at line 197 (via a system-reminder showing the user's editor selection). Everything
     below is the verbatim recovered portion. Content past line 197 is NOT recoverable and is not
     guessed at here. -->

Verification table

  Linear task: IPI-594
  Full task name: CF-MIG-230 — Migrate Mastra Agents to Cloudflare-Native AI Routing
  Change made: Renamed, rewritten into Waves 0–7 with canary %, per-wave rollback, golden-eval gate, CRM security gate
  Official source added: cloudflare/ai repo, AI Gateway binding tutorial
  Dependency fixed: blockedBy IPI-591 for Wave 3 only (not all 9 agents)
  Remaining blocker: Waves not yet executed
  Status: Backlog
  ────────────────────────────────────────
  Linear task: IPI-592
  Full task name: CF-MIG-820 — Delete Custom AI Gateway Worker
  Change made: Softened unverified "is the live path" claim to an open question; added 3-PR split, secrets deprecate→revoke sequence, infra
  rollback, deployed-Worker-deletion requirement
  Official source added: Worker deletion API/CLI docs
  Dependency fixed: blockedBy new soak-gate issue (IPI-609)
  Remaining blocker: Production AI_ROUTING_MODE value still unconfirmed (secret read blocked this session)
  Status: Backlog
  ────────────────────────────────────────
  Linear task: IPI-590
  Full task name: CF-GW-002 — Configure AI Gateway Managed Features
  Change made: Converted to umbrella issue; removed false "all 7 dashboard-only" claim; added accurate per-feature table
  Official source added: cf-aig-metadata docs
  Dependency fixed: relatedTo all 11 sub-issues (IPI-595–605)
  Remaining blocker: None
  Status: Backlog
  ────────────────────────────────────────
  Linear task: IPI-598
  Full task name: CF-GW-013 — Versioned AI Gateway Configuration Record
  Change made: Added managed-first-before-manual-docs requirement (REST API/Audit Logs/Terraform/MCP/dashboard export checked first)
  Official source added: AI Gateway REST API
  Dependency fixed: —
  Remaining blocker: Which programmatic method exists, unconfirmed
  Status: Backlog
  ────────────────────────────────────────
  Linear task: IPI-460
  Full task name: CF-AI-010 — AI Cost Tracking & Observability
  Change made: Replaced "c

<!-- TRUNCATED HERE — this is the exact point the recovered copy cuts off. Rows for IPI-460 onward
     (and any content beyond the verification table — this file's earlier turns referenced items
     like IPI-485/500/589/460 supersede-or-update guidance similar in shape to 07-linear-notes.md's
     §6 table) are not recoverable from this session's context. -->
