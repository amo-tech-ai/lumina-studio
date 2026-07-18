# PR #342 Architecture — Current vs Target State

## A. Current State Architecture (GAP ANALYSIS)

```mermaid
graph TD
    Client["📱 Client<br/>OpenAI-compat API"]
    Worker["⚙️ Worker Router<br/>(selectProvider)"]
    ValidReq["Validation<br/>validateToolRequest?<br/>❌ NOT TESTED"]
    RegOverride["Registry Override<br/>buildEffectiveRegistry?<br/>❌ NOT TESTED"]
    ProvSelect["Provider Selection<br/>selectProvider?<br/>❌ NOT TESTED"]
    GLM["🤖 GLM-4.7-Flash<br/>tool-calling"]
    Gemini["🤖 Gemini<br/>(fallback)<br/>NO tools"]
    GeminiMsg["toGeminiMessages<br/>❌ NO validation<br/>role:tool → user"]
    ToolExec["Tool Execution<br/>❌ No allowlist<br/>❌ No schema check<br/>❌ No timeout"]
    ToolResult["Tool Result<br/>❌ No sanitization<br/>❌ No injection check"]
    Streaming["Streaming<br/>SSE chunks<br/>❌ No failure test"]
    Error["Error Path<br/>❌ Not tested"]
    
    Tests["Tests<br/>❌ resolveModelEntry only<br/>❌ Manual logic dup<br/>❌ No selectProvider call<br/>❌ No validateToolRequest call<br/>❌ No validateGeminiRequest call<br/>❌ No toGeminiMessages test"]
    
    Client -->|Declares tools| Worker
    Worker -->|validate?| ValidReq
    Worker -->|override?| RegOverride
    Worker -->|select| ProvSelect
    ProvSelect -->|has tools| GLM
    ProvSelect -->|fallback| Gemini
    Gemini -->|convert| GeminiMsg
    GLM -->|tool_calls| ToolExec
    ToolExec -->|result| ToolResult
    ToolResult -->|send back| Worker
    Worker -->|stream| Streaming
    Worker -->|error| Error
    
    Tests -.->|MISSING| ValidReq
    Tests -.->|MISSING| RegOverride
    Tests -.->|MISSING| ProvSelect
    Tests -.->|MISSING| GeminiMsg
    Tests -.->|MISSING| ToolExec
    
    style Worker fill:#ff9999
    style ValidReq fill:#ff6666
    style RegOverride fill:#ff6666
    style ProvSelect fill:#ff6666
    style GeminiMsg fill:#ff3333
    style ToolExec fill:#ff6666
    style ToolResult fill:#ff9999
    style Streaming fill:#ff9999
    style Tests fill:#ffcccc
```

**Red flags:**
- ✗ `selectProvider()` never called in tests — only `resolveModelEntry()`
- ✗ `validateToolRequest()` not imported or called in tests
- ✗ `validateGeminiRequest()` guards entry but **not** `toGeminiMessages()`
- ✗ `toGeminiMessages()` silently converts role: "tool" → role: "user" (line 22–30)
- ✗ Tool execution: no authorization, schema validation, timeout, or loop limits
- ✗ Streaming: chunks can fail silently
- ✗ No live GLM E2E test
- ✗ Scoring 92/100 despite critical untested production paths

---

## B. Target State Architecture (PRODUCTION READY)

