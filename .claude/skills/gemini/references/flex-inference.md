---
parent: gemini
title: Flex Inference
description: Preview Flex API tier — 50% cost reduction, best-effort latency, timeouts, and rate-limit behavior.
load_when: flex inference, cost reduction, batch-like latency, preview API
tags: gemini, flex-inference, pricing, preview
---

> [!WARNING]
> **Preview:** The Gemini Flex API is in [Preview](https://cloud.google.com/products#product-launch-stages).

The Gemini Flex API is an inference tier that offers a 50% cost reduction
compared to standard rates, in exchange for variable latency and best-effort
availability. It's designed for latency-tolerant workloads that require
synchronous processing but don't need the real-time performance of the standard
API.

## How to use Flex

To use the Flex tier, specify the `service_tier` as `flex` in the
request body. By default, requests use the standard tier if this field is
omitted.

### Python

    from google import genai

    client = genai.Client()

    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents="Analyze this dataset for trends...",
            config={"service_tier": "flex"},
        )
        print(response.text)
    except Exception as e:
        print(f"Flex request failed: {e}")

### JavaScript

    import {GoogleGenAI} from '@google/genai';

    const ai = new GoogleGenAI({});

    async function main() {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: "Analyze this dataset for trends...",
          config: { serviceTier: "flex" },
        });
        console.log(response.text);
      } catch (e) {
        console.log(`Flex request failed: ${e}`);
      }
    }

    await main();

### Go

    package main

    import (
        "context"
        "fmt"
        "log"
        "google.golang.org/genai"
    )

    func main() {
        ctx := context.Background()
        client, err := genai.NewClient(ctx, nil)
        if err != nil {
            log.Fatal(err)
        }

        result, err := client.Models.GenerateContent(
            ctx,
            "gemini-3.5-flash",
            genai.Text("Analyze this dataset for trends..."),
            &genai.GenerateContentConfig{
                ServiceTier: "flex",
            },
        )
        if err != nil {
            log.Printf("Flex request failed: %v", err)
            return
        }
        fmt.Println(result.Text())
    }

### REST

    curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=$GEMINI_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "contents": [{
        "parts":[{"text": "Summarize the latest research on quantum computing."}]
      }],
      "service_tier": "flex"
    }'

## How Flex inference works

