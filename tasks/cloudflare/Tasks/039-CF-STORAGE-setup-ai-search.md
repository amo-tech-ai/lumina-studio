# IPI-XXX · CF-SEARCH-001 — Pilot Tenant-Isolated Cloudflare AI Search for Brand Guidelines

**Renamed 2026-07-14 (audit finding):** was `CF-STORAGE-005` — this is primarily retrieval/search, not generic storage. Also reclassified below — this is **not** part of the AI Gateway migration critical path.

**Task ID:** CF-SEARCH-001
**Track:** Future capability — Brand Intelligence RAG discovery pilot (audit-corrected 2026-07-14, was mislabeled "Production Hardening" — AI Search is a separate product from AI Gateway/Workers AI and has no established dependency requiring it for the migration)
**Phase:** Future / optional — **not a blocker for IPI-586, IPI-591, or IPI-592**
**Difficulty:** Medium
**Risk:** Medium (corrected from Low — see tenant-isolation and upload-security sections below; genuinely Low only once those are designed)
**Estimated time:** 30 minutes for the dashboard proof-of-concept; tenant isolation and upload security are separate, larger follow-on work
**Dependencies:** None required for the dashboard pilot phase — the "001, 003" dependency below applied to the old, premature "production hardening" framing; a Workers binding isn't needed until Step 2 of the pilot

**⚠️ Beta status correction (2026-07-14):** AI Search is confirmed **GA (generally available), not Beta**, per `developers.cloudflare.com/ai-search/` (shows "Available on all plans" — verified directly, no Beta badge). Two separate audit passes on this file assumed Beta status; both were checked against live docs and found wrong. Don't let that false assumption drive urgency either direction — evaluate on its actual merits, not a Beta/GA label.

---

## Purpose

Configure Cloudflare AI Search (formally released in early 2026) to manage the entire end-to-end RAG (Retrieval-Augmented Generation) pipeline. It provides built-in file storage, automatic chunking, vector embedding (using Qwen3-Embedding or EmbeddingGemma), and hybrid BM25 search. Eliminates the need to write custom node-level splitters, chunkers, and embedding uploads.

**This is a discovery pilot, not a committed production feature yet.** Approve it against a real Brand Intelligence use case before building beyond the dashboard proof-of-concept.

### Real-world iPix example

The Brand Intelligence agent needs to answer questions about a brand's brand guidelines PDF (e.g., "What are the primary colors?", "What is the tone of voice guidelines?"). Instead of iPix engineers writing custom PDF text extractors, chunkers, calling OpenAI embeddings, uploading to a vector DB, and setting up cosine similarity queries, they simply upload the brand's PDF to the AI Search instance. The agent queries AI Search in one call, and AI Search handles the retrieval, BM25 keyword fusion, and optional LLM response generation automatically.

---

## Recommended Setup Method

**Dashboard — create an AI Search instance, then use the simple Worker namespace binding for runtime queries.**

Priority order: option 1 (dashboard setup) combined with option 3 (official Worker binding).

---

## Official Links

| Resource | Link |
|----------|------|
| AI Search Overview | https://developers.cloudflare.com/ai-search/ |
| AI Search Get Started (Workers) | https://developers.cloudflare.com/ai-search/get-started/workers/ |
| AI Search Built-in Storage & Bindings (April 2026) | https://developers.cloudflare.com/changelog/post/2026-04-16-ai-search-namespace-binding/ |
| AI Search Supported Models (April 2026) | https://developers.cloudflare.com/changelog/post/2026-04-09-new-workers-ai-models/ |

---

## Commands

### Step 1: Create AI Search Namespace Binding

Add the `ai_search_namespaces` binding to the Wrangler configuration file:

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "ai_search_namespaces": [
    {
      "binding": "AI_SEARCH",
      "namespace": "default",
      "remote": true
    }
  ]
}
```

### Step 2: Query AI Search from Worker

**⚠️ Tenant isolation — required decision before any real data goes in (audit finding, 2026-07-14).** iPix is multi-tenant. A single shared instance without enforced filtering could expose one brand's documents to another. Choose one:

| Option | Isolation | Recommendation |
|---|---|---|
| Instance per tenant | Strongest | 🟢 Preferred for brand books |
| Shared instance + metadata filter | Logical filtering | 🟡 Only with proven server-side enforcement |
| One unfiltered shared instance | None | 🔴 Prohibited |

Cloudflare's own tutorial examples use a browser-supplied `x-tenant-id` header for simplicity — **do not do this in iPix.** The tenant identifier must come from authenticated Supabase session context, resolved server-side, never trusted from the client:

```typescript
// Correct flow: Supabase session → server resolves org ID → server derives
// the AI Search instance/filter → search executes. Tenant ID never comes
// from a client-supplied header or request body field.
const orgId = await resolveAuthenticatedOrgId(request); // from Supabase session, not request input
const instance = env.AI_SEARCH.get(`brand-intelligence-kb-${orgId}`); // or shared instance + verified metadata filter

// 1. Upload/Index content programmatically (Optional - can also do in dashboard)
const item = await instance.items.uploadAndPoll("brand-guidelines.md", contentString);

