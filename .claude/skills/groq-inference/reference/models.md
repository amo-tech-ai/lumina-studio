---
parent: groq-inference
title: Supported Models (GroqDocs)
description: Official GroqCloud model table — production/preview/deprecated IDs, speed, pricing, rate limits, context windows. Offline mirror of console.groq.com/docs/models.
load_when: model pricing, rate limits TPM RPM, production vs preview models, list models API, deprecations
tags: groq, models, pricing, rate-limits, compound
source: https://console.groq.com/docs/models
---

# Supported Models

## [Featured Models and Systems](#featured-models-and-systems)

[![Groq Compound icon](https://console.groq.com/_next/image?url=%2Fgroq-circle.png&w=96&q=75)Groq CompoundGroq Compound is an AI system powered by openly available models that intelligently and selectively uses built-in tools to answer user queries, including web search and code execution.Token Speed\~450 tpsModalitiesCapabilities](/docs/compound/systems/compound)[![OpenAI GPT-OSS 120B icon](https://console.groq.com/_next/static/media/openailogo.523c87a0.svg)OpenAI GPT-OSS 120BGPT-OSS 120B is OpenAI's flagship open-weight language model with 120 billion parameters, built in browser search and code execution, and reasoning capabilities.Token Speed\~500 tpsModalitiesCapabilities](/docs/model/openai/gpt-oss-120b)

## [Production Models](#production-models)

**Note:** Production models are intended for use in your production environments. They meet or exceed our high standards for speed, quality, and reliability. Read more [here](https://console.groq.com/docs/deprecations).

| MODEL ID                                                                                                                                 | SPEED (T/SEC) | PRICE PER 1M TOKENS      | RATE LIMITS (DEVELOPER PLAN) | CONTEXT WINDOW (TOKENS) | MAX COMPLETION TOKENS | MAX FILE SIZE |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------ | ---------------------------- | ----------------------- | --------------------- | ------------- |
| [![Meta](https://console.groq.com/_next/image?url=%2FMeta_logo.png&w=48&q=75)Llama 3.1 8B](/docs/model/llama-3.1-8b-instant)llama-3.1-8b-instant                 | 560           | $0.05 input$0.08 output  | 250K TPM1K RPM               | 131,072                 | 131,072               | \-            |
| [![Meta](https://console.groq.com/_next/image?url=%2FMeta_logo.png&w=48&q=75)Llama 3.3 70B](/docs/model/llama-3.3-70b-versatile)llama-3.3-70b-versatile          | 280           | $0.59 input$0.79 output  | 300K TPM1K RPM               | 131,072                 | 32,768                | \-            |
| [![OpenAI](https://console.groq.com/_next/static/media/openailogo.523c87a0.svg)GPT OSS 120B](/docs/model/openai/gpt-oss-120b)openai/gpt-oss-120b                 | 500           | $0.15 input$0.60 output  | 250K TPM1K RPM               | 131,072                 | 65,536                | \-            |
| [![OpenAI](https://console.groq.com/_next/static/media/openailogo.523c87a0.svg)GPT OSS 20B](/docs/model/openai/gpt-oss-20b)openai/gpt-oss-20b                    | 1000          | $0.075 input$0.30 output | 250K TPM1K RPM               | 131,072                 | 65,536                | \-            |
| [![OpenAI](https://console.groq.com/_next/static/media/openailogo.523c87a0.svg)Whisper](/docs/model/whisper-large-v3)whisper-large-v3                            | \-            | $0.111 per hour          | 200K ASH300 RPM              | \-                      | \-                    | 100 MB        |
| [![OpenAI](https://console.groq.com/_next/static/media/openailogo.523c87a0.svg)Whisper Large V3 Turbo](/docs/model/whisper-large-v3-turbo)whisper-large-v3-turbo | \-            | $0.04 per hour           | 400K ASH400 RPM              | \-                      | \-                    | \-            |

## [Production Systems](#production-systems)

Systems are a collection of models and tools that work together to answer a user query.

  
| MODEL ID                                                                                                                      | SPEED (T/SEC) | PRICE PER 1M TOKENS | RATE LIMITS (DEVELOPER PLAN) | CONTEXT WINDOW (TOKENS) | MAX COMPLETION TOKENS | MAX FILE SIZE |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------- | ---------------------------- | ----------------------- | --------------------- | ------------- |
| [![Groq](https://console.groq.com/_next/image?url=%2Fgroq-circle.png&w=48&q=75)Compound](/docs/compound/systems/compound)groq/compound                | 450           | \-                  | 200K TPM200 RPM              | 131,072                 | 8,192                 | \-            |
| [![Groq](https://console.groq.com/_next/image?url=%2Fgroq-circle.png&w=48&q=75)Compound Mini](/docs/compound/systems/compound-mini)groq/compound-mini | 450           | \-                  | 200K TPM200 RPM              | 131,072                 | 8,192                 | \-            |

  
[Learn More About Agentic ToolingDiscover how to build powerful applications with real-time web search and code execution](https://console.groq.com/docs/agentic-tooling) 

## [Preview Models](#preview-models)

**Note:** Preview models are intended for evaluation purposes only and should not be used in production environments as they may be discontinued at short notice. Read more about deprecations [here](https://console.groq.com/docs/deprecations).

| MODEL ID                                                                                                                                                                    | SPEED (T/SEC) | PRICE PER 1M TOKENS      | RATE LIMITS (DEVELOPER PLAN) | CONTEXT WINDOW (TOKENS) | MAX COMPLETION TOKENS | MAX FILE SIZE |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------ | ---------------------------- | ----------------------- | --------------------- | ------------- |
| [![Canopy Labs](https://console.groq.com/_next/image?url=%2Fcanopylabs.png&w=48&q=75)Canopy Labs Orpheus Arabic Saudi](/docs/model/canopylabs/orpheus-arabic-saudi)canopylabs/orpheus-arabic-saudi  | \-            | $40.00 per 1M characters | 50K TPM250 RPM               | 4,000                   | 50,000                | \-            |
| [![Canopy Labs](https://console.groq.com/_next/image?url=%2Fcanopylabs.png&w=48&q=75)Canopy Labs Orpheus V1 English](/docs/model/canopylabs/orpheus-v1-english)canopylabs/orpheus-v1-english        | \-            | $22.00 per 1M characters | 50K TPM250 RPM               | 4,000                   | 50,000                | \-            |
| [![Meta](https://console.groq.com/_next/image?url=%2FMeta_logo.png&w=48&q=75)Llama 4 Scout 17B 16E](/docs/model/meta-llama/llama-4-scout-17b-16e-instruct)meta-llama/llama-4-scout-17b-16e-instruct | 750           | $0.11 input$0.34 output  | 300K TPM1K RPM               | 131,072                 | 8,192                 | 20 MB         |
| [![Meta](https://console.groq.com/_next/image?url=%2FMeta_logo.png&w=48&q=75)Llama Prompt Guard 2 22M](/docs/model/meta-llama/llama-prompt-guard-2-22m)meta-llama/llama-prompt-guard-2-22m          | \-            | $0.03 input$0.03 output  | 30K TPM100 RPM               | 512                     | 512                   | \-            |
| [![Meta](https://console.groq.com/_next/image?url=%2FMeta_logo.png&w=48&q=75)Prompt Guard 2 86M](/docs/model/meta-llama/llama-prompt-guard-2-86m)meta-llama/llama-prompt-guard-2-86m                | \-            | $0.04 input$0.04 output  | 30K TPM100 RPM               | 512                     | 512                   | \-            |
| [![OpenAI](https://console.groq.com/_next/static/media/openailogo.523c87a0.svg)Safety GPT OSS 20B](/docs/model/openai/gpt-oss-safeguard-20b)openai/gpt-oss-safeguard-20b                            | 1000          | $0.075 input$0.30 output | 150K TPM1K RPM               | 131,072                 | 65,536                | \-            |
| [![Alibaba Cloud](https://console.groq.com/_next/image?url=%2Fqwen_logo.png&w=48&q=75)Qwen3-32B](/docs/model/qwen/qwen3-32b)qwen/qwen3-32b                                                          | 400           | $0.29 input$0.59 output  | 300K TPM1K RPM               | 131,072                 | 40,960                | \-            |
| [![Alibaba Cloud](https://console.groq.com/_next/image?url=%2Fqwen_logo.png&w=48&q=75)Qwen/Qwen3.6-27B](/docs/model/qwen/qwen3.6-27b)qwen/qwen3.6-27b                                               | 500           | $0.60 input$3.00 output  | 250K TPM1K RPM               | 131,072                 | 32,768                | 20 MB         |

## [Deprecated Models](#deprecated-models)

Deprecated models are models that are no longer supported or will no longer be supported in the future. See our deprecation guidelines and deprecated models [here](https://console.groq.com/docs/deprecations).

## [Get All Available Models](#get-all-available-models)

Hosted models are directly accessible through the GroqCloud Models API endpoint using the model IDs mentioned above. You can use the `https://api.groq.com/openai/v1/models` endpoint to return a JSON list of all active models:

Python

```
curl -X GET "https://api.groq.com/openai/v1/models" \
     -H "Authorization: Bearer $GROQ_API_KEY" \
     -H "Content-Type: application/json"
```

```
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const getModels = async () => {
  return await groq.models.list();
};

getModels().then((models) => {
  // console.log(models);
});
```

```
import requests
import os

api_key = os.environ.get("GROQ_API_KEY")
url = "https://api.groq.com/openai/v1/models"

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

response = requests.get(url, headers=headers)

print(response.json())
```