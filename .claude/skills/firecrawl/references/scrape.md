# Scrape (`/scrape`)

Use when the application already has a **URL** and needs content from one page.

## When This Applies

- Feature starts from a known URL
- Page content for retrieval, summarization, enrichment, or monitoring
- Default extraction primitive before considering `/interact`

## Defaults

- Return `markdown` unless the feature truly needs another format.
- Use `onlyMainContent` for article-like pages where nav and chrome add noise.
- Add waits or rendering options only when the page needs them.

## Common Product Patterns

- Knowledge ingestion from known URLs
- Enrichment from a company, product, or docs page
- Pricing, changelog, and documentation extraction
- Page-level quality checks or monitoring

## Implementation Notes

- Keep the integration narrow: one feature, one URL, one extraction contract.
- Treat `/scrape` as the default primitive for downstream LLM or indexing pipelines.
- Request richer formats (links, screenshots, branding) only when the consumer needs them.

## Escalation

- **No URL yet** → [search.md](search.md)
- **Content requires clicks, typing, or multi-step navigation** → [interact.md](interact.md)
