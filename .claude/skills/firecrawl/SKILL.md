---
name: firecrawl
description: Integrate Firecrawl into product code and agent workflows — onboarding, /search, /scrape, /interact, and research paper retrieval. Use whenever adding Firecrawl to an app, wiring FIRECRAWL_API_KEY, building query-to-URL pipelines, single-page extraction, browser interactions (clicks, forms, pagination, auth flows), literature or paper search, or any web discovery + extraction feature — even if the user does not say "Firecrawl".
license: ISC
metadata:
  author: firecrawl
  version: "1.0.0"
  homepage: https://www.firecrawl.dev
  source: https://github.com/firecrawl/skills
inputs:
  - name: FIRECRAWL_API_KEY
    description: Firecrawl API key for hosted Firecrawl requests.
    required: true
  - name: FIRECRAWL_API_URL
    description: Optional base URL for self-hosted Firecrawl deployments.
    required: false
references:
  - references/onboarding.md
  - references/search.md
  - references/scrape.md
  - references/interact.md
  - references/research-index.md
---

# Firecrawl

One skill for integrating Firecrawl into applications: credentials and SDK setup, then the narrowest endpoint for the product behavior.

## Install

If Firecrawl is not set up yet, one command installs CLI tools and build guidance:

```bash
npx -y firecrawl-cli@latest init --all --browser
```

This opens browser auth for the human to sign in. No separate `npx skills add` step is needed.

## Route to the Right Guide

Read **one** reference file based on where the task starts:

| Starting point | Read |
|---|---|
| No API key yet, first integration, `.env` setup | [references/onboarding.md](references/onboarding.md) |
| Feature starts with a **query**, not a URL | [references/search.md](references/search.md) |
| Feature already has a **URL**, needs page content | [references/scrape.md](references/scrape.md) |
| Page needs **clicks, forms, pagination, or auth** | [references/interact.md](references/interact.md) |
| **Literature / paper retrieval** (not general web) | [references/research-index.md](references/research-index.md) |

When unsure, follow the escalation ladder below before picking a reference.

## Escalation Ladder

Firecrawl endpoints compose left-to-right. Start narrow; escalate only when the previous step cannot unlock the data.

```text
onboarding → search → scrape → interact
                              ↘ research-index (parallel track for papers)
```

- **No URL yet** → `/search` discovers sources, then optionally `/scrape` top hits.
- **URL in hand** → `/scrape` is the default primitive.
- **Static read fails** (content behind clicks, filters, login) → `/interact`.
- **Paper corpus question** → research tools, not general `/search`.

Escalating too early adds latency and cost. `/scrape` handles most product extraction; `/interact` is for when the page must be manipulated, not just read.

## Fresh vs Existing Project

After credentials are in place:

- **Fresh project** — pick stack SDK, add first Firecrawl call, run a smoke test.
- **Existing project** — inspect how the repo handles third-party APIs and env vars; integrate Firecrawl in the same patterns.

Details: [references/onboarding.md](references/onboarding.md).

## Docs (Source of Truth)

Read the agent source-of-truth page for the project language **before** writing integration code:

- **Node / TypeScript**: [docs.firecrawl.dev/agent-source-of-truth/node](https://docs.firecrawl.dev/agent-source-of-truth/node)
- **Python**: [docs.firecrawl.dev/agent-source-of-truth/python](https://docs.firecrawl.dev/agent-source-of-truth/python)
- **Rust**: [docs.firecrawl.dev/agent-source-of-truth/rust](https://docs.firecrawl.dev/agent-source-of-truth/rust)
- **Java**: [docs.firecrawl.dev/agent-source-of-truth/java](https://docs.firecrawl.dev/agent-source-of-truth/java)
- **Elixir**: [docs.firecrawl.dev/agent-source-of-truth/elixir](https://docs.firecrawl.dev/agent-source-of-truth/elixir)
- **cURL / REST**: [docs.firecrawl.dev/agent-source-of-truth/curl](https://docs.firecrawl.dev/agent-source-of-truth/curl)

## Live Web Tooling During Development

For ad-hoc web work in the current session (not app code), use the Firecrawl CLI skills installed alongside this skill (`firecrawl search`, `firecrawl scrape`, etc.) or the Firecrawl MCP server when available.

## After Setup Checklist

1. Confirm `FIRECRAWL_API_KEY` is in `.env` or the platform secret manager (Infisical for iPix).
2. Decide what Firecrawl should do in the product.
3. Pick the narrowest endpoint from the route table above.
4. Read the matching reference file and the language source-of-truth page.
5. Add the SDK or REST call in code.
6. Run a smoke test proving one real Firecrawl request succeeds.
