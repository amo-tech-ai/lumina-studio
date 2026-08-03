# Shared prompt snippets

Copy into Linear issues or chat. Keep responses short (tables + verdict).

## Research-first (prefix every implementation task)

```xml
<instructions>
Research first. Do not write production code until you output a recommendation.
Follow: official docs → GitHub examples → templates/recipes → iPix code → Dashboard/CLI → small custom.
</instructions>
```

## Response shape

```xml
<output_format>
Be concise. Prefer tables. Lead with a one-line verdict.
Use sections: Verdict · Evidence · Approach · Risks · Next steps.
No essays. No bare issue IDs — use IPI-NNN · SPEC — Title.
</output_format>
```

## Platform-first gate

```xml
<constraints>
Custom code is last. If Dashboard, CLI, MCP, or an official template solves it, use that.
One concern per PR. Never mix docs and production code.
</constraints>
```

## Real-world test footer

```xml
<validation>
After code: test on localhost:3002 with qa@ipix.test; smoke ipix.co if safe;
exercise agent if relevant; list Problems · Improvements · Suggestions.
</validation>
```