```mermaid
graph TD
    Client["📱 Client<br/>OpenAI-compat API"]
    Auth["🔐 Authentication<br/>(IPI-468)"]
    ValidReq["✅ Validation<br/>validateToolRequest()<br/>hasToolsInHistory()"]
    ValidCorr["✅ Tool Correlation<br/>tool_call_id ↔ tools<br/>(IPI-535)"]
    RegSchema["✅ Registry Schema<br/>Zod validation<br/>(IPI-533)"]
    RegOverride["✅ Registry Override<br/>buildEffectiveRegistry<br/>safe merge"]
    ProvSelect["✅ Provider Selection<br/>selectProvider()<br/>TESTED"]
    GLM["🤖 GLM-4.7-Flash<br/>tool-calling"]
    Gemini["🤖 Gemini<br/>(no tools<br/>explicit guard)"]
    GeminiGuard["✅ Explicit Guard<br/>if role:tool →<br/>throw error<br/>(IPI-528)"]
    Allowlist["✅ Tool Allowlist<br/>Default-deny<br/>Tenant-scoped<br/>(IPI-537)"]
    ArgSchema["✅ Argument Validation<br/>JSON schema check<br/>(IPI-538)"]
    ToolExec["✅ Tool Execution<br/>Timeout: 5s<br/>Loop: 10 turns max<br/>(IPI-539)"]
    ToolResult["✅ Tool Result<br/>Sanitized logging<br/>Injection tests<br/>(IPI-532)"]
    Streaming["✅ Streaming<br/>SSE chunks<br/>Failure tests<br/>(IPI-536)"]
    Retry["✅ Retry Policy<br/>Exponential backoff<br/>Circuit breaker<br/>(IPI-540)"]
    Observ["✅ Observability<br/>Telemetry<br/>Cost tracking<br/>(IPI-534)"]
    Tests["✅ Tests<br/>✅ selectProvider()<br/>✅ validateToolRequest()<br/>✅ validateGeminiRequest()<br/>✅ toGeminiMessages()<br/>✅ Live E2E GLM<br/>✅ Streaming failure"]
    Staging["✅ Staging Verify<br/>Live E2E<br/>Rollback test<br/>(IPI-541, IPI-542)"]
    CIGate["✅ CI Gate<br/>Deprecated models<br/>Registry schema<br/>(IPI-543)"]
    
    Client -->|Bearer token| Auth
    Auth -->|validate| ValidReq
    ValidReq -->|correlate| ValidCorr
    ValidReq -->|override| RegOverride
    RegOverride -->|schema| RegSchema
    RegOverride -->|select| ProvSelect
    ProvSelect -->|tools| GLM
    ProvSelect -->|no tools| Gemini
    Gemini -->|guard| GeminiGuard
    GLM -->|allowlist| Allowlist
    Allowlist -->|schema| ArgSchema
    ArgSchema -->|exec| ToolExec
    ToolExec -->|timeout| ToolExec
    ToolExec -->|retry| Retry
    ToolExec -->|result| ToolResult
    ToolResult -->|inject test| ToolResult
    ToolResult -->|send back| ProvSelect
    ProvSelect -->|stream| Streaming
    Streaming -->|failure| Streaming
    ProvSelect -->|retry| Retry
    Retry -->|circuit| Retry
    ToolExec -->|telemetry| Observ
    ProvSelect -->|telemetry| Observ
    Observ -->|audit log| Observ
    
    Tests -->|unit| ValidReq
    Tests -->|unit| ValidCorr
    Tests -->|unit| Allowlist
    Tests -->|unit| ArgSchema
    Tests -->|unit| ToolExec
    Tests -->|stream| Streaming
    Tests -->|E2E| GLM
    Staging -->|live| GLM
    Staging -->|rollback| Staging
    CIGate -->|merge gate| Tests
    
    style Client fill:#99ff99
    style Auth fill:#99ff99
    style ValidReq fill:#99ff99
    style ValidCorr fill:#99ff99
    style RegSchema fill:#99ff99
    style RegOverride fill:#99ff99
    style ProvSelect fill:#99ff99
    style GLM fill:#99ff99
    style Gemini fill:#99ff99
    style GeminiGuard fill:#66ff66
    style Allowlist fill:#66ff66
    style ArgSchema fill:#66ff66
    style ToolExec fill:#66ff66
    style ToolResult fill:#99ff99
    style Streaming fill:#99ff99
    style Retry fill:#99ff99
    style Observ fill:#99ff99
    style Tests fill:#99ff99
    style Staging fill:#99ff99
    style CIGate fill:#99ff99
```

