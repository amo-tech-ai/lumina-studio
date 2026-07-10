# iPix / FashionOS — Architecture Audit Report

**Date:** 2026-07-09 · Scope: the consolidated 16-diagram set (`docs/architecture/diagrams/01`–`16`), each independently re-verified against `prd.md`, `roadmap.md`, `/home/sk/ipix/app`, `tasks/cloudflare/`, and `Universal-design-prompt-new/` during consolidation from the earlier 52-diagram pass.

## 1. Overall architecture score: 63/100 🟡

Weighted by category (🟢 full credit, 🟡 half credit, ⚪/🔴 no credit):

| Category | Estimate | Basis |
|---|:---:|---|
| Core features (Brand/CRM/Booking/Shoot/Assets) | ~80% | 5 of 9 features fully real; Campaign/Planner-UI unbuilt, Intelligence undecided |
| Data layer | ~85% | Strongest layer; only real gap is Realtime/notifications |
| Cloudflare infra | ~35% | Only Workers + AI Gateway Worker + Workers AI (embedding only) are live |
| AI platform | ~45% | Agents/tools real; the Gateway connecting them isn't wired |
| Planner | ~35% | Backend near-merge; UI is 0% |
| Deployment/Operations | ~30% | CI real; no monitoring, unmerged error boundaries, no rollback script |

This is consistent with (not a revision of) the scores this same effort produced before consolidation — consolidating 52 diagrams into 16 didn't change what's actually built, it just made the picture easier to maintain.

## 2. Documentation accuracy: 78/100 🟡

`prd.md` and `roadmap.md` (the two documents authored this session) are now highly accurate — **11 real factual errors were found and corrected** across two verification passes, and both documents explicitly mark every correction inline with a date, rather than silently fixing and hiding the history. Post-correction, these two documents are the most reliable in the repo.

The score isn't higher because the **broader documentation set** (older Approved docs like `ai-agent-architecture.md`, and the now-archived scratch diagrams in `tasks/diagrams/`) still has uncorrected drift — flagged in this pass's reports but left alone since they're outside this session's ownership. The recurring failure pattern worth naming: **tool counts, provider defaults, and component-existence claims drift quietly from reality** faster than architecture-level decisions do. Four separate corrections in this pass alone were of exactly that shape (agent tool counts, provider defaults, a component that was never built, a table that isn't actually Realtime-enabled).

## 3. Production readiness: 25/100 🔴

Cross-checked against `roadmap.md` §3's own MVP Release Gate (10 criteria) — roughly 2-3 are met today (RLS pattern established, audit logging real, CI partially green). The rest are open:

- AI Gateway not wired (blocks gate criterion 3)
- OAuth doesn't trust the future Cloudflare host (blocks criterion 4)
- Campaign not operational (blocks criterion 6)
- Planner UI not operational (blocks criterion 5)
- Preview smoke tests don't exist yet (blocks criterion 7)
- Rollback window isn't actually runnable — the plan exists, the script (`OPS-002`) doesn't (blocks criterion 10)
- No monitoring/observability (not a named gate criterion, but a real post-cutover blind spot)

## 4. Remaining blockers (ranked)

1. **AI Gateway unwired** (`IPI-454` AC-F) — every agent bypasses it, calling providers directly. Blocks Phase 2 (AI hardening), blocks Campaign's AI capability, blocks cost/failover work.
2. **OAuth host-trust gap** — `isTrustedForwardedHost()` doesn't yet recognize the Cloudflare production domain. Small, concrete, directly blocks `CF-MIG-810`.
3. **Campaign has no backend** — schema only.
4. **Planner UI has zero code** — backend is 2 PRs from done; nothing renders it yet.
5. **No monitoring/observability** — zero tooling found anywhere in the repo.
6. **Error boundaries unmerged** (`IPI-453`, PR #267) — written, not shipped.
7. **Rollback script doesn't exist** — the plan is a runbook, not yet an executable artifact.
8. **`NotificationCenter` frontend doesn't exist** — API/DB ready, nothing consumes it.
9. **No CI job builds the OpenNext bundle** — `CF-MIG-111`, 0%.

## 5. Recommended next implementation priority

**Wire the AI Gateway (`IPI-454` AC-F, unblocked by merging `IPI-457`).** This is the single highest-leverage move available right now: the Gateway Worker is already deployed, the provider registry PR is close, and this one piece of work unblocks the entire AI hardening phase, Campaign's AI capability, and the cost/failover work the roadmap already has queued behind it. It's also the most-repeated finding across every audit this session ran — nothing else in the backlog has that much downstream value sitting behind a single, already-scoped task.

**Close second:** fix the OAuth host-trust allowlist. It's small (a few lines), unblocks the production DNS cutover directly, and unlike the Gateway wiring, nothing else is currently blocking it — it could ship today.

---

*Old 52-diagram set and its original final report are preserved at `archive/` for reference. This report supersedes it.*
