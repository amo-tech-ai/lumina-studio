# Reference folders removed (roadmap trim)

**Date:** 2026-07-09  
**Reason:** Not on iPix Cloudflare roadmap (OpenNext + Workers AI + AI Gateway + Supabase). Restored from git if needed.

| Removed folder | Why |
|----------------|-----|
| `argo-smart-routing/` | Enterprise networking — not MVP |
| `ddos/` | Platform-managed; no custom work planned |
| `email-routing/` | Not used |
| `email-workers/` | Not used |
| `graphql-api/` | Analytics GraphQL — use dashboard / observability instead |
| `miniflare/` | Wrangler dev/test replaces local sim |
| `network-interconnect/` | Enterprise CNI |
| `pulumi/` | No Pulumi IaC in repo |
| `terraform/` | No Terraform in repo |
| `containers/` | No container Workers planned |
| `cron-triggers/` | No scheduled Workers jobs planned (yet) |
| `realtime-sfu/` | Not on roadmap |
| `realtimekit/` | Not on roadmap |
| `sandbox/` | Not using CF Sandbox API |
| `spectrum/` | L4 proxy not needed |
| `tail-workers/` | Not using tail consumers |
| `workers-vpc/` | Not using VPC |
| `zaraz/` | Tag manager not in stack |
| `r2-data-catalog/` | Iceberg/catalog deferred |
| `flagship/` | Feature flags not on CF Flagship |

**Still in hub:** workers, wrangler, workers-ai, ai-gateway, agents-sdk, durable-objects, kv, r2, d1, hyperdrive, vectorize, tunnel, waf, turnstile, pages, opennext-related via mastra ref, etc.

Official docs remain at https://developers.cloudflare.com/ for any removed product.
