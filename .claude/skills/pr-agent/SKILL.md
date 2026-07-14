---
name: pr-agent
description: >
  Set up, configure, debug, and operate open-source The-PR-Agent/pr-agent on iPix
  using Amazon Bedrock Qwen3 Coder Next in us-east-1 via the official GitHub Action.
  Pilot uses GitHub Secrets (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY); OIDC is a
  follow-up. Use whenever the user mentions PR-Agent, pr-agent, .pr_agent.toml,
  Bedrock PR review, qwen.qwen3-coder-next, bedrock/us-east-1/qwen.qwen3-coder-next,
  PRAGENT label, automated /review /describe /improve /ask, or tasks/pr-agent/.
  Prefer this skill over generic GitHub Action guidance for this integration.
  Do NOT use for Bugbot (pr-workflow), Seer (sentry-pr-code-review), Groq, or xAI
  Grok as the default for this track unless the plan is switched back.
---

# PR-Agent (Amazon Bedrock) — iPix

Plan SSOT: [`tasks/pr-agent/pragent-plan.md`](../../../tasks/pr-agent/pragent-plan.md).

Official deploy: [GitHub Action](https://docs.pr-agent.ai/installation/github/#run-as-a-github-action) ·
[Usage](https://docs.pr-agent.ai/usage-guide/) · [Tools](https://docs.pr-agent.ai/tools/).

## Hard rules

- Model: `bedrock/us-east-1/qwen.qwen3-coder-next` · region `us-east-1` · `custom_model_max_tokens = 250000`.
- **Pilot:** GitHub Secrets for a dedicated IAM user (Bedrock invoke only). No root. No chat-pasted keys.
- **Later:** **PR-AGENT-003** replaces secrets with OIDC — do not block pilot on OIDC.
- Start with an immutable Action commit SHA — never commit `@main`.
- Action env must use dotted `aws.AWS_ACCESS_KEY_ID` / `aws.AWS_SECRET_ACCESS_KEY` / `aws.AWS_REGION_NAME` (not plain AWS_* alone).
- Auto `/review` only; no `pull_request_target`; no `issue_comment` in the pilot.
- One concern: workflow+toml = CI/config PR; docs = docs-only PR.
- Additive with Bugbot / Seer / `/pr`.

## Pilot defaults

| Setting | Value |
|---------|--------|
| Secrets | `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` (GitHub secret names) |
| Action env | `aws.AWS_*` dotted keys → Dynaconf `[aws]` |
| Auto | review on; describe/improve off |
| Triggers | `opened`, `reopened`, `ready_for_review` |
| Timeout | 15m · concurrency per PR |
| Pin | `01569655d8b4825bbe599fd5b2a8de59d5c58390` (candidate) |

## References

| Need | File |
|------|------|
| Toml + secrets workflow | [references/setup.md](references/setup.md) |
| Bedrock/CLI smoke, OIDC later, failures | [references/ops.md](references/ops.md) |

## Related

[pr-workflow](../pr-workflow/SKILL.md) · [sentry-pr-code-review](../sentry-pr-code-review/SKILL.md) · [task-verifier](../task-verifier/SKILL.md)