**Green lights:**
- ✓ Every production function directly tested
- ✓ Explicit Gemini rejection guard
- ✓ Tool allowlist with default-deny
- ✓ Argument schema validation before execution
- ✓ Execution timeout + loop bounds
- ✓ Streaming failure tests
- ✓ Live E2E GLM test
- ✓ Staging deployment + rollback verified
- ✓ CI gates for deprecated models and schema
- ✓ Observability: cost, error tracking, audit logs

---

## C. Multi-Turn Sequence (Correct Flow)

```mermaid
sequenceDiagram
    participant Client
    participant Worker as Router
    participant Schema as Validation
    participant GLM as GLM-4.7-Flash
    participant Tool as Tool Executor
    participant Cache as Observability

    Client->>Worker: POST /chat/completions<br/>messages=[user]<br/>tools=[...]
    Worker->>Schema: validateToolRequest(req)
    Schema->>Schema: ✓ Has tools<br/>✓ No tool_choice conflicts<br/>✓ parallel_tool_calls valid
    Schema-->>Worker: OK
    Worker->>Schema: buildEffectiveRegistry(override)
    Schema->>Schema: ✓ Schema validation<br/>✓ Safe merge
    Schema-->>Worker: registry
    Worker->>Schema: selectProvider(req, registry)
    Schema->>Schema: ✓ has tools → "tool-calling" tier<br/>✓ GLM-4.7-Flash found
    Schema-->>Worker: provider=GLM
    Worker->>GLM: POST /v1/chat/completions<br/>messages=[user]<br/>tools=[...]
    GLM-->>Worker: tool_calls=[{id,name,args}]
    Worker->>Schema: validateToolCallCorrelation(msgs)
    Schema->>Schema: ✓ All IDs known<br/>✓ Loop depth < 10
    Schema-->>Worker: OK
    Worker->>Tool: authorizeAndValidate(tool, args)
    Tool->>Tool: ✓ tenant allowed<br/>✓ schema valid<br/>✓ no injection
    Tool-->>Worker: OK
    Worker->>Tool: executeWithTimeout(tool, args, 5s)
    Tool->>Tool: ⏱ Timeout: 5s
    Tool-->>Worker: {status,result}
    Worker->>Cache: log(request_id, tool, args, result)
    Worker->>GLM: POST /chat/completions<br/>messages=[user,...,<br/>assistant[tool_calls],<br/>tool[result]]
    GLM-->>Worker: message<br/>content="answer"<br/>finish_reason="stop"
    Worker->>Cache: log(request_id, final_answer)
    Worker-->>Client: {choices:[<br/>{message:{role:assistant,<br/>content:answer}}]}<br/>200 OK
```

---

## D. Failure Decision Tree

