# 02 — AI Provider Flow

**Type:** flowchart + sequence + journey  
**Verified:** 2026-07-09 — [full report](../cloudflare/audits/ipi-454-457-462-463-verification.md)

## Target architecture (post IPI-454 F + 457 + 463)

```mermaid
flowchart LR
  Agent["Mastra Agent"]
  Resolve["resolveModel()\nor @ai-sdk/openai-compatible"]
  Gateway["AI Gateway Worker\n/v1/chat/completions"]
  Router{"Tier router\nmodel-registry"}
  WorkersAI["Workers AI\nprimary MVP"]
  Gemini["Gemini\nfallback IPI-463"]
  KV[("KV registry\nIPI-454 AC-G")]
  Eval["Eval suite\nIPI-462 gate"]

  Agent --> Resolve
  Resolve --> Gateway
  Gateway --> KV
  Gateway --> Router
  Router --> WorkersAI
  Router -->|429/5xx| Gemini
  Eval -.->|gates cutover| Router
```

## Today on main (forensic)

```mermaid
flowchart LR
  Agent["Mastra Agent"] --> Resolve["resolveModel()"]
  Resolve -->|AI_PROVIDER=gemini| Gemini["@ai-sdk/google"]
  Resolve -->|AI_PROVIDER=groq| Groq["@ai-sdk/groq"]
  Gateway["AI Gateway Worker"] -.->|not wired| Resolve
```

## Sequence — happy path after wire

```mermaid
sequenceDiagram
  participant U as User
  participant MC as /api/marketing-chat
  participant M as Mastra
  participant GW as AI Gateway
  participant W as Workers AI

  U->>MC: chat message
  MC->>M: agent.stream()
  M->>GW: OpenAI-compat completion tier=fast
  GW->>W: accounts/ACCOUNT_ID/ai/v1/chat/completions
  W-->>GW: SSE chunks
  GW-->>M: OpenAI-shaped stream
  M-->>U: CopilotKit AG-UI
```
