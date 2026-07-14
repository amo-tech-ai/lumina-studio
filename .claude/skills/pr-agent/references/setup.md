# PR-Agent setup (secrets pilot)

## GitHub secrets

Repo → Settings → Secrets and variables → Actions:

| Secret | Value |
|--------|--------|
| `AWS_ACCESS_KEY_ID` | Dedicated IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | Matching secret |

User policy: `bedrock:InvokeModel` + `bedrock:InvokeModelWithResponseStream` on  
`arn:aws:bedrock:us-east-1::foundation-model/qwen.qwen3-coder-next` only.

Widen to an inference-profile ARN **only if** Converse requires it — do not pre-emptively broaden.

Never use root. Never commit keys. **Delete** (not merely deactivate) any keys pasted in chat.

## `.pr_agent.toml`

```toml
[config]
model = "bedrock/us-east-1/qwen.qwen3-coder-next"
fallback_models = ["bedrock/us-east-1/qwen.qwen3-coder-next"]
custom_model_max_tokens = 250000

[github_action_config]
auto_review = true
auto_describe = false
auto_improve = false
pr_actions = ["opened", "reopened", "ready_for_review"]

[pr_reviewer]
extra_instructions = """
Respect AGENTS.md and the iPix one-concern-per-PR rule.

Prioritize:
- correctness and regressions
- authentication and authorization
- Supabase RLS and organization isolation
- migration and data-loss risk
- exposed secrets
- Next.js server/client boundaries
- Cloudflare Workers and OpenNext compatibility
- missing high-value tests

Avoid formatting-only and low-value style comments.
Only report findings supported by the changed code.
"""
```

Prefer TOML for non-secrets; avoid duplicating the same settings in workflow `env` unless intentionally overriding.

## Workflow (pilot)

Official Bedrock Action env uses **dotted** `aws.*` keys ([docs](https://docs.pr-agent.ai/installation/github/#run-as-a-github-action)). Plain `AWS_ACCESS_KEY_ID` in Action `env` is not enough for Dynaconf `[aws]`.

Candidate pin (verify LiteLLM knows Qwen before relying on it):

`01569655d8b4825bbe599fd5b2a8de59d5c58390`

```yaml
name: PR Agent — Bedrock Qwen3 Coder Next

on:
  pull_request:
    types: [opened, reopened, ready_for_review]

permissions:
  contents: read
  pull-requests: write
  issues: write

concurrency:
  group: pr-agent-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  pr_agent_job:
    if: github.event.sender.type != 'Bot'
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Run PR-Agent
        uses: the-pr-agent/pr-agent@01569655d8b4825bbe599fd5b2a8de59d5c58390
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          aws.AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws.AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws.AWS_REGION_NAME: "us-east-1"
          config.model: "bedrock/us-east-1/qwen.qwen3-coder-next"
          config.fallback_models: '["bedrock/us-east-1/qwen.qwen3-coder-next"]'
          config.custom_model_max_tokens: "250000"
          github_action_config.auto_review: "true"
          github_action_config.auto_describe: "false"
          github_action_config.auto_improve: "false"
          github_action_config.pr_actions: '["opened", "reopened", "ready_for_review"]'
```

Never commit `@main`. No `actions/checkout`. No `issue_comment` until slash tools are needed. No `id-token: write` until **IPI-522**.

## OIDC later (PR-AGENT-003)

Switch to `aws-actions/configure-aws-credentials` + `id-token: write` + role assume; delete static secrets. Do not require this for the first working review.
