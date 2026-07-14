**Verdict: Partial → Yes locally.** AI Gateway Worker works for real local traffic; remote preview/production not proven.

**Baseline:** `origin/main` @ `c9086000` · Worktree `/home/sk/wt-cf-worker-real-verify`  
**Full report:** [`../worker-real-verify-2026-07-10.md`](../worker-real-verify-2026-07-10.md)

### Skill: `cloudflare-workers-testing`

| Check | Result |
|-------|--------|
| Vitest + `@cloudflare/vitest-pool-workers` | Pass — `vitest.config.mts` uses `defineWorkersConfig` + `wrangler.jsonc` |
| `scripts/run-tests.sh` / `npm test` | **Pass — 51/51** (5 files) |
| Wrangler Node | Requires **Node ≥ 22** (`nvm use 22`) |

### Environment truth

| Level | Result |
|-------|--------|
| Unit Verified | Pass (Worker 51/51) |
| Build Verified | Pass (earlier Next + OpenNext) |
| Local Worker Verified | Pass (`:8787`) |
| Browser Journey Verified | Pass (J11) / Partial (J08/J09 product UI) |
| Remote Preview Verified | Not run |
| Production Verified | Not run |

### Browser MCP (2026-07-10 re-run)

| Server | Status |
|--------|--------|
| `user-chrome-devtools` (`chrome-devtools-mcp`) | **Configured** in `~/.cursor/mcp.json` but **times out** after reconnect (isolated Chrome / port conflict). Needs Cursor MCP restart. |
| `cursor-ide-browser` | **Working** — used for live journeys |

| Journey | Result | Evidence |
|---------|--------|----------|
| J11 `/api/ai/health` | **Pass** | Browser body: `status=ok`, gateway `ai-gateway` ok |
| Worker `/health` | **Pass** | `{"status":"ok","service":"ai-gateway"}` |
| Home UI | **Pass** | Title `iPix — AI-Powered Content Studio…` |
| J09 browser→Worker embed | CORS blocked (expected) | Server-side embed: two **768-d** |
| J08 Worker fast chat | **Pass** (API) | `MCP_OK` |
| Marketing Copilot | Off | `NEXT_PUBLIC_MARKETING_CHAT_ENABLED` default false |

### Final table

| Item | Result |
|------|--------|
| Worker tests (skill) | Pass — 51/51 |
| Dry-run / OpenNext | Pass (prior run) |
| Worker / app health | Pass / Pass |
| Chat / stream / embeddings / invalid input | Pass |
| Structured raw tier | Fail (`gemini-3.1-pro-preview-002` 404) |
| J11 / J09 / J08 | Pass / Partial / Partial |
| Chrome DevTools MCP | Partial — installed; IDE browser OK; `user-chrome-devtools` needs restart |
| Remote preview | No (**IPI-472 · INFRA-001**) |
| Cloudflare Worker actually working | **Partial → Yes locally** |

### Critical blockers

1. **IPI-472 · INFRA-001** — no remote `ai-gateway` Worker  
2. Worker `structured` model ID dead  
3. Mastra→gateway product path / marketing chat flag  
4. Restart Cursor MCP for `user-chrome-devtools` if tools keep timing out  

### Ops notes

- Do not bind other processes to **8787** (Chrome/Cursor can steal it).  
- Start Wrangler with Node 22: `nvm use 22 && npx wrangler dev --port 8787`  
- App: `AI_GATEWAY_URL=http://127.0.0.1:8787 npx next dev --turbopack -p 3010`