```mermaid
graph TD
    Req["Request Arrives"]
    HasTools{Has tools?}
    ValidReq{validateToolRequest<br/>passes?}
    RegOK{Registry schema<br/>valid?}
    ProvOK{selectProvider<br/>succeeds?}
    
    HasTools -->|No| NoTools["Route to default tier<br/>(text or structured)"]
    HasTools -->|Yes| ValidReq
    
    ValidReq -->|No| E400["400 invalid_request<br/>Log: validation error"]
    ValidReq -->|Yes| RegOK
    
    RegOK -->|Invalid| E503["503 configuration_error<br/>Log: schema error<br/>Fallback: DEFAULT_REGISTRY"]
    RegOK -->|Valid| ProvOK
    
    ProvOK -->|tool-calling tier missing| E400A["400 provider_unavailable<br/>Fail-closed<br/>No fallback to Gemini"]
    ProvOK -->|Unknown provider| E400B["400 configuration_error<br/>Fail-closed"]
    ProvOK -->|OK| GeminiCheck{Routed to<br/>Gemini?}
    
    GeminiCheck -->|Yes| HasToolMsg{Request has<br/>role:tool?}
    HasToolMsg -->|Yes| E400C["🔴 CRITICAL<br/>400 invalid_request<br/>Tool messages cannot<br/>be sent to Gemini<br/>This is a router bug"]
    HasToolMsg -->|No| GeminiOK["Gemini: no tools OK"]
    GeminiCheck -->|No| GLMOK["GLM: tools OK"]
    
    GeminiOK --> RespOK["Model response OK"]
    GLMOK --> ToolsReturned{tool_calls<br/>returned?}
    ToolsReturned -->|No| RespOK
    ToolsReturned -->|Yes| ValidCorr{Correlation<br/>valid?}
    
    ValidCorr -->|No| E400D["400 invalid_tool_call_id<br/>Orphaned ID or unknown tool"]
    ValidCorr -->|Yes| Authorized{Tool<br/>authorized?}
    
    Authorized -->|No| E403["403 unauthorized_tool<br/>Tool not in allowlist"]
    Authorized -->|Yes| SchemaOK{Argument<br/>schema valid?}
    
    SchemaOK -->|No| E400E["400 invalid_tool_arguments<br/>Type mismatch or missing"]
    SchemaOK -->|Yes| Timeout{Execution<br/>completes < 5s?}
    
    Timeout -->|No| E504["504 tool_timeout<br/>AbortController cancelled"]
    Timeout -->|Yes| LoopOK{Loop depth<br/>< 10?}
    
    LoopOK -->|No| E400F["400 tool_loop_exceeded<br/>Infinite loop detected"]
    LoopOK -->|Yes| ExecOK["Tool executed OK"]
    
    ExecOK --> Retry{Provider<br/>429/5xx?}
    Retry -->|Yes, <3 retries| Backoff["Exponential backoff<br/>100ms, 200ms, 400ms"]
    Backoff --> ProvOK
    Retry -->|No or circuit open| CircuitOpen{Circuit<br/>open?}
    CircuitOpen -->|Yes| E503A["503 circuit_open<br/>Too many failures"]
    CircuitOpen -->|No| RespOK
    
    E400 --> Log1["📊 Log: request_id,<br/>error_code, details"]
    E400A --> Log1
    E400B --> Log1
    E400C --> Log1
    E400D --> Log1
    E400E --> Log1
    E400F --> Log1
    E403 --> Log2["📊 Log: request_id,<br/>tenant, tool, denied"]
    E503 --> Log3["📊 Log: request_id,<br/>config error, details"]
    E503A --> Log4["📊 Log: request_id,<br/>circuit_open"]
    E504 --> Log5["📊 Log: request_id,<br/>tool, elapsed_ms"]
    RespOK --> Audit["📊 Audit log: all<br/>requests, outcomes,<br/>cost, timing"]
    
    Log1 --> Client["Return 400/403/504"]
    Log2 --> Client
    Log3 --> Client
    Log4 --> Client
    Log5 --> Client
    Audit --> Client
    
    style E400C fill:#ff3333
    style E403 fill:#ff6666
    style E504 fill:#ff9999
    style E400A fill:#ff6666
    style E400B fill:#ff6666
    style E400D fill:#ff9999
    style E400E fill:#ff9999
    style E400F fill:#ff9999
    style E503 fill:#ff9999
    style E503A fill:#ff9999
```

---

## E. CI and Deployment Flow

