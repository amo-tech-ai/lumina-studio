# Create AI-agent priority Linear issues (Cursor Desktop)

**Why this doc exists:** Cursor **Cloud** agents cannot complete interactive Linear MCP login. Use **Cursor Desktop** (or Infisical + CLI) to create/connect the five issues.

**Branch / PR:** `cursor/process-improvement-playbooks-6ec4` · https://github.com/amo-tech-ai/lumina-studio/pull/778  
**Specs:** [`agent-priority-README.md`](./agent-priority-README.md)  
**Script:** [`scripts/linear-create-agent-priority-issues.mjs`](../../scripts/linear-create-agent-priority-issues.mjs)

---

## What gets created / updated

| Order | Task | Action |
|-------|------|--------|
| 1 | **AGENT-CTX-001** — Give AI the current brand, shoot, or deal context | **Create** (or update if title already has `AGENT-CTX-001`) |
| 2 | **AGENT-DNA-001** — Explain Brand DNA with evidence and confidence | **Create** / update |
| 3 | **AGENT-PLAN-001** — Require approval before each shoot-planning stage | **Create** / update |
| 4 | **IPI-156 · CAMP-001** — Add campaign help to the existing Creative Director | **Update** existing IPI-156 (do not duplicate) |
| 5 | **AGENT-RAG-001** — Let Brand Intelligence cite similar brands and past context | **Create** / update |

Rules: one issue · one PR later · no new Mastra agent IDs · no Support / Postiz / Apify / OpenClaw issues from this set.

---

## Option A — Cursor Desktop + Linear MCP (preferred)

### 1. Authenticate Linear in Cursor Desktop

1. Open this repo in **Cursor Desktop** (not Cloud-only).
2. Open **Settings → MCP** (or Features → MCP).
3. Find **Linear** → **Connect** / **Authenticate** → complete OAuth.
4. Confirm Linear tools are available (no `needsAuth`).

### 2. Paste this prompt to the Desktop agent

```text
Create or update the five iPix AI-agent priority Linear issues on team IPI.

Read:
- docs/linear/issues/CURSOR-DESKTOP-CREATE-LINEAR-ISSUES.md
- docs/linear/issues/agent-priority-README.md
- The five spec files listed there (CTX, DNA, PLAN, IPI-156, RAG)

Use Linear MCP:
1. Prefer running: infisical run --env=dev -- node scripts/linear-create-agent-priority-issues.mjs
   OR create/update issues via Linear MCP with full markdown bodies from those files.
2. Reuse IPI-156 — update title + description; do not create a second campaigns agent issue.
3. After create, rewrite any IPI-XXX placeholders to the real IPI-N identifiers in titles and descriptions.
4. Reply with the five Linear URLs in execution order.
5. Do not create Support, Postiz, Apify, or OpenClaw agent issues.
```

### 3. Done when

- [ ] Five Linear URLs returned (4 new or updated + IPI-156 updated)  
- [ ] Titles use `IPI-NNN · TASK-ID — Plain English title`  
- [ ] Descriptions match the markdown specs (with real IDs)  

---

## Option B — CLI + Infisical (no MCP)

On a machine with Infisical + `LINEAR_API_KEY` in the `dev` env:

```bash
cd "$(git rev-parse --show-toplevel)"
git fetch origin
git checkout cursor/process-improvement-playbooks-6ec4   # or main after merge

# Confirm key without printing it
infisical run --env=dev -- bash -c 'test -n "$LINEAR_API_KEY" && echo LINEAR_API_KEY=set'

# Create / update all five
infisical run --env=dev -- node scripts/linear-create-agent-priority-issues.mjs
```

Or with a key already exported:

```bash
LINEAR_API_KEY=lin_api_… node scripts/linear-create-agent-priority-issues.mjs
```

The script is **idempotent**: matching `AGENT-*-001` / IPI-156 updates instead of duplicating.

---

## Option C — Manual paste (fallback)

1. Open [Linear → IPI team → New issue](https://linear.app/amo100/team/IPI/new).  
2. For each of the five files under `docs/linear/issues/IPI-*-AGENT-*.md` and `IPI-156-CAMP-001-*.md`:  
   - Title = H1 of the file (replace `IPI-XXX` after Linear assigns the number).  
   - Description = full file contents.  
3. For campaigns: open **existing** [IPI-156](https://linear.app/amo100/issue/IPI-156) → replace description with `IPI-156-CAMP-001-creative-director-campaigns.md`.

---

## After issues exist

1. Copy the five URLs into the PR or a short note on IPI team.  
2. Implement **one issue per PR**, in order: CTX → DNA → PLAN → IPI-156 → RAG → **stop**.  
3. Optional: keep specs in sync later with `scripts/linear-sync-issue-body.mjs` once numbers are known.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| MCP `needsAuth` in Cloud | Use Desktop Option A or CLI Option B — Cloud cannot OAuth Linear |
| `LINEAR_API_KEY is not set` | `infisical run --env=dev -- …` or export a personal Linear API key with issue write scope |
| Duplicate issues | Re-run the create script (matches on `AGENT-*-001` / number 156) or search Linear before creating manually |
| Wrong team | Script targets team key **IPI** only |
