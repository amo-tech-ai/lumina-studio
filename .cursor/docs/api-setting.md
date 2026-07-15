# Cloudflare API token — iPix settings guide

Token for: **Sk@ipix.co's Account** (account API token `cfat_…`)  
Used by: `CLOUDFLARE_API_TOKEN` in `app/.env.local` → `cloudflare-api` MCP + `wrangler`  
Refs: [Cloudflare MCP servers](https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/) · [API docs](https://developers.cloudflare.com/api/)

## Verdict

| Question | Answer |
|----------|--------|
| **Are these settings correct for iPix + MCP?** | **Yes** — more than enough for migration and MCP |
| **Should you remove anything?** | **Optional** — only if you want a tighter token (see table below) |
| **Is anything missing?** | **Maybe R2** and **zone DNS** — add if you use those products |
| **Must not enable** | **Client IP filtering** (breaks MCP) |

---

## Form settings (before permissions)

| Field | Set to | Why |
|-------|--------|-----|
| Account | **Entire Sk@ipix.co's Account** | Required for account token + MCP `accountId` |
| Token type | **Account API token** | Matches `cfat_` + `cf-mcp-setup.sh --api-token` |
| Client IP filtering | **Off / none** | [Required for MCP](https://github.com/cloudflare/mcp) |
| TTL | Your choice | 90 days+ fine for dev; set a reminder |

---

## Permissions table

**Legend:** ✅ Keep · ⚪ Optional (safe to remove if trimming) · ➕ Consider adding · 🔒 High privilege (keep only if you need admin)

### Core — required for MCP + Workers migration

| Permission | R/W | Verdict | Used for |
|------------|-----|---------|----------|
| Workers Scripts | Read + Write | ✅ **Keep** | Deploy/query Workers (`cloudflare-api`, wrangler) |
| Workers KV Storage | Read + Write | ✅ **Keep** | KV namespaces (bindings MCP / API) |
| D1 | Read + Write | ✅ **Keep** | D1 databases |
| Pages | Read + Write | ✅ **Keep** | Pages projects |
| Workers CI | Read (+ Write) | ✅ **Keep** | Build logs (`cloudflare-workers-builds`) |
| Workers Observability | Read (+ Write) | ✅ **Keep** | Metrics, dashboards |
| Workers Tail | Read | ✅ **Keep** | Live Worker logs |
| CF Agents | Read + Write | ✅ **Keep** | Agents SDK / DO agents |
| AI Gateway | Read + Run (+ Write) | ✅ **Keep** | Gateway routing + logs |
| Workers AI | Read + Write | ✅ **Keep** | Workers AI models |
| Account Analytics | Read | ✅ **Keep** | Account-level metrics |
| Logs | Read (+ Write) | ✅ **Keep** | Logpush / log config |
| Account API Tokens | Read | ✅ **Keep** | Account token self-verify / MCP |
| Tag | Read + Write | ✅ **Keep** | Resource tagging |

### Agents & AI platform — recommended for iPix

| Permission | R/W | Verdict | Used for |
|------------|-----|---------|----------|
| Agents Gateway | Read + Run + Write | ✅ **Keep** | Agents gateway |
| AI Search | Read + Run + Write | ✅ **Keep** | AI Search / RAG |
| Auto Rag | Read + Write + Run Engine | ✅ **Keep** | AutoRAG pipelines |
| Websearch Run | Run | ✅ **Keep** | AI web search tool |
| MCP Portals | Read + Write | ✅ **Keep** | Zero Trust MCP portals |
| Agent Memory | Write | ✅ **Keep** | Agent memory store |
| Secrets Store | Read + Write | ✅ **Keep** | Worker secrets |
| Queues | Read + Write | ✅ **Keep** | Queues |
| Vectorize | Read + Write | ✅ **Keep** | Vector DB |
| Pipelines | Read + Write + Send | ✅ **Keep** | Pipelines |
| Workers Containers | Read + Write | ✅ **Keep** | Containers beta |
| Realtime Admin | Admin | ✅ **Keep** | Realtime kit |

### DNS, security, media — useful

| Permission | R/W | Verdict | Used for |
|------------|-----|---------|----------|
| Account DNS Settings | Read + Write | ✅ **Keep** | Account DNS settings |
| Account WAF | Read + Write | ✅ **Keep** | WAF rulesets |
| Account Rulesets | Read + Write | ✅ **Keep** | Rules engine |
| Account Rule Lists | Read + Write | ✅ **Keep** | IP/ASN lists |
| Account: SSL and Certificates | Read + Write | ✅ **Keep** | SSL for zones |
| Account API Gateway | Read | ✅ **Keep** | API Gateway |
| Images | Read + Write | ✅ **Keep** | Cloudflare Images |
| Turnstile Sites | Read + Write | ⚪ Optional | Turnstile only if used |
| Browser Rendering | Read + Write | ⚪ Optional | Browser rendering API |
| Intel | Read + Write | ⚪ Optional | Threat intel |
| Radar | Read | ⚪ Optional | Radar data |
| Allow Request Tracer | Read | ⚪ Optional | Debug tracing |

### Zero Trust / Access — broad (trim if you want least privilege)

| Permission | R/W | Verdict | Used for |
|------------|-----|---------|----------|
| Zero Trust | Read + Write + Report | ⚪ Optional | Full ZT admin |
| Access: Apps (+ Policies) | Read + Write + Revoke | ⚪ Optional | Access apps |
| Access: Organizations (+ IdP, Groups) | Read + Write + Revoke | ⚪ Optional | IdP / org admin |
| Access: Service Tokens | Read + Write | ⚪ Optional | Service tokens |
| Access: Users / Keys / Tags / Custom Pages | Read + Write | ⚪ Optional | Access admin |

You can **remove the whole Access block** if you are not automating Zero Trust via MCP yet. Keep if **IPI-487 · CLOUDFLARE-EPIC** includes Access/MCP portals.

### Admin / high privilege — keep only if intentional

| Permission | R/W | Verdict | Note |
|------------|-----|---------|------|
| Account API Tokens | **Write** | 🔒 Trim? | Can create/revoke other tokens |
| OAuth Client | Read + Write | 🔒 Trim? | OAuth app admin |
| Integration | Write | 🔒 Trim? | Integrations |
| Resource Sharing | Read | ⚪ Optional | Sharing features |
| Artifacts / Resource Library | Read + Write | ⚪ Optional | Build artifacts |
| Rule Policies | Read + Write | ⚪ Optional | Policy admin |
| Select Configuration | Read + Write | ⚪ Optional | Cloudflare Select |
| Account Custom Pages / Assets | Read + Write | ⚪ Optional | Custom error pages |

---

## Missing? (add if you need the product)

| Permission | Why add |
|------------|---------|
| **Workers R2 Storage** Read + Write | **Not in your list** — add if migration uses R2 (object storage). iPix uses Cloudinary today; add R2 when you ship R2-backed assets. |
| **Zone** DNS Read + Write (per zone) | Only if you manage **zone DNS records** via API (not just account DNS settings). Requires **Zone Resources** in the token wizard. |
| **Hyperdrive** Read + Write | Only if you use Hyperdrive configs via API |
| **Email Routing** | Only if automating email rules |

---

## Recommended profiles

### A) What you have now — **Create token** ✅

Best for: active **IPI-487 · CLOUDFLARE-EPIC — Cloudflare Platform Migration** dev — one token, no surprises.

### B) Lean dev token (smaller surface)

Keep only: Workers Scripts, KV, D1, Pages, Workers CI Read, Observability Read, Tail Read, CF Agents, AI Gateway Read+Run, Workers AI, Logs Read, Account API Tokens **Read**, Tag Read.

Add R2 when needed.

### C) MCP-only smoke test

Workers Scripts Read, D1 Read, KV Read, Account API Tokens Read, account scope — enough to list resources via `execute`.

---

## After creating the token

1. Paste into `app/.env.local`: `CLOUDFLARE_API_TOKEN=cfat_…`
2. Verify:
   ```bash
   curl -s "https://api.cloudflare.com/client/v4/accounts" \
     -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq '.success, .result[].name'
   ```
3. `bash scripts/cf-mcp-setup.sh --api-token`
4. Quit Cursor → `bash scripts/cursor-uninstall-cloudflare-plugin.sh` → reopen

---

## Quick FAQ

| Mistake | Fix |
|---------|-----|
| `/user/tokens/verify` fails | Normal for `cfat_` — use `/accounts` |
| MCP `9109 Invalid access token` | Old token in `.env.local` — paste new value |
| `plugin-cloudflare-*` errors | Uninstall marketplace plugin; use user servers only |
