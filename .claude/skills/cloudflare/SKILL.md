---
name: cloudflare
description: >
  Cloudflare platform hub — Workers, Pages, Wrangler CLI, D1/R2/KV, Durable Objects,
  Workers AI, AI Gateway, Mastra-on-Workers (OpenNext), Vectorize, Workflows, Tunnel,
  WAF, and production Workers best practices. Use whenever the user mentions Cloudflare,
  Workers, wrangler, edge functions, Durable Objects, AI agents on Workers,
  `@cloudflare/workers-types`, `wrangler.jsonc`, Hyperdrive, Mastra on Cloudflare, or iPix
  Cloudflare tasks under `tasks/cloudflare/` — even if they do not say "Cloudflare" explicitly.
  NOT for Cloudinary media (→ cloudinary) or Supabase Postgres/RLS (→ ipix-supabase).
version: 1.1.0
metadata:
  priority: 2
---

# Cloudflare Platform Hub

One consolidated Cloudflare skill (like [`cloudinary`](../cloudinary/SKILL.md)). **Load matching
`references/` on demand** — do not paste reference bodies into chat.

Your knowledge of Cloudflare APIs, limits, and pricing may be outdated. **Prefer retrieval over
pre-training** — trust [developers.cloudflare.com](https://developers.cloudflare.com/) when refs
and docs disagree.

**Trimmed refs (2026-07-09):** see [`references/REMOVED-FOR-NOW.md`](references/REMOVED-FOR-NOW.md).

---

## Routing — load the reference that matches the task

| User intent | Reference to load |
|-------------|-------------------|
| **Mastra + OpenNext on Workers** (iPix primary) | [`references/mastra/README.md`](references/mastra/README.md) → `opennext-inprocess.md` |
| **Workers AI / model tiers / resolveModel()** | [`references/mastra/workers-ai-wiring.md`](references/mastra/workers-ai-wiring.md) + [`workers-ai/`](references/workers-ai/) |
| **Wrangler CLI** — deploy, dev, secrets, KV/R2/D1 | [`references/wrangler/cli-guide.md`](references/wrangler/cli-guide.md) |
| **Review/write Worker code** — streaming, bindings | [`references/workers-best-practices/workers-best-practices.md`](references/workers-best-practices/workers-best-practices.md) |
| **Agents SDK** (CF-native DO agents, not Mastra) | [`references/agents-sdk/agents-sdk.md`](references/agents-sdk/agents-sdk.md) |
| **AI Gateway worker** (multi-provider routing) | [`references/ai-gateway/README.md`](references/ai-gateway/README.md) |
| **Pick a Cloudflare product** | Decision trees below → product folder under `references/` |
| **MCP live ops** | Cloudflare MCP plugins complement these refs |

### Priority when tasks overlap

1. **mastra/** — iPix operator app on OpenNext (in-process agents)
2. **workers-best-practices** — any Worker handler or binding access
3. **wrangler/cli-guide** — CLI deploy/config/secrets
4. **workers-ai / ai-gateway** — inference routing
5. **agents-sdk** — only for CF Agents SDK (distinct from Mastra)

### Don't use this hub for

- **Cloudinary** transforms/uploads → [`cloudinary`](../cloudinary/SKILL.md)
- **Supabase** schema/RLS/edge → [`ipix-supabase`](../ipix-supabase/SKILL.md)
- **Mastra agents/tools** (framework patterns) → [`mastra`](../mastra/SKILL.md) + **`references/mastra/`** for CF deployment
- Generic Next.js UI without Workers → [`nextjs-developer`](../nextjs-developer/SKILL.md)

---

## Retrieval sources

| Source | How to retrieve | Use for |
|--------|-----------------|---------|
| Cloudflare docs | MCP `cloudflare-docs` or developers.cloudflare.com | Limits, pricing, API signatures |
| Workers types | `node_modules/@cloudflare/workers-types` | Binding/handler types |
| Wrangler schema | `node_modules/wrangler/config-schema.json` | Config fields, binding shapes |
| Mastra CF | `references/mastra/` + tasks/cloudflare/mastra/ | iPix deployment |
| Changelog | developers.cloudflare.com/changelog | Deprecations, new limits |

---

## Decision trees

### "I need to run code"

```
Need to run code?
├─ Next.js + Mastra on Workers (iPix) → references/mastra/opennext-inprocess.md
├─ Serverless functions at the edge → references/workers/
├─ Full-stack web app with Git deploys → references/pages/
├─ Stateful coordination/real-time → references/durable-objects/
├─ Long-running multi-step jobs → references/workflows/
├─ Multi-tenant (customers deploy code) → references/workers-for-platforms/
├─ Lightweight edge logic (modify HTTP) → references/snippets/
└─ Optimize latency to backend → references/smart-placement/
```

### "I need to store data"

```
Need storage?
├─ Key-value → references/kv/
├─ SQL → references/d1/ or references/hyperdrive/
├─ Object storage → references/r2/
├─ Versioned file trees → references/artifacts/
├─ Message queue → references/queues/
├─ Vector embeddings → references/vectorize/
├─ Per-entity strong consistency → references/durable-objects/
├─ Secrets → references/secrets-store/
└─ ETL / analytics SQL → references/pipelines/, r2-sql/
```

### "I need AI/ML"

```
Need AI?
├─ Mastra agents on OpenNext (iPix) → references/mastra/
├─ Inference (LLMs, embeddings) → references/workers-ai/
├─ Vector DB / RAG → references/vectorize/
├─ CF Agents SDK (DO-backed) → references/agents-sdk/agents-sdk.md
├─ Multi-provider gateway → references/ai-gateway/
└─ AI search widget → references/ai-search/
```

### "I need networking / security / media"

See product index below — folders follow `references/<product>/` with README + api/configuration/patterns/gotchas where applicable.

---

## Product index (active)

### Developer tools

| Topic | Reference |
|-------|-----------|
| **Mastra on Cloudflare (iPix)** | `references/mastra/` |
| Wrangler CLI | `references/wrangler/cli-guide.md` |
| Workers best practices | `references/workers-best-practices/` |
| C3 / Observability | `references/c3/`, `references/observability/` |

### Compute & runtime

| Product | Reference |
|---------|-----------|
| Workers | `references/workers/` |
| Pages | `references/pages/` |
| Durable Objects | `references/durable-objects/` |
| Workflows | `references/workflows/` |
| Workers for Platforms | `references/workers-for-platforms/` |
| Snippets | `references/snippets/` |

### Storage & data

| Product | Reference |
|---------|-----------|
| KV · D1 · R2 · Queues · Hyperdrive | `references/kv/`, `d1/`, `r2/`, `queues/`, `hyperdrive/` |
| DO storage · Secrets Store · Pipelines | `references/do-storage/`, `secrets-store/`, `pipelines/` |

### AI

| Product | Reference |
|---------|-----------|
| Workers AI · Vectorize · AI Gateway · AI Search | `references/workers-ai/`, `vectorize/`, `ai-gateway/`, `ai-search/` |
| Agents SDK (CF-native) | `references/agents-sdk/agents-sdk.md` |

### Security · networking · media

| Area | Reference |
|------|-----------|
| WAF · Bot Management · Turnstile | `references/waf/`, `bot-management/`, `turnstile/` |
| Tunnel | `references/tunnel/` |
| Images · Stream · Browser Rendering | `references/images/`, `stream/`, `browser-rendering/` |
| REST API (management) | `references/api/` |

---

## How to use this skill

1. Classify the task from the routing table or decision trees.
2. Load **one** entry guide (`mastra/README.md`, `agents-sdk.md`, `cli-guide.md`, or product `README.md`).
3. Load deeper topic files only when the guide points to them — keep context lean.
