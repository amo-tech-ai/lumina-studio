# Prompting Best Practices for StartupAI

**Version:** 1.0 | **Date:** January 15, 2026
**Purpose:** Guidelines for crafting effective AI prompts in the StartupAI platform

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Prompt Structure](#prompt-structure)
3. [Techniques by Priority](#techniques-by-priority)
4. [XML Tags](#xml-tags)
5. [Chain of Thought](#chain-of-thought)
6. [Examples (Multishot)](#examples-multishot)
7. [Role Prompting](#role-prompting)
8. [Prefilling Responses](#prefilling-responses)
9. [Prompt Chaining](#prompt-chaining)
10. [Reducing Hallucinations](#reducing-hallucinations)
11. [Output Consistency](#output-consistency)
12. [Testing & Evaluation](#testing--evaluation)
13. [StartupAI-Specific Patterns](#startupai-specific-patterns)

---

## Core Principles

### The Golden Rule
> Show your prompt to a colleague with minimal context. If they're confused, Claude will be too.

### When to Use Prompt Engineering vs Fine-tuning

| Factor | Prompt Engineering | Fine-tuning |
|--------|-------------------|-------------|
| Speed | Instant results | Hours/days |
| Cost | Uses base model | Significant compute |
| Flexibility | Quick iteration | Requires retraining |
| Data needs | Zero to few-shot | Large labeled datasets |
| Model updates | Works across versions | May need retraining |

**Recommendation:** Always start with prompt engineering. Only consider fine-tuning after exhausting prompt optimization.

---

## Prompt Structure

### Template Pattern
```
Fixed content (static instructions) + Variable content (dynamic data)
```

### Variable Placeholders
Use `{{VARIABLE_NAME}}` for dynamic content:
```
Analyze this startup profile: {{STARTUP_DATA}}
Focus on: {{ANALYSIS_FOCUS}}
```

### Benefits of Templates
- **Consistency**: Uniform structure across interactions
- **Testability**: Easily swap variable content
- **Scalability**: Manage complexity as app grows
- **Version control**: Track changes to core prompts

---

## Techniques by Priority

Apply these techniques in order (most to least broadly effective):

| Priority | Technique | When to Use |
|----------|-----------|-------------|
| 1 | Be clear and direct | Always |
| 2 | Use examples (multishot) | Tasks needing specific formats |
| 3 | Chain of thought | Complex reasoning tasks |
| 4 | XML tags | Multi-component prompts |
| 5 | Role prompting | Domain-specific expertise |
| 6 | Prefill responses | Output format control |
| 7 | Prompt chaining | Multi-step workflows |

---

## XML Tags

### Why Use XML Tags?
- **Clarity**: Separate instructions, context, examples
- **Accuracy**: Prevent mixing up prompt components
- **Parseability**: Easy to extract specific parts from responses
- **Flexibility**: Add/remove sections without rewriting

### Common Tags
```xml
<instructions>Step-by-step task instructions</instructions>
<context>Background information</context>
<data>Input data to process</data>
<example>Sample input/output pair</example>
<thinking>Claude's reasoning (for CoT)</thinking>
<answer>Final response</answer>
<findings>Analysis results</findings>
<recommendations>Action items</recommendations>
```

### Best Practices
1. **Be consistent**: Use same tag names throughout
2. **Nest hierarchically**: `<outer><inner></inner></outer>`
3. **Reference by name**: "Using the data in `<startup>` tags..."

### Example: Structured Analysis
```xml
You're a startup advisor. Analyze this startup profile.

<startup>
{{STARTUP_DATA}}
</startup>

<instructions>
1. Identify 3 key strengths
2. Identify 3 risks
3. Provide 2 actionable recommendations
</instructions>

Output your analysis in <findings> tags, then recommendations in <recommendations> tags.
```

---

## Chain of Thought

### When to Use CoT
- Complex math or logic
- Multi-step analysis
- Decisions with many factors
- Tasks requiring reasoning trail

### When NOT to Use CoT
- Simple lookups or transformations
- Latency-sensitive applications
- Tasks with clear-cut answers

### CoT Levels

**Basic**: Add "Think step-by-step"
```
Analyze this deal pipeline. Think step-by-step.
```

**Guided**: Specify reasoning steps
```
Think before answering:
1. First, consider the startup's stage
2. Then, evaluate their traction metrics
3. Finally, compare to industry benchmarks
```

**Structured**: Use XML for separation
```
Think through your analysis in <thinking> tags.
Then provide your final answer in <answer> tags.
```

### Example: Financial Analysis with CoT
```
You're a financial advisor. A startup wants to raise $2M.

<data>
{{TRACTION_DATA}}
</data>

Think step-by-step in <thinking> tags:
1. Analyze their current metrics (MRR, growth, churn)
2. Compare to benchmarks for their stage
3. Evaluate if $2M valuation is justified
4. Identify risks for investors

Then provide your recommendation in <answer> tags.
```

---

## Examples (Multishot)

### Why Use Examples?
- **Accuracy**: Reduces misinterpretation
- **Consistency**: Enforces uniform structure
- **Performance**: Boosts complex task handling

### Crafting Effective Examples
- **Relevant**: Mirror actual use cases
- **Diverse**: Cover edge cases
- **Clear**: Wrap in `<example>` tags

### Recommended: 3-5 Examples
```xml
<examples>
<example>
Input: "Our MRR is $50K with 15% monthly growth"
Output: {"health": "strong", "score": 85, "signal": "growth_trajectory"}
</example>

<example>
Input: "We have 10 users, no revenue yet"
Output: {"health": "early", "score": 30, "signal": "pre_revenue"}
</example>

<example>
Input: "MRR dropped from $100K to $60K this quarter"
Output: {"health": "at_risk", "score": 40, "signal": "revenue_decline"}
</example>
</examples>

Now analyze: {{USER_INPUT}}
```

---

## Role Prompting

### Why Use Roles?
- **Enhanced accuracy**: Domain expertise mode
- **Tailored tone**: Match communication style
- **Improved focus**: Stay within task bounds

### Implementation
Use the `system` parameter for roles:
```python
response = client.messages.create(
    model="claude-sonnet-4-5",
    system="You are a seasoned startup advisor with 20 years of experience in SaaS companies.",
    messages=[{"role": "user", "content": "Analyze this startup's metrics..."}]
)
```

### StartupAI Role Examples

**Risk Analyzer**
```
You are a Risk Intelligence Analyst specializing in early-stage startups.
Your job is to identify potential risks that could derail a startup's growth.
Focus on: market risks, execution risks, financial risks, and team risks.
Be direct and specific. Founders need actionable insights, not generic warnings.
```

**Task Generator**
```
You are a Startup Execution Coach with expertise in helping founders prioritize.
Your task is to generate specific, actionable tasks based on the startup's current stage and goals.
Each task should have: clear action, specific outcome, and realistic timeline.
Prioritize ruthlessly. Founders have limited time.
```

**Deal Scorer**
```
You are an experienced VC Associate evaluating investment opportunities.
Score deals based on: team, market, traction, defensibility, and terms.
Be objective and data-driven. Flag both opportunities and red flags.
```

---

## Prefilling Responses

### Use Cases
- **Skip preamble**: Force direct output
- **Enforce format**: Start with `{` for JSON
- **Maintain character**: Keep role consistency

### JSON Output
```python
messages=[
    {"role": "user", "content": "Extract startup info as JSON..."},
    {"role": "assistant", "content": "{"}  # Prefill forces JSON
]
```

### Structured Output
```python
messages=[
    {"role": "user", "content": "Analyze the risks..."},
    {"role": "assistant", "content": "<analysis>\n<risks>"}  # Prefill structure
]
```

### Important
- Prefill cannot end with whitespace
- Not supported with extended thinking mode

---

## Prompt Chaining

### When to Chain
- Multi-step workflows
- Complex analysis requiring multiple passes
- Tasks with distinct subtasks
- Self-correction needs

### Benefits
- **Accuracy**: Full attention per subtask
- **Clarity**: Simpler instructions per step
- **Traceability**: Pinpoint issues easily

### Chain Pattern
```
Prompt 1: Extract data → Output A
Prompt 2: Analyze Output A → Output B
Prompt 3: Generate recommendations from Output B → Final
```

### StartupAI Chain Example

**Step 1: Extract Startup Profile**
```xml
Extract key information from this startup's website.

<url_content>{{SCRAPED_CONTENT}}</url_content>

Output in <profile> tags with: name, description, industry, business_model, team_size.
```

**Step 2: Analyze Risks**
```xml
Analyze risks for this startup profile.

<profile>{{PROFILE_FROM_STEP_1}}</profile>

Consider: market risks, execution risks, financial risks.
Output in <risks> tags.
```

**Step 3: Generate Tasks**
```xml
Generate priority tasks based on this risk analysis.

<risks>{{RISKS_FROM_STEP_2}}</risks>

Create 5 specific tasks to mitigate the top risks.
Output in <tasks> tags with priority (high/medium/low).
```

### Self-Correction Chain
```
Prompt 1: Generate analysis
Prompt 2: Review analysis for errors
Prompt 3: Refine based on review
```

---

## Reducing Hallucinations

### Core Strategies

1. **Allow "I don't know"**
```
If you're unsure about any aspect or lack necessary information,
say "I don't have enough information to assess this confidently."
```

2. **Use Direct Quotes**
```
First, extract exact quotes from the document that support your analysis.
Then, reference those quotes by number in your response.
Only base your analysis on the extracted quotes.
```

3. **Verify with Citations**
```
After your analysis, review each claim. For each claim:
- Find a direct quote from the documents that supports it
- If you can't find a supporting quote, remove the claim
- Mark removed claims with empty [] brackets
```

4. **Restrict to Provided Context**
```
Use ONLY information from the provided documents.
Do not use your general knowledge.
If the documents don't contain the answer, say so.
```

### Advanced Techniques
- **Chain-of-thought verification**: Reveal reasoning step-by-step
- **Best-of-N verification**: Run multiple times, compare outputs
- **Iterative refinement**: Use outputs as inputs for follow-up prompts

---

## Output Consistency

### Specify Format Precisely
```xml
Output in JSON format with these exact keys:
- "sentiment": one of ["positive", "negative", "neutral"]
- "confidence": number between 0 and 1
- "key_points": array of strings (max 5)
- "action_required": boolean
```

### Use Prefill for Structure
```python
messages=[
    {"role": "user", "content": "Analyze this feedback..."},
    {"role": "assistant", "content": '{"sentiment":'}
]
```

### Constrain with Examples
```xml
Output following this exact format:

<example>
Input: "Great product, fast shipping"
Output: {"sentiment": "positive", "confidence": 0.95, "topics": ["product", "shipping"]}
</example>

Now analyze: {{INPUT}}
```

### Use Retrieval for Context
```xml
You're an AI assistant. Only use information from this knowledge base:

<knowledge_base>
{{KB_ENTRIES}}
</knowledge_base>

When answering, cite the KB entry ID used.
If the answer isn't in the KB, say "I don't have information about that."
```

---

## Testing & Evaluation

### Define Success Criteria (SMART)
- **Specific**: "Accurate sentiment classification" not "good performance"
- **Measurable**: F1 score >= 0.85, response time < 200ms
- **Achievable**: Based on current model capabilities
- **Relevant**: Aligned with user needs

### Common Metrics

| Criteria | Metric | Method |
|----------|--------|--------|
| Task fidelity | F1 score, accuracy | Exact match |
| Consistency | Cosine similarity | Embedding comparison |
| Relevance | ROUGE-L | Text overlap |
| Tone | Likert scale (1-5) | LLM grading |
| Latency | Response time (ms) | Timing |
| Safety | Toxicity % | Content filter |

### Eval Design Principles
1. **Be task-specific**: Mirror real-world distribution
2. **Include edge cases**: Irrelevant inputs, ambiguous cases
3. **Automate grading**: Prefer automated over manual
4. **Prioritize volume**: More tests > perfect tests

### Grading Methods (fastest to slowest)
1. **Code-based**: Exact match, string match
2. **LLM-based**: Fast, flexible, scalable
3. **Human**: Most accurate, but slow and expensive

---

## StartupAI-Specific Patterns

### AI Agent System Prompts

**ProfileExtractor Agent**
```
You are a Startup Profile Extraction Agent for StartupAI.

Your task is to extract structured startup information from unstructured sources (websites, documents, pitch decks).

<instructions>
1. Extract: name, description, industry, stage, business_model, team_size, traction_metrics
2. For missing fields, output null (don't hallucinate)
3. Confidence score (0-1) for each extracted field
4. Flag fields that need verification
</instructions>

<output_format>
{
  "startup": {...},
  "confidence": {...},
  "needs_verification": [...]
}
</output_format>
```

**RiskAnalyzer Agent**
```
You are a Startup Risk Analyzer for StartupAI.

Your task is to identify and score risks based on startup data.

<risk_categories>
- market_risk: TAM too small, competition, timing
- execution_risk: Team gaps, technical complexity
- financial_risk: Burn rate, runway, unit economics
- regulatory_risk: Compliance, legal exposure
</risk_categories>

<instructions>
1. Score each category: low (1-3), medium (4-6), high (7-10)
2. Provide specific evidence for each score
3. Suggest mitigation actions for high risks
</instructions>

<output_format>
{
  "risks": [
    {"category": "...", "score": N, "evidence": "...", "mitigation": "..."}
  ],
  "overall_risk_score": N,
  "recommendation": "..."
}
</output_format>
```

**TaskGenerator Agent**
```
You are a Startup Task Generator for StartupAI.

Your task is to generate actionable tasks based on startup context and goals.

<principles>
- Tasks must be SPECIFIC (not vague)
- Tasks must be ACTIONABLE (clear next step)
- Tasks must be PRIORITIZED (high/medium/low)
- Tasks should have DEADLINES (suggested timeframe)
</principles>

<instructions>
1. Analyze the startup's current stage and goals
2. Generate 5-10 tasks sorted by priority
3. Each task: title, description, category, priority, suggested_deadline
4. Link tasks to specific risks or goals when possible
</instructions>
```

### Wizard Prompts

**Step 1: Profile Extraction**
```xml
Extract startup profile from this content.

<content>
{{WEBSITE_CONTENT}}
</content>

<extraction_fields>
- name: Company name
- description: What they do (2-3 sentences)
- industry: Primary industry
- business_model: How they make money
- target_customers: Who they serve
</extraction_fields>

Output in <profile> tags. For uncertain fields, add "?" suffix.
```

**Step 2: Diagnostic Analysis**
```xml
Analyze this startup's readiness based on their metrics.

<profile>{{EXTRACTED_PROFILE}}</profile>

<metrics>{{TRACTION_METRICS}}</metrics>

<industry_benchmarks>{{BENCHMARKS}}</industry_benchmarks>

<instructions>
1. Compare metrics to benchmarks
2. Identify signals (positive/negative)
3. Calculate readiness score (0-100)
4. Provide specific feedback
</instructions>
```

### Edge Function Prompt Pattern
```javascript
// ai-helper edge function prompt construction
const buildPrompt = (action, context, input) => {
  const systemPrompt = AGENT_PROMPTS[action];

  return {
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `
<context>
startup_id: ${context.startup_id}
user_id: ${context.user_id}
timestamp: ${new Date().toISOString()}
</context>

<input>
${JSON.stringify(input, null, 2)}
</input>

Execute the ${action} action and return structured results.
        `
      }
    ]
  };
};
```

---

## Quick Reference

### Prompt Checklist
- [ ] Clear, specific instructions
- [ ] Context provided (who, what, why)
- [ ] Output format specified
- [ ] Examples included (if complex)
- [ ] XML tags for structure
- [ ] Edge cases considered
- [ ] "I don't know" allowed

### Common Mistakes
1. Vague instructions ("analyze this")
2. No output format specified
3. Missing context
4. Too many tasks in one prompt
5. Not allowing uncertainty
6. No examples for complex formats

### Token Optimization
- Front-load important instructions
- Use XML to separate variable content
- Remove redundant context
- Chain prompts instead of mega-prompts

---

## References

- [Anthropic Prompt Engineering Guide](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering)
- [Anthropic Interactive Tutorial](https://github.com/anthropics/prompt-eng-interactive-tutorial)
- [Claude API Documentation](https://docs.anthropic.com/en/api)

---

**Last Updated:** January 15, 2026
**Owner:** Engineering Team
**Review Cycle:** Quarterly
