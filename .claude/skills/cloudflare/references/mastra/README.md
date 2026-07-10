# Mastra on Cloudflare (iPix)

Mastra AI runtime for the operator app — **Phase 1: in-process inside OpenNext Worker**. Standalone `@mastra/deployer-cloudflare` is Phase 2+ only.

**Canonical repo paths:** `app/src/mastra/` · `tasks/cloudflare/mastra/` · audit [`ipi-454-457-462-463-verification.md`](../../../../tasks/cloudflare/audits/ipi-454-457-462-463-verification.md)

**Also load:** [`../workers-ai/README.md`](../workers-ai/README.md) · [`../ai-gateway/README.md`](../ai-gateway/README.md) · repo [`mastra`](../../../mastra/SKILL.md) skill for agent/tool patterns.

---

## Routing — which doc to load

| Task | Load |
|------|------|
| OpenNext preview, CopilotKit routes, storage, build gotchas | [`opennext-inprocess.md`](opennext-inprocess.md) |
| Workers AI model strings, tiers, `resolveModel()` wiring | [`workers-ai-wiring.md`](workers-ai-wiring.md) |
| Build failures, Proxy pattern, LibSQL, CI | [`gotchas.md`](gotchas.md) |
| Separate Mastra Worker via `CloudflareDeployer` | [`standalone-deployer.md`](standalone-deployer.md) |

---

## iPix deployment modes

| Mode | When | Entry |
|------|------|-------|
| **A — In-process (current)** | Next.js on Workers via OpenNext; Mastra imported in API routes | `app/wrangler.jsonc` + `app/src/mastra/index.ts` |
| **B — Standalone Mastra Worker** | Dedicated agent API at `*.workers.dev/api/agents` | `@mastra/deployer-cloudflare` — defer until Phase 2 |

Mode **A** is the MVP path per [`tasks/cloudflare/migration/startup.md`](../../../../tasks/cloudflare/migration/startup.md).

---

## Inference path (today vs target)

```
Today:  Agent → resolveModel() → @ai-sdk/google (Gemini) | @ai-sdk/groq
Target: Agent → resolveModel() → AI Gateway → Workers AI (primary) → Gemini fallback
```

Track: IPI-454 AC-F · IPI-457 registry · IPI-462 eval gate · IPI-463 failover.

---

## Official sources

| Source | URL |
|--------|-----|
| Mastra Cloudflare deploy | https://mastra.ai/guides/deployment/cloudflare |
| CloudflareDeployer API | https://mastra.ai/reference/deployer/cloudflare |
| Workers AI provider (Mastra) | https://mastra.ai/models/providers/cloudflare-workers-ai |
| OpenNext on Cloudflare | https://opennext.js.org/cloudflare |
