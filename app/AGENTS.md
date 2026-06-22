# app/ — Next.js sub-project (Mastra + CopilotKit)

This is a separate sub-project from the root Vite dashboard. It runs Next.js on port 3002 and hosts the CopilotKit runtime + Mastra agents.

## Stack

- Next.js App Router (port 3002)
- CopilotKit v1.61.0 (CopilotRuntime + Chat + AG-UI)
- Mastra (2 agents: production-planner, creative-director)
- Gemini 3 Flash Preview (via `@google/genai`)
- In-memory LibSQL (Mastra memory, not persisted)

## Key files

```
src/mastra/agents/index.ts          # 2 agents
src/mastra/index.ts                 # Mastra runtime config
src/mastra/tools/index.ts           # Agent tools
src/app/api/copilotkit/[[...slug]]/route.ts  # CopilotRuntime endpoint
src/app/layout.tsx                  # Root layout
src/app/page.tsx                    # Home page
.copilotkit/project.json           # CopilotKit project config
```

## Notes

- CopilotKit and AG-UI packages are installed but NOT wired to Mastra yet
- Mastra agents use in-memory storage (no Supabase connection)
- No .env tracked — copy `.env.example` for development
- `.mastra/` (build output), `node_modules/`, `.next/` are gitignored
