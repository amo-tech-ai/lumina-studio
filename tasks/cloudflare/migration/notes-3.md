Updated **[IPI-454](https://linear.app/amo100/issue/IPI-454/ai-gateway-cloudflare-provider-routing)** with 4 mermaid diagrams + task-verifier probes. State stays **In Progress**.

## Diagrams added

| Diagram | Type | Shows |
|---------|------|-------|
| Architecture today vs target | `flowchart` | Gemini direct today → gateway + Workers AI after AC-F |
| Workers AI URL modes | `flowchart` | AC-C routing (gateway / custom `/v1` / direct API) |
| Inference sequence | `sequenceDiagram` | CopilotKit → Mastra → gateway → Workers AI/Gemini |
| Critical path | `gantt` | CF-MIG spine vs IPI-454 parallel track |

## Verified hosting critical path (skills + disk probes)

| # | Task | Verdict | Probe |
|---|------|---------|-------|
| 1 | CF-MIG-110 OpenNext PR | 🟢 **Done** | PR #282 merged — `wrangler.jsonc` on main |
| 2 | `hono/vercel` → fetch handler | 🔴 **NEXT (CF-MIG-210)** | `copilotkit/[[...slug]]/route.ts` — use `createCopilotRuntimeHandler` |
| 3 | OAuth `*.workers.dev` | 🔴 **Blocker** | `auth/callback/route.ts` — only `.vercel.app` |
| 4 | Bundle `groq-models.json` | 🔴 **Blocker** | `provider.ts` — `readFileSync` at runtime |
| 5 | `npm run cf-typegen` | 🟡 **Pending** | Script in `package.json`; `cloudflare-env.d.ts` missing |
| 6 | CI OpenNext build | 🔴 **Missing** | No match in `.github/workflows/ci.yml` |
| 7 | CF-MIG-220 smoke | ⚪ **Not started** | Operator path blocked by #2–#4 |

## IPI-454 parallel (verified)

| Task | Status |
|------|--------|
| AC-C URL fix | ✅ PR #279 on `main` (`dcbdf25b`) |
| AC-F Mastra wire | 🔴 No `AI_GATEWAY_URL` / openai-compatible in `app/src/lib/ai/` |
| AC-I prod deploy | 🔴 Worker not deployed |
| IPI-462 eval | ⚪ No harness — gate before tier flip |

**Recommended next PRs (one concern each):**
1. `ipi/cf-mig-110-opennext` — scaffold merge
2. `ipi/cf-mig-210-copilotkit-hono` — operator CopilotKit on Workers
3. `ipi/454-ac-f-mastra-gateway` — AC-F wire

Linear comment documents skills used and evidence path: `tasks/cloudflare/tests/pr-279-workers-ai-url-verification.md`.

# CF-MIG-110 — continued

Worktree: `/home/sk/wt-cf-mig-110-opennext` · branch `ipi/cf-mig-110-opennext` (from `origin/main`)

## Done (scoped to CF-MIG-110 only)

| Item | Status |
|------|--------|
| `@opennextjs/cloudflare` + `wrangler` | ✅ |
| `wrangler.jsonc` + `open-next.config.ts` | ✅ |
| Scripts `preview` / `deploy` / `upload` / `cf-typegen` | ✅ |
| Next **16.2.10** pin + `NEXT_PRIVATE_WORKER_THREADS=false` | ✅ |
| `serverExternalPackages` (Mastra natives) + dev OpenNext hook | ✅ |
| `proxy.ts` → Edge `middleware.ts` + tests | ✅ (OpenNext requirement) |
| `cf-ast-grep-stub.mjs` + wrangler alias | ✅ |
| `public/_headers` | ✅ |
| `cloudflare-env.d.ts` | gitignored — run `npm run cf-typegen` locally |

**Excluded** (CF-MIG-210): CopilotKit turbopack aliases, marketing-chat route, `hono/vercel`, OAuth, groq bundle.

## Verification

```text
npm run lint && npm run typecheck && npm test  → 930 passed
CI=true npm run build                          → green
CI=true npx opennextjs-cloudflare build        → Worker saved .open-next/worker.js
```

(hast-util copy warnings are non-fatal — same as startup.md)

## Diff (uncommitted)

~15 files — scaffold + middleware migration. **No commit yet.**

## Next steps

1. **Commit + push** on `ipi/cf-mig-110-opennext`
2. **Open code-only PR** — title: `[CF-MIG-110] OpenNext foundation — scaffold + Edge middleware`
3. **CF-MIG-210** stays separate on your dirty `ipi/restore-universal-design-prompt` checkout (don't mix)
4. **A5 env matrix** → docs-only PR later

Say **commit and open PR** when you want `/pr ship` on this branch.

 opened.

**PR:** https://github.com/amo-tech-ai/lumina-studio/pull/282  
**Branch:** `ipi/cf-mig-110-opennext` · commit `7fc956ba`  
**Worktree:** `/home/sk/wt-cf-mig-110-opennext`

## Shipped (CF-MIG-110 only)

- OpenNext + wrangler scaffold (`wrangler.jsonc`, `open-next.config.ts`, scripts)
- `proxy.ts` → Edge `middleware.ts` + tests
- Next 16.2.10, Mastra externals, ast-grep stub, `_headers`
- Verified: lint · typecheck · **930 tests** · `npm run build` · `opennextjs-cloudflare build`

## Not in this PR

CF-MIG-210 items stay on your `ipi/restore-universal-design-prompt` dirty checkout — do not merge into #282.

---

## Next: CF-MIG-210 — runtime compatibility

Branch suggestion: `ipi/cf-mig-210-runtime-compat` · worktree `../wt-cf-mig-210-runtime-compat` (from `main` after #282 merges, or stack on top if you prefer)

| Item | File / area |
|------|-------------|
| `hono/vercel` → `hono/cloudflare-workers` | `app/src/app/api/copilotkit/[[...slug]]/route.ts` |
| OAuth `*.workers.dev` | `app/src/app/auth/callback/route.ts` |
| `groq-models.json` — no runtime FS | `app/src/lib/ai/provider.ts` |
| CopilotKit / marketing-chat Workers fixes | `marketing-chat/route.ts`, turbopack aliases, `runtime-v2-fetch` |

Say **start CF-MIG-210** when you want that worktree opened.
The disk search found a single `planner/engine.ts` at `app/src/lib/planner/engine.ts` on the main checkout — not in the PR #282 worktree.

The typecheck issue is already fixed there (`toMs()` helper, no `string < Date` comparison). Typecheck and 24 planner tests pass.

When you're ready: `/pr ship 282` for the OpenNext thread fixes in `/home/sk/wt-cf-mig-110-opennext`.

# /pr-fix-ship — PR #282 complete

**Commit:** `0c11d374` — `fix(pr-282): address Copilot review — ast-grep aliases + open-next config`  
**PR:** https://github.com/amo-tech-ai/lumina-studio/pull/282

## Shipped

| Thread | Action |
|--------|--------|
| `wrangler.jsonc` ast-grep aliases | Fixed — all 9 platform stubs |
| `open-next.config.ts` commented code | Fixed — minimal config |
| `package.json` `rm -rf` Windows | Dismissed — Linux/macOS target |

## Verify

- Pre-push: typecheck + **930 tests** passed
- Unresolved threads: **0** on `0c11d374`
- CI: pending (`app-build`, `supabase-web015`, `booking-gate`)

## Next

Wait for CI green, then merge or run `/pr ready 282`.