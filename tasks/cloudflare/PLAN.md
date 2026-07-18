# Cloudflare — Domain plan (PRD + roadmap)

**Updated:** 2026-07-18  
**Authority:** Linear for status · this file for roadmap · [`todo.md`](./todo.md) for evidence progress  
**Epic:** [IPI-487 · CLOUDFLARE-EPIC — Cloudflare Platform Migration](https://linear.app/amo100/issue/IPI-487)

## Linear (active)

| Surface | Link |
|---------|------|
| **Project** | [AI Platform — LLM Providers](https://linear.app/amo100/project/ai-platform-llm-providers-8088f63224f2) |
| **Overview** | [Cloudflare — Overview](https://linear.app/amo100/document/cloudflare-overview-d96b306aa8f3) |
| **Product Plan and Roadmap** | [Cloudflare — Product Plan and Roadmap](https://linear.app/amo100/document/cloudflare-product-plan-and-roadmap-ba1c45a23f10) |
| **Progress Tracker** | [Cloudflare — Progress Tracker](https://linear.app/amo100/document/cloudflare-progress-tracker-314ad98b0d69) |

### Related active issues

- [IPI-606 · CF-SEC-010 — Connect Infisical Secrets to Cloudflare Deployment](https://linear.app/amo100/issue/IPI-606)
- [IPI-632 · CF-MIG-220 — Protected Preview Runtime Smoke Validation](https://linear.app/amo100/issue/IPI-632)
- [IPI-627 · CF-SEC-020 — Deployment Security Proof](https://linear.app/amo100/issue/IPI-627)
- Historical completed parent: [IPI-487 · CLOUDFLARE-EPIC — Cloudflare Platform Migration](https://linear.app/amo100/issue/IPI-487) (Done — children still drive work)


## Purpose

Host the Next.js operator app on Cloudflare Workers (OpenNext), keep AI traffic reliable via AI Gateway / Workers AI, and retire the custom `ai-gateway` Worker only after proven zero-legacy traffic.

## Goals

1. Protected preview on `ipix-operator-preview` with remote auth + CopilotKit SSE + one agent turn.
2. Production DNS cutover with rehearsed rollback.
3. Post-launch: Hyperdrive for Mastra storage, native AI routing, Edge LLM via Gateway REST.

## Scope

| In scope | Out of scope |
|----------|--------------|
| OpenNext Worker, secrets, CI upload, smoke, security proof, DNS | Design prototypes (UDP4) |
| Journey validation on CF preview / gateway | Mercur commerce |
| Hyperdrive + native AI after preview | Rewriting Mastra agents as new products |

## Current state (2026-07-18)

| Fact | Evidence |
|------|----------|
| App production host | Still **Vercel** for `ipix.co/app` |
| Preview Worker | `ipix-operator-preview` exists (IPI-472 Done) |
| Secrets sync | IPI-606 In Progress (orphan cleanup / env vars) |
| Remote SSE smoke | IPI-632 In Progress — remote not verified |
| Custom `ai-gateway` Worker | Still production AI path; frozen for new features |
| Epic IPI-487 | Linear **Done** — treat as epic closed; **do work via children** |

## Target architecture

```text
Browser → OpenNext Worker (ipix-operator)
  → Mastra + CopilotKit
  → Workers AI binding and/or AI Gateway (ipix-prod)
  → providers

Supabase Edge → AI Gateway REST (canary) → providers
Legacy services/cloudflare-worker (ai-gateway) → delete only after IPI-609
```

## Workstreams

| Stream | Outcome |
|--------|---------|
| **A · Protected preview** | Secrets + upload + remote smoke |
| **B · Production readiness** | Security proof, AI health, key journeys, DNS |
| **C · Bundle / env** | CF-ENV-001, CF-BUNDLE-220, CF-DEPLOY-030 |
| **D · Hyperdrive** | ADR → binding → canary workload |
| **E · Native AI** | One Workers AI call → agent routing → soak → delete legacy |

## Feature tables

### Core features

| Feature | Who / why | Real-world example | Related tasks |
|---------|-----------|-------------------|---------------|
| OpenNext CI + preview upload | Engineers ship Worker versions safely | `build:cf` in CI; bootstrap workflow uploads preview | [IPI-472 · INFRA-001 — OpenNext CI and Deployment Pipeline](https://linear.app/amo100/issue/IPI-472) |
| Infisical → Worker secrets | Ops: no secrets in git | GitHub env + `--secrets-file` | [IPI-606 · CF-SEC-010 — Connect Infisical Secrets to Cloudflare Deployment](https://linear.app/amo100/issue/IPI-606) |
| Remote preview smoke | Prove login + SSE like local | Playwright on `*.workers.dev` | [IPI-632 · CF-MIG-220 — Protected Preview Runtime Smoke Validation](https://linear.app/amo100/issue/IPI-632) |
| Fail-closed auth | Operators can't hit `/app` open | Middleware + cookie auth | [IPI-468 · SEC-001 — Fail-Closed Operator Authentication](https://linear.app/amo100/issue/IPI-468) |
| Bundle size gate | Stay under Workers 10 MiB gzip | CI dry-run metafile | [IPI-490 · CF-MIG-210 — Worker Bundle Compatibility and Size Gate](https://linear.app/amo100/issue/IPI-490) |

### Advanced features

| Feature | Who / why | Real-world example | Related tasks |
|---------|-----------|-------------------|---------------|
| Hyperdrive + PostgresStore | Persistent Mastra threads on Workers | Planner chat survives refresh | [IPI-616 · CF-DB-001](https://linear.app/amo100/issue/IPI-616) → [IPI-623 · CF-DB-009](https://linear.app/amo100/issue/IPI-623) |
| Native AI routing | Cut custom Worker | Marketing `fast` via Gateway | [IPI-586 · CF-AI-003](https://linear.app/amo100/issue/IPI-586) · [IPI-594 · CF-MIG-230](https://linear.app/amo100/issue/IPI-594) |
| Edge LLM via Gateway REST | BI crawl without custom Worker | Brand Intelligence edge → Gateway | [IPI-694 · CF-EDGE-AI](https://linear.app/amo100/issue/IPI-694) · [IPI-697 · CF-EDGE-003](https://linear.app/amo100/issue/IPI-697) |
| DNS cutover + rollback | Live traffic on Workers | `ipix.co` routes + version rollback | [IPI-631 · CF-MIG-810](https://linear.app/amo100/issue/IPI-631) |
| Zero-legacy soak | Safe delete of `ai-gateway` | 7-day zero traffic proof | [IPI-609 · CF-MIG-230-SOAK](https://linear.app/amo100/issue/IPI-609) → [IPI-592 · CF-MIG-820](https://linear.app/amo100/issue/IPI-592) |

### Use cases

| Persona | Use case |
|---------|----------|
| Operator | Login on preview Worker; Brand Hub crawl; Planner shot list |
| Engineer | Bootstrap secrets; dry-run bundle; capture version ID |
| Platform | Cut DNS; observe soak; delete legacy Worker |

## Dependencies

- Supabase remote project + RLS (auth cookies)
- Infisical + GitHub Environments
- Mastra registry in `app/src/mastra/` (IPI-486 track for storage)
- Do **not** start Hyperdrive until IPI-632 passes (unless product requires persistence at cutover)

## Risks

| Risk | Mitigation |
|------|------------|
| Epic Done while children open | Track children in `todo.md`; ignore epic Done as “all CF done” |
| Secret drift / orphans | IPI-606 orphan diff |
| Bundle ≥9 MiB | CF-BUNDLE-220 |
| Premature `ai-gateway` delete | Hard gate IPI-609 |

## Success criteria

- [ ] IPI-632 remote SSE + agent turn evidenced
- [ ] IPI-627 security proof
- [ ] Selected journeys (502/504/510) on preview
- [ ] IPI-631 DNS cutover with rollback rehearsal
- [ ] Post-launch: native AI + soak before IPI-592

## Roadmap (execution order)

```text
1. IPI-606 · CF-SEC-010 — Infisical secrets (finish orphans / env vars)
2. IPI-632 · CF-MIG-220 — Remote preview smoke
3. IPI-627 · CF-SEC-020 — Deployment security proof
4. IPI-510 · CF-UJ-011 — AI health journey
5. IPI-502 / IPI-504 — BI + Shoot journeys (selected)
6. IPI-631 · CF-MIG-810 — DNS cutover + rollback
7. Post: IPI-616…623 Hyperdrive · IPI-586…594 native AI · IPI-694…699 Edge · IPI-609→592
```

Detailed hosting notes: [`prime/04-plan-hosting.md`](./prime/04-plan-hosting.md).

Historical research under [`plan/`](./plan/) (e.g. `simplify-ai-setup-plan.md`) — **not** the active `PLAN.md`.
