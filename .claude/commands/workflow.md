---
description: "Lead-implement + independent-verify orchestration via the Workflow tool — same rigor as Wave 1-3 (IPI-261/584/304/650/286/551), scriptable and pipelineable."
argument-hint: "[IPI-NNN | IPI-NNN,IPI-MMM,... | pipeline IPI-A IPI-B IPI-C ...] [task description]"
allowed-tools: ["Bash", "Read", "Glob", "Grep", "Agent", "Workflow"]
---

# /workflow — scripted lead+verify orchestration

**Arguments:** `$ARGUMENTS` — one ticket (`IPI-286`), several independent tickets (`IPI-407,IPI-336`), or a sequential pipeline (`pipeline IPI-A IPI-B IPI-C` — each stage builds on the prior stage's *merged* `origin/main`, exactly like IPI-551 was gated on IPI-286 in Wave 3).

**Invoking this command is your explicit opt-in to the `Workflow` tool** for this task — call it directly per the tool's own gating rule ("user invoked a skill or slash command whose instructions tell you to call Workflow"). Don't ask permission again; the slash command *is* the permission.

**Skill:** `.claude/skills/worktrees/SKILL.md` (pre-flight) · `.claude/skills/ipix-task-lifecycle/SKILL.md` (phase model this mirrors)

---

## When to reach for this vs. manual `Agent` dispatch

| Situation | Use |
|---|---|
| One-off task, want to watch it unfold turn-by-turn | Manual `Agent` dispatch (what Wave 1-3 did) |
| 2+ independent tickets, want them fanned out and the results compared at once | `/workflow IPI-A,IPI-B` |
| A ticket that's *already* scoped as N sequential sub-PRs (e.g. IPI-336's 5-way split: architecture → screens 1-6 → screens 7-11 → screens 12-13 → QA/a11y) | `/workflow pipeline` |
| You want a machine-checkable merge gate (`blockingFindings.length === 0`) instead of parsing a verifier's free-text report | Either form here — both use schema'd output |

If it's genuinely one task and you want to review the lead's investigation table before it starts coding, manual dispatch is still fine — `/workflow` doesn't gate mid-run any tighter than manual does.

---

## Injected context

- Worktrees: !`git worktree list 2>/dev/null`
- Current branch: !`git branch --show-current`
- Open PRs: !`gh pr list --state open --limit 15 --json number,title,headRefName,isDraft 2>/dev/null`

---

## Non-negotiable discipline (carried over from Wave 1-3, do not weaken)

Every lead/verifier prompt this command generates must preserve:

