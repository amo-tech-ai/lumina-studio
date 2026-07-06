# Search (`/search`)

Use when the application starts with a **query**, not a URL.

## When This Applies

- User asks a question and the product must discover sources first
- Feature needs current web results
- Building a shortlist of pages for later scraping

## Defaults

- Use `/search` when URL discovery is part of the product behavior.
- Keep search and extraction conceptually separate unless scraping results is clearly required.
- Prefer selective follow-up extraction over broad hydration when cost or latency matters.

## Common Product Patterns

- Answer generation with cited sources
- Company, competitor, or topic discovery
- Research workflows that produce a shortlist before deeper extraction
- Query-to-URL pipelines for later `/scrape` or `/interact`

## Implementation Notes

- Treat `/search` as discovery, ranking, and source selection.
- Be explicit about whether the product needs snippets, URLs, or full result content.
- Keep the query contract stable so downstream scraping logic stays predictable.

## Escalation

- **Already have the URL** → [scrape.md](scrape.md)
- **Result page needs clicks or forms** → [interact.md](interact.md)
