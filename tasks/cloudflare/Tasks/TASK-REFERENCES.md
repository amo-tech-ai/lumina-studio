# Task References Index (21–30)

**Quick lookup:** All official Cloudflare + Mastra documentation links for each task.

Each task file includes frontmatter with 4 key references. Use these to research, verify, and troubleshoot.

---

## Task 21: Install OpenNext + Wrangler Dependencies

| Reference | URL | Topic |
|-----------|-----|-------|
| OpenNext Cloudflare Docs | https://opennext.js.org/cloudflare | Build, preview and deploy existing Next.js apps |
| Wrangler Documentation | https://developers.cloudflare.com/workers/wrangler/ | Main Cloudflare CLI tool |
| Next.js on Cloudflare Workers | https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/ | Official Next.js deployment guide |
| Node.js Compatibility | https://developers.cloudflare.com/workers/runtime-apis/nodejs/ | Check if existing dependencies work |

---

## Task 22: Create Wrangler Configuration

| Reference | URL | Topic |
|-----------|-----|-------|
| Wrangler Configuration | https://developers.cloudflare.com/workers/wrangler/configuration/ | wrangler.jsonc, bindings, environments |
| Wrangler Commands | https://developers.cloudflare.com/workers/wrangler/commands/ | Deploy, dev, and config commands |
| Environment Variables | https://developers.cloudflare.com/workers/configuration/environment-variables/ | Variables and environment separation |
| Secrets | https://developers.cloudflare.com/workers/configuration/secrets/ | Secure credentials management |

---

## Task 23: Create OpenNext Configuration

| Reference | URL | Topic |
|-----------|-----|-------|
| OpenNext Cloudflare | https://opennext.js.org/cloudflare | OpenNext adapter configuration |
| OpenNext GitHub | https://github.com/opennextjs/opennextjs-cloudflare | Adapter code, examples, issues |
| TypeScript in Workers | https://developers.cloudflare.com/workers/languages/typescript/ | TypeScript config and types |

---

## Task 24: Update package.json Scripts

| Reference | URL | Topic |
|-----------|-----|-------|
| Wrangler dev | https://developers.cloudflare.com/workers/wrangler/commands/dev | Local development and testing |
| Wrangler deploy | https://developers.cloudflare.com/workers/wrangler/commands/deploy | Deployment to production |
| Workers CI/CD | https://developers.cloudflare.com/workers/ci-cd/ | GitHub Actions and workflows |

---

## Task 25: Install Mastra Deployer for Cloudflare

| Reference | URL | Topic |
|-----------|-----|-------|
| Mastra Deployment Guide | https://mastra.ai/guides/deployment/cloudflare | Official Mastra deployer setup |
| Cloudflare Agents | https://developers.cloudflare.com/agents/ | Agent framework and capabilities |
| Mastra on Cloudflare Blog | https://blog.cloudflare.com/build-ai-agents-on-cloudflare/ | Architecture overview and patterns |
| Agents SDK GitHub | https://github.com/cloudflare/agents | Implementation examples |

---

## Task 26: Configure Mastra Deployer + KV

| Reference | URL | Topic |
|-----------|-----|-------|
| Cloudflare KV | https://developers.cloudflare.com/kv/ | Low-latency agent state storage |
| Wrangler Configuration Bindings | https://developers.cloudflare.com/workers/wrangler/configuration/ | Configure KV bindings |
| Mastra Deployment | https://mastra.ai/guides/deployment/cloudflare | Wire deployer config |
| Environment Variables | https://developers.cloudflare.com/workers/configuration/environment-variables/ | Per-environment settings |

---

## Task 27: Configure Mastra Model Registry

| Reference | URL | Topic |
|-----------|-----|-------|
| Mastra Models | https://mastra.ai/models/providers/cloudflare-workers-ai | Register models in Mastra |
| Workers AI Models | https://developers.cloudflare.com/workers-ai/models/ | Available models and pricing |
| Workers AI Setup | https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/ | Configure AI binding |
| Function Calling | https://developers.cloudflare.com/workers-ai/features/function-calling/ | Enable tool calling |

---

## Task 28: Implement Agent Auth + State Persistence

