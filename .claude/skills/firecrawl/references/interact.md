# Interact (`/interact`)

Use when `/scrape` is not enough because the feature must **act on the page**.

## When This Applies

- Content appears only after clicks, typing, or navigation
- Forms, pagination, filters, or multi-step flows
- Product must stay in the same browser context after scraping

## Defaults

- Start with `/scrape`, then escalate to `/interact`.
- Scope `/interact` to the smallest browser workflow that unlocks the data.
- Use persistent profiles only when the feature truly needs authenticated state across sessions.

## Common Product Patterns

- Search forms and faceted filters
- Paginated result sets
- Login-gated dashboards or tools
- Flows where the page must be explored before extraction is complete

## Implementation Notes

- `/interact` is for when the page must be manipulated, not just read.
- Keep prompts or action code specific to the product flow.
- For fully open-ended browser automation, evaluate whether a browser sandbox is a better product fit.

## Escalation

- **Page can be read directly** → [scrape.md](scrape.md)
