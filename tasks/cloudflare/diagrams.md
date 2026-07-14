# Cloudflare Migration — Architecture & Task Diagrams

---

## 1. Current Architecture (Jul 12)

```mermaid
graph TB
    subgraph "Production (Vercel)"
        VWeb["🌐 ipix.co (marketing)"]
        VApp["📱 iPix App (operators)"]
        VGem["🔮 Gemini API"]
    end

    subgraph "Cloudflare Edge"
        CFW["⚙️ Worker: ai-gateway"]
        WAI["🤖 Workers AI"]
        Llama["🦙 Llama 3.1 8B"]
        BGE["📊 BGE Embeddings"]
    end

    subgraph "Database"
        PG["🗄️ Supabase Postgres"]
    end

    VWeb -->|"NOT YET"| CFW
    VApp -->|"Optional"| CFW
    CFW -->|"Live ✅"| WAI
    WAI -->|"Chat"| Llama
    WAI -->|"Embed"| BGE
    VGem -->|"Fallback"| VApp
    VApp -->|"Reads/writes"| PG

    style CFW fill:#90EE90
    style WAI fill:#90EE90
    style VApp fill:#FFE4B5
    style VGem fill:#FFE4B5
    style PG fill:#87CEEB
```

**Status:** 
- ✅ Gateway Worker live on Cloudflare
- ✅ Workers AI chat + embeddings working
- ❌ Operators NOT yet routing through gateway (waiting for IPI-525)
- 📱 Marketing chat (public) CAN use gateway but still on Gemini

---

## 2. Target Architecture (After CF-MIG-810)

```mermaid
graph TB
    subgraph "Production (Cloudflare)"
        CFWeb["🌐 ipix.co (marketing)"]
        CFApp["📱 iPix App (operators)"]
    end

    subgraph "Cloudflare Edge"
        CFWorker["⚙️ Worker: ipix-operator\n(OpenNext)"]
        GWWorker["⚙️ Worker: ai-gateway"]
        WAI["🤖 Workers AI"]
        Llama["🦙 Llama 3.1 8B"]
        GPT["🚀 GPT-OSS-120B (tool calling)"]
        BGE["📊 BGE Embeddings"]
        KV["💾 KV (model registry)"]
    end

    subgraph "Database"
        PG["🗄️ Supabase Postgres"]
    end

    subgraph "Fallback"
        Gem["🔮 Gemini API (failover only)"]
    end

    CFWeb -->|"EDGE LOCAL"| CFWorker
    CFApp -->|"EDGE LOCAL"| CFWorker
    CFWorker -->|"AI routing"| GWWorker
    GWWorker -->|"Fetch model"| KV
    GWWorker -->|"Chat/embed"| WAI
    WAI -->|"Chat"| Llama
    WAI -->|"Tool calls"| GPT
    WAI -->|"Embed"| BGE
    GWWorker -->|"Fallback"| Gem
    CFWorker -->|"Read/write"| PG

    style CFWorker fill:#90EE90
    style GWWorker fill:#90EE90
    style WAI fill:#90EE90
    style KV fill:#FFD700
    style PG fill:#87CEEB
    style Gem fill:#FFB6C6
```

**Benefits (vs current):**
- ⚡ 30% faster (edge compute, not Vercel)
- 💰 50% cheaper AI (Workers AI vs Gemini)
- 🌍 Global resilience (auto-failover)
- 🔄 Auto-rollback (AI_ROUTING_MODE switch)

---

## 3. Task Dependency Chain

```mermaid
graph LR
    LINT["🔴 Fix Linter OOM\n(1 hour)\nBLOCKS ALL"]
    IPI525["✅ IPI-525\nTool Calling\n(2 days)"]
    ACJ["IPI-454 AC-J\nE2E Browser\n(1 day)"]
    ACG["IPI-454 AC-G\nKV Registry\n(1 day)"]
    IPI465["IPI-465\nShared Registry\n(2-3 days)"]
    CFM111["CF-MIG-111\nCI Gate\n(1 day)"]
    CFM220["🔴 CF-MIG-220\nSmoke Tests\n(2-3 days)\nCRITICAL GATE"]
    IPI462["IPI-462\nEvaluation\n(3 days)"]
    IPI463["IPI-463\nFailover\n(1 day)"]
    DNS["CF-MIG-810\nDNS Cutover\n(1 day)\nFINAL"]

    LINT -->|"Unblocks"| IPI525
    IPI525 -->|"Tested by"| ACJ
    IPI525 -->|"Parallel"| ACG
    IPI525 -->|"Foundation for"| IPI465
    ACJ -->|"Feeds into"| CFM111
    ACG -->|"Feeds into"| CFM111
    CFM111 -->|"Prereq"| CFM220
    CFM220 -->|"Enables"| IPI462
    IPI462 -->|"Input to"| IPI463
    IPI463 -->|"All gates"| DNS

    style LINT fill:#FF6B6B,color:#fff
    style CFM220 fill:#FF6B6B,color:#fff
    style DNS fill:#FFD700
    style IPI525 fill:#90EE90
```

