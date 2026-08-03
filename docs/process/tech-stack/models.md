# Tech stack · Models & providers

**SSOT playbook:** [06 · Tech Stack Playbook](../06-tech-stack-playbook.md) §3.1 + §3.9

| | |
|--|--|
| **Purpose** | Inference + embeddings for Mastra agents |
| **Current (✅)** | Gemini default (`@ai-sdk/google`); Groq + gateway-compatible paths; `AI_ROUTING_AGENT_*` keys |
| **Class** | Gemini tool agents = **MVP** · CF Workers AI marketing trial = **MVP** · fleet-wide native = **Post-MVP** |
| **Rec** | **Keep** Gemini for planner/CRM/booking/vision · trial CF flash/Kimi/Gemma on marketing only |

## Flags SSOT

`app/src/lib/ai/agent-routing-keys.mjs`

## Refs

[Workers AI models](https://developers.cloudflare.com/workers-ai/models/) · [AI Gateway REST](https://developers.cloudflare.com/ai-gateway/usage/rest-api/)
