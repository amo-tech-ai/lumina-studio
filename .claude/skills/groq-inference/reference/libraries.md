---
parent: groq-inference
title: Client Libraries (GroqDocs)
description: Official Python (groq) and TypeScript (groq-sdk) install + hello-world patterns. Community libs listed but unverified.
load_when: pip install groq, npm install groq-sdk, AsyncGroq, community groq client library
tags: groq, sdk, python, typescript, groq-sdk
source: https://console.groq.com/docs/libraries
---

# Groq Client Libraries

Groq provides both a Python and JavaScript/Typescript client library.

## [Groq Python Library](#groq-python-library)

The [Groq Python library](https://pypi.org/project/groq/) provides convenient access to the Groq REST API from any Python 3.7+ application. The library includes type definitions for all request params and response fields, and offers both synchronous and asynchronous clients.

### [Installation](#installation)

shell

```
pip install groq
```

### [Usage](#usage)

Use the library and your secret key to run:

Python

```
import os

from groq import Groq

client = Groq(
    # This is the default and can be omitted
    api_key=os.environ.get("GROQ_API_KEY"),
)

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "system",
            "content": "You are a helpful assistant."
        },
        {
            "role": "user",
            "content": "Explain the importance of fast language models",
        }
    ],
    model="llama-3.3-70b-versatile",
)

print(chat_completion.choices[0].message.content)
```

While you can provide an `api_key` keyword argument, we recommend using [python-dotenv](https://github.com/theskumar/python-dotenv) to add `GROQ_API_KEY="My API Key"` to your `.env` file so that your API Key is not stored in source control.

The following response is generated:

JSON

```
{
  "id": "34a9110d-c39d-423b-9ab9-9c748747b204",
  "object": "chat.completion",
  "created": 1708045122,
  "model": "mixtral-8x7b-32768",
  "system_fingerprint": "fp_dbffcd8265",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Low latency Large Language Models (LLMs) are important in the field of artificial intelligence and natural language processing (NLP) for several reasons:\n\n1. Real-time applications: Low latency LLMs are essential for real-time applications such as chatbots, voice assistants, and real-time translation services. These applications require immediate responses, and high latency can lead to a poor user experience.\n\n2. Improved user experience: Low latency LLMs provide a more seamless and responsive user experience. Users are more likely to continue using a service that provides quick and accurate responses, leading to higher user engagement and satisfaction.\n\n3. Competitive advantage: In today's fast-paced digital world, businesses that can provide quick and accurate responses to customer inquiries have a competitive advantage. Low latency LLMs can help businesses respond to customer inquiries more quickly, potentially leading to increased sales and customer loyalty.\n\n4. Better decision-making: Low latency LLMs can provide real-time insights and recommendations, enabling businesses to make better decisions more quickly. This can be particularly important in industries such as finance, healthcare, and logistics, where quick decision-making can have a significant impact on business outcomes.\n\n5. Scalability: Low latency LLMs can handle a higher volume of requests, making them more scalable than high-latency models. This is particularly important for businesses that experience spikes in traffic or have a large user base.\n\nIn summary, low latency LLMs are essential for real-time applications, providing a better user experience, enabling quick decision-making, and improving scalability. As the demand for real-time NLP applications continues to grow, the importance of low latency LLMs will only become more critical."
      },
      "finish_reason": "stop",
      "logprobs": null
    }
  ],
  "usage": {
    "prompt_tokens": 24,
    "completion_tokens": 377,
    "total_tokens": 401,
    "prompt_time": 0.009,
    "completion_time": 0.774,
    "total_time": 0.783
  },
  "x_groq": {
    "id": "req_01htzpsmfmew5b4rbmbjy2kv74"
  }
}
```

## [Groq JavaScript Library](#groq-javascript-library)

The [Groq JavaScript library](https://www.npmjs.com/package/groq-sdk) provides convenient access to the Groq REST API from server-side TypeScript or JavaScript. The library includes type definitions for all request params and response fields, and offers both synchronous and asynchronous clients.

### [Installation](#installation)

shell

```
npm install --save groq-sdk
```

### [Usage](#usage)

Use the library and your secret key to run:

JavaScript

```
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function main() {
  const chatCompletion = await getGroqChatCompletion();
  // Print the completion returned by the LLM.
  console.log(chatCompletion.choices[0]?.message?.content || "");
}

export async function getGroqChatCompletion() {
  return groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: "Explain the importance of fast language models",
      },
    ],
    model: "openai/gpt-oss-20b",
  });
}
```

The following response is generated:

JSON

```
{
  "id": "34a9110d-c39d-423b-9ab9-9c748747b204",
  "object": "chat.completion",
  "created": 1708045122,
  "model": "mixtral-8x7b-32768",
  "system_fingerprint": "fp_dbffcd8265",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Low latency Large Language Models (LLMs) are important in the field of artificial intelligence and natural language processing (NLP) for several reasons:\n\n1. Real-time applications: Low latency LLMs are essential for real-time applications such as chatbots, voice assistants, and real-time translation services. These applications require immediate responses, and high latency can lead to a poor user experience.\n\n2. Improved user experience: Low latency LLMs provide a more seamless and responsive user experience. Users are more likely to continue using a service that provides quick and accurate responses, leading to higher user engagement and satisfaction.\n\n3. Competitive advantage: In today's fast-paced digital world, businesses that can provide quick and accurate responses to customer inquiries have a competitive advantage. Low latency LLMs can help businesses respond to customer inquiries more quickly, potentially leading to increased sales and customer loyalty.\n\n4. Better decision-making: Low latency LLMs can provide real-time insights and recommendations, enabling businesses to make better decisions more quickly. This can be particularly important in industries such as finance, healthcare, and logistics, where quick decision-making can have a significant impact on business outcomes.\n\n5. Scalability: Low latency LLMs can handle a higher volume of requests, making them more scalable than high-latency models. This is particularly important for businesses that experience spikes in traffic or have a large user base.\n\nIn summary, low latency LLMs are essential for real-time applications, providing a better user experience, enabling quick decision-making, and improving scalability. As the demand for real-time NLP applications continues to grow, the importance of low latency LLMs will only become more critical."
      },
      "finish_reason": "stop",
      "logprobs": null
    }
  ],
  "usage": {
    "prompt_tokens": 24,
    "completion_tokens": 377,
    "total_tokens": 401,
    "prompt_time": 0.009,
    "completion_time": 0.774,
    "total_time": 0.783
  },
  "x_groq": {
    "id": "req_01htzpsmfmew5b4rbmbjy2kv74"
  }
}
```

## [Groq Community Libraries](#groq-community-libraries)

Groq encourages our developer community to build on our SDK. If you would like your library added, please fill out this [form](https://docs.google.com/forms/d/e/1FAIpQLSfkg3rPUnmZcTwRAS-MsmVHULMtD2I8LwsKPEasuqSsLlF0yA/viewform?usp=sf%5Flink).

Please note that Groq does not verify the security of these projects. **Use at your own risk.**

### [C#](#c)

* [jgravelle.GroqAPILibrary](https://github.com/jgravelle/GroqApiLibrary) by [jgravelle](https://github.com/jgravelle)

### [Dart/Flutter](#dartflutter)

* [TAGonSoft.groq-dart](https://github.com/TAGonSoft/groq-dart) by [TAGonSoft](https://github.com/TAGonSoft)

### [PHP](#php)

* [lucianotonet.groq-php](https://github.com/lucianotonet/groq-php) by [lucianotonet](https://github.com/lucianotonet)

### [Ruby](#ruby)

* [drnic.groq-ruby](https://github.com/drnic/groq-ruby) by [drnic](https://github.com/drnic)