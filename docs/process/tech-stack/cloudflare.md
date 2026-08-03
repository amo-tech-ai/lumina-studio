# Tech stack · Cloudflare

**SSOT playbook:** [06 · Tech Stack Playbook](../06-tech-stack-playbook.md) §3.1 · Live tracker: `tasks/cloudflare/todo.md`

| | |
|--|--|
| **Purpose** | AI Gateway (live), future OpenNext hosting, Hyperdrive for Mastra Postgres |
| **Current (✅)** | App on Vercel; `services/cloudflare-worker/` production AI path (frozen); gateway `ipix-prod`; Hyperdrive configured, not organic |
| **Class** | Gateway + cutover gates = **MVP** · Full Workers AI fleet = **Post-MVP** |
| **Rec** | **Keep** gateway · **Improve** IPI-708/709/707/763 + Hyperdrive · Worker delete **last** (IPI-592) |

## Models per agent (🟡 trial)

Prefer Gemini for tool agents; trial Workers AI (Gemma/Kimi/flash) only on `public-marketing` behind `AI_ROUTING_AGENT_*` after `cfEnv` (IPI-750).

## MVP actions

1. Cutover safety gates  
2. Hyperdrive organic  
3. One native marketing flip + smoke  

## Refs

[Workers](https://developers.cloudflare.com/workers/) · [AI Gateway](https://developers.cloudflare.com/ai-gateway/) · [Workers AI](https://developers.cloudflare.com/workers-ai/models/) · [Hyperdrive](https://developers.cloudflare.com/hyperdrive/)
