Forensic audit report

Verdict: 🟡 Will succeed, but not production-ready until stale Linear state, test harness gaps, and blocker sequencing are fixed.

The task system is mostly well structured. The biggest problem is not bad specs — it is stale statuses + blocked work marked active + weak verification gates. The uploaded scorecard says average spec quality is 76/100, but production readiness is only 55/100 because routes lack error boundaries and many tasks are still greenfield.

Grading system
Dot	Score	Meaning
🟢	90–100	Ready / production-safe
🟡	75–89	Good, minor fixes needed
⚪	50–74	Incomplete / needs correction
🔴	0–49	Blocker / stale / unsafe
Executive score
Area	Score	Grade	Audit note
Spec quality	76	🟡	Good enough to execute after cleanup
Dependency sequencing	82	🟡	Mostly right, but stale blockers exist
Testability	68	⚪	Too many “tests green” without exact assertions
Backend readiness	32	🔴	Campaigns, analytics, some harnesses still blocking
Production readiness	55	🔴	Missing error boundaries + incomplete E2E gates
Overall	74	⚪/🟡	Close, but needs cleanup before large execution
Highest-priority corrections
Priority	Task	Issue	Correction
🔴 P0	Error boundaries	17 routes have no error.tsx	Add (operator)/app/error.tsx first.
🔴 P0	IPI-349, IPI-350, IPI-352, IPI-353	Stale; done on disk	Close as Done.
🔴 P0	IPI-351	Mixes verification + feature enablement	Merge into CLD-105 E2E pipeline smoke or split clearly.
🔴 P0	IPI-268 / RLS	Campaigns passed but real auth-session RLS deferred	Add seed/test users + real auth RLS checks.
🟡 P1	IPI-410 / IPI-411	Booking UI depends on missing/partial agent + flow	Do not start UI until draft-only agent + harness are verified.
🟡 P1	IPI-370	Terminal CRM verification	Keep blocked until IPI-367 + IPI-369 are done.
🟡 P1	IPI-388 → IPI-391 → IPI-392	Correct CRM order	CRM list screens first, then company detail, then contact/Profile360.
⚪ P2	Mobile tasks	Weak / not ready	Defer until desktop parity; MOB-90 needs measurable Playwright matrix.
Task-by-task audit summary
Task group	Grade	Keep / Fix / Cancel	Corrections
CRM lists/detail chain: IPI-388, IPI-389, IPI-390, IPI-391, IPI-392	🟢	Keep	Execute in order: RF-03 → RF-04a → RF-04b.
CRM safety: IPI-367, IPI-370	🟡	Keep blocked	Must prove no silent won/lost, brand conversion, cross-org RLS.
Booking: IPI-397, IPI-410, IPI-411, IPI-312	🟡	Keep, sequence carefully	Agent safety first, then integration harness, then wizard/detail.
Campaigns: IPI-268	🟢/🟡	Keep	Schema looks good; add real auth-session RLS proof.
Cloudinary: CLD-000, CLD-001, CLD-105, CLD-101–110	🟡	Keep	Start with CLD-000 + CLD-001 + CLD-105 before UI.
Cloudinary stale: IPI-349/350/352/353	🔴	Close	Already done on disk; stale Linear noise.
Intelligence Panel: IPI-285/286/284	⚪	Re-audit before coding	Likely conflicts with newer tabbed IntelligencePanel architecture.
Gemini/Groq: IPI-107, IPI-47, IPI-354–361	🟡	Keep	Do not prod-flip until golden eval + registry CI gate pass.
Production certification: IPI-222/232/233/234/235	⚪	Reconcile	Old certification epic may be stale; re-run against current main before continuing.
Will the tasks succeed?

Yes, if OpenCode audits against live repo reality before coding.

Main success conditions:

Close stale done tasks.
Respect dependency order.
Add test harnesses before safety tests.
Stop building UI on missing backend/agent assumptions.
Require browser + typecheck + lint + targeted tests per PR.
Production-ready?

No.

Production blockers:

1. Missing route error boundaries.
2. Incomplete real auth-session RLS verification.
3. Booking confirmation safety not integration-tested.
4. Cloudinary pipeline not fully E2E-proven.
5. Some Linear statuses are stale and misleading.