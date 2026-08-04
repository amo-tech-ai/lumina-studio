# PR #814 — Merge Record

**Task:** IPI-661 · PRAGENT-003 — Add iPix PR-Agent Review Contract and Expert Guidance
**PR:** `IPI-661 · PRAGENT-003 — Add iPix PR-Agent Review Contract and Expert Guidance` (#814)
**Merge SHA:** `aa99aa7619491e961ef8192397ae3f40247c134d` (squash, `main`)
**Merged:** 2026-08-04

---

## Purpose

Ship the iPix PR-Agent review contract (`docs/pr-review-guidelines.md`) and six domain
expert sheets (`docs/engineering/pr-agent/*.md`) so the automated reviewer has an
iPix-specific rulebook — stack facts, ordered review priorities, security baseline,
anti-noise exclusions, `BLOCKING/IMPORTANT/OPTIONAL` finding format, task-reference rules,
and the humans-decide clause. This is a docs-only PR and is the hard blocker for
**IPI-659 · PRAGENT-004** (restricted PR-Agent config + hardened workflow), whose Phase A
`repo_context_files` load requires `docs/pr-review-guidelines.md` to exist on `main`.

## Files / systems changed

8 new files, 356 lines added, zero production code:

| File | Lines | Purpose |
|---|---|---|
| `docs/pr-review-guidelines.md` | 79 | Central review contract |
| `docs/engineering/pr-agent/supabase.md` | 56 | RLS+grants, remote-only workflow, types regen, edge `_shared` helpers |
| `docs/engineering/pr-agent/mastra.md` | 41 | Registry/agent-id/`useAgent` key sync, data-path layering, HITL ownership |
| `docs/engineering/pr-agent/copilotkit.md` | 47 | `package.json` v2-ladder import truth, runtime/frontend alignment |
| `docs/engineering/pr-agent/cloudflare.md` | 42 | Proof-required fs/path scoping on `nodejs_compat` Workers |
| `docs/engineering/pr-agent/commerce.md` | 42 | Mercur/Medusa commerce ownership vs. Supabase links-only role |
| `docs/engineering/pr-agent/github-actions.md` | 49 | SHA pinning, least-privilege permissions, command-token gate |
| `docs/linear/issues/IPI-661-PRAGENT-003.md` | 119 | Linear spec mirror (problem/story/flow/AC/steps A–E) |

No workflow, `.pr_agent.toml`, migration, or application code touched. Canonical PR-Agent
config values (`ignore_pr_labels`, `num_max_findings`, `restricted_mode`, task map) remain
owned by `tasks/pr-agent/` — verified no duplication in this diff.

## Tests / CI results

- Documentation-only change; no application build, typecheck, or test suite applies to the
  new files themselves.
- Per PR description: `markdownlint` clean on all 7 doc files (MD013/MD034 excluded per
  house style); line caps respected (contract 79 ≤ 120; sheets 41–56 ≤ 90).
- Pre-push gate reported green at merge time (typecheck + 3,147 tests) — this covers the
  repo's existing suite, unaffected by a docs-only diff.

## Production impact

None. No runtime, infrastructure, database, secrets, or workflow config changed. The new
files are inert on disk until wired into `repo_context_files` by the separate IPI-659
config PR (staged rollout: Phase A loads only `AGENTS.md` + the central contract; the six
expert sheets wire in later per Phase B/C).

## Known limitations

- The expert sheets exist on disk but are **not yet loaded** by any PR-Agent config —
  wiring is explicitly out of scope here and deferred to IPI-659.
- This record does not independently re-verify the PR's cited `markdownlint`/`wc -l`/test
  results; it reflects the PR description and file-count/line-count evidence confirmed on
  disk at merge.

## Rollback / cleanup notes

- Additive, docs-only change — revertable with `git revert aa99aa7` if any contract
  language needs correction.
- No migrations, feature flags, secrets, or deployments to clean up.

## Follow-up tasks

- **IPI-659 · PRAGENT-004** — restricted PR-Agent config + hardened workflow; wires
  `docs/pr-review-guidelines.md` into Phase A `repo_context_files` (now unblocked).
- Wire the six expert sheets into `repo_context_files` per the staged Phase B/C plan once
  the post-measurement gate is reached.
- **IPI-930 · PRAGENT-005** — seeded-defect validation PRs against this contract (tracked
  separately, not implemented here).