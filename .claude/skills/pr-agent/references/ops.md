# PR-Agent ops (Bedrock pilot)

## Bedrock smoke (folded into IPI-519)

```bash
aws sts get-caller-identity
# expect IAM user pr-agent-github (or operator setup identity) — never root

aws bedrock list-foundation-models --region us-east-1 \
  --query "modelSummaries[?contains(modelId, 'qwen3-coder-next')].[modelId,modelName]" --output table

aws bedrock-runtime converse \
  --region us-east-1 \
  --model-id qwen.qwen3-coder-next \
  --messages '[{"role":"user","content":[{"text":"Reply with exactly: Bedrock Qwen works"}]}]' \
  --inference-config '{"maxTokens":32,"temperature":0.1}' \
  2>&1 | tee /tmp/bedrock-qwen-smoke.log
```

Classify failures by exact error (do not assume one “enable model” button):

| Error | Likely cause |
|-------|----------------|
| `AccessDeniedException` | IAM / entitlement |
| `ValidationException` | bad request / wrong model id |
| `ResourceNotFoundException` | region / model id |
| `SubscriptionRequiredException` | Marketplace / subscription |
| Inference-profile messaging | add that ARN to IAM only after evidence |

## Local PR-Agent (optional, IPI-519 C)

```bash
eval "$(aws configure export-credentials --format env)"
export AWS_REGION=us-east-1 AWS_DEFAULT_REGION=us-east-1 AWS_REGION_NAME=us-east-1
pipx install pr-agent
export CONFIG__MODEL="bedrock/us-east-1/qwen.qwen3-coder-next"
export CONFIG__FALLBACK_MODELS='["bedrock/us-east-1/qwen.qwen3-coder-next"]'
export CONFIG__CUSTOM_MODEL_MAX_TOKENS="250000"
pr-agent --pr_url https://github.com/amo-tech-ai/lumina-studio/pull/PR_NUMBER review
```

## Action secrets rollout

1. Delete any keys previously exposed in chat  
2. Dedicated IAM user + least-privilege Bedrock policy  
3. Add `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` repo secrets  
4. Merge workflow + toml (dotted `aws.*` env, pinned SHA)  
5. Open test PR → confirm **exactly one** `/review`  
6. Later: **IPI-522** OIDC → delete static secrets → rotate keys  

## Tools ([docs](https://docs.pr-agent.ai/tools/))

`/review` `/improve` `/describe` `/ask` — pilot auto only `/review` (no `issue_comment` trigger).

## Rollback

Disable/delete `.github/workflows/pr-agent.yml`. Rotate IAM access keys. Keep `.pr_agent.toml`.

## Failures

| Symptom | Fix |
|---------|-----|
| `NoCredentialsError` / unable to locate credentials | Use dotted `aws.AWS_*` in Action env |
| Invalid AWS token | New IAM keys in secrets; delete exposed ones |
| Empty model list / access errors | Tee converse log; classify error type |
| MAX_TOKENS error | Set `custom_model_max_tokens=250000` |
| No review on fork PR | Expected without secrets on forks |
| Duplicate reviews on push | Keep triggers without `synchronize` for pilot |
