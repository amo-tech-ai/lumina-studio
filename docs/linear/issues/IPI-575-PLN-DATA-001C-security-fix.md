# IPI-575 · PLN-DATA-001C — Stop planner managers from escalating to owner-only roles

**Role:** iPix engineer. One concern per PR. Research before custom code.

**Plain English:** A Planner manager cannot invite/promote peers to manager or bypass RPC via direct assignment insert; invite errors do not leak whether an email is registered.

| Field | Value |
|-------|--------|
| **MVP stage** | Launch Blocker (Planner security) |
| **Parallel** | Must not mix with UI features; serialize migrations |
| **Blocked by** | — (cleanup after PR #387) |
| **Unblocks** | IPI-483 needsApproval hardening · IPI-542 release gate |
| **Track** | Platform |
| **Skills** | `ipix-task-lifecycle` · `ipix-supabase` · `worktrees` · `pr-workflow` · `task-verifier` |
| **Agents / hooks / commands** | `rls-policy-auditor` · `/verify-task` · block-local-supabase hook |
| **Stack** | Supabase remote-only · migrations · `verify-rls.mjs` |

**Quality scores (1–5):** P5 · C3 · R5 · UV4 · LV5  
**Linear:** https://linear.app/amo100/issue/IPI-575

---

## 1. Purpose

Finish migration integrity + verify-rls probes so SEC-003/004 fixes are actually on remote and tested.

## 2. Real-world iPix example

- **Persona:** Engineer (security) · Operator (manager in Planner)  
- **Surface:** Planner member invite / role update  
- **Today:** PR #387 fixed code; possible remote drift; probes missing  
- **After:** Remote matches git; probes fail closed on escalation  

## 3. User journey impact

| Before | During | After |
|--------|--------|-------|
| Manager might escalate | Invite/promote attempted | Rejected consistently; no email oracle |

## 4. Business value

Privilege escalation and email enumeration are launch blockers for multi-user Planner.

## 5. Quality checks

- [x] Required / Launch Blocker  
- [x] Not duplicate of IPI-542  
- [x] Prefer Supabase CLI + verify-rls over new app code  
- [x] Parallel: **no** with other planner migrations  

**Verdict:** Ship migration-only + verify probes (one concern: security).

---

## 6. Research checklist

- [ ] `supabase migration list` / diff linked  
- [ ] Official Supabase RLS docs  
- [ ] Existing `scripts/verify-rls.mjs` patterns  
- [ ] Confirm PR #387 merge state on GitHub  

## 7. Platform-first plan

| Step | Choice |
|------|--------|
| Dashboard | Inspect policies if needed |
| CLI | `supabase db push` / corrective migration |
| Existing | verify-rls harness |
| Custom | New probes + corrective SQL only |

**Do NOT:** Edit old migration in-place again · UI changes  
**Out of scope:** needsApproval product (IPI-483)

---

## 8. Multi-step implementation prompt

```xml
<role>Finish IPI-575 · PLN-DATA-001C. Migration + verify-rls only. One concern.</role>
<task>
1. Detect drift; add corrective migration if remote ≠ git.
2. Ensure RLS migration applied remotely.
3. Add verify-rls probes for SEC-003/003b/RLS/004/ordering.
4. Run proofs; PR migration+scripts only (no docs mix unless docs-only follow-up).
</task>
```

### Completion steps (A→E)

#### A. Migration integrity
- [ ] **A1** Detect drift / corrective migration — proof: migration list hashes  
- [ ] **A2** Remote has RLS fix — proof: migration list / policy query  

#### B. Probes
- [ ] **B1** verify-rls cases for five fixes — proof: script section  

#### C. Edges
- [ ] **C1** Wrong error ordering regression — proof: SQL/probe  

#### D. Tests
- [ ] **D1** `infisical run --env=dev -- npm run supabase:verify-rls` — proof: green  

#### E. Ship
- [ ] **E1** PR merged · ledger clean — proof: GitHub + migration list  
- [ ] **E2** Linear Done — proof: status  

---

## 9. Acceptance criteria

- **A:** Manager cannot invite as manager  
- **B:** Manager cannot promote to manager  
- **C:** Direct `assignments` insert as manager denied by RLS  
- **D:** Unknown vs out-of-org email → same error  
- **E:** Non-existent instance → `instance_not_found` (not role error)  

## 10–12. Tests / risks / PR evidence

verify-rls = primary · Risk: in-place edit history → always new forward migration · Rollback: reverse migration · PR: migration/scripts only.
