## GRAPH-004 · Graph Search RPCs (semantic + traversal)

**Linear:** [IPI-377](https://linear.app/amo100/issue/IPI-377) · **Spec file (detail):** [`GRAPH-004-graph-search-rpcs.md`](./GRAPH-004-graph-search-rpcs.md)

**Phase:** 1 · **Priority:** **P1** · **Estimate:** 1.5 · **Project:** BRAND · **Milestone:** BI-M5

Create Postgres functions (RPCs) for semantic brand search and graph traversal.

**In plain terms:** SQL functions the app calls for "find 10 brands similar to this one" or "show everything connected to this brand."

**Blocked by:** GRAPH-001 (tables) · GRAPH-003 (embeddings) — see [`GRAPH-004-graph-search-rpcs.md`](./GRAPH-004-graph-search-rpcs.md)

**Related:** IPI-376 (CRM graph UI) · IPI-39 · IPI-40 · MATCH-001

**Labels:** AI · SUPA · BRAND

---

### RPCs

#### 1. `search_brands(p_embedding, p_limit, p_exclude_brand_id)`
Cosine similarity on `brands.embedding` + shared nodes output.

#### 2. `traverse_brand_graph(p_start_node_id, p_max_hops, p_edge_types)`
Recursive CTE n-hop traversal with edge type filter.

### Acceptance

- [ ] `search_brands()` RPC: cosine similarity + shared node output
- [ ] `traverse_brand_graph()` RPC: recursive CTE, edge type filtering
- [ ] RLS: service_role execute (Edge Functions, not client)
- [ ] Smoke: brand A finds brand B with >0.7 similarity
- [ ] Smoke: 2-hop traversal returns connected nodes
- [ ] `infisical run -- npm run supabase:verify` passes

### Verify

```bash
infisical run -- npm run supabase:verify
infisical run -- npm run supabase:verify-rls
```
