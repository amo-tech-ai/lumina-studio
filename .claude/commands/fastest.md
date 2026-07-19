---
description: "Find the fastest verified way to complete a task — managed feature → CLI/SDK → official repo → custom, before writing code."
argument-hint: "<IPI-XXX|task name|description>"
allowed-tools: ["Bash", "Glob", "Grep", "Read", "WebFetch", "WebSearch", "Task"]
---

# /fastest — Find the Fastest Verified Way to Complete a Task

**Arguments:** `$ARGUMENTS` — Linear issue (`IPI-407`), task name, or free-text description.

**Principle:** Read-only research. Analyze the selected task and find the most efficient, verified implementation path **before writing any code**. Do not implement until the efficient path is verified — this command never edits files or commits.

---

## Instructions

1. Read the full task, acceptance criteria, blockers, and linked PRs.
2. Load the relevant project skills and repository instructions (`CLAUDE.md`, matching skill from the skills list).
3. Inspect the current codebase to avoid rebuilding existing work.
4. Verify live platform state using available MCPs, CLIs, and dashboards.
5. Web search **current official documentation only**.
6. Search official GitHub organizations for:
   - maintained repositories
   - SDKs and packages
   - starter projects
   - examples
   - templates
   - tutorials
   - recipes
   - GitHub Actions, and relevant Claude Code tooling/features (workflows, skills, subagents) worth suggesting alongside them
7. Prefer this order:

```text
Managed dashboard feature
→ official CLI or GitHub Action
→ official SDK/package
→ official repository/example/recipe
→ small adapter
→ custom implementation only when a verified gap remains
```

8. Identify:
   - stale assumptions
   - duplicate work
   - existing reusable code
   - unnecessary custom code
   - blockers
   - security risks
   - failure points
   - missing tests
   - simpler alternatives
9. Do not implement until the efficient path is verified.
10. Keep the `SUPA` label whenever the task materially involves Supabase.

---

## Required output

Always use the full task name:

`IPI-XXX · TASK-ID — Full Task Name`

Return:

| Area                          | Finding |
| ------------------------------ | ------- |
| Current approach                |         |
| More efficient approach         |         |
| Managed/dashboard option        |         |
| Official CLI/SDK/package        |         |
| Official repo/example/recipe    |         |
| Existing code to reuse          |         |
| Custom code still required      |         |
| Errors and failure points       |         |
| Critical fixes                  |         |
| Tests and verification          |         |
| Estimated effort saved          |         |
| Confidence                      |         |

Finish with:

```text
Recommended path:
1.
2.
3.

Avoid:
-

Verdict: Proceed / Rewrite task / Split task / Park / Duplicate / Cancel
Efficiency score: XX/100
Implementation readiness: XX/100
```

Cite every external recommendation with an official source. Do not use blogs when official documentation or repositories exist.

---

## Notes

- This is a sibling of `/efficient` (reuse/discovery-and-scoring, iPix-internal focus) — use `/fastest` when the task's efficiency question is really "does a vendor/platform already solve this" (managed feature, official SDK, official repo) rather than "what in this codebase can I extend."
- `graphify query "<task topic>"` before reading any source file, per repo convention.
- Never edit, commit, or open a PR from this command — output research and a recommendation only.
