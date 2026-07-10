# Rollback Strategy

**Purpose:** Show the real, documented rollback mechanism for the Cloudflare DNS cutover — not an invented blue-green/canary scheme.

## Explanation

`CLOUDFLARE-EPIC.md` §13 documents one concrete rollback plan, triggered by "smoke failure, auth outage, inference regression, or error budget breach after DNS cutover." The core mechanism is **DNS revert to Vercel**, either via an `OPS-002` rollback script or a manual DNS change — but `OPS-002` ("Rollback Automation — DNS Revert Script") does not exist on disk today; a repo-wide search found no rollback script anywhere in this project. So the real current state is: **the rollback plan is a documented runbook, not yet an executable, tested artifact.** This matches `roadmap.md` §3 item 10 ("Rollback window confirmed runnable") being listed as an open MVP release-gate criterion, not a shipped capability. There is no blue-green or canary mechanism anywhere in this repo — the plan is literally "point DNS back at the still-warm Vercel deployment."

## Diagram

```mermaid
flowchart TD
    Trigger["Trigger: smoke failure, auth outage,\ninference regression, or error-budget breach\n(post DNS cutover)"] --> Step1

    Step1["Step 1 — Immediate (< 5 min)\nRun OPS-002 script (NOT BUILT — no file on disk)\nOR revert DNS manually per CF-MIG-810 runbook"]
    Step1 --> Note1["Vercel prod kept warm 48h+ —\nno redeploy needed if not decommissioned"]

    Step1 --> Step2["Step 2 — Communicate\nPost incident note with failing probe + SHA\nReopen CF-MIG-220 blocker in Linear"]

    Step2 --> Step3["Step 3 — Fix forward\nFix on branch → preview on *.workers.dev\n→ re-run CF-MIG-220 smoke (script not yet built)\nDo NOT re-cut DNS until 2 consecutive green runs"]

    Step3 --> Step4["Step 4 — AI-specific rollback\nSet AI_PROVIDER=gemini (direct), bypass gateway\nIPI-463 failover order (⚪ not built)"]

    Step4 --> Step5["Step 5 — Decommission guard\nDo not delete Vercel project until\n7 days stable on Cloudflare"]
```

## Related Linear issues

`OPS-002` (Rollback Automation — DNS Revert Script, ⚪ not built), `CF-MIG-810` (DNS Cutover & Rollback, 🔴 0%), `CF-MIG-220` (preview smoke testing), `IPI-463` (AI Provider Failover & Rollback, ⚪ not built).

## Related PRD section

`roadmap.md` §3 item 10 (rollback window confirmed runnable — open gate), §8 Risk Register (OAuth host-allowlist blocks cutover). Source: `tasks/cloudflare/CLOUDFLARE-EPIC.md` §13 (Rollback plan), §12 checklist line "Rollback tested (§13)".
