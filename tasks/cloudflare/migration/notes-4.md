# CF-MIG-210 · Runtime Compatibility — status

**Previous:** PR #282 merged — **CF-MIG-110 · OpenNext Foundation — Scaffold & Edge Middleware** ✅

## PR status

| Item | State |
|------|--------|
| **PR opened?** | **No** — code is local in worktree only |
| **Branch** | `ipi/cf-mig-210-runtime-compat` |
| **Worktree** | `/home/sk/wt-cf-mig-210` |
| **Commits** | 0 (uncommitted changes) |

Open PR after commit + push:

```bash
cd /home/sk/wt-cf-mig-210
git add app/...
git commit -m "fix(cf-mig-210): Workers runtime — CopilotKit fetch, OAuth, groq bundle"
git push -u origin ipi/cf-mig-210-runtime-compat
gh pr create --title "[CF-MIG-210] Runtime Compatibility — Hono, OAuth & Groq Bundle" ...
```

---

## Implementation done (worktree)

| Blocker | Fix | File |
|---------|-----|------|
| `hono/vercel` | → `createCopilotRuntimeHandler` (fetch, no Hono adapter) | `copilotkit/[[...slug]]/route.ts` |
| OAuth `*.workers.dev` | trusted host | `auth/callback/route.ts` |
| `groq-models.json` FS | bundled via `ipix-groq-models-ssot` alias | `provider.ts`, `next.config.ts` |
| Marketing CopilotKit | same fetch handler; no LibSQLStore | `marketing-chat/route.ts` |
| Shims | `runtime-v2-fetch.ts` + turbopack aliases | `src/lib/copilotkit/` |

---

## Verify (worktree)

| Check | Result |
|-------|--------|
| `worktree-health` | 🟢 ahead 0, behind 0 |
| `npm run lint` | ✅ |
| `npm run typecheck` | ✅ |
| `npm test` | ✅ 959 passed |
| `CI=true npm run build` | ⏳ not run this session |
| `opennextjs-cloudflare build` | ⏳ not run this session |
| `npm run preview` | ⏳ manual smoke |

---

## Critical path

```text
HOSTING:  CF-MIG-110 ✅ → CF-MIG-210 (this PR) → CF-MIG-111 → CF-MIG-220 → CF-MIG-810
AI:       IPI-457 merge → IPI-454 AC-F → IPI-485 → IPI-462 → IPI-463
```

**Parallel (separate PR):** **IPI-457 · CF-AI-005 — Unified AI Provider Types & Registry**

---

## Next

1. Run build + OpenNext in worktree
2. Commit + push + open PR **CF-MIG-210** (hosting only)
3. Do **not** mix IPI-457 / AI in this PR
