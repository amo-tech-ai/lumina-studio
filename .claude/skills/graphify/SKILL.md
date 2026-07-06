---
name: graphify
description: >
  Query the iPix codebase and docs knowledge graph instead of grepping. Use for
  IPI dependency analysis, PRD traceability, Supabase schema impact, Brand
  Intelligence dependencies, Asset DNA dependencies, CopilotKit/Mastra workflow
  mapping, or Medusa commerce graph queries. Also use when the user asks "what
  connects X to Y", "find all dependencies of Z", "what files does feature W
  touch", "trace the impact of changing A", "map the data flow for B", or
  "which skills are relevant for C".
metadata:
  priority: 2
  triggers:
    - knowledge graph
    - repo graph
    - graph query
    - IPI dependency
    - PRD traceability
    - Supabase schema impact
    - Brand Intelligence dependencies
    - Asset DNA dependencies
    - CopilotKit Mastra workflows
    - Medusa commerce graph
    - dependency analysis
    - trace impact
    - data flow
    - cross-module
    - graphify
---

# Graphify — iPix Knowledge Graph

The iPix project graph lives at `graphify-out/graph.json` (repo root — matches the CLI's default `--graph` path; **~40K nodes**, AST-only rebuild; run `graphify update .` after large changes).

## When NOT to use

- For simple grep/search — use `rg` or `grep` instead
- Before the graph has valid edges (verify via `graphify query` first)
- For secrets or private env inspection
- For files outside the project root

## Quick start

```bash
# Query the graph
graphify query "what connects auth to the database?" \
  --graph graphify-out/graph.json

# Find shortest path between two concepts
graphify path "BrandIntake" "Gemini" \
  --graph graphify-out/graph.json

# Explain a node — what it is and what connects to it
graphify explain "brand_intake_drafts" \
  --graph graphify-out/graph.json

# Find impacted nodes (reverse traversal)
graphify affected "brand-intelligence" \
  --graph graphify-out/graph.json
```

## Common iPix queries

| Goal | Command |
|------|---------|
| IPI issue dependencies | `graphify query "IPI-" --graph graphify-out/graph.json` |
| Supabase data model | `graphify query "Supabase tables" --graph graphify-out/graph.json` |
| Brand Intelligence scope | `graphify query "Brand Intelligence" --graph graphify-out/graph.json` |
| Commerce integration | `graphify query "commerce_product_links" --graph graphify-out/graph.json` |
| Skill relevance | `graphify query "skill production package" --graph graphify-out/graph.json` |

## Rebuilding the graph

Only code AST extraction (free, no API cost). No LLM-based doc extraction.

```bash
# After project changes (rebuilds graphify-out/graph.json in place)
graphify update /home/sk/ipix
```

The `.graphifyignore` file at the project root controls what gets excluded. Currently excludes: `github/`, `claude-code-templates/`, `node_modules/`, `.git/`, archived docs, and sub-project repos.

## Graph health

| Metric | Current |
|--------|---------|
| Nodes | ~40K (AST) / operator app ~474 |
| Edges | ~50K |
| Operator app | `app/src/graphify-out/graph.json` (~474 nodes) |
| Location | `graphify-out/` (repo root) |
| Rebuild | `graphify update . --force` from repo root; `graphify update .` in `app/src` |

## Reference docs

- [Setup report](../../../graphify-out/GRAPHIFY_SETUP_REPORT.md)
- [Usage guide](../../../graphify-out/GRAPHIFY_USAGE_GUIDE.md)
- [Dev workflow](../../../graphify-out/GRAPHIFY_DEV_WORKFLOW.md)
- [Exclude rules](../../../graphify-out/GRAPHIFY_EXCLUDE_RULES.md)