```mermaid
graph LR
    PR["💬 PR #342<br/>Workers AI Tools"]
    
    Lint["🔍 Lint<br/>ESLint"]
    Type["🔍 Typecheck<br/>tsc --noEmit"]
    Unit["🧪 Unit Tests<br/>Vitest"]
    Build["🏗️ Build<br/>next build +<br/>opennextjs-build"]
    
    Lint -->|PASS| Type
    Type -->|PASS| Unit
    Unit -->|PASS| Build
    Build -->|PASS| BundleAudit["📦 Bundle Audit<br/>No secrets<br/>Size < 1MB<br/>No eval"]
    
    BundleAudit -->|PASS| IntegTest["🧪 Integration<br/>selectProvider()<br/>real route functions"]
    IntegTest -->|PASS| Security["🔐 Security Tests<br/>Injection<br/>Authorization<br/>Streaming"]
    Security -->|PASS| Deprecated["⚠️ CI Gate<br/>No deprecated models<br/>Registry schema valid"]
    
    Deprecated -->|PASS| Ready["✅ Ready for<br/>Staging"]
    
    Ready -->|Manual Approval| Staging["📤 Deploy Staging<br/>npm run deploy:staging"]
    Staging -->|SUCCESS| SmokeStaging["🧪 Smoke Test<br/>Basic tool-calling"]
    SmokeStaging -->|PASS| E2ELive["🧪 Live E2E<br/>Real GLM<br/>Multi-turn"]
    E2ELive -->|PASS| Rollback["🔄 Rollback Test<br/>Revert to prior<br/>Verify still works"]
    Rollback -->|PASS| ProdReady["✅ Ready for<br/>Production"]
    
    ProdReady -->|Manual Approval| Prod["📤 Deploy Production<br/>Gradual rollout<br/>0% → 10% → 50% →<br/>100%"]
    Prod -->|SUCCESS| Monitor["📊 Production<br/>Monitoring<br/>Error rate<br/>Cost tracking<br/>Tool usage"]
    Monitor -->|Green| Done["✅ Production<br/>Verified"]
    
    Lint -->|FAIL| Reject["❌ CI Failed"]
    Type -->|FAIL| Reject
    Unit -->|FAIL| Reject
    Build -->|FAIL| Reject
    BundleAudit -->|FAIL| Reject
    IntegTest -->|FAIL| Reject
    Security -->|FAIL| Reject
    Deprecated -->|FAIL| Reject
    SmokeStaging -->|FAIL| Reject
    E2ELive -->|FAIL| Reject
    Rollback -->|FAIL| Reject
    
    Reject -->|Fix + Retry| PR
    
    style PR fill:#ffff99
    style Ready fill:#99ff99
    style ProdReady fill:#99ff99
    style Done fill:#99ff99
    style Reject fill:#ff9999
```

---

## Diagram-to-Task Mapping

| Diagram Node | Linear Task | Why |
|--------------|-------------|-----|
| `validateToolRequest()` | IPI-527 | Integration test of router function |
| `validateGeminiRequest()` + `toGeminiMessages()` guard | IPI-528 | Explicit rejection of tool messages in Gemini path |
| `buildEffectiveRegistry()` + schema validation | IPI-533 | Runtime validation of registry entries |
| `selectProvider()` tests | IPI-527, IPI-530 | Core routing logic; all tiers and errors tested |
| Tool correlation (tool_call_id ↔ tools) | IPI-535 | Validation of multi-turn message coherence |
| Streaming chunk failures | IPI-536 | Robustness of SSE reconstruction |
| Tool allowlist + authorization | IPI-537 | Security: default-deny, tenant-scoped |
| Argument schema validation | IPI-538 | Security: reject invalid/malicious args |
| Execution timeout + loop limits | IPI-539 | Reliability: prevent hangs and infinite loops |
| Retry + circuit breaker | IPI-540 | Reliability: transient error handling |
| Live GLM E2E | IPI-541 | Verification: real model behavior |
| Staging deployment + rollback | IPI-542 | Operational: deployment safety |
| CI deprecated models + schema gate | IPI-543 | Configuration safety: merge-time checks |
| Error paths (all 400/403/504 codes) | IPI-531 | Comprehensive error scenario coverage |
| Observability + cost telemetry | IPI-534 | Production visibility |
| Audit log sanitization + injection tests | IPI-532 | Security: tool results as untrusted data |
| Correct evidence + scores | IPI-529 | Documentation: accurate audit report |

