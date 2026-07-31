---
title: "Cloudinary — Feature Adoption Report"
version: "1.0"
lastUpdated: "2026-07-31"
status: Active
purpose: "Which Cloudinary features iPix uses, and which custom media code the platform would delete."
ssot: ../../../tasks/cloudinary/todo.md
verifiedAgainst: "app/package.json · cloudinary_assets table (24 cols) · app/src/mastra/agents/visual-identity.ts · scripts/verify-cloudinary-*.mjs"
verifiedAt: "2026-07-31"
scores: { core: 70, advanced: 20, overall: 50 }
---

# Cloudinary — 50/100 (C) 🟡

**One-line problem:** we treat Cloudinary as a CDN. It's a DAM with agents, MCP
servers, and a workflow engine — and we hand-wrote media logic it ships.

---

## 1. What we use

| Feature | Used | Evidence |
|---------|:----:|----------|
| `next-cloudinary` (`CldImage`, upload widget) | ✅ | `^6.17.5` |
| Node SDK (server upload, signatures) | ✅ | `cloudinary` ^2.10.0 in root + app |
| Asset metadata in Postgres | ✅ | `cloudinary_assets` — 24 columns, RLS + 5 policies |
| Signed uploads | ✅ | `CLOUDINARY_API_SECRET` server-side |
| Webhooks | 🟡 | `CLOUDINARY_NOTIFICATION_API_SECRET`, `verify-cloudinary-webhook-live.mjs` |
| `f_auto` / `q_auto` delivery | 🟡 | via `CldImage` defaults |
| Programmatic upload from an agent | ✅ | `visual-identity.ts:85` — `brands/${brandId}/screenshots/homepage` |

| Feature | Not used |
|---------|----------|
| Named / responsive / AI transformations | ⚪ |
| Upload presets | ⚪ |
| Structured metadata fields | ⚪ (we mirror into Postgres instead) |
| MediaFlows (visual workflow builder) | ⚪ |
| DAM (collections, folders, taxonomy) | ⚪ |
| Cloudinary MCP servers (5) | ⚪ |
| Cloudinary Agents | ⚪ |
| Video player / transformations | ⚪ |

**Core 70 · Advanced 20 → 50**

---

## 2. Custom code Cloudinary would replace

| Our code | What it does | Cloudinary feature | Verdict |
|----------|--------------|--------------------|---------|
| `visual-identity.ts:52-85` — raw `fetch` to Firecrawl, manual `AbortController` timeout, base64 strip, buffer upload | Screenshot → upload | Upload preset + `fetch` remote URL delivery | 🔴 Replace |
| `scripts/verify-cloudinary-pipeline.mjs` | Asserts upload→transform→deliver | Upload presets make the contract declarative | 🟡 Reduce |
| `cloudinary_assets` 24 columns | Mirrors Cloudinary metadata into Postgres | Structured Metadata + DAM search | 🟡 Partially — keep the FK, drop the mirrored fields |
| Per-channel spec lookup (`lookupChannelSpecs`) | IG/TikTok/Amazon/Shopify sizes | Named transformations, one per channel | 🔴 Replace — this is the cleanest win |
| `media_size_specs` table | Channel dimensions in Postgres | Named transformations | 🔴 Replace |

**The channel-specs one is the standout.** iPix's whole deliverables model is
"same shot, N channel formats." That is literally what named transformations are:
define `ipix_ig_feed`, `ipix_amazon_main`, `ipix_shopify_hero` once in Cloudinary,
then `CldImage` references them by name. Today we store the numbers in a Postgres
table, look them up with a Mastra tool, and construct URLs ourselves.

---

## 3. Cloudinary MCP + Agents (new, May 2026)

Cloudinary publishes **5 MCP servers**: Asset Management, Environment Config,
Structured Metadata, Analysis, MediaFlows. They run as remote OAuth endpoints or
local `npx` processes.