Gemini Flex inference bridges the gap between the standard API and the 24-hour
turnaround of the [Batch API](https://ai.google.dev/gemini-api/docs/batch-api). It utilizes off-peak,
"sheddable" compute capacity to provide a cost-effective solution for background
tasks and sequential workflows.

| Feature | Flex | Priority | Standard | Batch |
|---|---|---|---|---|
| **Pricing** | 50% discount | 75-100% more than Standard | Full price | 50% discount |
| **Latency** | Minutes (1--15 min target) | Low (Seconds) | Seconds to minutes | Up to 24 hours |
| **Reliability** | Best-effort (Sheddable) | High (Non-sheddable) | High / Medium-high | High (for throughput) |
| **Interface** | Synchronous | Synchronous | Synchronous | Asynchronous |

### Key benefits

- **Cost efficiency**: Substantial savings for non-production evals, background agents, and data enrichment.
- **Low friction**: No need to manage batch objects, job IDs, or polling; simply add a single parameter to your existing requests.
- **Synchronous workflows**: Ideal for sequential API chains where the next request depends on the output of the previous one, making it more flexible than Batch for agentic workflows.

### Use cases

- **Offline evaluations**: Running "LLM-as-a-judge" regression tests or leaderboards.
- **Background agents**: Sequential tasks like CRM updates, profile building, or content moderation where minutes of delay are acceptable.
- **Budget-constrained research**: Academic experiments that require high token volume on a limited budget.

### Rate limits

Flex inference traffic counts towards your general [rate limits](https://aistudio.google.com/rate-limit); it doesn't
offer extended rate limits like the [Batch API](https://ai.google.dev/gemini-api/docs/batch-api).

### Sheddable capacity

Flex traffic is treated with lower priority. If there is a spike in
standard traffic, Flex requests may be preempted or evicted to ensure capacity
for high-priority users. If you're looking for high-priority inference, check
[Priority inference](https://ai.google.dev/gemini-api/docs/priority-inference)

### Error codes

When Flex capacity is unavailable or the system is congested, the API will
return standard error codes:

- **503 Service Unavailable**: The system is currently at capacity.
- **429 Too Many Requests**: Rate limits or resource exhaustion.

### Client responsibility

- **No server-side fallback**: To prevent unexpected charges, the system won't automatically upgrade a Flex request to the Standard tier if Flex capacity is full.
- **Retries**: You must implement your own client-side retry logic with exponential backoff.
- **Timeouts**: Because Flex requests may sit in a queue, we recommend increasing client-side timeouts to 10 minutes or more to avoid premature connection closure.

## Adjust timeout windows

You can configure per-request timeouts for the REST API and client libraries,
and global timeouts only when using the client libraries.

Always ensure your client-side timeout covers the intended server patience
window (e.g., 600s+ for Flex wait queues). The SDKs expect timeout values in
milliseconds.

### Per-request timeouts

### Python

    from google import genai

    client = genai.Client()

    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents="why is the sky blue?",
            config={
                "service_tier": "flex",
                "http_options": {"timeout": 900000}
            },
        )
    except Exception as e:
        print(f"Flex request failed: {e}")

    # Example with streaming
    try:
        response = client.models.generate_content_stream(
            model="gemini-3.5-flash",
            contents=["List 5 ideas for a sci-fi movie."],
            config={
                "service_tier": "flex",
                "http_options": {"timeout": 60000}
            }
            # Per-request timeout for the streaming operation
        )
        for chunk in response:
            print(chunk.text, end="")

    except Exception as e:
        print(f"An error occurred during streaming: {e}")

### JavaScript

     import {GoogleGenAI} from '@google/genai';

     const client = new GoogleGenAI({});

     async function main() {
         try {
             const response = await client.models.generateContent({
                 model: "gemini-3.5-flash",
                 contents: "why is the sky blue?",
                 config: {
                   serviceTier: "flex",
                   httpOptions: {timeout: 900000}
                 },
             });
         } catch (e) {
             console.log(`Flex request failed: ${e}`);
         }

         // Example with streaming
         try {
             const response = await client.models.generateContentStream({
                 model: "gemini-3.5-flash",
                 contents: ["List 5 ideas for a sci-fi movie."],
                 config: {
                     serviceTier: "flex",
                     httpOptions: {timeout: 60000}
                 },
             });
             for await (const chunk of response.stream) {
                 process.stdout.write(chunk.text());
             }
         } catch (e) {
             console.log(`An error occurred during streaming: ${e}`);
         }
     }

     await main();

### Go

    package main

    import (
        "context"
        "fmt"
        "log"
        "time"

        "google.golang.org/api/iterator"
        "google.golang.org/genai"
    )

    func main() {
        ctx := context.Background()
        client, err := genai.NewClient(ctx, nil)
        if err != nil {
            log.Fatal(err)
        }
        defer client.Close()

        timeoutCtx, cancel := context.WithTimeout(ctx, 900*time.Second)
        defer cancel()

        _, err = client.Models.GenerateContent(
            timeoutCtx,
            "gemini-3.5-flash",
            genai.Text("why is the sky blue?"),
            &genai.GenerateContentConfig{
                ServiceTier: "flex",
            },
        )
        if err != nil {
            fmt.Printf("Flex request failed: %v\n", err)
        }

        // Example with streaming
        streamTimeoutCtx, streamCancel := context.WithTimeout(ctx, 60*time.Second)
        defer streamCancel()

        iter := client.Models.GenerateContentStream(
            streamTimeoutCtx,
            "gemini-3.5-flash",
            genai.Text("List 5 ideas for a sci-fi movie."),
            &genai.GenerateContentConfig{
                ServiceTier: "flex",
            },
        )
        for {
            response, err := iter.Next()
            if err == iterator.Done {
                break
            }
            if err != nil {
                fmt.Printf("An error occurred during streaming: %v\n", err)
                break
            }
            fmt.Print(response.Candidates[0].Content.Parts[0])
        }
    }

### REST

When making REST calls, you can control timeouts using a combination of HTTP
headers and `curl` options:

- **`X-Server-Timeout` header (server-side timeout)**: This header suggests a
  preferred timeout duration (default 600s) to the Gemini API server. The server
  will attempt to respect this, but it's not guaranteed. The value should be in
  seconds.

- **`--max-time` in `curl` (Client-Side Timeout)** : The `curl --max-time
  <seconds>` option sets a hard limit on the total time (in seconds) that `curl`
  will wait for the entire operation to complete. This is a client-side safeguard.

     # Set a server timeout hint of 120 seconds and a client-side curl timeout of 125 seconds.
     curl --max-time 125 \
       -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=$GEMINI_API_KEY" \
       -H "Content-Type: application/json" \
       -H "X-Server-Timeout: 120" \
       -d '{
       "contents": [{
         "parts":[{"text": "Summarize the latest research on quantum computing."}]
       }],
       "service_tier": "flex"
     }'

### Global timeouts

If you want all API calls made through a specific `genai.Client` instance
(client libraries only) to have a default timeout, you can configure this when
initializing the client using `http_options` and `genai.types.HttpOptions`.

### Python

    from google import genai
    from google.genai import types

    global_timeout_ms = 120000

    client_with_global_timeout = genai.Client(
        http_options=types.HttpOptions(timeout=global_timeout_ms)
    )

    try:
        # Calling generate_content using global timeout...
        response = client_with_global_timeout.models.generate_content(
            model="gemini-3.5-flash",
            contents="Summarize the history of AI development since 2000.",
            config={"service_tier": "flex"},
        )
        print(response.text)

        # A per-request timeout will *override* the global timeout for that specific call.
        shorter_timeout = 30000
        response = client_with_global_timeout.models.generate_content(
            model="gemini-3.5-flash",
            contents="Provide a very brief definition of machine learning.",
            config={
                "service_tier": "flex",
                "http_options":{"timeout": shorter_timeout}
            }  # Overrides the global timeout
        )

        print(response.text)

    except TimeoutError:
        print(
            f"A GenerateContent call timed out. Check if the global or per-request timeout was exceeded."
        )
    except Exception as e:
        print(f"An error occurred: {e}")

### JavaScript

    import {GoogleGenAI} from '@google/genai';

    const globalTimeoutMs = 120000;

    const clientWithGlobalTimeout = new GoogleGenAI({httpOptions: {timeout: globalTimeoutMs}});

    async function main() {
        try {
            // Calling generate_content using global timeout...
            const response1 = await clientWithGlobalTimeout.models.generateContent({
                model: "gemini-3.5-flash",
                contents: "Summarize the history of AI development since 2000.",
                config: { serviceTier: "flex" },
            });
            console.log(response1.text());

            // A per-request timeout will *override* the global timeout for that specific call.
            const shorterTimeout = 30000;
            const response2 = await clientWithGlobalTimeout.models.generateContent({
                model: "gemini-3.5-flash",
                contents: "Provide a very brief definition of machine learning.",
                config: {
                    serviceTier: "flex",
                    httpOptions: {timeout: shorterTimeout}
                }  // Overrides the global timeout
            });

            console.log(response2.text());

        } catch (e) {
            if (e.name === 'TimeoutError' || e.message?.includes('timeout')) {
                console.log(
                    "A GenerateContent call timed out. Check if the global or per-request timeout was exceeded."
                );
            } else {
                console.log(`An error occurred: ${e}`);
            }
        }
    }

    await main();

### Go

     package main

     import (
         "context"
         "fmt"
         "log"
         "time"

         "google.golang.org/genai"
     )

     func main() {
         ctx := context.Background()
         client, err := genai.NewClient(ctx, nil)
         if err != nil {
             log.Fatal(err)
         }
         defer client.Close()

         model := client.GenerativeModel("gemini-3.5-flash")

         // Go uses context for timeouts, not client options.
         // Set a default timeout for requests.
         globalTimeout := 120 * time.Second
         fmt.Printf("Using default timeout of %v seconds.\n", globalTimeout.Seconds())

         fmt.Println("Calling generate_content (using default timeout)...")
         ctx1, cancel1 := context.WithTimeout(ctx, globalTimeout)
         defer cancel1()
         resp1, err := model.GenerateContent(ctx1, genai.Text("Summarize the history of AI development since 2000."), &genai.GenerateContentConfig{ServiceTier: "flex"})
         if err != nil {
             log.Printf("Request 1 failed: %v", err)
         } else {
             fmt.Println("GenerateContent 1 successful.")
             fmt.Println(resp1.Text())
         }

         // A different timeout can be used for other requests.
         shorterTimeout := 30 * time.Second
         fmt.Printf("\nCalling generate_content with a shorter timeout of %v seconds...\n", shorterTimeout.Seconds())
         ctx2, cancel2 := context.WithTimeout(ctx, shorterTimeout)
         defer cancel2()
         resp2, err := model.GenerateContent(ctx2, genai.Text("Provide a very brief definition of machine learning."), &genai.GenerateContentConfig{
             ServiceTier: "flex",
         })
         if err != nil {
             log.Printf("Request 2 failed: %v", err)
         } else {
             fmt.Println("GenerateContent 2 successful.")
             fmt.Println(resp2.Text())
         }
     }

## Implement retries

Because Flex is sheddable and fails with 503 errors, here is an example of
optionally implementing retry logic to continue with failed requests:

### Python

    import time
    from google import genai

    client = genai.Client()

    def call_with_retry(max_retries=3, base_delay=5):
        for attempt in range(max_retries):
            try:
                return client.models.generate_content(
                    model="gemini-3.5-flash",
                    contents="Analyze this batch statement.",
                    config={"service_tier": "flex"},
                )
            except Exception as e:
                # Check for 503 Service Unavailable or 429 Rate Limits
                print(e.code)
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt) # Exponential Backoff
                    print(f"Flex busy, retrying in {delay}s...")
                    time.sleep(delay)
                else:
                    # Fallback to standard on last strike (Optional)
                    print("Flex exhausted, falling back to Standard...")
                    return client.models.generate_content(
                        model="gemini-3.5-flash",
                        contents="Analyze this batch statement."
                    )

    # Usage
    response = call_with_retry()
    print(response.text)

### JavaScript

     import {GoogleGenAI} from '@google/genai';

     const ai = new GoogleGenAI({});

     async function sleep(ms) {
       return new Promise(resolve => setTimeout(resolve, ms));
     }

     async function callWithRetry(maxRetries = 3, baseDelay = 5) {
       for (let attempt = 0; attempt < maxRetries; attempt++) {
         try {
           console.log(`Attempt ${attempt + 1}: Calling Flex tier...`);
           const response = await ai.models.generateContent({
             model: "gemini-3.5-flash",
             contents: "Analyze this batch statement.",
             config: { serviceTier: 'flex' },
           });
           return response;
         } catch (e) {
           if (attempt < maxRetries - 1) {
             const delay = baseDelay * (2 ** attempt);
             console.log(`Flex busy, retrying in ${delay}s...`);
             await sleep(delay * 1000);
           } else {
             console.log("Flex exhausted, falling back to Standard...");
             return await ai.models.generateContent({
               model: "gemini-3.5-flash",
               contents: "Analyze this batch statement.",
             });
           }
         }
       }
     }

     async function main() {
         const response = await callWithRetry();
         console.log(response.text);
     }

     await main();

### Go

     package main

     import (
         "context"
         "fmt"
         "log"
         "math"
         "time"

         "google.golang.org/genai"
     )

     func callWithRetry(ctx context.Context, client *genai.Client, maxRetries int, baseDelay time.Duration) (*genai.GenerateContentResponse, error) {
         modelName := "gemini-3.5-flash"
         content := genai.Text("Analyze this batch statement.")
         flexConfig := &genai.GenerateContentConfig{
             ServiceTier: "flex",
         }

         for attempt := 0; attempt < maxRetries; attempt++ {
             log.Printf("Attempt %d: Calling Flex tier...", attempt+1)
             resp, err := client.Models.GenerateContent(ctx, modelName, content, flexConfig)
             if err == nil {
                 return resp, nil
             }

             log.Printf("Attempt %d failed: %v", attempt+1, err)

             if attempt < maxRetries-1 {
                 delay := time.Duration(float64(baseDelay) * math.Pow(2, float64(attempt)))
                 log.Printf("Flex busy, retrying in %v...", delay)
                 time.Sleep(delay)
             } else {
                 log.Println("Flex exhausted, falling back to Standard...")
                 return client.Models.GenerateContent(ctx, modelName, content)
             }
         }
         return nil, fmt.Errorf("retries exhausted") // Should not be reached
     }

     func main() {
         ctx := context.Background()
         client, err := genai.NewClient(ctx, nil)
         if err != nil {
             log.Fatal(err)
         }
         defer client.Close()

         resp, err := callWithRetry(ctx, client, 3, 5*time.Second)
         if err != nil {
             log.Fatalf("Failed after retries: %v", err)
         }
         fmt.Println(resp.Text())
     }

## Pricing

Flex inference is priced at 50% of the [standard API](https://ai.google.dev/gemini-api/docs/pricing)
and billed per token.

## Supported models

The following models support Flex inference:

| Model | Flex inference |
|---|---|
| [Gemini 3.5 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash) | ✔️ |
| [Gemini 3.1 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite) | ✔️ |
| [Gemini 3.1 Pro Preview](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-pro-preview) | ✔️ |
| [Gemini 3 Flash Preview](https://ai.google.dev/gemini-api/docs/models/gemini-3-flash-preview) | ✔️ |
| [Gemini 3 Pro Image Preview](https://ai.google.dev/gemini-api/docs/models/gemini-3-pro-image-preview) | ✔️ |
| [Gemini 2.5 Pro](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-pro) | ✔️ |
| [Gemini 2.5 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash) | ✔️ |
| [Gemini 2.5 Flash Image](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-image) | ✔️ |
| [Gemini 2.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-lite) | ✔️ |

## What's next

Read about Gemini's other [inference and optimization](https://ai.google.dev/gemini-api/docs/optimization) options:

- [Priority inference](https://ai.google.dev/gemini-api/docs/priority-inference) for ultra-low latency.
- [Batch API](https://ai.google.dev/gemini-api/docs/batch-api) for asynchronous processing within 24 hours.
- [Context caching](https://ai.google.dev/gemini-api/docs/caching) for reduced input token costs.