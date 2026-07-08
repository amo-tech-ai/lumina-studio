# Claude Cookbooks — iPix Reference Guide

> Source: [platform.claude.com/cookbook](https://platform.claude.com/cookbook) · [github.com/anthropics/claude-cookbooks](https://github.com/anthropics/claude-cookbooks)
> Reviewed: 2026-06-21 · 83 cookbooks catalogued · 10 rated in depth below

---

## Top 10 Cookbooks — Rated for iPix FashionOS

Scored on: **iPix relevance** (Mastra/CopilotKit/Supabase fit) + **production applicability** + **code quality** + **concept value**

| # | Cookbook | Category | Score | Difficulty | iPix Use |
|---|---|---|---|---|---|
| 1 | [Context Engineering: Memory, Compaction, Tool Clearing](#1-context-engineering-memory-compaction-tool-clearing) | Tools · Agent Patterns | **92/100** | Intermediate+ | Long-running Mastra agents, brand intake workflows |
| 2 | [Programmatic Tool Calling (PTC)](#2-programmatic-tool-calling-ptc) | Tools | **91/100** | Intermediate | Bulk asset DNA checks, batch brand analysis |
| 3 | [Chief of Staff Agent (Claude Agent SDK)](#3-chief-of-staff-agent) | Agent SDK · Agent Patterns | **90/100** | Advanced | SDK patterns for iPix Mastra agents and HITL |
| 4 | [Tool Search with Embeddings](#4-tool-search-with-embeddings) | Tools · RAG | **89/100** | Intermediate | Scale Mastra tool registry to 100+ tools |
| 5 | [Async Multi-Agent Orchestration](#5-async-multi-agent-orchestration) | Agent Patterns | **88/100** | Intermediate | Parallel Mastra agent messaging patterns |
| 6 | [Multiagent: Coordinate a Specialist Team](#6-multiagent-coordinate-a-specialist-team) | Managed Agents · Tools | **87/100** | Advanced | Brand intake + asset DNA specialist pipeline |
| 7 | [Orchestrator Workers](#7-orchestrator-workers) | Agent Patterns | **84/100** | Intermediate | Dynamic sub-agent delegation in ipix-supervisor |
| 8 | [Evaluator Optimizer](#8-evaluator-optimizer) | Agent Patterns · Evals | **82/100** | Intermediate | AI draft quality loops for brand profiles |
| 9 | [Data Analyst Agent (Managed Agents)](#9-data-analyst-agent) | Managed Agents · Tools | **80/100** | Intermediate | Brand analytics + contest ROI reports |
| 10 | [Prompting for Frontend Aesthetics](#10-prompting-for-frontend-aesthetics) | Responses · Skills | **78/100** | Intermediate | iPix design system — Cormorant/Outfit typography |

---

## Full Catalog Summary

83 cookbooks across 10 categories as of 2026-06-21.

| Category | Count | Top Pick |
|---|---|---|
| Agent Patterns | 12 | Async Multi-Agent Orchestration |
| Claude Agent SDK | 8 | Chief of Staff Agent |
| Claude Managed Agents | 9 | Coordinate a Specialist Team |
| Tools & Tool Use | 12 | Programmatic Tool Calling |
| RAG & Retrieval | 14 | Tool Search with Embeddings |
| Vision & Multimodal | 6 | Giving Claude a Crop Tool |
| Extended Thinking | 2 | Extended Thinking with Tool Use |
| Responses & Output | 7 | Prompt Caching |
| Evaluations | 3 | Building Evals |
| Skills | 2 | Claude Skills for Financial Applications |

---

## Detailed Reviews

---

### 1. Context Engineering: Memory, Compaction, Tool Clearing

**Score: 92/100** · Category: Tools · Agent Patterns · Difficulty: Intermediate+

| Field | Detail |
|---|---|
| URL | `platform.claude.com/cookbook/tool-use-context-engineering-context-engineering-tools` |
| Stack | Python 3.11+, `anthropic` SDK v0.84.0+, Claude Sonnet 4.6, `matplotlib` |
| New APIs | `compact_20260112`, `clear_tool_uses_20250919`, `memory_20250818` |

**What It Does**

Three production-ready context management primitives for agents that accumulate tokens faster than they can process them:

| Primitive | Mechanism | Cost | Best for |
|---|---|---|---|
| **Compaction** | Summarizes conversation via server-side API at token trigger | Inference cost | Long multi-turn dialogue, reasoning chains |
| **Tool-result clearing** | Surgically drops old tool outputs, keeps recent N | Zero cost | Re-fetchable data (files, API calls) |
| **Memory** | Agent writes persistent notes to external storage | Zero API cost | Cross-session knowledge, findings accumulation |

**Key Patterns**

```python
# Compaction — triggers at 150K tokens
context_management={"edits": [{"type": "compact_20260112",
    "trigger": {"type": "input_tokens", "value": 150_000},
    "instructions": "Preserve quantitative findings and task state..."}]}

# Clearing — keeps last 4 tool results
context_management={"edits": [{"type": "clear_tool_uses_20250919",
    "trigger": {"type": "input_tokens", "value": 30_000},
    "keep": {"type": "tool_uses", "value": 4}}]}

# Memory tool — agent-driven external storage
tools.append({"type": "memory_20250818", "name": "memory"})
```

**Measured Results** (8 documents, ~328K tokens):

| Strategy | Peak tokens | Turns |
|---|---|---|
| Baseline | 335,279 | 5 |
| Clearing | 173,137 | 7 |
| Compaction | 169,164 | 7 |
| All three | ~180K | 8+ |

**iPix Real-World Use Cases**

- Brand intake workflow: clears Cloudinary asset payloads after DNA check, keeps last 4 results
- Mastra brand-intelligence agent: compacts after 150K tokens in long brand analysis sessions
- Cross-session memory: brand profile notes persist across multiple brand intake runs
- Contest judging agent: memory accumulates rubric calibration notes across entries

**Scoring**
- iPix relevance: 10/10 — directly solves Mastra agent token bloat
- Code quality: 9/10 — real measurement data, minimal patterns
- Concept depth: 9.5/10 — diagnostic framework is excellent
- Production readiness: 9/10

---

### 2. Programmatic Tool Calling (PTC)

**Score: 91/100** · Category: Tools · Difficulty: Intermediate

| Field | Detail |
|---|---|
| URL | `platform.claude.com/cookbook/tool-use-programmatic-tool-calling-ptc` |
| Stack | Python 3.11+, `anthropic >= 0.72`, async/await, beta: `advanced-tool-use-2025-11-20` |
| Model | Claude Sonnet 4.6 |

**What It Does**

Lets Claude write code that calls tools directly inside a Code Execution environment rather than round-tripping through the model API for each invocation. **85.6% token reduction** on a real expense-report workflow (110K → 16K tokens).

**Key Patterns**

```python
# Mark tools as PTC-callable
ptc_tools = copy.deepcopy(tools)
for tool in ptc_tools:
    tool["allowed_callers"] = ["code_execution_20250825"]
ptc_tools.append({"type": "code_execution_20250825", "name": "code_execution"})

# Detect caller type
if block.caller["type"] == "code_execution_20250825":
    print(f"[PTC] Tool called from code execution: {tool_name}")
elif block.caller["type"] == "direct":
    print(f"[Direct] Tool called by model: {tool_name}")

# Container management for stateful sessions
response = client.beta.messages.create(**params,
    extra_body={"container": container_id} if container_id else None)
```

**Performance Results**

| Metric | Traditional | PTC | Improvement |
|---|---|---|---|
| API Calls | 4 | 4 | — |
| Total Tokens | 110,473 | 15,919 | **85.6% reduction** |
| Elapsed Time | 35.38s | 34.88s | 1.4% reduction |

**Use PTC when:** large metadata-rich datasets, sequential tool dependencies, loops over many entities, cost optimization is a priority.

**Don't use PTC when:** human oversight needed per invocation, tools have side effects requiring immediate feedback.

**iPix Real-World Use Cases**

- Bulk Asset DNA: check 50 product images in one PTC session vs. 50 API round-trips
- Brand analysis: pull all brand assets → score all → summarize → one container session
- Contest entry batch review: process 100 photo entries, DNA-check, categorize in one run
- Analytics agent: aggregate vote counts + sponsor metrics without bloating model context

**Scoring**
- iPix relevance: 9.5/10 — directly applicable to batch workflows
- Performance proof: 10/10 — real numbers, not estimates
- Code quality: 9/10
- Production readiness: 9/10

---

### 3. Chief of Staff Agent

**Score: 90/100** · Category: Claude Agent SDK · Agent Patterns · Difficulty: Advanced

| Field | Detail |
|---|---|
| URL | `platform.claude.com/cookbook/claude-agent-sdk-01-the-chief-of-staff-agent` |
| Stack | Python, Claude Agent SDK (`claudium`), Claude Opus 4.6 |
| Series | Tutorial 1 of N (next: Observability Agent with MCP) |

**What It Does**

End-to-end tutorial for building an AI Chief of Staff that coordinates specialist subagents (financial analyst, recruiter), maintains audit trails, adapts communication styles, and executes in plan mode before stakeholder approval.

**7 Progressive Features**

| Feature | What it teaches |
|---|---|
| CLAUDE.md memory | Persistent context files as agent instructions — no redundant tokens |
| Bash tool | Run Python scripts for procedural computation (hiring models, forecasts) |
| Output styles | `.claude/output-styles/` — executive vs. technical style configs |
| Plan mode | Create execution plan, review before running: `permission_mode="plan"` |
| Slash commands | `.claude/commands/` — vetted prompt templates with `$ARGUMENTS` substitution |
| Hooks | Auto-run compliance scripts on PostToolUse Write events |
| Subagents via Task | `.claude/agents/*.md` — specialist definitions, delegate via Task tool |

**Key Pattern: Subagent Delegation**

```python
# Agent configured to delegate via Task tool
allowed_tools=["Task"]

# Subagent spec in .claude/agents/financial-analyst.md
# System: "You are a financial analyst. Analyze hiring impact on ARR..."

# Usage
await agent.query("Should we hire 5 engineers? Analyze the financial impact.")
# → Task tool → financial-analyst subagent → returns structured analysis
```

**Key Pattern: Hooks for Audit**

```json
{"hooks": {"PostToolUse": [{"matcher": "Write",
  "hooks": [{"type": "command",
    "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/report-tracker.py"}]}]}}
```

**iPix Real-World Use Cases**

- iPix supervisor agent: coordinating brand-intelligence, asset-dna, analytics subagents
- Brand intake HITL: plan mode → operator reviews plan before Supabase write
- Slash commands: `/analyze-brand [url]` → full brand intelligence workflow
- Hooks: audit log every `ai_drafts` write via PostToolUse hook

**Scoring**
- iPix relevance: 9/10 — direct SDK patterns for Mastra agent architecture
- Completeness: 10/10 — 7 progressive features, all production-relevant
- Code quality: 9/10
- Difficulty curve: well-paced from basic to advanced

---

### 4. Tool Search with Embeddings

**Score: 89/100** · Category: Tools · RAG & Retrieval · Difficulty: Intermediate

| Field | Detail |
|---|---|
| URL | `platform.claude.com/cookbook/tool-use-tool-search-with-embeddings` |
| Stack | Python, `anthropic`, `sentence-transformers` (all-MiniLM-L6-v2), `numpy`, Claude Sonnet 4.6 |
| Beta | `advanced-tool-use-2025-11-20` |

**What It Does**

Scales Claude from dozens to thousands of tools by embedding tool descriptions and using cosine similarity to surface only the relevant subset per query. **90%+ context reduction** vs. front-loading all tool definitions.

**Key Pattern: Single Meta-Tool**

```python
# Step 1: Build embedding index for all tools
tool_embeddings = embedding_model.encode([t["description"] for t in all_tools])

# Step 2: Give Claude only tool_search initially
initial_tools = [tool_search_definition]

# Step 3: When Claude calls tool_search, return matching definitions
def handle_tool_search(query, top_k=5):
    query_emb = embedding_model.encode(query)
    similarities = np.dot(tool_embeddings, query_emb)
    top_indices = np.argsort(similarities)[-top_k:][::-1]
    return [{"type": "tool_reference", "tool_name": all_tools[i]["name"]}
            for i in top_indices]
```

**iPix Real-World Use Cases**

- Mastra tool registry: 50+ Supabase RPCs, Cloudinary transforms, Chatwoot templates as searchable tools
- Brand intelligence: "find competitor prices" → surfaces only web-scrape + brand-score tools
- Contest platform: route operator intent to correct contest tool subset without loading all 100+
- Agent SDK: replace hardcoded tool lists with semantic discovery

**Scoring**
- Concept value: 10/10 — solves a real scaling bottleneck
- iPix relevance: 9/10 — Mastra tool proliferation is a real near-term problem
- Code quality: 9/10 — clean embedding + similarity pattern
- Production readiness: 8/10

---

### 5. Async Multi-Agent Orchestration

**Score: 88/100** · Category: Agent Patterns · Difficulty: Intermediate

| Field | Detail |
|---|---|
| URL | `platform.claude.com/cookbook/patterns-agents-async-multi-agent-orchestration` |
| Stack | Python, `asyncio`, `anthropic` SDK, Claude Opus 4.8 |

**What It Does**

Two distilled patterns with zero domain logic — pure messaging and lifecycle mechanics:

| Pattern | Description |
|---|---|
| **Fixed N-agent team** | Stable team with peer-to-peer messaging via shared Hub |
| **Dynamic subagents** | Orchestrator spawns, polls, collects, and kills workers at runtime |

**Key Pattern: Message Hub**

```python
class Hub:
    inbox: dict[str, list[dict]]   # per-agent message queues
    event: dict[str, asyncio.Event] # non-polling block signals
    status: dict[str, str]          # active/idling/done/crashed

# Inbox auto-appended to last tool result — no polling needed
if results:
    results[-1]["content"] += hub.render(inbox)  # ← the key line
```

**Key Pattern: Dynamic Subagent Lifecycle**

```python
# Lead spawns helpers
create_subagents(names=["worker-1", "worker-2", "worker-3"])

# Check status without polling
get_status(names=["worker-1", "worker-2", "worker-3"])  # active/idling/done/crashed

# Collect results via wait_for_message
# Kill when done
kill_subagents(names=["worker-1", "worker-2", "worker-3"])
```

**iPix Real-World Use Cases**

- Parallel brand analysis: spawn N brand subagents for competitor batch processing
- Asset DNA queue: dispatch DNA check workers per Cloudinary folder
- Contest entry review: fixed judge + helper team with shared review hub
- Chatwoot bridge: dispatcher + specialist agents for brand/asset/contest intent routing

**Scoring**
- Concept purity: 10/10 — minimal, swappable template
- iPix relevance: 9/10 — directly maps to Mastra multi-agent architecture
- Code quality: 9/10
- Learning curve: 8/10 — asyncio knowledge required

---

### 6. Multiagent: Coordinate a Specialist Team

**Score: 87/100** · Category: Managed Agents · Tools · Difficulty: Advanced

| Field | Detail |
|---|---|
| URL | `platform.claude.com/cookbook/managed-agents-cma-coordinate-specialist-team` |
| Stack | Python, `anthropic` Managed Agents beta (`managed-agents-2026-04-01`), Claude Opus 4.6 |

**What It Does**

Coordinator agent orchestrates 3 scoped specialists (researcher → web search only, case-study picker → local files only, pricing modeler → pricing rules only) to assemble a tailored sales proposal. Demonstrates tool scoping, environment file mounting, parallel specialist execution, and event streaming.

**Key Patterns**

```python
# Coordinator with specialists
coordinator = client.beta.agents.create(
    name="Proposal Writer", model=MODEL,
    multiagent={"type": "coordinator",
                "agents": [researcher, case_study_picker, pricing_modeler]})

# Per-role tool scoping — each agent sees only what it needs
researcher_tools     = [web_search, web_fetch]
librarian_tools      = [file_system_tools]
pricing_tools        = [file_system_tools]

# Environment + file mounting
env = client.beta.environments.create(name="proposal-env",
    config={"type": "anthropic_cloud", "networking": {"type": "unrestricted"}})

# Event streaming
with client.beta.sessions.events.stream(session.id, betas=BETAS) as stream:
    for ev in stream:
        if ev.type == "session.thread_created":
            print(f"[spawn] {ev.agent_name}")
```

**iPix Real-World Use Cases**

- Brand intake pipeline: researcher (web scrape brand) → analyst (score DNA fit) → strategy (draft brand profile)
- Contest setup: researcher (find sponsor leads) → pricing modeler (draft package tiers) → writer (assemble proposal)
- Production package: asset-dna specialist + product-linking specialist + coordinator assembles shoot brief
- Managed Agents = hosted alternative to self-managed Mastra if ops burden grows

**Scoring**
- Architecture quality: 10/10 — tool scoping per role is exemplary
- iPix relevance: 8.5/10 — maps to 7-agent iPix system
- Code quality: 9/10
- Managed Agents beta risk: -1 (API may change)

---

### 7. Orchestrator Workers

**Score: 84/100** · Category: Agent Patterns · Difficulty: Intermediate

| Field | Detail |
|---|---|
| URL | `platform.claude.com/cookbook/patterns-agents-orchestrator-workers` |
| Stack | Python, `anthropic` SDK |

**What It Does**

Central orchestrator LLM analyzes a task, **dynamically determines** which specialist workers to spawn and what subtasks to assign (at runtime, not hardcoded), delegates in parallel, then synthesizes. Unlike Async Multi-Agent (which is about messaging) this is about dynamic task decomposition.

**Key Patterns**

```python
# Phase 1: Orchestrator plans
# XML output: <subtask><worker_id>...</worker_id><instructions>...</instructions></subtask>

# Phase 2: Workers execute in parallel with full context + specific instructions
worker_results = await asyncio.gather(*[
    run_worker(task=original_task, instructions=subtask.instructions)
    for subtask in orchestrator_output.subtasks
])

# Phase 3: Synthesize
final = await synthesize(original_task, worker_results)
```

**Use: Dynamic decomposition** — subtask strategy is determined by the input, not hardcoded.
**Don't use:** when subtasks are predictable (use simpler parallelization) or latency is critical (N+1 calls).

**iPix Real-World Use Cases**

- ipix-supervisor: determine at runtime whether brand intake needs geo research, competitor analysis, or social scrape based on the brand URL
- Contest setup: orchestrator decides which specialists (pricing, case-study, competitor) to spawn for a given brief
- Analytics agent: dynamically choose which metrics workers to spawn per report request

**Scoring**
- Concept clarity: 9/10 — clean "do/don't use" criteria
- iPix relevance: 8/10
- Code quality: 8/10 — class-based, well structured
- vs. fixed parallelization: -1 (more complexity for variable gain)

---

### 8. Evaluator Optimizer

**Score: 82/100** · Category: Agent Patterns · Evals · Difficulty: Intermediate

| Field | Detail |
|---|---|
| URL | `platform.claude.com/cookbook/patterns-agents-evaluator-optimizer` |
| Stack | Python, `anthropic` SDK |

**What It Does**

Generator LLM creates output → Evaluator LLM scores it and provides feedback → Generator improves → repeat until PASS. State tracked via `memory` (previous attempts) and `chain_of_thought` (reasoning + results).

**Key Patterns**

```python
# Dual LLM loop
while status != "PASS":
    response = generator.generate(task, memory=previous_attempts)
    evaluation = evaluator.evaluate(response, criteria)
    if evaluation.status == "PASS":
        break
    memory.append({"attempt": response, "feedback": evaluation.feedback})

# XML parsing for structured handoff
# <thoughts>...</thoughts><response>...</response>
# <evaluation>...</evaluation><feedback>...</feedback>
```

**When to use:** clear evaluation criteria exist, LLM responses demonstrably improve with feedback.
**Don't use:** unclear criteria, evaluation itself is uncertain.

**iPix Real-World Use Cases**

- Brand profile drafts: generator writes brand profile → evaluator checks against brand brief → iterate until quality threshold met
- Contest rubric: generate judging criteria → evaluate against brand guidelines → refine
- Sponsor proposal: generate → evaluate fit score → improve until score > threshold
- Asset DNA report: generate interpretation → evaluate accuracy → refine

**Scoring**
- Concept value: 9/10 — core agentic pattern
- iPix relevance: 8/10 — useful for ai_drafts quality gate before HITL
- Code quality: 8/10
- Production readiness: 7/10 — needs termination guard (max iterations)

---

### 9. Data Analyst Agent (Managed Agents)

**Score: 80/100** · Category: Managed Agents · Tools · Difficulty: Intermediate

| Field | Detail |
|---|---|
| URL | `platform.claude.com/cookbook/managed-agents-data-analyst-agent` |
| Stack | Python 3.11+, `anthropic` Managed Agents, pandas, plotly (preinstalled in container) |

**What It Does**

Upload a CSV → agent analyzes patterns and trends → generates publication-quality HTML report with narrative + 3+ interactive Plotly charts + actionable recommendations. Output persisted at `/mnt/session/outputs/` and retrieved via Files API.

**Key Patterns**

```python
# Container environment with preinstalled deps
env = client.beta.environments.create(name="analyst-env",
    config={"type": "anthropic_cloud", "networking": {"type": "unrestricted"}})

# File upload + session binding
file = client.beta.files.upload(file=("data.csv", csv_bytes, "text/csv"))
session = client.beta.sessions.create(agent={"id": analyst.id},
    environment_id=env.id, resources=[{"type": "file", "file_id": file.id}])

# Stream progress
with client.beta.sessions.events.stream(session.id) as stream:
    for ev in stream:
        if ev.type == "agent.message":
            print(ev.content)
```

**iPix Real-World Use Cases**

- Contest ROI reports: upload vote/entry/sponsor CSV → auto-generate sponsor-ready HTML report
- Brand analytics: upload shoot performance metrics → narrative HTML with engagement charts
- Weekly performance: Cloudinary asset metrics → automated brand owner report
- Sales reports: Stripe revenue CSV → sponsor invoice report with visualizations

**Scoring**
- Practical utility: 9/10 — immediately deployable pattern
- iPix relevance: 8/10 — analytics + contest ROI are real near-term needs
- Code quality: 8/10
- Managed Agents dependency: -1 (beta API)

---

### 10. Prompting for Frontend Aesthetics

**Score: 78/100** · Category: Responses · Skills · Difficulty: Intermediate

| Field | Detail |
|---|---|
| URL | `platform.claude.com/cookbook/coding-prompting-for-frontend-aesthetics` |
| Stack | Python, HTML/CSS/JS (vanilla), Tailwind CSS, Google Fonts, Claude Sonnet 4.6 |

**What It Does**

Teaches how to prevent Claude from generating generic "AI slop" UI — overused Inter font, purple gradients, predictable layouts. Provides a `DISTILLED_AESTHETICS_PROMPT` to append to any system prompt, plus isolated prompts for typography, color/theme, motion, and backgrounds.

**The Core Prompt**

```python
DISTILLED_AESTHETICS_PROMPT = """
<frontend_aesthetics>
Avoid generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character
</frontend_aesthetics>
"""
# Append to any system prompt:
generate_html_with_claude(BASE_SYSTEM_PROMPT + "\n\n" + DISTILLED_AESTHETICS_PROMPT, prompt)
```

**Four Design Dimensions**

| Dimension | Avoid | Use instead |
|---|---|---|
| Typography | Inter, Roboto, Arial | Cormorant Garamond, Playfair Display, Space Grotesk, IBM Plex |
| Color | Purple gradient on white | CSS vars, dominant + sharp accent, IDE-theme-inspired palettes |
| Motion | No animation / generic fade | CSS-only or Motion.js, high-impact moments only |
| Backgrounds | Flat white | Gradients, texture, contextual atmosphere |

**iPix Real-World Use Cases**

- CopilotKit approval cards: avoid generic card styling, match iPix brand aesthetic
- Contest gallery: distinctive photo grid, not default shadcn grid
- Brand Hub dashboard: Cormorant Garamond headings (already in iPix design system)
- Append `DISTILLED_AESTHETICS_PROMPT` to any Claude prompt generating iPix UI components

**iPix specific:** iPix design system already specifies Cormorant Garamond + Outfit — this cookbook reinforces why that choice matters and how to communicate it to Claude in prompts.

**Scoring**
- Practical value: 8/10 — immediately usable system prompt snippet
- iPix relevance: 8/10 — directly applicable to UI generation prompts
- Concept depth: 7/10 — more prompt engineering than architecture
- Before/after proof: 9/10 — visual comparisons included

---

## Honourable Mentions (Scores 70–78)

| Cookbook | Score | Why |
|---|---|---|
| Extended Thinking with Tool Use | 77 | Reasoning + tool calls for complex brand strategy; use for hard brand analysis |
| RAG: Contextual Retrieval | 76 | Enhances brand similarity search and pgvector queries |
| Building Evals | 75 | Test ai_drafts quality before shipping to HITL |
| Session Memory Compaction | 74 | Simpler version of Context Engineering #1 for short sessions |
| Batch Processing (Message Batches API) | 73 | Bulk brand intake: 100 brands → Gemini → score batch |
| Creating a Customer Service Agent (Client-Side Tools) | 72 | Chatwoot bridge pattern reference |
| Using Haiku as a Sub-Agent | 71 | Route cheap tasks (format, classify) to Haiku, expensive (strategy) to Opus |
| Text to SQL with Claude | 70 | Natural language → Supabase SQL for analytics agent |

---

## How to Use This Guide

### For iPix Agent Development (Mastra / `services/agent/`)

1. **Start with #1** (Context Engineering) — fix token bloat in Mastra agent loops first
2. **Add #2** (PTC) — batch Asset DNA and brand analysis without N round-trips
3. **Reference #5** (Async Multi-Agent) — messaging patterns for ipix-supervisor delegation
4. **Apply #7** (Orchestrator Workers) — dynamic specialist dispatch per brand intake task

### For CopilotKit UI / Approval Cards

1. **Apply #10** (Frontend Aesthetics) — append `DISTILLED_AESTHETICS_PROMPT` to any UI generation prompt
2. **Reference #8** (Evaluator Optimizer) — quality gate before surfacing draft to HITL

### For Production Scaling

1. **Apply #4** (Tool Search with Embeddings) — when Mastra tool count exceeds 20
2. **Reference #6** (Coordinate Specialist Team) — if moving to Anthropic Managed Agents

### For Contest + Analytics Features

1. **Reference #9** (Data Analyst Agent) — contest ROI reports and brand analytics dashboards
2. **Reference #3** (Chief of Staff Agent) — SDK patterns for multi-agent contest coordinator

---

## Quick Reference: Key Code Snippets

### Context Compaction (paste into any Mastra agent loop)

```python
context_management={
    "edits": [
        {"type": "clear_tool_uses_20250919",
         "trigger": {"type": "input_tokens", "value": 30_000},
         "keep": {"type": "tool_uses", "value": 4}},
        {"type": "compact_20260112",
         "trigger": {"type": "input_tokens", "value": 150_000}}
    ]
}
```

### Aesthetics Prompt (append to any UI generation system prompt)

```python
DISTILLED_AESTHETICS_PROMPT = """
<frontend_aesthetics>
Avoid generic AI-generated aesthetics: overused fonts (Inter, Roboto),
purple gradients on white, predictable layouts. Use Cormorant Garamond
for headings, Outfit for body, brand palette #E87C4D / #1E293B / #F3B93C
on #FBF8F5 background. Premium fashion aesthetic — generous whitespace,
glassmorphism accents, distinctive typography.
</frontend_aesthetics>
"""
```

### Tool Search Bootstrap (for large Mastra tool registries)

```python
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer("all-MiniLM-L6-v2")
tool_embeddings = model.encode([t["description"] for t in all_tools])

def search_tools(query: str, top_k: int = 5):
    q_emb = model.encode(query)
    sims = np.dot(tool_embeddings, q_emb)
    return [all_tools[i] for i in np.argsort(sims)[-top_k:][::-1]]
```

---

Sources:
- [Claude Cookbook Index](https://platform.claude.com/cookbook/)
- [Chief of Staff Agent](https://platform.claude.com/cookbook/claude-agent-sdk-01-the-chief-of-staff-agent)
- [Context Engineering](https://platform.claude.com/cookbook/tool-use-context-engineering-context-engineering-tools)
- [Async Multi-Agent Orchestration](https://platform.claude.com/cookbook/patterns-agents-async-multi-agent-orchestration)
- [Coordinate a Specialist Team](https://platform.claude.com/cookbook/managed-agents-cma-coordinate-specialist-team)
- [Programmatic Tool Calling](https://platform.claude.com/cookbook/tool-use-programmatic-tool-calling-ptc)
- [Tool Search with Embeddings](https://platform.claude.com/cookbook/tool-use-tool-search-with-embeddings)
- [Prompting for Frontend Aesthetics](https://platform.claude.com/cookbook/coding-prompting-for-frontend-aesthetics)
- [claude-cookbooks GitHub](https://github.com/anthropics/claude-cookbooks/tree/main)
