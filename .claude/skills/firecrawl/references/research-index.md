# Research Index (Paper Retrieval)

Find research papers that answer a research query. Use for **literature-finding / paper-retrieval** — single-paper lookups or full multi-paper sets. Not for general web search (use [search.md](search.md) instead).

There is **no fixed recipe**. Read the query, decide what kind it is, and choose the approach. Some queries need a single search; others need heavy structural/semantic expansion.

## Tools

| Tool | MCP | CLI | Best for |
|---|---|---|---|
| Semantic search | `firecrawl_research_search_papers(query, k?)` | `firecrawl research search-papers <query> [--k N]` | HyDE search over abstracts — natural first move |
| Expansion | `firecrawl_research_related_papers(seed_ids, intent, mode?, k?)` | `firecrawl research related-papers <ids...> --intent <intent> [--mode similar\|citers\|references]` | Turn one hit into a set; reaches papers semantic search cannot |
| Metadata | `firecrawl_research_inspect_paper(id)` | `firecrawl research inspect-paper <id>` | Canonical citation/metadata for one paper (not full text) |
| Full-text verify | `firecrawl_research_read_paper(id, question)` | `firecrawl research read-paper <id> --question <q>` | In-body passages to verify a load-bearing constraint |
| Web fallback | `firecrawl_search` / `firecrawl_scrape` | `firecrawl search` / `firecrawl scrape` | Leaderboards, rankings, facts not in abstracts |

### Expansion modes

- `similar` → niche siblings
- `citers` → who uses/builds on the seeds
- `references` → what they build on / compare against

## Match Approach to Query

| Query type | Approach |
|---|---|
| **Single named paper** ("the Qwen3 report") | One `search_papers`, done |
| **Paper by description / method** ("training-free N-gram detection") | Best match + `related_papers` for the family — include neighbors, don't narrow to one hit |
| **Enumeration / method-family** ("papers that do X") | Set answer; expand anchors with `mode=similar`, re-seed from strong hits |
| **Exhibiting** ("papers that use property P") | From P's defining paper via `citers`/`references`; `read_paper` to confirm |
| **Superlative / leaderboard** ("best on benchmark X") | Web search for leaderboard → map top entries back with `search_papers` |
| **Org / author filtered** | Topical match + verify affiliation/authorship before keeping |
| **Compare-against** ("what does paper X benchmark against") | `read_paper(X, ...)` or `related_papers([X], ..., mode="references")` |

## Principles

- **When in doubt, include.** Return the relevant family, not just the single best match.
- **Follow the literature.** Seminal source, competing methods, close neighbors are usually one hop away via `related_papers`.
- **Verify to exclude, not gatekeep.** Use `read_paper` to rule a paper out when a hard constraint fails; keep plausibly relevant work.
- **Only drop clearly off-topic.** High bar for exclusion.
