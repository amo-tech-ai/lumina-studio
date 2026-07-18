# Quick Gate — fast blocker verification

**Parent:** [../SKILL.md](../SKILL.md) · **Escalates to:** full protocol in SKILL.md Phases 0–10

Use **Quick Gate** for merge safety, small fixes, docs, status checks, and first-pass ops triage.  
Use **Full Verify** for Done gates, architecture, security, and production releases.

Task titles use: `IPI-XXX · TASK-ID — Full Task Name` (e.g. `IPI-702 · COPILOT-RUNTIME-001 — Restore Production CopilotKit /info`).

---

## When to use Quick vs Full

| Trigger | Mode |
|---------|------|
| User says `quick`, `Quick gate`, merge safety, small fix | **Quick** |
| User says `full`, `before Done`, production release | **Full** |
| No mode specified | **Quick** (router picks depth) |
| Any 🔴 blocker in Quick | Escalate or stop — user may request Full |
| Evidence conflicts | Escalate to **Full** |
| Status moving to Done | **Full** mandatory |
| Production or security affected | **Full** mandatory |
| User explicitly requests full | **Full** |

---

## Phase 0 — Route

Load [task-type-router-ipix.md](./task-type-router-ipix.md) **mode table** (below). Identify:

1. **Task type** — incident / code-fix PR / docs / new spec / Done gate / release gate
2. **Default mode** — quick or full (override only when user names a mode)
3. **Expected evidence** — what must be true to say Safe
4. **Probes to skip** — do not run full rubric, anti-fake-done (10 gates), or web search by default

### Task-type → default mode

| Task type | Default mode | Required checks (minimum) |
|-----------|:------------:|---------------------------|
| Production incident / operations | Quick first | logs → runtime endpoint → env/deployment timestamps → remediation |
| Code-fix PR | Quick | diff → targeted tests → relevant skill |
| Docs / tracker update | Quick | scope → links → internal consistency |
| New spec / architecture decision | Full | claims → official docs/MCP → implementation feasibility |
| In Progress → Done | Full | complete task-verifier protocol (SKILL.md Phases 0–10) |
| Production release gate | Full | deployment + runtime + rollback evidence |

**Artifact detection** still uses the router type table (IPI, SCR, Audit, Legacy F*, etc.) — this table adds **verification depth**, not a replacement.

---

## Phase 1 — Probe

Run **only** the minimum useful evidence for the routed task type:

| Budget | Rule |
|--------|------|
| Disk/code | **1–3 probes** — `rg`, `ls`, targeted test, or `gh pr diff` |
| External | **One** relevant MCP or connected source when needed |
| Operations | Production runtime/log probe when task is incident/ops |

**Stop at the first confirmed 🔴 blocker.** Do not continue probing for a completeness score in Quick mode.

### Probe examples by type

| Type | Typical probes |
|------|----------------|
| Code-fix PR | `gh pr diff` · `npm test -- <file>` · changed path exists on disk |
| Docs | Link targets exist · scope matches PR title · no stale IPI refs |
| Production ops | Runtime logs · `GET /api/copilotkit/info` (or task-specific health URL) · deployment SHA |
| IPI status check | Linear MCP status + one disk probe for claimed fix |

Run `bash .claude/skills/task-verifier/scripts/probe-disk-ipix.sh` only when the task touches app/supabase/skills/git — not on every Quick gate.

---

## Phase 2 — Skills and docs

**Order (strict — do not web-search by default):**

```text
1. Relevant domain skill (Read SKILL.md + references for changed paths)
2. MCP / installed package docs / Context7 (when skill silent on API shape)
3. Official web documentation — ONLY when (1) and (2) are insufficient
```

Log **Docs checked** with actual sources used (skill path, MCP server, or URL).

Quick mode: Phase 5b skills compliance is **abbreviated** — declare skills, confirm on disk, audit MUSTs for **changed paths only**. Full MUST table deferred to Full Verify.

