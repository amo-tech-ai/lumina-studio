---
parent: groq-inference
title: Structured Outputs
description: JSON schema mode, strict compliance, Pydantic/Zod patterns on Groq chat completions.
load_when: json_schema, strict true, response_format, structured extraction, pydantic on groq
tags: groq, structured-output, json-schema, pydantic
---

# Groq Structured Outputs

Force model output to match a JSON Schema via `response_format`.

## Modes

| Mode | Guarantee | Models |
|------|-----------|--------|
| `strict: true` | 100% schema compliance | `openai/gpt-oss-20b`, `openai/gpt-oss-120b` |
| `strict: false` | Best-effort | Other supported models |
| `type: json_object` | Valid JSON object, no schema | Most chat models |

**Mutually exclusive with:** `stream: true`, `tools` / function calling.

## Strict schema example

```python
response = client.chat.completions.create(
    model="openai/gpt-oss-20b",
    messages=[{"role": "user", "content": "Extract: John is 30 years old"}],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "person",
            "strict": True,
            "schema": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "age": {"type": "integer"},
                },
                "required": ["name", "age"],
                "additionalProperties": False,
            },
        },
    },
)
```

## With Pydantic

```python
from pydantic import BaseModel
import json

class Person(BaseModel):
    name: str
    age: int

response = client.chat.completions.create(
    model="openai/gpt-oss-20b",
    messages=[{"role": "user", "content": "Extract: John is 30"}],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "person",
            "strict": True,
            "schema": Person.model_json_schema(),
        },
    },
)
person = Person.model_validate(json.loads(response.choices[0].message.content))
```

## iPix notes

- Brand intelligence structured payloads: prefer gpt-oss strict tier per [`tasks/llm/groq-plan.md`](../../../../tasks/llm/groq-plan.md).
- Log `x_groq.id` on production BI calls for traceability.
- Baseline golden JSON from Gemini lives in IPI-355 before Groq parity gates.
