# iPix Cloudflare Architecture — Mermaid Diagrams

**⚠️ Superseded 2026-07-09.** This 5-file set predates a full architecture diagramming pass and has known drift (e.g. `03-agent-tool-architecture.md` draws Campaign/Research agents as if they have real tools; `04-workflow-architecture.md` lists 7 Mastra workflows when only 2 exist). **The current, maintained diagram set lives at `/home/sk/ipix/docs/architecture/diagrams/`** (16 diagrams, verified against `prd.md`/`roadmap.md`/code, re-verified twice). Kept here only as historical reference — do not treat as current.

**Purpose:** Visual planning references for Cloudflare platform migration.

| # | File | Type | Supports Tasks |
|:-:|------|:----:|:--------------:|
| 01 | `01-system-architecture.md` | C4Context — full system | CF-000, INFRA-001 |
| 02 | `02-ai-provider-flow.md` | Flow + Sequence — agent→adapter→gateway→fallback | CF-AI-001/004/005/006 |
| 03 | `03-agent-tool-architecture.md` | C4Container — agents→tool registry→data | AGENT-001/002/003/005 |
| 04 | `04-workflow-architecture.md` | Flowchart — 7 AI workflows | AGENT-004, CF-AI-002/003 |
| 05 | `05-data-storage-decision-map.md` | Flowchart — data location decisions | SEARCH-001, CF-000 |

Render via GitHub, Mermaid Live, or Obsidian with Mermaid plugin.