---

## Phase 3 — Report (required output)

One compact report. **No** long explanations, duplicate sections, or full rubric unless escalating to Full.

```markdown
## Gate — IPI-XXX · TASK-ID — Full Task Name

| Question | Answer |
|----------|--------|
| **Verdict** | ✅ Safe / 🛑 Not ready |
| **Composite** | NN/100 (estimate OK in Quick; cite rubric only if escalated) |
| **Will succeed?** | NN% — one-line condition |
| **Blockers 🔴** | None or exact blocker |
| **Red flags 🟡** | Material risks only |
| **Critical fixes** | Minimum required corrections |
| **Missing** | Evidence or acceptance gaps |
| **Improvements** | Optional — only after blockers cleared |
| **Docs checked** | Skills/MCP/docs actually used |

### Probes

| Claim | Probe | Result |
|-------|-------|--------|
| ... | `command` or MCP | ✅ / 🔴 / 🟡 |
```

### Quick scoring (estimate)

When not escalating, composite may be a **good-faith estimate** from:

- Blockers present → cap composite at **70**
- Zero 🔴, probes pass → **75–85** typical for merge-ready code-fix
- Do **not** publish spec/execution/skills sub-scores unless user asks or mode escalates to Full

Full composite formula unchanged: `0.35×spec + 0.40×execution + 0.25×skills` ([task-spec-rubric.md](./task-spec-rubric.md)).

### Stop condition (Quick)

Any 🔴 → verdict **🛑 Not ready** + list blockers. Offer: *"Run `@task-verifier full IPI-XXX` for complete gate."*

Never false-positive **✅ Safe** when production runtime fails and task claims prod Done.

---

## Escalation to Full Verify

Escalate when **any** of:

- 🔴 blocker appears and task is production-critical
- Probe results conflict with Linear/issue claims
- User moving task to **Done**
- Production, security, or release gate affected
- User requests full verification
- Quick composite would be &lt;70 and root cause unclear

On escalation: run SKILL.md **Phases 0–10** including anti-fake-done (all 10 gates) and full rubric sub-scores.

---

## Production-ops shortcut

For production configuration incidents (e.g. `IPI-127 · AIOR-011 — Restore CopilotKit Production Runtime Configuration`):

**Fixed order — diagnostic first:**

```text
1. Confirm access (dashboard or CLI — don't fix auth if dashboard works)
2. Read runtime logs BEFORE changing anything
3. Identify the exact exception (import-time vs request-time)
4. Check env-var presence AND scope (Production vs Preview)
5. Compare env changes with deployment timestamps (env ≠ live until redeploy)
6. Apply ONE confirmed fix
7. Redeploy once
8. Run acceptance smoke (/info → agents → stream)
```

**Hard rule:** Never modify production secrets before logs and evidence confirm the cause.

### CopilotKit ops probes (iPix)

| Step | Probe |
|------|-------|
| Runtime health | Authed `GET /api/copilotkit/info` → 200 JSON with agent list |
| Import crash | Stack mentions `getMastraStorage` / module init before handler |
| Env | `DATABASE_URL`, `GEMINI_API_KEY`, `OPERATOR_AUTH_ENABLED` — names only in reports |
| Deploy | Record deployment id, commit SHA, build time |

See [copilotkit skill](../../copilotkit/references/ipix-production.md) when CopilotKit is in scope.

---

## Command routing examples

| User says | Mode |
|-----------|------|
| `@task-verifier quick IPI-702` | Quick |
| `@task-verifier full IPI-702` | Full |
| `Quick gate IPI-702` | Quick |
| `Full verify IPI-702 before Done` | Full |
| `Verify IPI-702` (no qualifier) | Quick (router default) |
| `Is IPI-702 done?` | Full (Done implies full gate) |

Default: **quick** for merge safety, small fixes, docs, status checks.  
**full** for Done, incidents requiring ship proof, architecture, security, releases.
