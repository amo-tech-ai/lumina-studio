# 06 · Tech Stack Playbook

**Goal:** Keep each vendor current with platform-first usage — one tool deep-dive at a time.

**Depends on:** [03](./03-ai-research-playbook.md)  
**Index of deep dives:** [`tech-stack/`](./tech-stack/)

| Tool | Doc | iPix use today |
|------|-----|----------------|
| Cloudflare | [cloudflare.md](./tech-stack/cloudflare.md) | AI Gateway Worker live; full app cutover not done |
| Supabase | [supabase.md](./tech-stack/supabase.md) | Auth, RLS, edge, brand intelligence |
| Mastra | [mastra.md](./tech-stack/mastra.md) | Operator agents registry |
| CopilotKit | [copilotkit.md](./tech-stack/copilotkit.md) | /app chat runtime v2 |
| pgvector / RAG | [pgvector-rag.md](./tech-stack/pgvector-rag.md) | Embeddings / similarity; check Mastra RAG |
| Models | [models.md](./tech-stack/models.md) | Gemini + gateway routing |
| Claude Code / Cursor | [claude-cursor.md](./tech-stack/claude-cursor.md) | Agent harness |
| Apify / Firecrawl / Xpoz / Postiz / OpenClaw | [ecosystem.md](./tech-stack/ecosystem.md) | Crawl, social, research candidates |

---

## Multistep prompt — one tool review

```xml
<role>You audit one vendor for iPix and recommend only essential upgrades.</role>

<context>
Tool: {TOOL}
Current iPix paths: {PATHS}
Ladder: Dashboard → CLI → docs → GitHub (last 30 days) → templates → SDK → reuse → custom.
</context>

<task>
1. Web search official docs + changelog (last 90 days).
2. Search blogs + GitHub examples/templates/recipes.
3. Check iPix usage (graphify + code).
4. List Core features we should use vs Advanced (park).
5. Gaps: config-only vs code vs defer.
6. Mermaid: current data/control flow + failure points + live readiness.
7. Score launch value vs complexity; reject over-engineering.
</task>

<output_format>
Latest features · Best practices · Examples · iPix gaps · MVP actions · Deferrals
</output_format>
```

---

## Parallelization

| Can parallel | Must serialize |
|--------------|----------------|
| Independent tool reviews (docs only) | Anything sharing one PR concern |
| Research Cloudflare models vs Supabase RLS docs | Schema + app code that depends on it |

---

## Done when

- [ ] Each `tech-stack/*.md` stub filled once via the prompt
- [ ] Follow-ups are Linear tasks, not more essays
