# QA evidence (paste into Linear / PR)

**IPI-NNN · TASK-ID — Title** · Date: YYYY-MM-DD

## Scenario

- **Persona:** Operator | Engineer  
- **Journey:** …  
- **Creds:** `qa@ipix.test` via Infisical (`QA_PASSWORD`) — not committed  
- **Browsers / sizes:** Chromium · 375 · 1280  

## Expected vs failure

| Expected | Failure cases tested |
|----------|----------------------|
| … | empty · 401 · RLS · tool error · … |

## Results

| Layer | Command / method | Result | Evidence |
|-------|------------------|--------|----------|
| Unit | `cd app && npx vitest run …` | pass/fail | N passed |
| Integration / API | … | | |
| DB / RLS / Edge | `supabase:verify-rls` / … | | |
| Agent / CopilotKit | prompts … | | |
| Browser local | Playwright / MCP Chrome | | screenshot path |
| Mobile | 375 viewport | | |
| A11y / Perf | spot check | | |
| Preview | URL | | |
| Prod-safe | ipix.co … | | |
| Rollback | plan … | | documented |

## Defects

| ID | Severity (S0–S4) | Problem | Fix / follow-up |
|----|------------------|---------|-----------------|

## Recommendations

- UX: …  
- Agent: …  
- Tests to add: …  

## Verdict

- [ ] **Pass — merge OK** (no S0/S1)  
- [ ] **Blocked** — reason: …  
**Verification level:** Unit / Build / Local Runtime / Preview / Production-safe  

**Rollback:** …