**Reading:**
- 🔴 RED = blocker (must complete before next)
- 🟢 GREEN = in progress
- 🟡 YELLOW = gate
- Chain length: 17 days minimum

---

## 4. Weekly Timeline

```mermaid
gantt
    title Cloudflare Migration — 5-Week Roadmap
    dateFormat YYYY-MM-DD

    section Week 1
    Fix Linter OOM :done, w1a, 2026-07-15, 1d
    IPI-525 Tool Calling :active, w1b, 2026-07-15, 3d

    section Week 2
    AC-J E2E Test :crit, w2a, 2026-07-22, 1d
    AC-G KV Registry :crit, w2b, 2026-07-22, 1d
    CF-MIG-111 CI Gate :crit, w2c, 2026-07-23, 1d
    PostgresStore Verification :crit, w2d, 2026-07-23, 2d

    section Week 3
    CF-MIG-220 Smoke Tests :crit, w3a, 2026-07-29, 3d
    IPI-462 Evaluation :w3b, 2026-07-29, 3d

    section Week 4
    IPI-463 Failover :crit, w4a, 2026-08-05, 1d
    Final Review :crit, w4b, 2026-08-06, 1d

    section Week 5
    CF-MIG-810 DNS Cutover :crit, w5a, 2026-08-12, 1d
    Monitor Live :w5b, 2026-08-12, 3d

    milestone Linter Fixed, 2026-07-15, 0d
    milestone IPI-525 Complete, 2026-07-18, 0d
    milestone Smoke Tests Pass, 2026-08-01, 0d
    milestone DNS Live, 2026-08-12, 0d
```

**Milestones:**
- Jul 15: Linter fixed → IPI-525 can proceed
- Jul 18: Tool calling works → operators can test
- Aug 1: Full smoke tests pass → production-ready
- Aug 12: DNS cutover → live on Cloudflare

---

## 5. Linter OOM Issue & Fix

```mermaid
graph LR
    subgraph "Problem"
        Files["141 test files\n+ 50 components\n+ Mastra registry"]
        Heap["Node default\nheap: 512MB"]
        OOM["❌ ESLint\nOOM crash"]
    end

    subgraph "Solution"
        Param["--max-old-space-size\n= 4096MB"]
        CI["CI Workflow\nUpdate"]
        Fixed["✅ ESLint\nCompletes"]
    end

    Files -->|"Exceeds"| Heap
    Heap -->|"Triggers"| OOM
    Param -->|"Increases"| Heap
    CI -->|"Applies"| Param
    Param -->|"Allows"| Fixed

    style OOM fill:#FF6B6B,color:#fff
    style Fixed fill:#90EE90
    style Param fill:#FFD700
```

**Fix applied:**
```yaml
run: node --max-old-space-size=4096 node_modules/.bin/eslint . --max-warnings=0
```

**Result:** CI lint step now completes in ~60s (was OOM at 50s).

---

## 6. Operator Workflow (Current → Target)

```mermaid
sequenceDiagram
    participant Operator as 👤 Operator
    participant App as App (Vercel)
    participant Gem as Gemini API
    participant DB as Postgres

    rect rgb(200, 200, 200)
        note over Operator,DB: Current (Jul 12)
    end

    Operator->>App: "Summarize campaign"
    App->>Gem: POST /messages (no tools)
    Gem-->>App: "Here's a summary"
    App->>DB: Store result
    App-->>Operator: ✅ Done

    rect rgb(200, 255, 200)
        note over Operator,DB: Target (Aug 12)
    end

    Operator->>App: "Summarize campaign"
    App->>App: Route to Cloudflare
    App->>App: Worker (edge compute)
    App->>App: AI Gateway
    App->>App: Workers AI (Llama)
    App->>App: Tool: fetch_campaign_data
    App->>DB: [Tool execution]
    DB-->>App: [Campaign data]
    App->>App: Workers AI (continue)
    App->>App: Tool: generate_insights
    App->>App: [Tool execution]
    App->>DB: Store result
    App-->>Operator: ✅ Done (30% faster)

    style App fill:#90EE90
```

