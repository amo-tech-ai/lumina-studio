# Tech stack · pgvector / RAG

**SSOT playbook:** [06 · Tech Stack Playbook](../06-tech-stack-playbook.md) §3.5

| | |
|--|--|
| **Purpose** | Semantic brand/context (later talent/assets) search |
| **Current (✅)** | `vector(768)`; `search_brands` / context RPCs; model-match still filter-heavy |
| **Core** | Healthy embeddings + RLS search |
| **Advanced** | Full RAG chat, rerank, hybrid |
| **Class** | Brand search = **MVP** · Domain RAG packs = **Post-MVP** |
| **Rec** | **Keep** pgvector · **Improve** Brand Hub UX · no second vector product |

## RAG priority (🟡)

Brand DNA → context snapshots → talent → shoot refs → CRM memory → campaigns.

## MVP action

**IPI-XXX · STACK-RAG-001 — Brand Hub similar-brands via search_brands RPC**