1. **Investigate before coding.** Fetch the *live* Linear ticket yourself (descriptions get corrected after creation — this repo has real history of stale/wrong original scope, e.g. IPI-286's IPI-247 non-dependency, IPI-551's cancellation-history red herring). Report a before-coding table (`Task | Current state | Files/contracts verified | Supabase evidence | Risks | Plan`) before writing any code.
2. **Extend, don't duplicate.** Grep for the existing pattern/resolver/shell before building a parallel one. Reuse > add.
3. **Only build against confirmed contracts.** If a data contract doesn't exist yet, document the gap and stop — don't invent a shape (IPI-286's shoot-data-contract deferral is the template).
4. **One concern per PR.** No docs+code mixing, no unrelated cleanup folded in.
5. **The verifier never trusts the lead's self-report.** Re-run lint/typecheck/tests/build itself. Re-derive the diff. Drive real browser flows against real Supabase data. Independently spot-check any CI failure the lead claims is "pre-existing/unrelated" (`gh pr list --state open` + check the same job on 2-3 other PRs, or check recent `main` runs) — don't take that claim on faith even from your own prior agent.
6. **Merge gate:** zero unresolved review threads AND zero blocking findings from the verifier's structured output. If the verifier finds a real bug, fix it directly (small, well-diagnosed fixes — same pattern as IPI-650's `getCompanyNames` fix and IPI-551's Escape-capture-phase fix), re-verify narrowly, then merge. Don't merge on a "mostly fine" verdict.
7. **If a subagent gets blocked opening/merging a PR by the auto-mode permission classifier** (has happened 3x across Wave 1-3), it must say so explicitly and hand back the exact `gh pr create`/`gh pr merge` command — the *orchestrator* (you, reading the workflow's result) runs it, not the subagent bypassing the block.
8. **`main` has no branch-protection configured** (confirmed 2026-07-18) — "no merge without green CI" is a team norm the verifier enforces by policy, not something GitHub blocks for you. Don't rely on the platform to catch a bad merge.

---

## Step 0 — pre-flight (Bash, before touching `Workflow`)

Workflow scripts have **no filesystem access** — all worktree setup happens here, in your own tool calls, before the script runs. The `agent()` calls inside the script get full tool access (Bash, Browser, Supabase, GitHub) once they start; they just can't be *scripted* directly.

For each ticket in `$ARGUMENTS`:

```bash
npm run worktree:audit                     # mandatory pre-check, every time — CLAUDE.md Step 0
# remove anything safe-to-delete, then:
git fetch origin main --quiet
git worktree add ../wt-ipi-NNN-slug -b ai/ipi-NNN-slug origin/main
cp app/.env.local ../wt-ipi-NNN-slug/app/.env.local
grep -c "^DATABASE_URL=" ../wt-ipi-NNN-slug/app/.env.local   # must be exactly 1
cd ../wt-ipi-NNN-slug/app && npm ci
```

For `pipeline` mode, only create the **first** stage's worktree now — later stages branch off whatever `origin/main` looks like after the prior stage merges, so their worktrees can't exist yet.

---

## Step 1 — the script

Author this inline via the `Workflow` tool's `script` parameter (don't `Write` it to a file first — the tool persists it for you). Fill in `{TICKET}`, `{WORKTREE_PATH}`, `{BRANCH}` per task from Step 0.

```js
export const meta = {
  name: 'workflow-lead-verify',
  description: 'Lead-implement + independent-verify, one pair per ticket',
  phases: [
    { title: 'Implement' },
    { title: 'Verify' },
  ],
}

const LEAD_SCHEMA = {
  type: 'object',
  required: ['beforeCodingTable', 'prNumber', 'blockedByClassifier', 'localGateSummary', 'honestGaps'],
  properties: {
    beforeCodingTable: { type: 'string', description: 'markdown table: Task | Current state | Files/contracts verified | Supabase evidence | Risks | Plan' },
    prNumber: { type: ['number', 'null'] },
    prUrl: { type: ['string', 'null'] },
    blockedByClassifier: { type: 'boolean' },
    exactCommandToRun: { type: ['string', 'null'], description: 'if blockedByClassifier, the literal gh pr create command + body' },
    filesChanged: { type: 'array', items: { type: 'string' } },
    localGateSummary: { type: 'string', description: 'lint/tsc/test/build pass-fail, actual numbers not vibes' },
    honestGaps: { type: 'string', description: 'anything NOT verified live — say so plainly' },
  },
}

const VERIFIER_SCHEMA = {
  type: 'object',
  required: ['readiness', 'ciStatus', 'threadsUnresolved', 'blockingFindings', 'mergeRecommendation'],
  properties: {
    readiness: { type: 'number', minimum: 0, maximum: 100 },
    ciStatus: { type: 'string', enum: ['green', 'failing-confirmed-unrelated', 'failing-blocking'] },
    ciEvidence: { type: 'string', description: 'how failing-unrelated was independently confirmed (which other PRs/runs checked)' },
    threadsUnresolved: { type: 'number' },
    browserProof: { type: 'string' },
    supabaseProof: { type: 'string' },
    blockingFindings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['summary', 'evidence', 'fixDirection'],
        properties: {
          summary: { type: 'string' },
          evidence: { type: 'string', description: 'exact reproduction steps, not a hunch' },
          fixDirection: { type: 'string' },
        },
      },
    },
    mergeRecommendation: { type: 'string', enum: ['approve', 'block'] },
  },
}

function leadPrompt(ticket, worktreePath, branch) {
  return `You are the lead implementation agent for ${ticket}. Work in ${worktreePath} (branch ${branch}, already set up — env copied, npm ci done). GitHub repo is amo-tech-ai/lumina-studio (this local repo folder is named "ipix" — same project, different name, confirmed via git remote -v — don't flag that as suspicious).

Before coding: fetch the LIVE Linear ticket yourself (treat corrections in its current text as authoritative, not any paraphrase you're given). Grep for the existing pattern/resolver/shell you're extending — do not build a parallel one. Confirm every data contract you plan to bind to actually exists; if it doesn't, stop and document the gap rather than inventing a shape. Report your before-coding table before writing code.

Implement narrowly — one concern, this ticket's scope only. Loading/empty/error states for anything that fetches data. Full local gate: npm run lint && npx tsc --noEmit && npm test && npm run build, all must pass, paste real numbers. Live browser verification (Browser pane tools) against real Supabase data where relevant — say explicitly what you could NOT verify live, don't claim proof you don't have.

Open a DRAFT PR. If the auto-mode permission classifier blocks you from running gh pr create, say so explicitly and return the exact command + body for the orchestrator to run instead — do not attempt to bypass the block.

Do not merge anything. Do not touch Linear status.`
}

function verifierPrompt(ticket, prNumber, worktreePath) {
  return `You are the independent verifier for ${ticket}, PR #${prNumber} (worktree ${worktreePath}). Do NOT trust the lead's self-report — re-derive everything from live code, GitHub, Supabase, and a real browser.

Fetch the live Linear ticket yourself, confirm every AC. Read the full diff (gh pr diff ${prNumber}) and confirm it extends the existing pattern rather than duplicating it. Re-run lint/typecheck/tests/build yourself — paste real output, don't trust the lead's numbers. Drive real browser flows against real Supabase data covering every acceptance criterion you can reach; say explicitly what's architecturally unreachable (e.g. no click-trigger UI wired yet) vs. what you just didn't get to.

Check CI on the PR. For ANY failing check, independently confirm whether it's pre-existing/unrelated — check the same job on 2-3 OTHER open PRs or recent main runs, don't accept "probably unrelated" from the lead or from yourself without that check.

Check GraphQL reviewThreads for unresolved bot/human comments — inspect each against actual code before dismissing or confirming.

If you find a real, reproducible bug: give the EXACT reproduction and a concrete fix direction, not a vague concern — this becomes the orchestrator's fix-it input.

Do not merge. Do not touch Linear status. Return the structured verdict.`
}

// --- Fill in per ticket from Step 0 ---
const TASKS = [
  // { ticket: 'IPI-NNN', worktreePath: '/home/sk/wt-ipi-NNN-slug', branch: 'ai/ipi-NNN-slug' },
]

const results = await pipeline(
  TASKS,
  (task) => agent(leadPrompt(task.ticket, task.worktreePath, task.branch), {
    label: `lead:${task.ticket}`, phase: 'Implement', schema: LEAD_SCHEMA,
  }),
  (lead, task) => lead?.prNumber
    ? agent(verifierPrompt(task.ticket, lead.prNumber, task.worktreePath), {
        label: `verify:${task.ticket}`, phase: 'Verify', schema: VERIFIER_SCHEMA,
      }).then((v) => ({ task, lead, verifier: v }))
    : { task, lead, verifier: null },
)

return results.filter(Boolean)
```

For **pipeline mode** (sequential sub-PRs, e.g. IPI-336's 5-way split), the shape is the same `pipeline()` call, but each stage's worktree/branch must be created **after** the prior stage's PR merges — so run this script once per stage instead of once for the whole array, merging between runs (see Step 2). Don't try to pre-create all 5 worktrees up front; stage 2's base commit doesn't exist until stage 1 merges.

---

## Step 2 — read results, merge gate, cleanup

For each `{task, lead, verifier}`:

1. If `lead.blockedByClassifier`, run `lead.exactCommandToRun` yourself to open the PR (same as this session's precedent — 3 times so far).
2. If `verifier.blockingFindings.length > 0`: read each one's `evidence` and `fixDirection`. If it's a small, well-diagnosed fix, apply it directly in the worktree, add a regression test, run the local gate again, push. Do **not** dispatch a whole second verifier round for a narrow, well-understood fix — spot-check the specific thing yourself (matching IPI-551's Escape-capture-phase precedent: fixed directly, proved via the exact test the verifier flagged, then merged).
3. Independently re-spot-check `ciEvidence`'s claim once more right before merge if any time has passed — CI state and unrelated-PR comparisons can go stale.
4. Merge only when `blockingFindings.length === 0` (after your own fixes if needed) and `threadsUnresolved === 0`:
   ```bash
   gh pr ready {prNumber}
   gh pr merge {prNumber} --squash --delete-branch=false
   git fetch origin main --quiet && git log origin/main -2 --oneline   # confirm it landed
   ```
5. Move the Linear ticket to Done only after confirming the AC files exist on `origin/main` (`git ls-tree -r origin/main --name-only | grep ...`).
6. Clean up: `git status --short` the worktree (must be clean), `git worktree remove`, `git branch -d`.
7. **Pipeline mode only:** now create the *next* stage's worktree off the freshly-merged `origin/main`, and re-invoke this command (or re-run `Workflow` with `resumeFromRunId` if you're continuing the same run) for the next stage.

---

## Approval gates (unchanged from `/pr`)

| Action | Requires |
|---|---|
| `git worktree add` | worktree:audit run first, nothing safe-to-delete left dirty |
| `gh pr create` / `gh pr merge` | verifier schema shows `blockingFindings: []` and `threadsUnresolved: 0` (or you fixed the findings and re-proved it) |
| Direct code fix mid-flow | small, well-diagnosed, tested — not a rewrite |
| `git worktree remove` | `git status --short` clean first |
| Linear → Done | AC files independently confirmed present on `origin/main`, not just "PR merged" |

Never `--no-verify`. Never skip the independent CI-failure spot-check just because a prior agent already claimed it's unrelated.

---

## Quick reference

```text
One ticket, fire-and-forget:      /workflow IPI-407
Two independent tickets at once:  /workflow IPI-407,IPI-403
Sequential sub-PR split:          /workflow pipeline IPI-336a IPI-336b IPI-336c IPI-336d IPI-336e
Resume a run after a fix:         re-invoke Workflow with resumeFromRunId — cached stages replay free
```