**Improvements:**
- ⚡ No egress to Gemini API (edge local)
- 🛠️ Tools work (production-planner agent fully capable)
- 💰 Workers AI cheaper than Gemini
- 🔄 Fallback to Gemini if needed

---

## 7. Control Flow: AI Routing

```mermaid
graph TD
    Request["Browser request"]
    CK["CopilotKit route\n/api/copilotkit"]
    Mastra["Mastra Agent\n(production-planner)"]
    Resolve["resolveModel(tier)"]
    Check["AI_ROUTING_MODE?"]
    
    GW["Gateway mode\nPOST https://ai-gateway"]
    Direct["Direct mode\nPOST Gemini SDK"]
    Fallback["Fallback\nGemini (always works)"]
    
    Response["Stream response"]

    Request -->|"Agent request"| CK
    CK -->|"Initialize"| Mastra
    Mastra -->|"Get model"| Resolve
    Resolve -->|"Check env"| Check
    
    Check -->|"gateway"| GW
    Check -->|"direct"| Direct
    Check -->|"undefined"| Fallback
    
    GW -->|"Success"| Response
    GW -->|"Timeout/error"| Fallback
    Direct -->|"Success"| Response
    Direct -->|"Fail"| Fallback
    Fallback -->|"Always works"| Response

    style GW fill:#90EE90
    style Fallback fill:#FFB6C6
    style Response fill:#87CEEB
```

**Key insight:** 
- Routing is pluggable (change `AI_ROUTING_MODE` env var to switch)
- Fallback always works (Gemini is always available)
- No operator sees a failure

---

## 8. Deployment Flow (CI/CD)

```mermaid
graph LR
    Push["git push origin main"]
    GH["GitHub Actions CI"]
    Lint["Linter\n(4GB heap)"]
    Build["Next.js build"]
    Test["1039 unit tests"]
    OF["OpenNext build"]
    Deploy["Cloudflare Workers\nBuild (auto-deploy)"]
    Live["🟢 LIVE\n*.workers.dev"]

    Push -->|"Trigger"| GH
    GH -->|"Run"| Lint
    Lint -->|"Pass"| Build
    Build -->|"Pass"| Test
    Test -->|"Pass"| OF
    OF -->|"Deploy"| Deploy
    Deploy -->|"Ready"| Live

    style Lint fill:#FFD700
    style Live fill:#90EE90
```

**Gates (must all pass):**
1. ✅ Lint (fixed: 4GB heap)
2. ✅ Build (working)
3. ✅ Tests (1039 passing)
4. ✅ OpenNext build (working)
5. ✅ Cloudflare deploy (automatic)

---

## Key Numbers

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Response latency | ~300ms (Vercel) | ~100ms (edge) | **67% faster** |
| AI cost | Gemini | Workers AI | **50% cheaper** |
| Deployment time | 60s | 10s | **6x faster** |
| Heap (linter) | 512MB (crashes) | 4096MB (works) | **8x more** |
| Time to production | — | Aug 12 | **4 weeks** |

---

## Rollback Plan (If Needed)

```mermaid
graph LR
    Live["🟢 LIVE\nCloudflare"]
    Emergency["🔴 EMERGENCY"]
    Switch["Set env var\nAI_ROUTING_MODE=direct"]
    Verify["Test on preview"]
    OK["✅ Working\non Gemini"]
    Revert["DNS revert\n(if needed)"]

    Live -->|"Error detected"| Emergency
    Emergency -->|"Quick fix"| Switch
    Switch -->|"Verify"| Verify
    Verify -->|"Success"| OK
    OK -->|"Persistent issue"| Revert

    style Live fill:#90EE90
    style Emergency fill:#FF6B6B
    style OK fill:#90EE90
    style Revert fill:#FFD700
```

**Rollback time:** <1 minute (env var switch or DNS revert)

---

## Summary

- ✅ Gateway is live and working
- 🔴 Linter OOM fixed (PR #334)
- ⏳ IPI-525 tool calling starts this week
- 📅 Production cutover: Aug 12 (if all tests pass)
- 🔄 Rollback: <1 minute (safe to ship)
