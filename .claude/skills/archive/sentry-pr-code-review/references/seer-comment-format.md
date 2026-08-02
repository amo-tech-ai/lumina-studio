# Seer comment format (best-effort)

Seer's GitHub comment markdown is **not a stable API**. Prefer parsing by meaning if
labels change. Captured shape as of 2026-07 (Sentry agent skills / Seer Bug Prediction).

## Typical inline review body

```markdown
**Bug:** <one-line description>

<sub>Severity: HIGH | Confidence: 0.87</sub>

<details>
<summary>🔍 <b>Detailed Analysis</b></summary>

…

</details>

<details>
<summary>💡 <b>Suggested Fix</b></summary>

…

</details>

<details>
<summary>🤖 <b>Prompt for AI Agent</b></summary>

…

</details>
```

## Extraction tips

| Field | Heuristic |
|-------|-----------|
| Bug | First `**Bug:**` line, or first bold sentence if label missing |
| Severity | `Severity:\s*(CRITICAL|HIGH|MEDIUM|LOW)` |
| Confidence | `Confidence:\s*([0-9.]+)` |
| Analysis | Content under Detailed Analysis / Analysis heading |
| Fix | Content under Suggested Fix |
| Agent prompt | Content under Prompt for AI Agent — useful as a checklist, not a mandate |

## jq helpers

Strip HTML-ish noise for a quick list:

```bash
gh api "repos/amo-tech-ai/lumina-studio/pulls/$PR/comments" --paginate \
  --jq '.[] | select(.user.login == "seer-by-sentry[bot]") |
    {
      path,
      line,
      bug: (.body | capture("\\*\\*Bug:\\*\\*\\s*(?<b>[^\\n]+)").b // .body[0:120]),
      severity: (.body | capture("Severity:\\s*(?<s>[A-Z]+)").s // "UNKNOWN")
    }'
```

## Severity handling

| Severity | Default stance |
|----------|----------------|
| CRITICAL / HIGH | Verify and fix before merge unless proven false positive |
| MEDIUM | Verify; fix if confirmed and in-scope |
| LOW | Fix if trivial; otherwise document skip with reason |

Confidence is a signal, not a gate — low confidence still deserves a 30-second code check.
