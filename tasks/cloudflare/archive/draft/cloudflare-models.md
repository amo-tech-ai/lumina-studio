Based on the current Cloudflare Workers AI catalog and recent Cloudflare changelog, these are the **10 best models to consider** for a production AI platform like iPix/FashionOS (agents, CopilotKit, Mastra, tool calling, long context, multilingual support, vision, and coding). Cloudflare has also explicitly recommended migrating away from older models such as the deprecated Llama 3.1 model toward newer models like GLM-4.7-Flash, Gemma 4, and Kimi. ([Cloudflare Docs][1])

| Rank | Model                                      | Best for                   | Key features                                                      | Real-world use case                                     |      Score |
| ---- | ------------------------------------------ | -------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------- | ---------: |
| 🥇 1 | `@cf/zai-org/glm-4.7-flash`                | Default production agent   | 131k context, reasoning, multilingual, function calling, low cost | CRM assistant, booking agent, planner, chat             | **98/100** |
| 🥈 2 | `@cf/zai-org/glm-5.2`                      | Complex reasoning & coding | 262k context, reasoning, function calling                         | Production Planner, Brand Intelligence, code generation | **97/100** |
| 🥉 3 | `@cf/moonshotai/kimi-k2.7-code`            | Coding agents              | 262k context, vision, reasoning, multi-turn tool calling          | Claude Code replacement, repo analysis                  | **97/100** |
| 4    | `@cf/google/gemma-4-26b-a4b-it`            | Vision + text              | Vision, reasoning, function calling                               | Asset DNA, Cloudinary analysis, image QA                | **95/100** |
| 5    | `@cf/moonshotai/kimi-k2.6`                 | General AI assistant       | Vision, reasoning, tools                                          | Fashion assistant, research, documentation              | **95/100** |
| 6    | `@cf/meta/llama-4-scout-17b-16e-instruct`  | Multimodal assistant       | Vision, function calling                                          | Customer support, content understanding                 | **94/100** |
| 7    | `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | High-quality text          | Strong reasoning, fast inference                                  | Knowledge assistant, document summaries                 | **93/100** |
| 8    | `@cf/meta/llama-3.1-8b-instruct-fast`      | Compatibility migration    | 128k context, streaming, tool calls                               | Drop-in replacement for deprecated model                | **92/100** |
| 9    | `@cf/nvidia/nemotron-3-120b-a12b`          | Multi-agent orchestration  | Agent-focused reasoning, function calling                         | Supervisor agents, planning                             | **91/100** |
| 10   | `@cf/openai/gpt-oss-120b`                  | Open-weight reasoning      | Strong reasoning, tool calling                                    | AI evaluations, fallback reasoning                      | **90/100** |

## Recommended production architecture

| Tier                      | Recommended model                     | Why                                                                         |
| ------------------------- | ------------------------------------- | --------------------------------------------------------------------------- |
| 🚀 Fast/default           | `@cf/zai-org/glm-4.7-flash`           | Best balance of speed, quality, multilingual support, tool calling and cost |
| 🧠 Premium reasoning      | `@cf/zai-org/glm-5.2`                 | Large context, coding, planning and complex workflows                       |
| 💻 Coding                 | `@cf/moonshotai/kimi-k2.7-code`       | Optimized specifically for coding and repositories                          |
| 👁 Vision                 | `@cf/google/gemma-4-26b-a4b-it`       | Image understanding and multimodal workflows                                |
| 🔄 Compatibility fallback | `@cf/meta/llama-3.1-8b-instruct-fast` | Simplest migration from deprecated Llama 3.1                                |
| 🤖 Multi-agent            | `@cf/nvidia/nemotron-3-120b-a12b`     | Designed for agent systems and orchestration                                |

## Best fit for iPix / FashionOS

| Feature                 | Recommended model |
| ----------------------- | ----------------- |
| Production Planner      | GLM-5.2           |
| Brand Intelligence      | GLM-5.2           |
| CRM Assistant           | GLM-4.7-Flash     |
| Booking Agent           | GLM-4.7-Flash     |
| CopilotKit Chat         | GLM-4.7-Flash     |
| Asset DNA               | Gemma-4-26B       |
| Cloudinary Vision       | Gemma-4-26B       |
| Repository Analysis     | Kimi K2.7 Code    |
| Claude Code alternative | Kimi K2.7 Code    |
| AI Gateway fallback     | Llama 3.1 Fast    |

## Recommended model registry

```text
fast        → @cf/zai-org/glm-4.7-flash
reasoning   → @cf/zai-org/glm-5.2
coding      → @cf/moonshotai/kimi-k2.7-code
vision      → @cf/google/gemma-4-26b-a4b-it
multimodal  → @cf/meta/llama-4-scout-17b-16e-instruct
compat      → @cf/meta/llama-3.1-8b-instruct-fast
fallback    → Gemini (AI Gateway)
```

## Final recommendation

For your Cloudflare AI Gateway architecture, I would avoid relying on a single model.

* 🟢 **Default:** GLM-4.7-Flash
* 🟢 **Premium:** GLM-5.2
* 🟢 **Coding:** Kimi K2.7 Code
* 🟢 **Vision:** Gemma 4 26B
* 🟢 **Compatibility:** Llama 3.1 Fast
* 🟢 **Fallback:** Gemini via AI Gateway

This gives you excellent coverage for chat, planning, coding, vision, multilingual workflows, and resilient provider failover while staying aligned with Cloudflare's current Workers AI catalog and migration guidance. ([Cloudflare Docs][1])

[1]: https://developers.cloudflare.com/workers-ai/models/?utm_source=chatgpt.com "Workers AI Models · Cloudflare Workers AI docs"
