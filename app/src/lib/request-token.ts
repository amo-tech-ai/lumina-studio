import { AsyncLocalStorage } from "node:async_hooks";

// Propagates the operator's Supabase JWT through the async call-stack of a
// CopilotKit request so Mastra tools can auth edge function calls without
// the LLM ever seeing or supplying the token.
// Populated in app/api/copilotkit/[[...slug]]/route.ts; read in mastra/tools.
export const requestToken = new AsyncLocalStorage<string>();
