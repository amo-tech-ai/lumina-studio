---
parent: groq-inference
title: Advanced API (curated)
description: Batch API, MCP via Responses API, Llama Guard moderation, prompt caching, and error handling — curated patterns (not full param list).
load_when: groq batch, MCP server, llama guard, prompt caching, RateLimitError, retry-after
tags: groq, batch, mcp, moderation, errors, caching
see_also: api-reference.md
---

# Groq Advanced API

Curated patterns. **Full request/response fields:** [`api-reference.md`](api-reference.md).

## Error handling

```python
from groq import Groq, RateLimitError, APIConnectionError, APIStatusError

try:
    response = client.chat.completions.create(...)
except RateLimitError as e:
    retry_after = e.response.headers.get("retry-after")
    # exponential backoff; honor retry-after when present
except APIConnectionError:
    ...
except APIStatusError as e:
    ...  # e.status_code
```

Parse rate-limit headers: `x-ratelimit-remaining-*`, `x-ratelimit-reset-*`, `retry-after`.

## Prompt caching

Automatic 50% discount on repeated prompt prefixes (no code change). Put static system prompts and tool defs first; user content last.

**Supported models include:** `openai/gpt-oss-20b`, `openai/gpt-oss-120b`, `moonshotai/kimi-k2-instruct-0905`.

```python
cached = response.usage.prompt_tokens_details.cached_tokens
```

Cache TTL ~2 hours without reuse.

## Batch processing

24h–7d completion window for high-volume async jobs:

```python
batch = client.batches.create(
    input_file_id=file_id,
    endpoint="/v1/chat/completions",
    completion_window="24h",
)
batch = client.batches.retrieve(batch.id)
```

## MCP (Responses API)

Remote tools via OpenAI-compatible Responses API + Groq base URL:

```python
import os
import openai

client = openai.OpenAI(
    api_key=os.environ["GROQ_API_KEY"],
    base_url="https://api.groq.com/openai/v1",
)

response = client.responses.create(
    model="openai/gpt-oss-120b",
    input="What models are trending on Hugging Face?",
    tools=[{
        "type": "mcp",
        "server_label": "Huggingface",
        "server_url": "https://huggingface.co/mcp",
    }],
)
```

## Content moderation

**Llama Guard 4** — returns `safe` or `unsafe\n<category>`:

```python
response = client.chat.completions.create(
    model="meta-llama/Llama-Guard-4-12B",
    messages=[{"role": "user", "content": user_input}],
)
```

**GPT-OSS Safeguard 20B** — structured injection/policy JSON:

```python
response = client.chat.completions.create(
    model="openai/gpt-oss-safeguard-20b",
    messages=[
        {"role": "system", "content": policy_text},
        {"role": "user", "content": user_input},
    ],
)
```

## Built-in agentic models

Use `groq/compound` or `groq/compound-mini` for server-side web search and code execution — not deprecated `compound-beta`.