| MCP server | iPix agent that would use it | What it enables |
|------------|------------------------------|-----------------|
| **Analysis** | `creative-director` | Real image analysis for DNA scoring instead of only our own pillars |
| **Asset Management** | `creative-director` | Bulk tag/move/organise from the `/app/assets` chat |
| **Structured Metadata** | `production-planner` | Write shoot/shot/channel metadata onto the asset itself |
| **MediaFlows** | — | Post-shoot triage: auto-sort by shot type, generate channel variants |
| **Environment Config** | — | Ops only |

**This connects directly to the Mastra gap.** [01-mastra](./01-mastra.md) notes we
have no MCP client. Cloudinary's 5 servers are the most concrete reason to add one
— it would turn `creative-director` from "3 read-only tools" into a real asset
agent without us writing a tool per operation.

---

## 4. Real iPix example

`creative-director` on `/app/assets` today:

> *"Why is this asset flagged?"* → `getAssetDnaEvidence` reads **our** stored score
> → `suggestAssetRetakes` maps pillars to advice deterministically.

The agent can explain a score it can't compute and can't re-check, because
re-scoring "would silently overwrite the operator's existing score" (its own
instructions). With the Cloudinary Analysis MCP server it could fetch fresh
perceptual data — sharpness, colour, face detection, quality score — *without*
touching our stored DNA score. That's a new capability, not a rewrite.

---

## 5. Progress tracker

| ID | Task | | % | Examine | Verify | Blocker |
|----|------|:-:|--:|---------|--------|---------|
| CD-01 | Upload + delivery | 🟢 | 80 | `next-cloudinary` | `npm run verify:cloudinary-pipeline` | — |
| CD-02 | Signed uploads | 🟢 | 85 | server SDK | pipeline verify | — |
| CD-03 | Webhooks | 🟡 | 55 | `verify-cloudinary-webhook-live.mjs` | live run | needs prod creds |
| CD-04 | Named transformations | ⚪ | 0 | `media_size_specs` in PG | — | not scoped |
| CD-05 | Upload presets | ⚪ | 0 | — | — | not scoped |
| CD-06 | Structured metadata | ⚪ | 0 | mirrored to PG instead | — | not scoped |
| CD-07 | MediaFlows | ⚪ | 0 | — | — | not scoped |
| CD-08 | MCP servers | ⚪ | 0 | — | — | needs Mastra MCP client |
| CD-09 | Video | ⚪ | 0 | — | — | not in MVP |

---

## 6. Next 5 tasks

| # | Task | Effort | Why |
|:-:|------|:------:|-----|
| 1 | Move channel specs to named transformations; keep `media_size_specs` as a read-through cache | M | Deletes the most-duplicated logic in the media path |
| 2 | Upload presets for the 3 upload paths (operator, agent screenshot, webhook) | S | Declarative contract; shrinks `verify-cloudinary-pipeline.mjs` |
| 3 | Replace the raw Firecrawl `fetch` in `visual-identity.ts` with a proper tool | S | Currently fails silently to `null` on any error |
| 4 | Spike the Cloudinary Analysis MCP server against `creative-director` | M | Highest-value new capability; needs the Mastra MCP client |
| 5 | Evaluate MediaFlows for post-shoot asset triage | L | Directly matches the fashion-production triage workflow |

---

## 7. Sources

- [Cloudinary docs](https://cloudinary.com/documentation) · [MCP + LLM tools](https://cloudinary.com/documentation/cloudinary_llm_mcp) · [Agents](https://cloudinary.com/agents) · [Integrations](https://cloudinary.com/integrations) · [Blog](https://cloudinary.com/blog/)
- [Cloudinary Agents launch, May 2026](https://www.businesswire.com/news/home/20260505410851/en/Cloudinary-Launches-AI-Agents-to-Streamline-Enterprise-Scale-Visual-Media-Management-and-Brand-Governance)
- Local: `tasks/cloudinary/` · skill: `cloudinary`
