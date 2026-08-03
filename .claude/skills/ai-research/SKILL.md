---
name: ai-research
description: >
  Research-before-code for iPix. Use whenever implementing, architecting, debugging,
  writing migrations, adding vendors/tools, or starting an IPI task — even if the user
  did not say "research". Also use for /research, "what's the best way", "should we
  build or reuse", platform-first checks, and before any custom Cloudflare/Supabase/
  Mastra/CopilotKit/Stripe work. Produces a concise evidence-backed research report
  and blocks coding until a recommendation exists (except trivial ≤3-file known-pattern
  edits). Prefer official docs, dashboards, CLI, SDK, MCP, and existing iPix code over
  new custom code. NOT for pure copy edits, or when the user explicitly says "skip
  research and implement this known one-liner".
---

# AI Research (iPix)

**Playbook SSOT:** [`docs/process/03-ai-research-playbook.md`](../../../docs/process/03-ai-research-playbook.md)  
**Report template:** [`references/report-template.md`](references/report-template.md)  
**Platform sources:** [`references/platform-sources.md`](references/platform-sources.md)  
**Peers:** `/efficient` (rank approaches) · lifecycle [`research.md`](../ipix-task-lifecycle/research.md) · `ponytail` · `graphify`

**Default stance:** Research → recommend → only then implement. Custom code is last.

---

## When this skill runs

| Trigger | Action |
|---------|--------|
| IPI implement / `/task` Phase 2 | Full report before edits |
| Architecture / new tool / vendor | Full report + MVP stage |
| Migration / RLS / auth | Full report + safety risks |
| Debugging “how should we fix” | Short report: reuse vs patch |
| User says implement immediately | Still 5-line verdict unless ≤3-file known pattern |

Skip full report only when: ≤3 files, known pattern, no Supabase/RLS/edge/Mastra/new vendor.

---

## Workflow (mandatory order)

1. **User outcome** — one sentence (persona + surface + after state).  
2. **iPix codebase** — `graphify query` → `explain`/`affected` → targeted `Read`/`rg`.  
3. **Linear + GitHub PRs** — spec md, siblings, `gh pr list` / related merges.  
4. **Dashboard / config** — only vendors touched (see platform-sources).  
5. **Official docs** — MCP or web; cite URL.  
6. **Official GitHub examples / templates / recipes** — prefer last 30 days.  
7. **SDK / CLI / API / MCP / modules** — can we configure instead of build?  
8. **Compare** ≤3 options (effort · risk · launch value).  
9. **Recommend** smallest: `configure` | `reuse` | `small custom` | `defer` | `duplicate`.  
10. **Custom?** Only if 4–7 insufficient — justify in report.

Load [`references/platform-sources.md`](references/platform-sources.md) for vendor-specific first stops.

---

## Decision rules

| Evidence | Verdict |
|----------|---------|
| Dashboard/CLI enough | `configure` — no feature PR |
| Existing iPix helper | `reuse` / extend |
| Official template/SDK ≥80% | adopt + thin adapter |
| Same IPI/PR already solves | `duplicate` — stop |
| Low launch value + Advanced | `defer` |
| Gap remains after sources | `small custom` + named tests |

Reject: new abstractions, parallel Vite `src/`, new agents for a “persona”, extra vendors when Firecrawl/existing covers crawl/research.

---

## Output (always)

Copy structure from [`references/report-template.md`](references/report-template.md). Keep **≤1 page**. Every row needs a path, URL, or command observation.

Must include:

- What already exists  
- What can be reused  
- Official best practice  
- Relevant GitHub examples  
- Recommended implementation  
- Alternatives considered  
- Risks and blockers  
- Tests required  
- Why custom is or is not needed  
- **MVP stage:** Core | Post-MVP | Advanced  

End with: **`Stop research: yes`** + **Next: implement | blocked | defer**

---

## Stop gate

Do **not** edit production files until the report has a verdict and tests required — unless the user overrides or the skip rule applies.

After green-light, hand off to `ipix-task-lifecycle` Phase 3 / domain skill / `/task`.
