---
description: "Forensic task verifier — GitHub-first evidence gate for IPI/SCR/RF/BE tasks. Proves spec→repo→tests→CI→browser→design→runtime before trusting Linear. Never trusts a status field."
argument-hint: "IPI-387 | SCR-26 | path/to/spec.md | --done IPI-387"
allowed-tools: ["Bash", "Read", "Grep", "Glob", "Task", "Write"]
---

# /verify-task — forensic gate before any "Done"

**Arguments:** `$ARGUMENTS` — a task ref (`IPI-###` / `SCR-###` / `RF-##`, or a path to a spec/audit `.md`). Prefix `--done` for the stricter **Done-flip** gate (browser + evidence required).

**Skill (SSOT):** [`.claude/skills/task-verifier/SKILL.md`](../skills/task-verifier/SKILL.md). This command drives the skill's phases **plus** the iPix delivery-evidence pipeline below.

**Principle:** *A task is not done until you can prove it — in GitHub, in the running app, and against the design — not in Linear.* **Fails closed:** any 🔴 → "Not ready". Memory and `status:` fields are **not** evidence; re-probe every claim.

---

## Source of truth — verify in this order (GitHub before Linear)

Linear "Done" means nothing if the PR isn't merged, CI is red, or the feature doesn't render. Walk **up** from the artifact, not down from the ticket:

```
Specification → Repository (on main) → Tests → CI/GitHub → Browser → Design → Linear
```

Linear is the **last** thing checked, and only to reconcile — never as evidence.

---

## Verification dimensions — apply the ones the task touches

Detect task type (Phase 0), then run only the relevant dimensions. Score all 10 (n/a dimensions score ⚪ and drop from the weighted total).

| # | Dimension | Wt | How to prove (tools) | Applies to |
|---|-----------|---:|----------------------|-----------|
| 1 | **Specification** | 15% | AC each map to a probe; DoR/Phase-0 tables (SCR); scope not crept | all |
| 2 | **Architecture** | 15% | no dup component/hook/API/provider/types/tokens — `graphify query` + `rg` for siblings before accepting a new file | all |
| 3 | **Code quality** | 15% | `cd app && npm run lint && npm run typecheck`; no `--no-verify`; no legacy hex / `src/` additions | code |
| 4 | **Tests** | 15% | `npx vitest run <glob>`; new logic has a test; `npm test` vs main baseline (no new failures) | code |
| 5 | **Runtime** | 15% | backend actually runs: Supabase MCP (`execute_sql`, `list_migrations`, advisors), edge `get_edge_function`, Mastra tool exec, CopilotKit route 200, Groq/Cloudinary/webhook/cron live probe — **not** just compilation | BE / edge / agents |
| 6 | **Browser** | 10% | app renders the feature: **Playwright** or **Chrome DevTools MCP** — renders ✓, responsive @1280/390 ✓, **0 console errors**, network 200 on data routes, screenshot each state | UI / SCR |
| 7 | **CI / GitHub** | 10% | `gh pr checks <N>` all required green; `gh pr view --json mergeable,mergeStateStatus`; branch protection; **PR merged?** | any PR-backed task |
| 8 | **Documentation** | 5% | AGENTS.md / route docs updated if API changed; evidence path recorded | code |
| 9 | **Dependencies** | 5% | the 5-step chain below | any blocked task |
| 10 | **Security** | 5% | no client AI keys (`rg 'NEXT_PUBLIC_.*_(API_KEY|SECRET|TOKEN)|GEMINI_API_KEY|GROQ_API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|SERVICE_ROLE[:_]?KEY' app/src` → server-only); RLS on new tables; auth guard on new routes | code touching auth/data |

### Design parity (folds into #1 + #6 for DESIGN-* / SCR)

DC HTML wins layout. Verify **pixel parity · spacing · typography · tokens (no raw hex)** side-by-side (DC `:8765` vs React `:3002`) via [`design-to-production`](../skills/design-to-production/SKILL.md). Screenshot each DC state.

### Performance (folds into #6 for UI)

`CI=true npm run build` bundle delta; hydration/CLS/LCP + React warnings via the `chrome-devtools-mcp:debug-optimize-lcp` plugin skill. Flag slow renders.

### Accessibility (folds into #6 for UI)

keyboard nav · visible focus · labels/ARIA · contrast · screen-reader names via [`accessibility`](../skills/accessibility/SKILL.md) / chrome-devtools `a11y-debugging`.

---

## Dependency chain — 5 steps, not 1 (GitHub-verified)

A blocker being "Done" in Linear is worthless. For each `blockedBy`:

```
1. merged to main?   git ls-tree origin/main -r | grep <file>      (not just PR open)
2. CI green?         gh pr checks <blocker-PR>
3. actually exported? git show origin/main:<file> | grep 'export'
4. actually imported? rg "from '.*<module>'" app/src
5. actually used?     rg "<Symbol>" app/src  (a dead import ≠ satisfied dep)
```

Only when all 5 hold for every blocker is the task unblocked.

---

## Injected context (run first)

