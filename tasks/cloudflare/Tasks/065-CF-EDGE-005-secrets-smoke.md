# IPI-699 · CF-EDGE-005 — Edge secrets + remote smoke (Gateway Workers AI without Gemini)

**Linear:** [IPI-699 · CF-EDGE-005](https://linear.app/amo100/issue/IPI-699)  
**Task ID:** CF-EDGE-005  
**Phase:** 5 of 5 (CF-EDGE-AI)  
**Difficulty:** Medium  
**Risk:** High (production Edge secrets)  
**Estimated time:** 2–4 hours ops + evidence  
**Dependencies:** [IPI-697](https://linear.app/amo100/issue/IPI-697) (and 698 if DNA wired)  
**Unblocks:** safer [IPI-690](https://linear.app/amo100/issue/IPI-690) Edge Gemini removal; [IPI-455](https://linear.app/amo100/issue/IPI-455) Phase B  
**PR type:** Ops evidence (docs/evidence PR separate from any code)

---

## Purpose

Flip remote Edge to `AI_PROVIDER=cloudflare`, sync Infisical → Supabase Edge secrets, prove one real Brand Hub analysis path without Edge `GEMINI_API_KEY` on the happy path.

### Real-world iPix example

After smoke, engineers can revoke a leaked Gemini key without Brand Hub analysis dying — or document that DNA still needs Gemini until 004 ships.

---

## Secret matrix (fill in ticket comment)

| Name | Infisical | Supabase Edge | Gateway / Workers | Notes |
|------|-----------|---------------|-------------------|-------|
| `AI_PROVIDER` | | | — | `cloudflare` |
| `AI_GATEWAY_URL` | | | matches `ipix-prod` OpenAI base | Prefer native gateway URL |
| `AI_GATEWAY_TOKEN` / CF token | | | Authenticated Gateway | Never commit |
| `BI_USE_GEMINI` | | | — | Rollback `1` |
| `GEMINI_API_KEY` | | | — | Remove after smoke **or** “DNA only” |

---

## Completion steps

- [ ] **A — Secret matrix** filled.  
  `proof:` table in Linear comment.
- [ ] **B — Set remote secrets** (Dashboard/CLI). Confirm Workers AI / gateway auth.  
  `proof:` redacted names-only list.
- [ ] **C — Remote smoke** authed `brand-intelligence` (+ DNA if in scope). Gateway shows workers-ai.  
  `proof:` JSON attach to Linear or docs-only evidence under `tasks/cloudflare/tests/` (separate PR from code).
- [ ] **D — Gemini on Edge** remove or document DNA-only; comment on IPI-690.  
  `proof:` Linear comment on IPI-690.
- [ ] **E — Validation label** Remote Preview Verified (not Production).  
  `proof:` checklist on issue.

---

## Success criteria

- [ ] Remote BI success with `AI_PROVIDER=cloudflare`, no Gemini on happy path
- [ ] Secret names documented
- [ ] Rollback written (`AI_PROVIDER=groq` or `BI_USE_GEMINI=1`)
- [ ] IPI-690 updated
- [ ] Validation level: **Remote Preview Verified**

## Do NOT

- Commit tokens / `.env`
- `functions deploy --prune`
- Claim Production Verified after one smoke
- Mix OpenNext operator deploy
