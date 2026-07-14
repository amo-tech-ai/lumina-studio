# Cloudflare Workers AI Setup — Choose Your Path

**Pick ONE based on your goal.**

---

## 🚀 Goal: Get Workers AI Running ASAP (10 minutes)

**→ Read:** [QUICKSTART-WORKERS-AI.md](QUICKSTART-WORKERS-AI.md)

- 5 dashboard steps
- Deploy hello-world
- Test in browser
- Done

No architecture decisions. No heavy reading. Just working code.

---

## 🛠️ Goal: Understand When to Use Dashboard vs Code

**→ Read:** [DASHBOARD-VS-CODE.md](DASHBOARD-VS-CODE.md)

- What belongs in dashboard (bindings, secrets, config)
- What belongs in code (logic, models, routing)
- Decision tree
- Common mistakes

Use this when:
- Adding a new binding
- Deciding if something should go in git
- Syncing dashboard ↔ git

---

## 📋 Goal: Copy Working Code (No Reinventing)

**→ Read:** [TRUE-AND-TRIED-PATTERNS.md](TRUE-AND-TRIED-PATTERNS.md)

7 proven patterns with code:
1. Simple chat
2. Embeddings + RAG
3. Function calling (tools)
4. Streaming
5. OpenAI-compatible API
6. KV cache
7. Error handling

Copy, modify, deploy. These are from Cloudflare's own production code.

---

## 🏗️ Goal: Full Architecture Review (Optional)

**→ Read:** [CF-ARCHITECTURE-REDESIGN-2026.md](CF-ARCHITECTURE-REDESIGN-2026.md)

- Current architecture problems
- Cloudflare 2026 recommendations
- Migration plan (5 phases)
- Technology matrix
- Cost/benefit analysis

**Use only if:**
- You're rewriting the architecture
- You need to justify decisions to the team
- You have time for deep reading

**Do NOT read if:**
- You just need to get something working
- You're new to Cloudflare
- You're setting up for the first time

---

## 📊 Other Resources in This Folder

| File | Purpose |
|------|---------|
| `CF-ARCHITECTURE-DIAGRAMS.md` | Visual comparison (current vs recommended) |
| `CF-MIGRATION-ROADMAP.md` | 5-phase implementation plan (if redesigning) |
| `CF-DECISION-CHECKLIST.md` | Team decision template (for redesign) |
| `README.md` | Full index (you are here) |

---

## Quick Decision

```
Are you:

A) New to Cloudflare?
   → QUICKSTART-WORKERS-AI.md

B) Building something specific (chat, search, agents)?
   → TRUE-AND-TRIED-PATTERNS.md (find your pattern)

C) Integrating with existing app?
   → DASHBOARD-VS-CODE.md

D) Rewriting architecture?
   → CF-ARCHITECTURE-REDESIGN-2026.md

E) Not sure?
   → Start with QUICKSTART, then PATTERNS
```

---

## Official Cloudflare Links

- **Models list:** https://developers.cloudflare.com/workers-ai/models/
- **Examples:** https://github.com/cloudflare/ai
- **Quick start:** https://developers.cloudflare.com/workers-ai/get-started/
- **Pricing:** https://developers.cloudflare.com/workers/platform/pricing/

---

**Last updated:** 2026-07-12

Questions? Check the guide for your goal above, then the official Cloudflare docs.
