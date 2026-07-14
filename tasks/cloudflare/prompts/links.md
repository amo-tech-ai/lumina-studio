## Official Cloudflare documentation to research

| Priority | Topic                              | Link                                                                                                                                                                   | What to learn                                                             |
| -------: | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
|        1 | Workers AI overview                | [https://developers.cloudflare.com/workers-ai/](https://developers.cloudflare.com/workers-ai/)                                                                         | Models, bindings, features, pricing, limits and related services          |
|        2 | Workers AI setup with Wrangler     | [https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/](https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/)               | Simplest CLI setup: C3, AI binding, local development and deployment      |
|        3 | Workers AI models                  | [https://developers.cloudflare.com/workers-ai/models/](https://developers.cloudflare.com/workers-ai/models/)                                                           | Current model IDs, capabilities, pricing, context limits and deprecations |
|        4 | Workers AI function calling        | [https://developers.cloudflare.com/workers-ai/features/function-calling/](https://developers.cloudflare.com/workers-ai/features/function-calling/)                     | Traditional and embedded tool calling                                     |
|        5 | OpenAI-compatible API              | [https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/](https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/) | Use standard OpenAI clients instead of custom adapters                    |
|        6 | Vercel AI SDK integration          | [https://developers.cloudflare.com/workers-ai/configuration/ai-sdk/](https://developers.cloudflare.com/workers-ai/configuration/ai-sdk/)                               | Streaming, React chat and provider integration                            |
|        7 | Workers AI limits                  | [https://developers.cloudflare.com/workers-ai/platform/limits/](https://developers.cloudflare.com/workers-ai/platform/limits/)                                         | Request, token and platform restrictions                                  |
|        8 | Workers AI pricing                 | [https://developers.cloudflare.com/workers-ai/platform/pricing/](https://developers.cloudflare.com/workers-ai/platform/pricing/)                                       | Model costs and usage calculations                                        |
|        9 | Workers AI errors                  | [https://developers.cloudflare.com/workers-ai/platform/errors/](https://developers.cloudflare.com/workers-ai/platform/errors/)                                         | Correct handling of model and runtime failures                            |
|       10 | Workers AI demos and architectures | [https://developers.cloudflare.com/workers-ai/guides/](https://developers.cloudflare.com/workers-ai/guides/)                                                           | Official example architectures                                            |

Cloudflare’s Workers AI documentation links directly to setup methods, model configuration, OpenAI compatibility, the Vercel AI SDK, function calling, pricing, limits and architecture guides. ([Cloudflare Docs][1])

## Next.js and application deployment

| Priority | Topic                         | Link                                                                                                                                                                                       | What to learn                                          |
| -------: | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
|        1 | Next.js on Cloudflare Workers | [https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)                                 | Official Next.js deployment path                       |
|        2 | OpenNext Cloudflare docs      | [https://opennext.js.org/cloudflare](https://opennext.js.org/cloudflare)                                                                                                                   | Build, preview and deploy existing Next.js apps        |
|        3 | OpenNext GitHub               | [https://github.com/opennextjs/opennextjs-cloudflare](https://github.com/opennextjs/opennextjs-cloudflare)                                                                                 | Adapter code, releases, examples and issues            |
|        4 | Framework guides              | [https://developers.cloudflare.com/workers/framework-guides/](https://developers.cloudflare.com/workers/framework-guides/)                                                                 | Next.js, React, Vite, Astro, Hono and other frameworks |
|        5 | Static assets                 | [https://developers.cloudflare.com/workers/static-assets/](https://developers.cloudflare.com/workers/static-assets/)                                                                       | Best option for simple HTML or frontend-only sites     |
|        6 | Workers Builds                | [https://developers.cloudflare.com/workers/ci-cd/builds/](https://developers.cloudflare.com/workers/ci-cd/builds/)                                                                         | GitHub-connected automatic deployment                  |
|        7 | CI/CD                         | [https://developers.cloudflare.com/workers/ci-cd/](https://developers.cloudflare.com/workers/ci-cd/)                                                                                       | GitHub Actions, previews and deployment workflows      |
|        8 | Versions and deployments      | [https://developers.cloudflare.com/workers/configuration/versions-and-deployments/](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/)                     | Safe releases and version management                   |
|        9 | Rollbacks                     | [https://developers.cloudflare.com/workers/configuration/versions-and-deployments/rollbacks/](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/rollbacks/) | Restore known-good Worker versions                     |
|       10 | Node.js compatibility         | [https://developers.cloudflare.com/workers/runtime-apis/nodejs/](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)                                                           | Determine whether current Next.js dependencies work    |

Cloudflare maintains a dedicated Next.js guide under its Workers framework documentation; this should be the primary reference for an existing Next.js application. ([Cloudflare Docs][2])

## CLI, configuration and local development

| Topic                  | Link                                                                                                                                                             | What to research                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Wrangler documentation | [https://developers.cloudflare.com/workers/wrangler/](https://developers.cloudflare.com/workers/wrangler/)                                                       | Main Cloudflare CLI                                    |
| C3 project generator   | [https://developers.cloudflare.com/pages/get-started/c3/](https://developers.cloudflare.com/pages/get-started/c3/)                                               | Creating projects using `npm create cloudflare@latest` |
| Wrangler configuration | [https://developers.cloudflare.com/workers/wrangler/configuration/](https://developers.cloudflare.com/workers/wrangler/configuration/)                           | `wrangler.jsonc`, bindings, environments and routes    |
| Local development      | [https://developers.cloudflare.com/workers/development-testing/](https://developers.cloudflare.com/workers/development-testing/)                                 | Local Worker testing                                   |
| Environment variables  | [https://developers.cloudflare.com/workers/configuration/environment-variables/](https://developers.cloudflare.com/workers/configuration/environment-variables/) | Variables and environment separation                   |
| Secrets                | [https://developers.cloudflare.com/workers/configuration/secrets/](https://developers.cloudflare.com/workers/configuration/secrets/)                             | Secure credentials                                     |
| Type generation        | [https://developers.cloudflare.com/workers/languages/typescript/](https://developers.cloudflare.com/workers/languages/typescript/)                               | Generate types for Worker bindings                     |
| Miniflare              | [https://developers.cloudflare.com/workers/testing/miniflare/](https://developers.cloudflare.com/workers/testing/miniflare/)                                     | Local runtime emulation                                |
| Vitest integration     | [https://developers.cloudflare.com/workers/testing/vitest-integration/](https://developers.cloudflare.com/workers/testing/vitest-integration/)                   | Tests running inside the Workers runtime               |
| Wrangler commands      | [https://developers.cloudflare.com/workers/wrangler/commands/](https://developers.cloudflare.com/workers/wrangler/commands/)                                     | Exact CLI command reference                            |

The official setup guide uses C3 to generate a Worker, installs Wrangler, adds the AI binding, runs locally with `npx wrangler dev`, and deploys with `npx wrangler deploy`. ([Cloudflare Docs][3])

## AI Gateway

| Topic                  | Link                                                                                                                                                                   | What to research                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| AI Gateway overview    | [https://developers.cloudflare.com/ai-gateway/](https://developers.cloudflare.com/ai-gateway/)                                                                         | Determine whether custom gateway code is necessary |
| Get started            | [https://developers.cloudflare.com/ai-gateway/get-started/](https://developers.cloudflare.com/ai-gateway/get-started/)                                                 | Create and connect a gateway                       |
| Workers AI integration | [https://developers.cloudflare.com/ai-gateway/integrations/aig-workers-ai-binding/](https://developers.cloudflare.com/ai-gateway/integrations/aig-workers-ai-binding/) | Connect a Worker binding through AI Gateway        |
| Universal endpoint     | [https://developers.cloudflare.com/ai-gateway/usage/universal/](https://developers.cloudflare.com/ai-gateway/usage/universal/)                                         | Multiple providers through one endpoint            |
| Dynamic routing        | [https://developers.cloudflare.com/ai-gateway/dynamic-routing/](https://developers.cloudflare.com/ai-gateway/dynamic-routing/)                                         | Native model/provider routing                      |
| Fallbacks              | [https://developers.cloudflare.com/ai-gateway/configuration/fallbacks/](https://developers.cloudflare.com/ai-gateway/configuration/fallbacks/)                         | Replace custom fallback logic                      |
| Retries                | [https://developers.cloudflare.com/ai-gateway/configuration/retries/](https://developers.cloudflare.com/ai-gateway/configuration/retries/)                             | Replace custom retry logic                         |
| Rate limiting          | [https://developers.cloudflare.com/ai-gateway/configuration/rate-limiting/](https://developers.cloudflare.com/ai-gateway/configuration/rate-limiting/)                 | Control requests centrally                         |
| Caching                | [https://developers.cloudflare.com/ai-gateway/configuration/caching/](https://developers.cloudflare.com/ai-gateway/configuration/caching/)                             | Reduce cost and latency                            |
| Logs and analytics     | [https://developers.cloudflare.com/ai-gateway/observability/](https://developers.cloudflare.com/ai-gateway/observability/)                                             | Monitoring, usage and failures                     |

AI Gateway is specifically positioned for observability and controls such as caching, rate limiting, retries and fallback, which may eliminate parts of a custom router. ([Cloudflare Docs][1])

## Cloudflare Agents and persistent AI applications

| Topic                 | Link                                                                                                                                                         | What to research                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| Agents overview       | [https://developers.cloudflare.com/agents/](https://developers.cloudflare.com/agents/)                                                                       | Determine whether Agents simplifies chat and tools |
| Getting started       | [https://developers.cloudflare.com/agents/getting-started/](https://developers.cloudflare.com/agents/getting-started/)                                       | Create a basic agent                               |
| Agent state           | [https://developers.cloudflare.com/agents/api-reference/store-and-sync-state/](https://developers.cloudflare.com/agents/api-reference/store-and-sync-state/) | Persistent conversation state                      |
| Using AI models       | [https://developers.cloudflare.com/agents/api-reference/using-ai-models/](https://developers.cloudflare.com/agents/api-reference/using-ai-models/)           | Model calls from agents                            |
| Tools                 | [https://developers.cloudflare.com/agents/api-reference/using-tools/](https://developers.cloudflare.com/agents/api-reference/using-tools/)                   | Tool definitions and execution                     |
| MCP                   | [https://developers.cloudflare.com/agents/model-context-protocol/](https://developers.cloudflare.com/agents/model-context-protocol/)                         | MCP client/server integration                      |
| WebSockets            | [https://developers.cloudflare.com/agents/api-reference/websockets/](https://developers.cloudflare.com/agents/api-reference/websockets/)                     | Real-time chat                                     |
| Scheduling            | [https://developers.cloudflare.com/agents/api-reference/schedule-tasks/](https://developers.cloudflare.com/agents/api-reference/schedule-tasks/)             | Scheduled agent work                               |
| Workflows             | [https://developers.cloudflare.com/agents/api-reference/run-workflows/](https://developers.cloudflare.com/agents/api-reference/run-workflows/)               | Durable multi-step operations                      |
| Agents SDK repository | [https://github.com/cloudflare/agents](https://github.com/cloudflare/agents)                                                                                 | Official implementation and examples               |
| Agents starter        | [https://github.com/cloudflare/agents-starter](https://github.com/cloudflare/agents-starter)                                                                 | Prebuilt agent application                         |

Cloudflare’s Agents documentation and repositories provide an official starter and reusable components for stateful AI agents. ([Cloudflare Docs][4])

## Official GitHub repositories

| Repository               | Link                                                                                                             | Research purpose                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Workers SDK              | [https://github.com/cloudflare/workers-sdk](https://github.com/cloudflare/workers-sdk)                           | Wrangler, C3, Miniflare and framework tooling  |
| Agents                   | [https://github.com/cloudflare/agents](https://github.com/cloudflare/agents)                                     | Agent SDK and examples                         |
| Agents starter           | [https://github.com/cloudflare/agents-starter](https://github.com/cloudflare/agents-starter)                     | Fastest prebuilt agent setup                   |
| OpenNext Cloudflare      | [https://github.com/opennextjs/opennextjs-cloudflare](https://github.com/opennextjs/opennextjs-cloudflare)       | Next.js adapter                                |
| Cloudflare templates     | [https://github.com/cloudflare/templates](https://github.com/cloudflare/templates)                               | Official Worker starters                       |
| Workers examples         | [https://github.com/cloudflare/workers-examples](https://github.com/cloudflare/workers-examples)                 | Worker patterns and samples                    |
| Cloudflare docs          | [https://github.com/cloudflare/cloudflare-docs](https://github.com/cloudflare/cloudflare-docs)                   | Documentation source and recent changes        |
| Workflows starter        | [https://github.com/cloudflare/workflows-starter](https://github.com/cloudflare/workflows-starter)               | Durable workflow examples                      |
| Durable Objects examples | [https://github.com/cloudflare/durable-objects-template](https://github.com/cloudflare/durable-objects-template) | Stateful Worker patterns                       |
| Hono                     | [https://github.com/honojs/hono](https://github.com/honojs/hono)                                                 | Lightweight Worker API framework               |
| Workers AI provider      | [https://github.com/cloudflare/ai](https://github.com/cloudflare/ai)                                             | AI SDK integrations and Cloudflare AI packages |

The Workers SDK repository is the official home of Wrangler and Cloudflare’s main development tooling. ([GitHub][5])

## Storage and state options

| Service         | Link                                                                                                     | Best use                                  |
| --------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Durable Objects | [https://developers.cloudflare.com/durable-objects/](https://developers.cloudflare.com/durable-objects/) | Strongly consistent chat or agent state   |
| D1              | [https://developers.cloudflare.com/d1/](https://developers.cloudflare.com/d1/)                           | Relational application data               |
| KV              | [https://developers.cloudflare.com/kv/](https://developers.cloudflare.com/kv/)                           | Configuration and low-latency cached data |
| R2              | [https://developers.cloudflare.com/r2/](https://developers.cloudflare.com/r2/)                           | Files and large unstructured assets       |
| Vectorize       | [https://developers.cloudflare.com/vectorize/](https://developers.cloudflare.com/vectorize/)             | Embeddings and semantic search            |
| Queues          | [https://developers.cloudflare.com/queues/](https://developers.cloudflare.com/queues/)                   | Background asynchronous jobs              |
| Workflows       | [https://developers.cloudflare.com/workflows/](https://developers.cloudflare.com/workflows/)             | Durable multi-step tasks                  |
| Hyperdrive      | [https://developers.cloudflare.com/hyperdrive/](https://developers.cloudflare.com/hyperdrive/)           | Connecting Workers to external PostgreSQL |

Cloudflare presents Durable Objects, D1, KV, R2 and Vectorize as separate tools for different state and data requirements; they should not all be added by default. ([Cloudflare Docs][1])

## Security, monitoring and operations

| Topic                 | Link                                                                                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workers observability | [https://developers.cloudflare.com/workers/observability/](https://developers.cloudflare.com/workers/observability/)                                       |
| Logs                  | [https://developers.cloudflare.com/workers/observability/logs/](https://developers.cloudflare.com/workers/observability/logs/)                             |
| Tail Workers          | [https://developers.cloudflare.com/workers/observability/logs/tail-workers/](https://developers.cloudflare.com/workers/observability/logs/tail-workers/)   |
| Analytics Engine      | [https://developers.cloudflare.com/analytics/analytics-engine/](https://developers.cloudflare.com/analytics/analytics-engine/)                             |
| Rate limiting         | [https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) |
| Cloudflare Access     | [https://developers.cloudflare.com/cloudflare-one/access-controls/](https://developers.cloudflare.com/cloudflare-one/access-controls/)                     |
| Turnstile             | [https://developers.cloudflare.com/turnstile/](https://developers.cloudflare.com/turnstile/)                                                               |
| Security model        | [https://developers.cloudflare.com/workers/reference/security-model/](https://developers.cloudflare.com/workers/reference/security-model/)                 |
| Platform limits       | [https://developers.cloudflare.com/workers/platform/limits/](https://developers.cloudflare.com/workers/platform/limits/)                                   |
| Cloudflare status     | [https://www.cloudflarestatus.com/](https://www.cloudflarestatus.com/)                                                                                     |

## Cloudflare articles and engineering posts

| Topic                           | Link                                                                                                                                                                             |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workers AI announcement         | [https://blog.cloudflare.com/workers-ai/](https://blog.cloudflare.com/workers-ai/)                                                                                               |
| AI Gateway announcement         | [https://blog.cloudflare.com/announcing-cloudflare-ai-gateway/](https://blog.cloudflare.com/announcing-cloudflare-ai-gateway/)                                                   |
| Cloudflare Agents               | [https://blog.cloudflare.com/build-ai-agents-on-cloudflare/](https://blog.cloudflare.com/build-ai-agents-on-cloudflare/)                                                         |
| Next.js on Workers              | [https://blog.cloudflare.com/nextjs-on-cloudflare-workers/](https://blog.cloudflare.com/nextjs-on-cloudflare-workers/)                                                           |
| OpenNext support                | [https://blog.cloudflare.com/deploying-nextjs-apps-to-cloudflare-workers-with-opennext/](https://blog.cloudflare.com/deploying-nextjs-apps-to-cloudflare-workers-with-opennext/) |
| Durable Objects architecture    | [https://blog.cloudflare.com/durable-objects-easy-fast-correct-choose-three/](https://blog.cloudflare.com/durable-objects-easy-fast-correct-choose-three/)                       |
| Workflows                       | [https://blog.cloudflare.com/cloudflare-workflows/](https://blog.cloudflare.com/cloudflare-workflows/)                                                                           |
| Vectorize                       | [https://blog.cloudflare.com/vectorize-vector-database-open-beta/](https://blog.cloudflare.com/vectorize-vector-database-open-beta/)                                             |
| Workers observability           | [https://blog.cloudflare.com/workers-observability/](https://blog.cloudflare.com/workers-observability/)                                                                         |
| Cloudflare Developer Week posts | [https://blog.cloudflare.com/tag/developer-week/](https://blog.cloudflare.com/tag/developer-week/)                                                                               |

## Best research order

1. Workers AI Wrangler setup
2. Existing Next.js deployment with OpenNext
3. AI Gateway native routing, retry and fallback
4. Agents starter and Agents SDK
5. Vercel AI SDK integration
6. Official Cloudflare templates
7. Storage selection
8. CI/CD and rollback
9. Security and observability
10. Compare findings against the current custom architecture

Cloudflare also publishes machine-readable documentation indexes useful for AI research:

```text
https://developers.cloudflare.com/llms.txt
https://developers.cloudflare.com/llms-full.txt
https://developers.cloudflare.com/workers-ai/llms.txt
https://developers.cloudflare.com/workers-ai/llms-full.txt
```

The Workers AI documentation explicitly recommends its `llms.txt` index for discovering all current pages. ([Cloudflare Docs][1])

[1]: https://developers.cloudflare.com/workers-ai/ "Overview · Cloudflare Workers AI docs"
[2]: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/ "Next.js · Cloudflare Workers docs"
[3]: https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/ "Get started - Workers and Wrangler · Cloudflare Workers AI docs"
[4]: https://developers.cloudflare.com/agents/ "Agents · Cloudflare Agents docs"
[5]: https://github.com/cloudflare/workers-sdk "GitHub - cloudflare/workers-sdk: ⛅️ Home to Wrangler, the CLI for Cloudflare Workers® · GitHub"
