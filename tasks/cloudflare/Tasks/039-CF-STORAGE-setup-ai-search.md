# IPI-XXX · CF-STORAGE-005 — Set Up Cloudflare AI Search (RAG)

**Task ID:** CF-STORAGE-005
**Track:** Storage & AI Search
**Phase:** 4 — Production Hardening
**Difficulty:** Medium
**Risk:** Low
**Estimated time:** 30 minutes
**Dependencies:** 001 (gateway created), 003 (AI binding)

---

## Purpose

Configure Cloudflare AI Search (formally released in early 2026) to manage the entire end-to-end RAG (Retrieval-Augmented Generation) pipeline. It provides built-in file storage, automatic chunking, vector embedding (using Qwen3-Embedding or EmbeddingGemma), and hybrid BM25 search. Eliminates the need to write custom node-level splitters, chunkers, and embedding uploads.

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

```typescript
// Query the default namespace in our AI Search instance
const instance = env.AI_SEARCH.get("brand-intelligence-kb");

// 1. Upload/Index content programmatically (Optional - can also do in dashboard)
const item = await instance.items.uploadAndPoll("brand-guidelines.md", contentString);

// 2. Query with Hybrid Search (BM25 Keyword + Vector Similarity)
const results = await instance.search({
  messages: [{ role: "user", content: "What are our primary colors?" }],
});
```

---

## Dashboard Steps

### Step 1: Create the AI Search Instance

1. Open the Cloudflare dashboard → **AI Search** (under AI & Inference).
2. Click **Create Instance**.
3. Name the instance `brand-intelligence-kb`.
4. Choose an embedding model: Select `@cf/qwen/qwen3-embedding-0.6b` (1,024 dimensions, 4,096 token context) or `@cf/google/embeddinggemma-300m` (768 dimensions, 512 token context).
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

Pass criteria: `instance.search()` returns the exact uploaded text as the most relevant chunk with score > 0.8.

### Test 3: Hybrid Search (BM25 keyword)

Query with a specific keyword present in only one chunk.

Pass criteria: Keyword matches correctly, BM25 score boosts the correct document to rank #1.

---

## Acceptance Criteria

- [ ] AI Search instance created in the dashboard
- [ ] Binding `AI_SEARCH` added to Wrangler config
- [ ] Programmatic search runs successfully in a local `npx wrangler dev --remote` session
- [ ] Results show similarity scores and source file references

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

Removes:
- Custom PDF parser dependencies in `package.json`.
- Custom chunking algorithms and sentence-splitter utilities.
- Hand-rolled cosine similarity calculations in SQL or Javascript.
- Custom vector upload boilerplate.

---

## User Journey After This Task

> An operator drags a brand's brand book PDF into the iPix hub. Behind the scenes, the operator app uploads the file directly to the Cloudflare AI Search instance using the `env.AI_SEARCH` binding. The Brand Intelligence agent is immediately ready. When analyzing the brand's creative assets, the agent queries the index to cross-check compliance with color and logo guidelines. Everything is managed globally by Cloudflare without a single external vector database.
