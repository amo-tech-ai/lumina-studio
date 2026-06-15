## PLT-003 — Edge Function Foundation (no Gemini yet)

**In plain terms:** Reusable secure Deno helpers + `health` / `edge-test` functions before AI agents ship.

**Blocked by:** ~~IPI-15 PLT-002~~ ✅ Done

**Unblocks:** [IPI-18](https://linear.app/ipix/issue/IPI-18) AI-001 · [IPI-19](https://linear.app/ipix/issue/IPI-19) DNA-001 · [IPI-53](https://linear.app/ipix/issue/IPI-53) SEC-002

### Skills (load in order)

| # | Skill | Path |
| -- | -- | -- |
| 1 | ipix-task-lifecycle | `.claude/skills/ipix-task-lifecycle/SKILL.md` |
| 2 | edge-functions | `.cursor/skills/edge-functions/SKILL.md` |
| 3 | task-verifier | `.claude/skills/task-verifier/SKILL.md` |

**Out of scope this issue:** Gemini calls, Cloudinary, Supabase Storage buckets.

---

### Completion steps

#### A. Shared helpers (`supabase/functions/_shared/`)

- [X] **A1** `cors.ts` — OPTIONS + CORS headers
- [X] **A2** `response.ts` — `{ ok, data }` / `{ ok: false, error }`
- [X] **A3** `env.ts` — validate Supabase-injected env
- [X] **A4** `auth.ts` — JWT resolver (401 when required)
- [X] **A5** `supabase-client.ts` — user + service clients
- [X] **A6** `agent-log.ts` — `ai_agent_logs` insert helper

#### B. Reference functions

- [X] **B1** `health` — public ping
- [X] **B2** `edge-test` — JWT required, inserts one `ai_agent_logs` row

#### C. Client + deploy

- [X] **C1** `src/services/edgeFunctionService.ts`
- [X] **C2** Deploy: `supabase functions deploy health edge-test --project-ref nvdlhrodvevgwdsneplk`
- [X] **C3** `supabase/README.md` § Edge Functions
- [X] **C4** `npm run supabase:verify-edge`

#### D. Verify + ship

- [X] **D1** `npm run build` — ✅ 2026-06-14
- [X] **D2** `npm run supabase:verify-edge` green — ✅ 2026-06-14
- [X] **D3** `npm run supabase:verify-rls` still green — ✅ 2026-06-14
- [X] **D4** Linear **Done** (with IPI-53 SEC-002) — ✅ 2026-06-14

**Also shipped:** `brand-intelligence` edge function (see IPI-18) reuses `_shared/` helpers from this issue.

### Verifier probes

| Probe | Pass |
| -- | -- |
| `curl` health → `{ ok: true, data: { status: "ok" } }` | ✅ |
| edge-test without JWT | 401 |
| edge-test with JWT | 200 + `logId` |
| `grep generateImages supabase/functions` | 0 hits |
| `GEMINI_API_KEY` not in `src/` | ✅ |

---

_Source: `docs/linear/issues/IPI-16-PLT-003.md` · push via `node scripts/linear-update-issue.mjs IPI-16`_