```bash
git fetch origin -q
REF="${ARGUMENTS#--done }"; echo "ref: $REF  gate: $([[ "$ARGUMENTS" == *--done* ]] && echo DONE || echo plan)"
git ls-tree origin/main -r --name-only >/tmp/vt_main.txt   # authoritative "what's on main"
ls docs/linear/issues/ 2>/dev/null | grep -iE "${REF%% *}" || echo "(no local issue md — Linear MCP get_issue)"
# probe-disk-ipix.sh is local-only (.claude/skills gitignored) — skip if absent
[ -f .claude/skills/task-verifier/scripts/probe-disk-ipix.sh ] && bash .claude/skills/task-verifier/scripts/probe-disk-ipix.sh git 2>/dev/null | tail -5 || true
```

---

## Workflow

Read [`SKILL.md`](../skills/task-verifier/SKILL.md), then:

1. **Phase 0 — type router** ([task-type-router-ipix.md](../skills/task-verifier/references/task-type-router-ipix.md)). IPI/SCR/RF/BE/MOB/Audit/Legacy. Select which dimensions apply.
2. **Spec** — resolve from the repo/spec doc **first**; Linear MCP `get_issue` only to reconcile. List stale/canceled refs.
3. **Dependencies** — the 5-step GitHub chain above. Any un-merged blocker → 🔴, stop.
4. **Repo + code** — dims 2,3,4,8,10 with probes ([verifier-probes-ipix.md](../skills/task-verifier/references/verifier-probes-ipix.md)).
5. **CI/GitHub** — dim 7; `gh pr checks`, mergeability, merged?
6. **Runtime** — dim 5 (BE) via Supabase/Mastra/edge MCP ([mcp-cadence-ipix.md](../skills/task-verifier/references/mcp-cadence-ipix.md)).
7. **Browser + design + perf + a11y** — dim 6 (UI) via Playwright / Chrome DevTools MCP; screenshot each state; design parity for DESIGN-*.
8. **Skills compliance (5b)** — [skills-compliance-ipix.md](../skills/task-verifier/references/skills-compliance-ipix.md).
9. **`--done` only:** Phase 7 anti-fake-done ([checklist](../skills/task-verifier/references/anti-fake-done-checklist.md)) — every gate + attached evidence (screenshots, test output, CI links).

**Stop at the first 🔴** unless auditing a report end-to-end.

---

## Report (required)

```markdown
## Verification report — <date> · /verify-task <ref>  [plan|DONE]

Task type: <IPI|SCR|RF|BE|…>   PR: #<n> (<merged|open|none>)   CI: <green|red|n/a>

| Dimension | Score /100 | Wt | Evidence (probe) |
|-----------|-----------:|---:|------------------|
| Specification | | 15% | |
| Architecture | | 15% | |
| Code quality | | 15% | |
| Tests | | 15% | |
| Runtime | | 15% | |
| Browser | | 10% | |
| CI / GitHub | | 10% | |
| Documentation | | 5% | |
| Dependencies | | 5% | |
| Security | | 5% | |
| **Weighted composite** | **NN** | | (⚪ dims excluded, weights renormalized) |

### Dependency chain (5-step)
| Blocker | merged | CI | exported | imported | used |

### Browser / design evidence
- screenshots: docs/qa/screenshots/<date>/<screen>/ · console: N errors · network: N failures · parity: N%

### Red flags | Sev | Evidence
### Claims — verified ✅ / not verified / stale
### Stop condition
```

Composite = Σ(dim × weight) over applicable dimensions (renormalize when some are ⚪). Evidence symbols: ✅ verified this run (cite probe) · 🔴 blocker · 🟡 fix before Done · ⚪ n/a · ⏭️ pending external.

---

## Stop condition (hard rule)

- Zero 🔴 → **"✅ Safe to execute"** (plan) / **"✅ Safe to mark Done"** (`--done`).
- Any 🔴 → verbatim: **"Not ready. These blockers must be fixed first: \<list\>"** — never a false-positive pass.
- After a ✅ `--done` pass only, **offer** the Linear + `tasks/plan/todo.md` flip (outward action — confirm first).

---

## Rules

- **GitHub before Linear.** A merged, green, rendering, design-matching feature is "done" — a Linear status is not.
- Cite a probe for every ✅. Tables over prose. No "looks good!".
- Verify only — never edit product code here; findings route to `/pr fix` or the implementer.
- One task per row; several refs → one report row each.
- `.claude/skills/` is gitignored (local); read it in place.

---

## Worked example — `/verify-task IPI-387` (2026-07-07)

RF atom. Dependency chain caught the real blocker that a status check never would:

| Blocker | merged | PR | exported on main |
|---------|:--:|:--:|:--:|
| IPI-385 StatusChip | 🔴 no | #237 open | 🔴 0 |
| IPI-386 Empty/Error | 🔴 no | #238 open | 🔴 no |

`entity-list.tsx` absent on `main`, no branch — yet Linear said **In Progress**. → **🛑 Not ready; blockers: #237, #238 not merged.** GitHub-first verification exposed the fiction.

```text
/verify-task --done SCR-26     # UI screen: adds browser + design-parity + a11y + perf evidence before Done
/verify-task --done BE-D1      # backend: adds Supabase/edge/Mastra runtime probes, not just typecheck
```