| Reference | URL | Topic |
|-----------|-----|-------|
| Cloudflare KV | https://developers.cloudflare.com/kv/ | Store conversation state |
| Agent State in Mastra | https://developers.cloudflare.com/agents/api-reference/store-and-sync-state/ | Persistent memory |
| Security Model | https://developers.cloudflare.com/workers/reference/security-model/ | Secure auth patterns |
| Bearer Token Auth | https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/ | Token validation |

---

## Task 29: Implement Streaming Agent Responses

| Reference | URL | Topic |
|-----------|-----|-------|
| Vercel AI SDK | https://developers.cloudflare.com/workers-ai/configuration/ai-sdk/ | Streaming integration |
| Workers Runtime APIs | https://developers.cloudflare.com/workers/runtime-apis/ | TransformStream and Response |
| Mastra Streaming | https://mastra.ai/guides/deployment/cloudflare | Real-time agent responses |
| Server-Sent Events | https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events | EventSource API |

---

## Task 30: Monitor Agent Performance + Error Tracking

| Reference | URL | Topic |
|-----------|-----|-------|
| Workers Observability | https://developers.cloudflare.com/workers/observability/ | Logging and monitoring |
| Workers Logs | https://developers.cloudflare.com/workers/observability/logs/ | Console logs and streaming |
| Tail Workers | https://developers.cloudflare.com/workers/observability/logs/tail-workers/ | Real-time wrangler tail |
| Analytics Engine | https://developers.cloudflare.com/analytics/analytics-engine/ | Time-series and cost tracking |
| AI Gateway Observability | https://developers.cloudflare.com/ai-gateway/observability/ | Usage and failure tracking |

---

## Task 31: Enable AI Gateway Caching

| Reference | URL | Topic |
|-----------|-----|-------|
| AI Gateway Caching | https://developers.cloudflare.com/ai-gateway/configuration/caching/ | Reduce latency by up to 90% |
| AI Gateway Overview | https://developers.cloudflare.com/ai-gateway/ | Gateway features and config |
| AI Gateway Analytics | https://developers.cloudflare.com/ai-gateway/observability/ | Monitor cache hit rates |
| Cloudflare Blog - AI Gateway | https://blog.cloudflare.com/announcing-cloudflare-ai-gateway/ | Architecture and best practices |

---

## Task 32: Configure Worker Rate Limiting

| Reference | URL | Topic |
|-----------|-----|-------|
| Rate Limiting API | https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/ | Implement rate limits in code |
| Workers Analytics Engine | https://developers.cloudflare.com/analytics/analytics-engine/ | Track rate-limited requests |
| AI Gateway Rate Limiting | https://developers.cloudflare.com/ai-gateway/configuration/rate-limiting/ | Gateway-level rate limiting |
| Security Best Practices | https://developers.cloudflare.com/workers/reference/security-model/ | Secure API design |

---

## Task 33: Setup Cron Triggers for Maintenance

| Reference | URL | Topic |
|-----------|-----|-------|
| Cron Triggers | https://developers.cloudflare.com/workers/platform/triggers/cron-triggers/ | Schedule periodic tasks |
| Wrangler Configuration | https://developers.cloudflare.com/workers/wrangler/configuration/ | Cron trigger config |
| Scheduled Handlers | https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/ | Implement scheduled() handler |
| Workers Monitoring | https://developers.cloudflare.com/workers/observability/ | Monitor cron job execution |

---

## How to Use This Index

1. **During implementation:** Open the task file, scroll to frontmatter, click the reference link
2. **For research:** Use this table to find all related docs at once
3. **For troubleshooting:** Search the reference table for your problem area
4. **For learning:** Follow references in order (top to bottom for each task)

Each task frontmatter uses `YAML` format for easy parsing:

```yaml
---
title: "Task Name"
references:
  - title: Link title
    url: https://...
    topic: What to learn
---
```

---

## Official Source

All links curated from:
- **Cloudflare Developers:** developers.cloudflare.com (primary authority)
- **Mastra Docs:** mastra.ai (official framework)
- **Mastra Blog:** blog.cloudflare.com (announcements + patterns)
- **GitHub:** Official repositories for SDKs and examples

Updated: 2026-07-12
