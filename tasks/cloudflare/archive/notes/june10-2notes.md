## Verification report — 2026-07-10 · task-verifier + Cloudflare MCP

| Task | Spec /100 | Execution /100 | Skills /100 | Composite | Blockers | Safe? |
|------|----------:|---------------:|------------:|----------:|----------|-------|
| **IPI-492 · CF-AI-004c** (492-audit) | 92 | 70* | 88 | **82** | 0 after Linear lock | Yes* — implement with locked ACs |
| **IPI-404 · SCR-08** | — | — | — | — | Wrong surface for CF MCP | Separate DESIGN V2 track |

\*Execution was capped until ACs locked rejection/allowlist/typed error — **Linear IPI-492 updated this run**.

---

### IPI-404 note

[IPI-404 · SCR-08 Assets](https://linear.app/amo100/issue/IPI-404/scr-08-assets-library-read-only-masonry) is read-only masonry UI (`design-to-production`, Cloudinary, Supabase). **Cloudflare MCP does not apply.** DoR still incomplete on `SCR-08-assets.md` (~5% stub). Do not mix with IPI-492.

---

### 492-audit — suggestions vs Cloudflare MCP

| Suggestion | Verdict | Evidence |
|------------|---------|----------|
| Empty input → 400 before provider | ✅ Confirmed | `handleEmbed` has no guard; catch → 502 (`router.ts:107-109`) |
| Reject wrong model, don’t remap | ✅ Confirmed | Correct product/API design |
| Allowlist, not `gemini*` match | ✅ Confirmed | Future Gemini embed IDs exist; allowlist safer |
| Map/sanitize statuses, don’t passthrough | ✅ Confirmed | Gateway 401 ≠ client auth |
| Typed `AiGatewayError` | ✅ Confirmed | Adapter still throws flat strings |
| BGE = 768-d, 512 tokens, batch | ✅ Confirmed | [bge-base-en-v1.5 docs](https://developers.cloudflare.com/workers-ai/models/bge-base-en-v1.5/) |
| OpenAI-compat `/v1/embeddings` | ✅ Confirmed | [OpenAI compatibility](https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/) |
| `MAX_EMBED_INPUTS=100` | 🟡 Gateway policy | Docs: batch yes; no published “100” — fine as local limit |
| Extra root cause | ✅ Confirmed | `selectProvider` falls unknown models → **`default` Gemini chat** → embed 404 |

Audit quality: strong, actionable, correctly scoped. One wording fix (Gemini SSOT) already called out in the audit — correct.

---

### `cloudflare-workflow` — adapted

Yes — skill was thin on AI Gateway embed/error contracts. Updated:

- `.opencode/skills/cloudflare-workflow/SKILL.md` — **AI Gateway Embed & Error Contract Gate** + Outcome Grader row  
- `references/verification-checklist.md` — **§2.1** embed/error MCP + probe table  

Also: Linear **IPI-492** ACs locked to audit revisions; stamp appended to `tasks/cloudflare/tasks/492-audit.md`.

---

### Stop condition

**IPI-492:** Safe to implement with locked ACs (reject · allowlist · sanitize · typed error · no default-chat fallback on embed).  
**IPI-404:** Not ready for Cloudflare workflow — use SCR Phase 0 / `design-to-production` separately.

Next for 492: worktree `ipi/492-embed-error-harden` → Worker validation first → adapter typed error → live Wrangler.

**IPI-492 · CF-AI-004c** is implemented on its own branch/PR — not merged.

### PR
https://github.com/amo-tech-ai/lumina-studio/pull/319  
Branch: `ai/ipi-492-embed-error-contracts` · worktree: `/home/sk/wt-ipi-492-embed-error-contracts`

### What landed
- Empty/malformed embed input → **400** `invalid_request` (no provider call)
- Non-embedding models (incl. chat `default` / Gemini) → **400** `unsupported_embedding_model` (no silent remap)
- Stable sanitized envelope: `{ error: { code, message, providerStatus?, retryable?, requestId } }`
- Typed `AiGatewayError` in `createProviderAdapter()`
- Happy embed still **768-d**; chat still green

### Final stage report

| Item | Result |
|------|--------|
| Finding | Empty input / wrong model returned opaque 502s via default-chat fallback |
| Evidence | Live repro + CF BGE docs (768-d); code in `router.ts` / adapter |
| Classification | Confirmed → fixed |
| Files changed | Worker: `router.ts`, `gateway-errors.ts`, `embed-validation.ts` + tests; App: `provider-adapter.ts` + tests |
| Tests added | `embed-validation.test.ts`, `router.embed.test.ts`, index + adapter cases |
| Validation | Unit + Worker + Local Runtime (Wrangler `:8787`) |
| Scope preserved | Yes (no AC-F / Mastra / deploy / docs) |
| Remaining risks | Chat path still uses flat `{ error: string }` 502s (embed-only hardening); CI on #319 not waited |

### After merge (your order)
1. **IPI-454** AC-F (#317)  
2. **IPI-454** AC-J  
3. **IPI-472** remote/prod  
4. Production verification

**PR #317 review fixes landed** — unresolved threads = **0** on `7f97c691`. Not merged.

https://github.com/amo-tech-ai/lumina-studio/pull/317

### Triage → fix

| Thread | Class | Tier | Fix |
|--------|-------|------|-----|
| Vision off gateway | Confirmed | A | `vision` always direct (no ImageParts on Worker) |
| Preserve tier routing | Confirmed | A | Send Worker keys (`fast`/`structured`/…); ignore Gemini-id overrides |
| Preserve Mastra tools | Confirmed | B | `default`/`structured` stay direct; opt-in `AI_GATEWAY_ALLOW_TOOL_TIERS=1` |
| Split `.env.example` | Confirmed | A | Reverted to `main` (config out of this PR) |

### Mastra gotcha review
**SAFE** — no `DATABASE_URL`/top-level `getMastra()`/registry drift.

### Verify
- `provider.test.ts` — 30 passed  
- Pre-push suite — 1102 passed  
- GraphQL unresolved — **0** (re-checked after push)  
- CI — `app-build` still running

### Routing policy now
With `AI_ROUTING_MODE=gateway`: tool-free `fast` → Worker; vision + tool tiers → direct Gemini/Groq until a Worker multimodal/tools bridge exists.

Updated `.cursor/rules/pr-description.mdc` so every PR body must include:

1. **Why it matters in iPix** — real surface/persona/workflow  
2. A **domain cookbook** (Brand Hub, agents, CRM, gateway, auth)  
3. **Good vs bad** examples from the #317–#319 style  
4. Skimmable **titles** for non-authors  

Also synced the same section into `.claude/skills/pr-workflow/references/pr-template.md` so `/pr` stays aligned.

Not committed — say if you want a docs-only PR for the rule.

**PR #318** — 1 review thread fixed; unresolved = **0** on `35d2f9c1`.

https://github.com/amo-tech-ai/lumina-studio/pull/318

### Triage → fix

| Thread | Class | Tier | Fix |
|--------|-------|------|-----|
| Executive summary vs follow-ups contradict Linear (461/491) | Confirmed | A | Reconciled tables to MCP-verified **Done**; left AC-F/J/I + IPI-472 open |

### Evidence
- Linear: **IPI-461 · CF-AI-004** = Done, **IPI-491 · CF-AI-004b** = Done (AC boxes checked)
- Docs-only commit on `docs/pr-315-316-successor`

### Verify
- GraphQL unresolved — **0** at HEAD  
- Required CI — re-running (`app-build` pending)  
- Codacy — previously `action_required` (1 issue); re-check after this push  

Not merged.

**PR #317** preflight finished cleanly:

- Worktree `/home/sk/wt-ipi-454-ac-f-gateway` is healthy (ahead 2, behind 0).
- Required CI was green (`app-build`, `booking-gate`, `supabase-web015`, Vercel). Codacy/MatterAI were still pending at check time.

**Verdict: Yes — for process gates. No — as the only Cloudflare skill.**

### Rating: **7.5 / 10** (process) · **6 / 10** (day-to-day Cursor use)

| Dimension | Score | Why |
|-----------|-------|-----|
| Accuracy / anti-drift | 9 | Stage → evidence → runtime levels → docs contradiction is exactly what burned CF PRs |
| iPix specificity | 9 | Embed/error gate (IPI-492), OpenNext bundle audit, Outcome Grader |
| Operational checklist | 8 | `verification-checklist.md` maps stage → skill → MCP → command |
| Discoverability in Cursor | 4 | Lives under `.opencode/skills/` — not in default Cursor skill list |
| Overlap / ceremony | 5 | Duplicates `task-accuracy.mdc` + `ENGINEERING-WORKFLOW.md`; full 9 stages is heavy for Tier A `/pr-fix` |
| Product API help | 3 | Not a Workers/Wrangler/AI Gateway API hub — that’s `.claude/skills/cloudflare` |

### When to use it

| Use | Skip / light-touch |
|-----|--------------------|
| New CF epic / Worker / OpenNext / bindings | Tiny Tier A review nits (one-line map fix) |
| AI Gateway embed/error contracts | Pure Mastra/Gemini app code with no Worker touch |
| Pre-merge “is this Production Verified?” | Docs-only CF audit already covered by `task-accuracy` |
| Bundle / `nodejs_compat` / silent-remap audits | |

### How it should sit with the others

```text
cloudflare-workflow  → HOW (gates, evidence, verify level, merge rubric)
cloudflare (hub)     → WHAT (Workers, Wrangler, AI Gateway product refs)
task-accuracy / lean → general evidence-first (all domains)
```

For **#319**-style work: load **workflow** for the embed contract gate + verify level honesty; load **cloudflare** hub (or MCP docs) for API truth. Don’t run all 9 stages on every review reply.

### One improvement if you keep it

Promote or symlink into `.claude/skills/` (or Cursor skills) and narrow the frontmatter description so it doesn’t claim “ALWAYS for CopilotKit/Mastra/Supabase even when not Cloudflare” — that over-triggers and fights ponytail.

Created **`.cursor/rules/cloudflare-workflow.mdc`** (independent of the OpenCode skill) and linked it from `lean.mdc`.

### Improvements vs `.opencode/skills/cloudflare-workflow`

| Change | Why |
|--------|-----|
| **Globs, not always-on** | Fires on Worker / wrangler / OpenNext / AI provider paths — not every Mastra chat |
| **Tiers A/B/C** | Stops forcing OpenNext + full 9-stage ceremony on Tier A review nits |
| **Delegates to `task-accuracy`** | No duplicated generic stages |
| **Product APIs stay in `cloudflare` hub** | Rule = process; skill = Workers/Wrangler/AI Gateway refs |
| **Right-sizing from ENGINEERING-WORKFLOW** | Match verify cost to risk; dry-run / CI / rollback called out |
| **IPI-492 embed/error gate kept + tightened** | Includes the #319 lessons (500 retryable, timeout vs status, safe override parse, explicit BGE) |

### Layout

```text
cloudflare-workflow.mdc  → HOW (gates, tiers, contracts, grader)
cloudflare skill         → WHAT (product APIs / references)
cloudflare-mcp.mdc       → MCP servers / auth
task-accuracy.mdc        → evidence stages for all domains
```

Not committed — say if you want a docs-only PR for the rule + lean pointer.

The most important bar is now explicit: **Workers must work in real iPix journeys**, not only in vitest.

### Added
**[`tasks/cloudflare/tests/worker-user-journeys.md`](tasks/cloudflare/tests/worker-user-journeys.md)** — journey catalog with pass/fail, env, prompts, and evidence pack:

| ID | Real iPix surface |
|----|-------------------|
| `UJ-HEALTH` | App → Worker `:8787` (not Mastra `:4111`) |
| `UJ-OP-CHAT` | Operator dock stream |
| `UJ-MKT-CHAT` | Marketing chat |
| `UJ-BI` | Brand Intelligence draft |
| `UJ-EMBED` | BGE 768-d + reject bad input |
| `UJ-VISION` | Vision stays direct when gateway is on |
| `UJ-BOOK` / `UJ-CRM` | Domain agents + tools |
| `UJ-ERR` | Provider-down UX |

### Wired in
- **`.cursor/rules/cloudflare-workflow.mdc`** — north star + Tier B/C require named `UJ-*`; Outcome Grader includes journey proof  
- **`ENGINEERING-WORKFLOW.md`** — points at the same reference for AC-J / Done claims  

**AC-J-style minimum:** `UJ-HEALTH` + `UJ-OP-CHAT` + `UJ-MKT-CHAT` + `UJ-EMBED` at Local Runtime (Preview preferred) before calling gateway Done.
---

## Pre-merge plan execution — 2026-07-10 (PRs #317/#318/#319)

**Do not merge yet** — wait for required CI green on latest HEADs; no Production Verified.

| PR | HEAD (refreshed) | Unresolved threads | Behind main |
|----|------------------|-------------------:|------------:|
| #319 | `7785b9f4` | 0 | 0 |
| #317 | `e899bcdc` | 0 | 0 |
| #318 | `35d2f9c1` | 0 | 0 |

**#319 fix:** override missing `embedding` tier → canonical default BGE (not re-query incomplete override). Live `:8787`: empty/wrong model → 400; happy → 768-d; chat Pass.

**#317 fix:** removed sticky `x-request-id` from `createOpenAICompatible` headers. Routing unit: `fast`→gateway key `fast`; `default`/`structured`/`vision` stay direct without `AI_GATEWAY_ALLOW_TOOL_TIERS`.

**Combined:** `git merge --no-commit` #319 into #317 → auto-merge OK; `AiGatewayError` present.

**#318:** docs-only; still accurate that AC-J/AC-I open and no Production Verified; **stale** edge rows (empty/wrong model → 502) until rewritten after #319 merges; suggested merge order in doc said #317 then #319 — prefer **#319 → #317 → #318**.

**Validation level:** Unit + Local Runtime (Worker curls). **Not** full browser UJ-OP-CHAT / CopilotKit stream under gateway. **Not** Remote Preview / Production.

**Merge order:** 1) #319 2) rebase #317 3) #317 4) update #318 5) #318


## 2026-07-10 — PR #319 post-merge audit

- Merged `c9086000` on main. Local Runtime Verified: empty/wrong embed → 400; happy → 768-d; chat 200.
- Audit: `tasks/cloudflare/tests/pr-319-post-merge-audit-2026-07-10.md` (~95% for IPI-492).
- Residuals tracked: IPI-494 JSON, IPI-495 chat envelope, IPI-497 docs.
