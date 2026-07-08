## GRAPH-004 — Graph Search RPCs

**Linear:** [IPI-377](https://linear.app/amo100/issue/IPI-377) · **Phase:** 1 · **Priority:** **P1** · **Estimate:** 1.5

Create Postgres functions (RPCs) for semantic brand search and graph traversal.

**In plain terms:** These are SQL functions the app can call to ask questions like "find me 10 brands most similar to this one" or "show me everything connected to this brand." They're the query API for the graph.

### RPCs

#### 1. `search_brands(p_embedding, p_limit, p_exclude_brand_id)`
Finds similar brands by cosine similarity on `brands.embedding`. Returns similarity score + shared nodes.

```sql
-- Example: "find brands similar to Brand X"
select * from search_brands(
  p_embedding => (select embedding from brands where id = 'abc-123'),
  p_limit => 10,
  p_exclude_brand_id => 'abc-123'
);
-- Returns: brand_id, brand_name, similarity (0-1), shared_nodes (what they have in common)
```

#### 2. `traverse_brand_graph(p_start_node_id, p_max_hops, p_edge_types)`
N-hop graph traversal using recursive CTE. Follows edges from a starting node to discover connected nodes.

```sql
-- Example: "find everything 2 hops from this persona"
select * from traverse_brand_graph(
  p_start_node_id => 'node-456',
  p_max_hops => 2,
  p_edge_types => array['SELLS', 'TARGETS', 'COMPETES_WITH']
);
-- Returns: node_id, node_type, label, path_length, edge_types
```

### Acceptance

- [ ] `search_brands()` RPC: cosine similarity + shared node output
- [ ] `traverse_brand_graph()` RPC: recursive CTE, edge type filtering
- [ ] RLS: service_role execute (called via Edge Functions, not client-side)
- [ ] Smoke test: brand A finds brand B with >0.7 similarity
- [ ] Smoke test: 2-hop traversal returns all connected nodes
- [ ] `npm run supabase:verify` passes

### Dependencies

- **Requires:** GRAPH-001 (tables), GRAPH-003 (brands.embedding)
- **Unlocks:** Brand discovery, matching agent (MATCH-001)