Review all Planner-related work before any new implementation.

Audit:

- Open PR #283 (Planner schema)
- Open PR #284 (Planner engine)
- IPI-484 and IPI-476–IPI-483
- Current codebase
- Supabase schema
- Existing Planner docs
- Existing AI architecture

Verify everything against the actual repository.

For each PR and Linear task:

- Is it correct?
- Matches acceptance criteria?
- Missing requirements?
- Duplicate responsibilities?
- Architecture issues?
- Security/RLS issues?
- Realtime issues?
- Cloudflare integration correct?
- AI/HITL correct?
- Production ready?
- Safe to merge?
- Correct merge order?

Identify:

- Errors
- Red flags
- Blockers
- Failure points
- Missing tasks
- Missing acceptance criteria
- Incorrect dependencies
- Scope creep
- Duplicate implementations
- Stale documentation

Pay special attention to task boundaries between:

- IPI-476 vs IPI-483
- IPI-476 vs IPI-477
- IPI-478 vs IPI-483
- IPI-479 vs IPI-476

Generate:

- Overall audit report
- PR review
- Linear task review
- Corrected dependency graph
- Corrected merge order
- Required Linear edits
- Production readiness assessment

Score every task (/100) using:

🟢 Correct
🟡 Needs fixes
⚪ Not started
🔴 Blocked/incorrect

Use repository evidence only. Do not assume documentation is correct. Verify against code, migrations, tests, and `origin/main`.