// 2. Query with Hybrid Search (BM25 Keyword + Vector Similarity)
const results = await instance.search({
  messages: [{ role: "user", content: "What are our primary colors?" }],
});
```

**Upload security — not yet designed, required before this leaves pilot (audit finding):** MIME allow-list, file size limit, filename sanitization, duplicate detection, PDF-parsing-failure handling, document ownership, deletion/offboarding, retention policy, and a decision on whether malware scanning is needed. None of this exists yet in the pilot scope above.

---

## Dashboard Steps

### Step 1: Create the AI Search Instance

1. Open the Cloudflare dashboard → **AI Search** (under AI & Inference).
2. Click **Create Instance**.
3. Name the instance `brand-intelligence-kb`.
4. Choose an embedding model — **verify the current supported-models list at execution time** (`developers.cloudflare.com/ai-search/configuration/models/supported-models/`) rather than assuming the two listed here are still current; the catalog changes. As of this writing it includes `@cf/qwen/qwen3-embedding-0.6b` (1,024 dimensions, 4,096 token context), `@cf/baai/bge-m3`, `google-ai-studio/gemini-embedding-001`, and `openai/text-embedding-3-small` — validate against language, document length, retrieval quality, dimensions, price, and supported context before committing to one.
5. Click **Create**.

### Step 2: Upload Reference Files

1. Select your new instance `brand-intelligence-kb`.
2. Open the **Items** tab.
3. Click **Upload** and upload markdown, text, or PDF reference guidelines.
4. AI Search automatically chunks and embeds the content.

### Step 3: Test Retrieval in Playground

1. Go to the **Playground** tab.
2. Select **Search** mode.
3. Ask: "What are our primary colors?" and verify the returned source chunks are highly relevant.

---

## Files Changed

### File 1: `app/wrangler.jsonc`

Add the `ai_search_namespaces` block.

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| wrangler v4.24+ | Installed | Required for AI Search bindings |
| Workers AI | ✅ Task 003 | AI Search runs on Workers AI |

---

## Tests

### Test 1: Binding is defined

Run `npx wrangler types`.

Pass criteria: `env.AI_SEARCH` type is generated as `AISearchNamespace` (or equivalent).

### Test 2: Document Indexing & Retrieval

Call the Worker route that indexes a test string and queries it.

**Corrected 2026-07-14 (audit finding) — pass criteria: do not use a fixed `score > 0.8` threshold.** Retrieval scores depend on model, query, and corpus — a universal numeric cutoff isn't a reliable quality metric. Use retrieval evaluation instead:
- the expected document appears in the top 3 results
- no other tenant's document appears in the results (cross-tenant leak test)
- source filename/citation is present in the response
- the answer is grounded in the retrieved evidence, not invented
- an unsupported question returns "not found," not a hallucinated answer

### Test 3: Hybrid Search (BM25 keyword)

Query with a specific keyword present in only one chunk.

Pass criteria: Keyword matches correctly, BM25 score boosts the correct document to rank #1.

---

## Acceptance Criteria

**Corrected/expanded 2026-07-14 (audit finding) — the original 4-item list only covered the dashboard proof, not the tenant-isolation and security requirements above:**

- [ ] Pilot approved with a real Brand Intelligence use case (not built speculatively)
- [ ] Tenant-isolation model selected (instance-per-tenant or proven filtered-shared — see table above)
- [ ] Authenticated organization context (Supabase session) controls instance/filter selection — no client-supplied tenant header
- [ ] Upload type and size restrictions enforced
- [ ] AI Search instance created in the dashboard
- [ ] Binding `AI_SEARCH` added to Wrangler config
- [ ] One test document indexes successfully
- [ ] Expected document appears in top 3 results (not a fixed score threshold)
- [ ] Cross-tenant test returns zero foreign documents
- [ ] Sources/citations are returned with every answer
- [ ] Unsupported query does not hallucinate an answer
- [ ] Delete/offboarding behavior verified
- [ ] Pricing and account limits reviewed

---

## Rollback

1. Remove the `ai_search_namespaces` array from `wrangler.jsonc`.
2. Redeploy the Worker.

The instance remains in the dashboard, but the Worker no longer has access to it.

---

## Evidence Required

1. Screenshot of the AI Search instance Playground returning correct answers.
2. Code diff of the `wrangler.jsonc` showing the namespace binding.

---

## What Custom Code This Removes

**Corrected 2026-07-14 (overclaim, audit finding):** AI Search manages ingestion and indexing, but application code still needs to handle things AI Search doesn't: upload validation, document metadata extraction for the UI, preview display, original-file retention, permission enforcement, document lifecycle tracking, and unsupported-file-format handling. What it genuinely removes:
- Custom chunking algorithms and sentence-splitter utilities
- Hand-rolled cosine similarity calculations in SQL or JavaScript
- Custom vector upload boilerplate
- A custom PDF text-extraction pipeline (AI Search parses PDFs itself) — but not upload validation or file-type handling around it

## Document lifecycle (added 2026-07-14, audit finding — not previously specified)

```text
uploaded → indexing → ready → failed → superseded → deleted
```
The task above only covers "uploaded → ready." Failure handling, replacement (a new brand-guidelines version supersedes the old), and deletion/offboarding all need explicit behavior before this is production-usable.

---

## User Journey After This Task

> An operator drags a brand's brand book PDF into the iPix hub. Behind the scenes, the operator app uploads the file directly to the Cloudflare AI Search instance using the `env.AI_SEARCH` binding. The Brand Intelligence agent is immediately ready. When analyzing the brand's creative assets, the agent queries the index to cross-check compliance with color and logo guidelines. Everything is managed globally by Cloudflare without a single external vector database.
