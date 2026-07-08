---
name: cloudflare
description: >
  Cloudflare platform hub — Workers, Pages, Wrangler CLI, D1/R2/KV, Durable Objects,
  Workers AI, Agents SDK, AI Gateway, Vectorize, Workflows, Tunnel, WAF, Terraform/Pulumi,
  and production Workers best practices. Use whenever the user mentions Cloudflare, Workers,
  wrangler, edge functions, Durable Objects, AI agents on Workers, `@cloudflare/workers-types`,
  `wrangler.jsonc`, Hyperdrive, or iPix Cloudflare tasks under `tasks/cloudflare/` — even if
  they do not say "Cloudflare" explicitly. NOT for Cloudinary media (→ cloudinary) or Supabase
  Postgres/RLS (→ ipix-supabase).
version: 1.0.0
metadata:
  priority: 2
---

# Cloudflare Platform Hub

One consolidated Cloudflare skill (like [`cloudinary`](../cloudinary/SKILL.md)). **Load matching
`references/` on demand** — do not paste reference bodies into chat.

Your knowledge of Cloudflare APIs, limits, and pricing may be outdated. **Prefer retrieval over
pre-training** — trust [developers.cloudflare.com](https://developers.cloudflare.com/) when refs
and docs disagree.

---

## Routing — load the reference that matches the task

| User intent | Reference to load |
|-------------|-------------------|
| **Wrangler CLI** — deploy, dev, secrets, KV/R2/D1 commands | [`references/wrangler/cli-guide.md`](references/wrangler/cli-guide.md) (+ [`configuration.md`](references/wrangler/configuration.md) for bindings) |
| **Review/write Worker code** — streaming, bindings, anti-patterns | [`references/workers-best-practices/workers-best-practices.md`](references/workers-best-practices/workers-best-practices.md) |
| **Agents SDK** — stateful agents, chat, MCP, workflows, `@callable` | [`references/agents-sdk/agents-sdk.md`](references/agents-sdk/agents-sdk.md) |
| **Pick a Cloudflare product** (storage, AI, security, networking) | Decision trees below → product folder under `references/` |
| **MCP live ops** | Cloudflare MCP plugins (`plugin-cloudflare-*`) complement these refs |

### Priority when tasks overlap

1. **workers-best-practices** — any Worker handler or binding access
2. **wrangler/cli-guide** — CLI deploy/config/secrets
3. **agents-sdk** — Agent class, DO-backed agents, React client hooks
4. **Product ref** — D1, R2, AI Gateway, etc.

### Don't use this hub for

- **Cloudinary** transforms/uploads → [`cloudinary`](../cloudinary/SKILL.md)
- **Supabase** schema/RLS/edge → [`ipix-supabase`](../ipix-supabase/SKILL.md)
- **Gemini/Mastra** in iPix operator app → [`mastra`](../mastra/SKILL.md) / [`gemini`](../gemini/SKILL.md)
- Generic Next.js UI without Workers → [`nextjs-developer`](../nextjs-developer/SKILL.md)

---

## Retrieval sources

| Source | How to retrieve | Use for |
|--------|-----------------|---------|
| Cloudflare docs | MCP `cloudflare-docs` or developers.cloudflare.com | Limits, pricing, API signatures |
| Workers types | `npm pack @cloudflare/workers-types` or `node_modules` | Binding/handler types |
| Wrangler schema | `node_modules/wrangler/config-schema.json` | Config fields, binding shapes |
| Changelog | developers.cloudflare.com/changelog | Deprecations, new limits |

---

## Decision trees

### "I need to run code"

```
Need to run code?
├─ Serverless functions at the edge → references/workers/
├─ Full-stack web app with Git deploys → references/pages/
├─ Stateful coordination/real-time → references/durable-objects/
├─ Long-running multi-step jobs → references/workflows/
├─ Run containers → references/containers/
├─ Multi-tenant (customers deploy code) → references/workers-for-platforms/
├─ Scheduled tasks (cron) → references/cron-triggers/
├─ Lightweight edge logic (modify HTTP) → references/snippets/
├─ Process Worker execution events → references/tail-workers/
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
└─ ETL / Iceberg / analytics SQL → references/pipelines/, r2-data-catalog/, r2-sql/
```

### "I need AI/ML"

```
Need AI?
├─ Inference (LLMs, embeddings) → references/workers-ai/
├─ Vector DB / RAG → references/vectorize/
├─ Stateful AI agents → references/agents-sdk/agents-sdk.md
├─ Multi-provider gateway → references/ai-gateway/
└─ AI search widget → references/ai-search/
```

### "I need networking / security / media / IaC"

See product index below — folders follow `references/<product>/` with README + api/configuration/patterns/gotchas where applicable.

---

## Product index

### Developer tools (start here for tooling)

| Topic | Reference |
|-------|-----------|
| Wrangler CLI (full) | `references/wrangler/cli-guide.md` |
| Wrangler (patterns/config) | `references/wrangler/` |
| Workers best practices | `references/workers-best-practices/` |
| Miniflare / C3 / Observability | `references/miniflare/`, `references/c3/`, `references/observability/` |

### Compute & runtime

| Product | Reference |
|---------|-----------|
| Workers | `references/workers/` |
| Pages | `references/pages/` |
| Durable Objects | `references/durable-objects/` |
| Workflows | `references/workflows/` |
| Containers | `references/containers/` |
| Workers for Platforms | `references/workers-for-platforms/` |
| Cron / Snippets / Tail Workers | `references/cron-triggers/`, `references/snippets/`, `references/tail-workers/` |

### Storage & data

| Product | Reference |
|---------|-----------|
| KV · D1 · R2 · Queues · Hyperdrive | `references/kv/`, `d1/`, `r2/`, `queues/`, `hyperdrive/` |
| DO storage · Secrets Store · Pipelines | `references/do-storage/`, `secrets-store/`, `pipelines/` |

### AI

| Product | Reference |
|---------|-----------|
| Workers AI · Vectorize · AI Gateway · AI Search | `references/workers-ai/`, `vectorize/`, `ai-gateway/`, `ai-search/` |
| **Agents SDK** (deep) | `references/agents-sdk/agents-sdk.md` + topic `*.md` in same folder |

### Security · networking · media · IaC

| Area | Reference |
|------|-----------|
| WAF · DDoS · Bot Management · Turnstile | `references/waf/`, `ddos/`, `bot-management/`, `turnstile/` |
| Tunnel · Spectrum · Argo | `references/tunnel/`, `spectrum/`, `argo-smart-routing/` |
| Images · Stream · Browser Rendering | `references/images/`, `stream/`, `browser-rendering/` |
| Terraform · Pulumi · REST API | `references/terraform/`, `pulumi/`, `api/` |
| Flagship (feature flags) | `references/flagship/` |

---

## How to use this skill

1. Classify the task from the routing table or decision trees.
2. Load **one** entry guide (`agents-sdk.md`, `cli-guide.md`, `workers-best-practices.md`, or product `README.md`).
3. Load deeper topic files only when the guide points to them — keep context lean.
