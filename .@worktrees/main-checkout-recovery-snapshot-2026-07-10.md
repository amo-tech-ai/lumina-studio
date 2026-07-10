# Main checkout recovery snapshot

Generated 2026-07-10T01:28:02-04:00 on branch `ipi/restore-universal-design-prompt` at commit `dedbe3da`.
Purpose: preservation record before resolving the 10 stale conflicts or splitting the ~526 pending changes into commits.

## git status --short (full, 529 lines)
```
 M .@worktrees/worktrees.md
UD .claude/commands/pr-fix.md
 M .claude/hooks/verify-before-stop.sh
M  .claude/skills/README.md
UD .claude/skills/architecture-brief/SKILL.md
UD .claude/skills/architecture-brief/references/output-template.md
AM .claude/skills/cloudflare/SKILL.md
A  .claude/skills/cloudflare/references/agents-sdk/README.md
A  .claude/skills/cloudflare/references/agents-sdk/agents-sdk.md
A  .claude/skills/cloudflare/references/agents-sdk/api.md
A  .claude/skills/cloudflare/references/agents-sdk/browse-the-web.md
A  .claude/skills/cloudflare/references/agents-sdk/callable.md
A  .claude/skills/cloudflare/references/agents-sdk/client-sdk.md
A  .claude/skills/cloudflare/references/agents-sdk/codemode.md
A  .claude/skills/cloudflare/references/agents-sdk/configuration.md
A  .claude/skills/cloudflare/references/agents-sdk/durable-execution.md
A  .claude/skills/cloudflare/references/agents-sdk/email.md
A  .claude/skills/cloudflare/references/agents-sdk/gotchas.md
A  .claude/skills/cloudflare/references/agents-sdk/human-in-the-loop.md
A  .claude/skills/cloudflare/references/agents-sdk/mcp.md
A  .claude/skills/cloudflare/references/agents-sdk/observability.md
A  .claude/skills/cloudflare/references/agents-sdk/patterns.md
A  .claude/skills/cloudflare/references/agents-sdk/queue-retries.md
A  .claude/skills/cloudflare/references/agents-sdk/routing.md
A  .claude/skills/cloudflare/references/agents-sdk/server-driven-messages.md
A  .claude/skills/cloudflare/references/agents-sdk/state-scheduling.md
A  .claude/skills/cloudflare/references/agents-sdk/streaming-chat.md
A  .claude/skills/cloudflare/references/agents-sdk/think.md
A  .claude/skills/cloudflare/references/agents-sdk/voice.md
A  .claude/skills/cloudflare/references/agents-sdk/webhooks-push.md
A  .claude/skills/cloudflare/references/agents-sdk/workflows.md
A  .claude/skills/cloudflare/references/ai-gateway/README.md
A  .claude/skills/cloudflare/references/ai-gateway/configuration.md
A  .claude/skills/cloudflare/references/ai-gateway/dynamic-routing.md
A  .claude/skills/cloudflare/references/ai-gateway/features.md
A  .claude/skills/cloudflare/references/ai-gateway/sdk-integration.md
A  .claude/skills/cloudflare/references/ai-gateway/troubleshooting.md
A  .claude/skills/cloudflare/references/ai-search/README.md
A  .claude/skills/cloudflare/references/ai-search/api.md
A  .claude/skills/cloudflare/references/ai-search/configuration.md
A  .claude/skills/cloudflare/references/ai-search/gotchas.md
A  .claude/skills/cloudflare/references/ai-search/patterns.md
AM .claude/skills/cloudflare/references/analytics-engine/README.md
A  .claude/skills/cloudflare/references/analytics-engine/api.md
A  .claude/skills/cloudflare/references/analytics-engine/configuration.md
A  .claude/skills/cloudflare/references/analytics-engine/gotchas.md
A  .claude/skills/cloudflare/references/analytics-engine/patterns.md
A  .claude/skills/cloudflare/references/api-shield/README.md
A  .claude/skills/cloudflare/references/api-shield/api.md
A  .claude/skills/cloudflare/references/api-shield/configuration.md
A  .claude/skills/cloudflare/references/api-shield/gotchas.md
A  .claude/skills/cloudflare/references/api-shield/patterns.md
AM .claude/skills/cloudflare/references/api/README.md
A  .claude/skills/cloudflare/references/api/api.md
A  .claude/skills/cloudflare/references/api/configuration.md
A  .claude/skills/cloudflare/references/api/gotchas.md
A  .claude/skills/cloudflare/references/api/patterns.md
AD .claude/skills/cloudflare/references/argo-smart-routing/README.md
AD .claude/skills/cloudflare/references/argo-smart-routing/api.md
AD .claude/skills/cloudflare/references/argo-smart-routing/configuration.md
AD .claude/skills/cloudflare/references/argo-smart-routing/gotchas.md
AD .claude/skills/cloudflare/references/argo-smart-routing/patterns.md
A  .claude/skills/cloudflare/references/artifacts/README.md
A  .claude/skills/cloudflare/references/artifacts/api.md
A  .claude/skills/cloudflare/references/artifacts/configuration.md
A  .claude/skills/cloudflare/references/bindings/README.md
A  .claude/skills/cloudflare/references/bindings/api.md
A  .claude/skills/cloudflare/references/bindings/configuration.md
A  .claude/skills/cloudflare/references/bindings/gotchas.md
A  .claude/skills/cloudflare/references/bindings/patterns.md
A  .claude/skills/cloudflare/references/bot-management/README.md
A  .claude/skills/cloudflare/references/bot-management/api.md
A  .claude/skills/cloudflare/references/bot-management/configuration.md
A  .claude/skills/cloudflare/references/bot-management/gotchas.md
A  .claude/skills/cloudflare/references/bot-management/patterns.md
A  .claude/skills/cloudflare/references/browser-rendering/README.md
A  .claude/skills/cloudflare/references/browser-rendering/api.md
A  .claude/skills/cloudflare/references/browser-rendering/configuration.md
A  .claude/skills/cloudflare/references/browser-rendering/gotchas.md
A  .claude/skills/cloudflare/references/browser-rendering/patterns.md
A  .claude/skills/cloudflare/references/c3/README.md
A  .claude/skills/cloudflare/references/c3/api.md
A  .claude/skills/cloudflare/references/c3/configuration.md
A  .claude/skills/cloudflare/references/c3/gotchas.md
A  .claude/skills/cloudflare/references/c3/patterns.md
A  .claude/skills/cloudflare/references/cache-reserve/README.md
A  .claude/skills/cloudflare/references/cache-reserve/api.md
A  .claude/skills/cloudflare/references/cache-reserve/configuration.md
A  .claude/skills/cloudflare/references/cache-reserve/gotchas.md
A  .claude/skills/cloudflare/references/cache-reserve/patterns.md
AD .claude/skills/cloudflare/references/containers/README.md
AD .claude/skills/cloudflare/references/containers/api.md
AD .claude/skills/cloudflare/references/containers/configuration.md
AD .claude/skills/cloudflare/references/containers/gotchas.md
AD .claude/skills/cloudflare/references/containers/patterns.md
AD .claude/skills/cloudflare/references/cron-triggers/README.md
AD .claude/skills/cloudflare/references/cron-triggers/api.md
AD .claude/skills/cloudflare/references/cron-triggers/configuration.md
AD .claude/skills/cloudflare/references/cron-triggers/gotchas.md
AD .claude/skills/cloudflare/references/cron-triggers/patterns.md
A  .claude/skills/cloudflare/references/d1/README.md
A  .claude/skills/cloudflare/references/d1/api.md
A  .claude/skills/cloudflare/references/d1/configuration.md
A  .claude/skills/cloudflare/references/d1/gotchas.md
A  .claude/skills/cloudflare/references/d1/patterns.md
AD .claude/skills/cloudflare/references/ddos/README.md
AD .claude/skills/cloudflare/references/ddos/api.md
AD .claude/skills/cloudflare/references/ddos/configuration.md
AD .claude/skills/cloudflare/references/ddos/gotchas.md
AD .claude/skills/cloudflare/references/ddos/patterns.md
A  .claude/skills/cloudflare/references/do-storage/README.md
A  .claude/skills/cloudflare/references/do-storage/api.md
A  .claude/skills/cloudflare/references/do-storage/configuration.md
A  .claude/skills/cloudflare/references/do-storage/gotchas.md
A  .claude/skills/cloudflare/references/do-storage/patterns.md
A  .claude/skills/cloudflare/references/do-storage/testing.md
A  .claude/skills/cloudflare/references/durable-objects/README.md
A  .claude/skills/cloudflare/references/durable-objects/api.md
A  .claude/skills/cloudflare/references/durable-objects/configuration.md
A  .claude/skills/cloudflare/references/durable-objects/gotchas.md
A  .claude/skills/cloudflare/references/durable-objects/patterns.md
AD .claude/skills/cloudflare/references/email-routing/README.md
AD .claude/skills/cloudflare/references/email-routing/api.md
AD .claude/skills/cloudflare/references/email-routing/configuration.md
AD .claude/skills/cloudflare/references/email-routing/gotchas.md
AD .claude/skills/cloudflare/references/email-routing/patterns.md
AD .claude/skills/cloudflare/references/email-workers/README.md
AD .claude/skills/cloudflare/references/email-workers/api.md
AD .claude/skills/cloudflare/references/email-workers/configuration.md
AD .claude/skills/cloudflare/references/email-workers/gotchas.md
AD .claude/skills/cloudflare/references/email-workers/patterns.md
AD .claude/skills/cloudflare/references/flagship/README.md
AD .claude/skills/cloudflare/references/flagship/api.md
AD .claude/skills/cloudflare/references/flagship/configuration.md
AD .claude/skills/cloudflare/references/flagship/gotchas.md
AD .claude/skills/cloudflare/references/flagship/patterns.md
AD .claude/skills/cloudflare/references/graphql-api/README.md
AD .claude/skills/cloudflare/references/graphql-api/api.md
AD .claude/skills/cloudflare/references/graphql-api/configuration.md
AD .claude/skills/cloudflare/references/graphql-api/gotchas.md
AD .claude/skills/cloudflare/references/graphql-api/patterns.md
A  .claude/skills/cloudflare/references/hyperdrive/README.md
A  .claude/skills/cloudflare/references/hyperdrive/api.md
A  .claude/skills/cloudflare/references/hyperdrive/configuration.md
A  .claude/skills/cloudflare/references/hyperdrive/gotchas.md
A  .claude/skills/cloudflare/references/hyperdrive/patterns.md
A  .claude/skills/cloudflare/references/images/README.md
A  .claude/skills/cloudflare/references/images/api.md
A  .claude/skills/cloudflare/references/images/configuration.md
A  .claude/skills/cloudflare/references/images/gotchas.md
A  .claude/skills/cloudflare/references/images/patterns.md
A  .claude/skills/cloudflare/references/kv/README.md
A  .claude/skills/cloudflare/references/kv/api.md
A  .claude/skills/cloudflare/references/kv/configuration.md
A  .claude/skills/cloudflare/references/kv/gotchas.md
A  .claude/skills/cloudflare/references/kv/patterns.md
AD .claude/skills/cloudflare/references/miniflare/README.md
AD .claude/skills/cloudflare/references/miniflare/api.md
AD .claude/skills/cloudflare/references/miniflare/configuration.md
AD .claude/skills/cloudflare/references/miniflare/gotchas.md
AD .claude/skills/cloudflare/references/miniflare/patterns.md
AD .claude/skills/cloudflare/references/network-interconnect/README.md
AD .claude/skills/cloudflare/references/network-interconnect/api.md
AD .claude/skills/cloudflare/references/network-interconnect/configuration.md
AD .claude/skills/cloudflare/references/network-interconnect/gotchas.md
AD .claude/skills/cloudflare/references/network-interconnect/patterns.md
AM .claude/skills/cloudflare/references/observability/README.md
A  .claude/skills/cloudflare/references/observability/api.md
A  .claude/skills/cloudflare/references/observability/configuration.md
A  .claude/skills/cloudflare/references/observability/gotchas.md
A  .claude/skills/cloudflare/references/observability/patterns.md
A  .claude/skills/cloudflare/references/pages-functions/README.md
A  .claude/skills/cloudflare/references/pages-functions/api.md
A  .claude/skills/cloudflare/references/pages-functions/configuration.md
A  .claude/skills/cloudflare/references/pages-functions/gotchas.md
A  .claude/skills/cloudflare/references/pages-functions/patterns.md
A  .claude/skills/cloudflare/references/pages/README.md
A  .claude/skills/cloudflare/references/pages/api.md
A  .claude/skills/cloudflare/references/pages/configuration.md
A  .claude/skills/cloudflare/references/pages/gotchas.md
A  .claude/skills/cloudflare/references/pages/patterns.md
AM .claude/skills/cloudflare/references/pipelines/README.md
A  .claude/skills/cloudflare/references/pipelines/api.md
A  .claude/skills/cloudflare/references/pipelines/configuration.md
A  .claude/skills/cloudflare/references/pipelines/gotchas.md
AM .claude/skills/cloudflare/references/pipelines/patterns.md
AD .claude/skills/cloudflare/references/pulumi/README.md
AD .claude/skills/cloudflare/references/pulumi/api.md
AD .claude/skills/cloudflare/references/pulumi/configuration.md
AD .claude/skills/cloudflare/references/pulumi/gotchas.md
AD .claude/skills/cloudflare/references/pulumi/patterns.md
A  .claude/skills/cloudflare/references/queues/README.md
A  .claude/skills/cloudflare/references/queues/api.md
A  .claude/skills/cloudflare/references/queues/configuration.md
A  .claude/skills/cloudflare/references/queues/gotchas.md
A  .claude/skills/cloudflare/references/queues/patterns.md
AD .claude/skills/cloudflare/references/r2-data-catalog/README.md
AD .claude/skills/cloudflare/references/r2-data-catalog/api.md
AD .claude/skills/cloudflare/references/r2-data-catalog/configuration.md
AD .claude/skills/cloudflare/references/r2-data-catalog/gotchas.md
AD .claude/skills/cloudflare/references/r2-data-catalog/patterns.md
AM .claude/skills/cloudflare/references/r2-sql/README.md
A  .claude/skills/cloudflare/references/r2-sql/api.md
AM .claude/skills/cloudflare/references/r2-sql/configuration.md
A  .claude/skills/cloudflare/references/r2-sql/gotchas.md
AM .claude/skills/cloudflare/references/r2-sql/patterns.md
A  .claude/skills/cloudflare/references/r2/README.md
A  .claude/skills/cloudflare/references/r2/api.md
A  .claude/skills/cloudflare/references/r2/configuration.md
A  .claude/skills/cloudflare/references/r2/gotchas.md
A  .claude/skills/cloudflare/references/r2/patterns.md
AD .claude/skills/cloudflare/references/realtime-sfu/README.md
AD .claude/skills/cloudflare/references/realtime-sfu/api.md
AD .claude/skills/cloudflare/references/realtime-sfu/configuration.md
AD .claude/skills/cloudflare/references/realtime-sfu/gotchas.md
AD .claude/skills/cloudflare/references/realtime-sfu/patterns.md
AD .claude/skills/cloudflare/references/realtimekit/README.md
AD .claude/skills/cloudflare/references/realtimekit/api.md
AD .claude/skills/cloudflare/references/realtimekit/configuration.md
AD .claude/skills/cloudflare/references/realtimekit/gotchas.md
AD .claude/skills/cloudflare/references/realtimekit/patterns.md
AD .claude/skills/cloudflare/references/sandbox/README.md
AD .claude/skills/cloudflare/references/sandbox/api.md
AD .claude/skills/cloudflare/references/sandbox/configuration.md
AD .claude/skills/cloudflare/references/sandbox/gotchas.md
AD .claude/skills/cloudflare/references/sandbox/patterns.md
A  .claude/skills/cloudflare/references/secrets-store/README.md
A  .claude/skills/cloudflare/references/secrets-store/api.md
A  .claude/skills/cloudflare/references/secrets-store/configuration.md
A  .claude/skills/cloudflare/references/secrets-store/gotchas.md
A  .claude/skills/cloudflare/references/secrets-store/patterns.md
A  .claude/skills/cloudflare/references/smart-placement/README.md
A  .claude/skills/cloudflare/references/smart-placement/api.md
A  .claude/skills/cloudflare/references/smart-placement/configuration.md
A  .claude/skills/cloudflare/references/smart-placement/gotchas.md
A  .claude/skills/cloudflare/references/smart-placement/patterns.md
A  .claude/skills/cloudflare/references/snippets/README.md
A  .claude/skills/cloudflare/references/snippets/api.md
A  .claude/skills/cloudflare/references/snippets/configuration.md
A  .claude/skills/cloudflare/references/snippets/gotchas.md
A  .claude/skills/cloudflare/references/snippets/patterns.md
AD .claude/skills/cloudflare/references/spectrum/README.md
AD .claude/skills/cloudflare/references/spectrum/api.md
AD .claude/skills/cloudflare/references/spectrum/configuration.md
AD .claude/skills/cloudflare/references/spectrum/gotchas.md
AD .claude/skills/cloudflare/references/spectrum/patterns.md
A  .claude/skills/cloudflare/references/static-assets/README.md
A  .claude/skills/cloudflare/references/static-assets/api.md
A  .claude/skills/cloudflare/references/static-assets/configuration.md
A  .claude/skills/cloudflare/references/static-assets/gotchas.md
A  .claude/skills/cloudflare/references/static-assets/patterns.md
A  .claude/skills/cloudflare/references/stream/README.md
A  .claude/skills/cloudflare/references/stream/api-live.md
A  .claude/skills/cloudflare/references/stream/api.md
A  .claude/skills/cloudflare/references/stream/configuration.md
A  .claude/skills/cloudflare/references/stream/gotchas.md
A  .claude/skills/cloudflare/references/stream/patterns.md
AD .claude/skills/cloudflare/references/tail-workers/README.md
AD .claude/skills/cloudflare/references/tail-workers/api.md
AD .claude/skills/cloudflare/references/tail-workers/configuration.md
AD .claude/skills/cloudflare/references/tail-workers/gotchas.md
AD .claude/skills/cloudflare/references/tail-workers/patterns.md
AD .claude/skills/cloudflare/references/terraform/README.md
AD .claude/skills/cloudflare/references/terraform/api.md
AD .claude/skills/cloudflare/references/terraform/configuration.md
AD .claude/skills/cloudflare/references/terraform/gotchas.md
AD .claude/skills/cloudflare/references/terraform/patterns.md
A  .claude/skills/cloudflare/references/tunnel/README.md
A  .claude/skills/cloudflare/references/tunnel/api.md
A  .claude/skills/cloudflare/references/tunnel/configuration.md
A  .claude/skills/cloudflare/references/tunnel/gotchas.md
A  .claude/skills/cloudflare/references/tunnel/networking.md
A  .claude/skills/cloudflare/references/tunnel/patterns.md
A  .claude/skills/cloudflare/references/turn/README.md
A  .claude/skills/cloudflare/references/turn/api.md
A  .claude/skills/cloudflare/references/turn/configuration.md
A  .claude/skills/cloudflare/references/turn/gotchas.md
A  .claude/skills/cloudflare/references/turn/patterns.md
A  .claude/skills/cloudflare/references/turnstile/README.md
A  .claude/skills/cloudflare/references/turnstile/api.md
A  .claude/skills/cloudflare/references/turnstile/configuration.md
A  .claude/skills/cloudflare/references/turnstile/gotchas.md
A  .claude/skills/cloudflare/references/turnstile/patterns.md
A  .claude/skills/cloudflare/references/vectorize/README.md
A  .claude/skills/cloudflare/references/vectorize/api.md
A  .claude/skills/cloudflare/references/vectorize/configuration.md
A  .claude/skills/cloudflare/references/vectorize/gotchas.md
A  .claude/skills/cloudflare/references/vectorize/patterns.md
A  .claude/skills/cloudflare/references/waf/README.md
A  .claude/skills/cloudflare/references/waf/api.md
A  .claude/skills/cloudflare/references/waf/configuration.md
A  .claude/skills/cloudflare/references/waf/gotchas.md
A  .claude/skills/cloudflare/references/waf/patterns.md
AM .claude/skills/cloudflare/references/web-analytics/README.md
A  .claude/skills/cloudflare/references/web-analytics/configuration.md
A  .claude/skills/cloudflare/references/web-analytics/gotchas.md
A  .claude/skills/cloudflare/references/web-analytics/integration.md
A  .claude/skills/cloudflare/references/web-analytics/patterns.md
AM .claude/skills/cloudflare/references/workerd/README.md
A  .claude/skills/cloudflare/references/workerd/api.md
A  .claude/skills/cloudflare/references/workerd/configuration.md
A  .claude/skills/cloudflare/references/workerd/gotchas.md
A  .claude/skills/cloudflare/references/workerd/patterns.md
A  .claude/skills/cloudflare/references/workers-ai/README.md
A  .claude/skills/cloudflare/references/workers-ai/api.md
A  .claude/skills/cloudflare/references/workers-ai/configuration.md
A  .claude/skills/cloudflare/references/workers-ai/gotchas.md
A  .claude/skills/cloudflare/references/workers-ai/patterns.md
A  .claude/skills/cloudflare/references/workers-best-practices/review.md
A  .claude/skills/cloudflare/references/workers-best-practices/rules.md
A  .claude/skills/cloudflare/references/workers-best-practices/workers-best-practices.md
AM .claude/skills/cloudflare/references/workers-for-platforms/README.md
A  .claude/skills/cloudflare/references/workers-for-platforms/api.md
A  .claude/skills/cloudflare/references/workers-for-platforms/configuration.md
A  .claude/skills/cloudflare/references/workers-for-platforms/gotchas.md
A  .claude/skills/cloudflare/references/workers-for-platforms/patterns.md
A  .claude/skills/cloudflare/references/workers-playground/README.md
A  .claude/skills/cloudflare/references/workers-playground/api.md
A  .claude/skills/cloudflare/references/workers-playground/configuration.md
A  .claude/skills/cloudflare/references/workers-playground/gotchas.md
A  .claude/skills/cloudflare/references/workers-playground/patterns.md
AD .claude/skills/cloudflare/references/workers-vpc/README.md
AD .claude/skills/cloudflare/references/workers-vpc/api.md
AD .claude/skills/cloudflare/references/workers-vpc/configuration.md
AD .claude/skills/cloudflare/references/workers-vpc/gotchas.md
AD .claude/skills/cloudflare/references/workers-vpc/patterns.md
A  .claude/skills/cloudflare/references/workers/README.md
A  .claude/skills/cloudflare/references/workers/api.md
A  .claude/skills/cloudflare/references/workers/configuration.md
A  .claude/skills/cloudflare/references/workers/frameworks.md
A  .claude/skills/cloudflare/references/workers/gotchas.md
A  .claude/skills/cloudflare/references/workers/patterns.md
A  .claude/skills/cloudflare/references/workflows/README.md
A  .claude/skills/cloudflare/references/workflows/api.md
A  .claude/skills/cloudflare/references/workflows/configuration.md
A  .claude/skills/cloudflare/references/workflows/gotchas.md
A  .claude/skills/cloudflare/references/workflows/patterns.md
AM .claude/skills/cloudflare/references/wrangler/README.md
A  .claude/skills/cloudflare/references/wrangler/api.md
A  .claude/skills/cloudflare/references/wrangler/cli-guide.md
A  .claude/skills/cloudflare/references/wrangler/configuration.md
A  .claude/skills/cloudflare/references/wrangler/gotchas.md
A  .claude/skills/cloudflare/references/wrangler/patterns.md
AD .claude/skills/cloudflare/references/zaraz/IMPLEMENTATION_SUMMARY.md
AD .claude/skills/cloudflare/references/zaraz/README.md
AD .claude/skills/cloudflare/references/zaraz/api.md
AD .claude/skills/cloudflare/references/zaraz/configuration.md
AD .claude/skills/cloudflare/references/zaraz/gotchas.md
AD .claude/skills/cloudflare/references/zaraz/patterns.md
UD .claude/skills/design-to-production/SKILL.md
UD .claude/skills/design-to-production/references/report-template.md
UD .claude/skills/design-to-production/references/route-map.md
UD .claude/skills/graphify/SKILL.md
UD .claude/skills/ipix-supabase/SKILL.md
M  .claude/skills/ipix-task-lifecycle/README.md
M  .claude/skills/ipix-task-lifecycle/SKILL.md
M  .claude/skills/ipix-task-lifecycle/implementation.md
M  .claude/skills/ipix-task-lifecycle/planning.md
M  .claude/skills/ipix-task-lifecycle/references/audit-checklist.md
A  .claude/skills/ipix-task-lifecycle/references/domain-skill-routing.md
M  .claude/skills/ipix-task-lifecycle/references/linear-issue-steps.md
M  .claude/skills/ipix-task-lifecycle/references/linear-prompt-engineering.md
M  .claude/skills/ipix-task-lifecycle/references/linear-spec-template.md
M  .claude/skills/ipix-task-lifecycle/references/migration-safety.md
M  .claude/skills/ipix-task-lifecycle/references/overview.md
M  .claude/skills/ipix-task-lifecycle/references/prd-template.md
M  .claude/skills/ipix-task-lifecycle/references/shipping-templates.md
M  .claude/skills/ipix-task-lifecycle/references/verifier-probes-ipix.md
M  .claude/skills/ipix-task-lifecycle/shipping.md
M  .claude/skills/ipix/SKILL.md
 M .claude/skills/linear/SKILL.md
 M .claude/skills/linear/references/ipix.md
UD .claude/skills/mercur/SKILL.md
 D .claude/skills/skill-creator/scripts/__pycache__/__init__.cpython-314.pyc
 D .claude/skills/skill-creator/scripts/__pycache__/generate_report.cpython-314.pyc
 D .claude/skills/skill-creator/scripts/__pycache__/improve_description.cpython-314.pyc
 D .claude/skills/skill-creator/scripts/__pycache__/run_eval.cpython-314.pyc
 D .claude/skills/skill-creator/scripts/__pycache__/run_loop.cpython-314.pyc
 D .claude/skills/skill-creator/scripts/__pycache__/utils.cpython-314.pyc
UD .claude/skills/task-verifier/references/verifier-probes-ipix.md
 M .claude/skills/worktrees/SKILL.md
 D .cursor/rules/mercur.mdc
 D .cursor/skills/mercur
 D "Universal design prompt"
A  Universal-design-prompt-new/plan/booking-wizard/audit.md
AD Universal-design-prompt-new/plan/design-prompts/00-review-and-conventions.md
AD Universal-design-prompt-new/plan/design-prompts/SCR-32-planner-workspace.md
AD Universal-design-prompt-new/plan/design-prompts/SCR-33-planner-dashboard.md
AD Universal-design-prompt-new/plan/design-prompts/SCR-34-planner-instance-settings.md
AD Universal-design-prompt-new/plan/design-prompts/diagrams.md
A  Universal-design-prompt-new/plan/planner/01-audit.md
A  Universal-design-prompt-new/plan/planner/8eb2c2aa-9bdc-47a8-851b-84aa6a082b7e.png
A  Universal-design-prompt-new/plan/planner/a129ba7f-5282-4161-9f73-ccb40688ba59.png
A  Universal-design-prompt-new/plan/planner/architecture-plan.md
A  Universal-design-prompt-new/plan/planner/mermaid-diagrams.md
A  Universal-design-prompt-new/plan/planner/wireframes.md
A  Universal-design-prompt-new/tasks/designtoreact.md
A  Universal-design-prompt-new/tests/ipi-395-deal-detail-stub.png
A  Universal-design-prompt-new/tests/ipi-395-pipeline-at-risk-empty.png
A  Universal-design-prompt-new/tests/ipi-395-pipeline-desktop.png
A  Universal-design-prompt-new/tests/ipi-395-pipeline-mobile-390.png
A  Universal-design-prompt-new/tests/ipi-410-booking-wizard-availability.png
A  Universal-design-prompt-new/tests/ipi-410-booking-wizard-draft.png
A  Universal-design-prompt-new/tests/ipi-410-booking-wizard-mobile-390.png
A  Universal-design-prompt-new/tests/ipi-410-booking-wizard-rejected.png
A  Universal-design-prompt-new/tests/ipi-410-booking-wizard-review.png
A  Universal-design-prompt-new/tests/ipi-410-booking-wizard-send-qa-org-gap.png
A  Universal-design-prompt-new/tests/ipi-410-booking-wizard-step0.png
 M app/.gitignore
 M app/next.config.ts
 M app/package-lock.json
 M app/package.json
 M app/src/app/(operator)/layout.tsx
 M app/src/app/api/marketing-chat/[[...slug]]/route.test.ts
 M app/src/app/api/marketing-chat/[[...slug]]/route.ts
 M app/src/lib/ai/provider.ts
 M app/src/middleware.test.ts
 D app/src/proxy.test.ts
 D app/src/proxy.ts
 M app/src/test/operator-middleware-contract.test.ts
 D config/groq-models.json
 D config/groq-models.schema.json
M  index-skills.md
 M linear/issues/README.md
 M package.json
 M scripts/verify-rls.mjs
 M scripts/worktree-audit.mjs
 M scripts/worktree-health.mjs
 M services/cloudflare-worker/AGENTS.md
 D tasks/cloudflare/09-gemini-groq-audit.md
 D tasks/cloudflare/ai-agent-architecture.md
 D tasks/cloudflare/ai-provider-decision.md
 D tasks/cloudflare/cf-000-platform-architecture.md
 D tasks/cloudflare/cf-ai-migration-research.md
 D tasks/cloudflare/intelligence-platform-plan.md
 D "tasks/cloudflare/prompts/Deep Architecture & AI Strategy Review.md"
 D "tasks/cloudflare/prompts/Migrate from Vercel to Cloudflare Workers.md"
 M tasks/cloudflare/todo.md
 D tasks/design-docs/designtoreact.md
 M tasks/diagrams/02-ai-provider-flow.md
 M tasks/diagrams/README.md
 D tasks/plan/todo.md
?? .@worktrees/main-checkout-recovery-snapshot-2026-07-10.md
?? .agents/
?? .claude/skills/brainstorming/
?? .claude/skills/cloudflare/references/REMOVED-FOR-NOW.md
?? .claude/skills/cloudflare/references/mastra/
?? .claude/skills/prd/
?? .infisical.json
?? .obsidian/
?? "Universal design prompt (4).zip"
?? Universal-design-prompt-new/plan/planner/design-prompts/
?? Universal-design-prompt-new/plan/planner/planner.md
?? Universal-design-prompt-new/plan/planner/tasks/
?? Universal-design-prompt5.MERGED-verify-then-delete/
?? app/index.md
?? app/open-next.config.ts
?? app/public/_headers
?? app/scripts/cf-ast-grep-stub.mjs
?? app/src/lib/copilotkit/
?? app/src/lib/planner/
?? app/src/middleware-auth-gate.test.ts
?? app/src/middleware.ts
?? app/wrangler.jsonc
?? docs/.obsidian/
?? docs/architecture/diagrams/
?? docs/linear/issues/README.md
?? "linear/ALL issues.csv"
?? "linear/DESIGN V2 \342\200\224 Operator React Parity \342\200\272 Issues.csv"
?? linear/all-issues.md
?? linear/design.md
?? linear/issues/IPI-240-provider-options-alignment.md
?? linear/issues/IPI-457-cf-ai-005-unified-types-registry.md
?? linear/issues/IPI-461-cf-ai-004-provider-adapter.md
?? linear/issues/IPI-476-PLN-001-planner-schema-reusable-engine-core.md
?? linear/issues/IPI-477-PLN-002-shoot-production-timeline-template.md
?? linear/issues/IPI-478-PLN-003-hybrid-timeline-kanban-calendar-ui.md
?? linear/issues/IPI-479-PLN-004-role-based-views-assignments.md
?? linear/issues/IPI-480-PLN-005-real-time-sync-cloudflare-do.md
?? linear/issues/IPI-481-PLN-006-notification-rules-cloudflare-queue.md
?? linear/issues/IPI-482-PLN-007-mastra-planner-ai-tools-hitl.md
?? linear/issues/IPI-483-PLN-008-workflow-engine-dependencies-approvals.md
?? linear/issues/IPI-485-mastra-cf-001-provider-gateway-cutover.md
?? linear/issues/IPI-486-mastra-epic.md
?? linear/issues/IPI-487-cloudflare-epic.md
?? linear/issues/IPI-CF-MIG-110-opennext-foundation.md
?? linear/issues/IPI-CF-MIG-111-ci-opennext-build.md
?? linear/issues/IPI-CF-MIG-210-runtime-compat.md
?? linear/issues/IPI-CF-MIG-220-preview-smoke-gate.md
?? linear/issues/IPI-CF-MIG-810-production-cutover.md
?? linear/issues/IPI-MASTRA-CF-001-provider-gateway-cutover.md
?? mvp.md
?? prd.md
?? roadmap.md
?? scripts/cf-mcp-api-bridge.sh
?? scripts/cf-mcp-bridge.sh
?? scripts/cf-mcp-setup.sh
?? scripts/cursor-mcp-setup.sh
?? scripts/cursor-uninstall-cloudflare-plugin.sh
?? scripts/linear-apply-mastra-audit.py
?? scripts/linear-create-cf-mig-issues.py
?? scripts/mcp-env-bridge.sh
?? scripts/package-lock.json
?? scripts/package.json
?? scripts/worktree-sync-main.mjs
?? skills-lock.json
?? supabase/migrations/20260709000000_planner_schema_rls.sql
?? supabase/seed-planner-workflows.sql
?? tasks/.obsidian/
?? "tasks/cloudflare/AI Platform \342\200\224 LLM Providers \342\200\272 Issues (5).md"
?? tasks/cloudflare/CLOUDFLARE-EPIC.md
?? tasks/cloudflare/audits/09-gemini-groq-audit.md
?? tasks/cloudflare/audits/audit-design.md
?? tasks/cloudflare/audits/audit-jul-9.md
?? tasks/cloudflare/audits/ipi-454-457-462-463-verification.md
?? tasks/cloudflare/audits/jul-8-linear-audit.md
?? tasks/cloudflare/audits/july-9-audit-plan.md
?? tasks/cloudflare/cursor-mcp-cloudflare.json
?? tasks/cloudflare/mastra/
?? tasks/cloudflare/migration/
?? tasks/cloudflare/plan/
?? tasks/cloudflare/prompts/Deep-Architecture-AI-Strategy.md
?? tasks/cloudflare/tests/
?? tasks/intelligence/ai/cursor-mcp.json
?? tasks/linear-audit/
?? tasks/plan/Untitled.md
?? tasks/plan/audit/
?? tasks/plan/prompt-plan.md
?? worktrees/
```

## git diff --stat (unstaged, working tree vs index)
```
 .@worktrees/worktrees.md                           |    78 +-
 .claude/commands/pr-fix.md                         | Unmerged
 .claude/hooks/verify-before-stop.sh                |    18 +-
 .claude/skills/architecture-brief/SKILL.md         | Unmerged
 .../references/output-template.md                  | Unmerged
 .claude/skills/cloudflare/SKILL.md                 |    80 +-
 .../references/analytics-engine/README.md          |     2 +-
 .claude/skills/cloudflare/references/api/README.md |     4 +-
 .../references/argo-smart-routing/README.md        |    90 -
 .../references/argo-smart-routing/api.md           |   240 -
 .../references/argo-smart-routing/configuration.md |   197 -
 .../references/argo-smart-routing/gotchas.md       |   111 -
 .../references/argo-smart-routing/patterns.md      |   104 -
 .../cloudflare/references/containers/README.md     |    85 -
 .../skills/cloudflare/references/containers/api.md |   187 -
 .../references/containers/configuration.md         |   188 -
 .../cloudflare/references/containers/gotchas.md    |   178 -
 .../cloudflare/references/containers/patterns.md   |   202 -
 .../cloudflare/references/cron-triggers/README.md  |    99 -
 .../cloudflare/references/cron-triggers/api.md     |   196 -
 .../references/cron-triggers/configuration.md      |   180 -
 .../cloudflare/references/cron-triggers/gotchas.md |   199 -
 .../references/cron-triggers/patterns.md           |   190 -
 .../skills/cloudflare/references/ddos/README.md    |    41 -
 .claude/skills/cloudflare/references/ddos/api.md   |   164 -
 .../cloudflare/references/ddos/configuration.md    |    93 -
 .../skills/cloudflare/references/ddos/gotchas.md   |   107 -
 .../skills/cloudflare/references/ddos/patterns.md  |   174 -
 .../cloudflare/references/email-routing/README.md  |    89 -
 .../cloudflare/references/email-routing/api.md     |   195 -
 .../references/email-routing/configuration.md      |   186 -
 .../cloudflare/references/email-routing/gotchas.md |   196 -
 .../references/email-routing/patterns.md           |   229 -
 .../cloudflare/references/email-workers/README.md  |   151 -
 .../cloudflare/references/email-workers/api.md     |   237 -
 .../references/email-workers/configuration.md      |   112 -
 .../cloudflare/references/email-workers/gotchas.md |   125 -
 .../references/email-workers/patterns.md           |   102 -
 .../cloudflare/references/flagship/README.md       |    59 -
 .../skills/cloudflare/references/flagship/api.md   |   390 -
 .../references/flagship/configuration.md           |   202 -
 .../cloudflare/references/flagship/gotchas.md      |   178 -
 .../cloudflare/references/flagship/patterns.md     |   469 -
 .../cloudflare/references/graphql-api/README.md    |   147 -
 .../cloudflare/references/graphql-api/api.md       |   175 -
 .../references/graphql-api/configuration.md        |   118 -
 .../cloudflare/references/graphql-api/gotchas.md   |   110 -
 .../cloudflare/references/graphql-api/patterns.md  |   225 -
 .../cloudflare/references/miniflare/README.md      |   105 -
 .../skills/cloudflare/references/miniflare/api.md  |   187 -
 .../references/miniflare/configuration.md          |   173 -
 .../cloudflare/references/miniflare/gotchas.md     |   160 -
 .../cloudflare/references/miniflare/patterns.md    |   181 -
 .../references/network-interconnect/README.md      |    99 -
 .../references/network-interconnect/api.md         |   199 -
 .../network-interconnect/configuration.md          |   114 -
 .../references/network-interconnect/gotchas.md     |   165 -
 .../references/network-interconnect/patterns.md    |   166 -
 .../cloudflare/references/observability/README.md  |     2 +-
 .../cloudflare/references/pipelines/README.md      |     2 +-
 .../cloudflare/references/pipelines/patterns.md    |     2 +-
 .../skills/cloudflare/references/pulumi/README.md  |   100 -
 .claude/skills/cloudflare/references/pulumi/api.md |   200 -
 .../cloudflare/references/pulumi/configuration.md  |   198 -
 .../skills/cloudflare/references/pulumi/gotchas.md |   181 -
 .../cloudflare/references/pulumi/patterns.md       |   191 -
 .../references/r2-data-catalog/README.md           |    75 -
 .../cloudflare/references/r2-data-catalog/api.md   |   122 -
 .../references/r2-data-catalog/configuration.md    |    98 -
 .../references/r2-data-catalog/gotchas.md          |    55 -
 .../references/r2-data-catalog/patterns.md         |   122 -
 .../skills/cloudflare/references/r2-sql/README.md  |     2 +-
 .../cloudflare/references/r2-sql/configuration.md  |     2 +-
 .../cloudflare/references/r2-sql/patterns.md       |     4 +-
 .../cloudflare/references/realtime-sfu/README.md   |    65 -
 .../cloudflare/references/realtime-sfu/api.md      |   158 -
 .../references/realtime-sfu/configuration.md       |   137 -
 .../cloudflare/references/realtime-sfu/gotchas.md  |   133 -
 .../cloudflare/references/realtime-sfu/patterns.md |   174 -
 .../cloudflare/references/realtimekit/README.md    |   113 -
 .../cloudflare/references/realtimekit/api.md       |   212 -
 .../references/realtimekit/configuration.md        |   203 -
 .../cloudflare/references/realtimekit/gotchas.md   |   169 -
 .../cloudflare/references/realtimekit/patterns.md  |   223 -
 .../skills/cloudflare/references/sandbox/README.md |    96 -
 .../skills/cloudflare/references/sandbox/api.md    |   198 -
 .../cloudflare/references/sandbox/configuration.md |   143 -
 .../cloudflare/references/sandbox/gotchas.md       |   194 -
 .../cloudflare/references/sandbox/patterns.md      |   201 -
 .../cloudflare/references/spectrum/README.md       |    52 -
 .../skills/cloudflare/references/spectrum/api.md   |   181 -
 .../references/spectrum/configuration.md           |   194 -
 .../cloudflare/references/spectrum/gotchas.md      |   145 -
 .../cloudflare/references/spectrum/patterns.md     |   196 -
 .../cloudflare/references/tail-workers/README.md   |    89 -
 .../cloudflare/references/tail-workers/api.md      |   200 -
 .../references/tail-workers/configuration.md       |   176 -
 .../cloudflare/references/tail-workers/gotchas.md  |   192 -
 .../cloudflare/references/tail-workers/patterns.md |   180 -
 .../cloudflare/references/terraform/README.md      |   102 -
 .../skills/cloudflare/references/terraform/api.md  |   178 -
 .../references/terraform/configuration.md          |   197 -
 .../cloudflare/references/terraform/gotchas.md     |   150 -
 .../cloudflare/references/terraform/patterns.md    |   174 -
 .../cloudflare/references/web-analytics/README.md  |     2 +-
 .../skills/cloudflare/references/workerd/README.md |     3 +-
 .../references/workers-for-platforms/README.md     |     2 +-
 .../cloudflare/references/workers-vpc/README.md    |   127 -
 .../cloudflare/references/workers-vpc/api.md       |   202 -
 .../references/workers-vpc/configuration.md        |   147 -
 .../cloudflare/references/workers-vpc/gotchas.md   |   167 -
 .../cloudflare/references/workers-vpc/patterns.md  |   209 -
 .../cloudflare/references/wrangler/README.md       |     1 -
 .../references/zaraz/IMPLEMENTATION_SUMMARY.md     |   121 -
 .../skills/cloudflare/references/zaraz/README.md   |   111 -
 .claude/skills/cloudflare/references/zaraz/api.md  |   112 -
 .../cloudflare/references/zaraz/configuration.md   |    90 -
 .../skills/cloudflare/references/zaraz/gotchas.md  |    81 -
 .../skills/cloudflare/references/zaraz/patterns.md |    74 -
 .claude/skills/design-to-production/SKILL.md       | Unmerged
 .../references/report-template.md                  | Unmerged
 .../design-to-production/references/route-map.md   | Unmerged
 .claude/skills/graphify/SKILL.md                   | Unmerged
 .claude/skills/ipix-supabase/SKILL.md              | Unmerged
 .claude/skills/linear/SKILL.md                     |     4 +-
 .claude/skills/linear/references/ipix.md           |     7 +-
 .claude/skills/mercur/SKILL.md                     | Unmerged
 .../scripts/__pycache__/__init__.cpython-314.pyc   |   Bin 161 -> 0 bytes
 .../__pycache__/generate_report.cpython-314.pyc    |   Bin 16271 -> 0 bytes
 .../improve_description.cpython-314.pyc            |   Bin 13799 -> 0 bytes
 .../scripts/__pycache__/run_eval.cpython-314.pyc   |   Bin 15567 -> 0 bytes
 .../scripts/__pycache__/run_loop.cpython-314.pyc   |   Bin 17354 -> 0 bytes
 .../scripts/__pycache__/utils.cpython-314.pyc      |   Bin 2591 -> 0 bytes
 .../references/verifier-probes-ipix.md             | Unmerged
 .claude/skills/worktrees/SKILL.md                  |    14 +-
 .cursor/rules/mercur.mdc                           |    57 -
 .cursor/skills/mercur                              |     1 -
 Universal design prompt                            |     1 -
 .../design-prompts/00-review-and-conventions.md    |   103 -
 .../design-prompts/SCR-32-planner-workspace.md     |    80 -
 .../design-prompts/SCR-33-planner-dashboard.md     |    67 -
 .../SCR-34-planner-instance-settings.md            |    76 -
 .../plan/design-prompts/diagrams.md                |   166 -
 app/.gitignore                                     |     8 +
 app/next.config.ts                                 |    38 +-
 app/package-lock.json                              | 14199 ++++++++++++-------
 app/package.json                                   |    14 +-
 app/src/app/(operator)/layout.tsx                  |     4 +-
 .../api/marketing-chat/[[...slug]]/route.test.ts   |     7 +-
 .../app/api/marketing-chat/[[...slug]]/route.ts    |     6 +-
 app/src/lib/ai/provider.ts                         |    28 +-
 app/src/middleware.test.ts                         |    10 +-
 app/src/proxy.test.ts                              |   134 -
 app/src/proxy.ts                                   |    63 -
 app/src/test/operator-middleware-contract.test.ts  |    29 +-
 config/groq-models.json                            |   125 -
 config/groq-models.schema.json                     |    63 -
 linear/issues/README.md                            |    24 +
 package.json                                       |     1 +
 scripts/verify-rls.mjs                             |    15 +
 scripts/worktree-audit.mjs                         |    82 +-
 scripts/worktree-health.mjs                        |    11 +-
 services/cloudflare-worker/AGENTS.md               |     3 +-
 tasks/cloudflare/09-gemini-groq-audit.md           |    42 -
 tasks/cloudflare/ai-agent-architecture.md          |   322 -
 tasks/cloudflare/ai-provider-decision.md           |    32 -
 tasks/cloudflare/cf-000-platform-architecture.md   |   169 -
 tasks/cloudflare/cf-ai-migration-research.md       |    31 -
 tasks/cloudflare/intelligence-platform-plan.md     |    41 -
 .../Deep Architecture & AI Strategy Review.md      |   523 -
 .../Migrate from Vercel to Cloudflare Workers.md   |   375 -
 tasks/cloudflare/todo.md                           |   206 +-
 tasks/design-docs/designtoreact.md                 |   522 -
 tasks/diagrams/02-ai-provider-flow.md              |    59 +-
 tasks/diagrams/README.md                           |     2 +
 tasks/plan/todo.md                                 |   619 -
 166 files changed, 9736 insertions(+), 24728 deletions(-)
```

## git diff --cached --stat (staged vs HEAD)
```
 .claude/commands/pr-fix.md                         | Unmerged
 .claude/skills/README.md                           |   5 +-
 .claude/skills/architecture-brief/SKILL.md         | Unmerged
 .../references/output-template.md                  | Unmerged
 .claude/skills/cloudflare/SKILL.md                 | 167 ++++
 .../cloudflare/references/agents-sdk/README.md     |  91 ++
 .../cloudflare/references/agents-sdk/agents-sdk.md | 221 +++++
 .../skills/cloudflare/references/agents-sdk/api.md | 190 +++++
 .../references/agents-sdk/browse-the-web.md        |  63 ++
 .../cloudflare/references/agents-sdk/callable.md   |  92 ++
 .../cloudflare/references/agents-sdk/client-sdk.md | 110 +++
 .../cloudflare/references/agents-sdk/codemode.md   | 110 +++
 .../references/agents-sdk/configuration.md         |  72 ++
 .../references/agents-sdk/durable-execution.md     |  51 ++
 .../cloudflare/references/agents-sdk/email.md      | 146 ++++
 .../cloudflare/references/agents-sdk/gotchas.md    | 158 ++++
 .../references/agents-sdk/human-in-the-loop.md     |  67 ++
 .../skills/cloudflare/references/agents-sdk/mcp.md | 188 +++++
 .../references/agents-sdk/observability.md         |  44 +
 .../cloudflare/references/agents-sdk/patterns.md   | 192 +++++
 .../references/agents-sdk/queue-retries.md         |  79 ++
 .../cloudflare/references/agents-sdk/routing.md    |  75 ++
 .../agents-sdk/server-driven-messages.md           |  63 ++
 .../references/agents-sdk/state-scheduling.md      | 171 ++++
 .../references/agents-sdk/streaming-chat.md        | 198 +++++
 .../cloudflare/references/agents-sdk/think.md      | 112 +++
 .../cloudflare/references/agents-sdk/voice.md      |  68 ++
 .../references/agents-sdk/webhooks-push.md         |  86 ++
 .../cloudflare/references/agents-sdk/workflows.md  | 132 +++
 .../cloudflare/references/ai-gateway/README.md     | 175 ++++
 .../references/ai-gateway/configuration.md         | 111 +++
 .../references/ai-gateway/dynamic-routing.md       |  82 ++
 .../cloudflare/references/ai-gateway/features.md   |  96 +++
 .../references/ai-gateway/sdk-integration.md       | 114 +++
 .../references/ai-gateway/troubleshooting.md       |  88 ++
 .../cloudflare/references/ai-search/README.md      | 138 +++
 .../skills/cloudflare/references/ai-search/api.md  |  87 ++
 .../references/ai-search/configuration.md          |  88 ++
 .../cloudflare/references/ai-search/gotchas.md     |  81 ++
 .../cloudflare/references/ai-search/patterns.md    |  85 ++
 .../references/analytics-engine/README.md          |  94 +++
 .../cloudflare/references/analytics-engine/api.md  | 112 +++
 .../references/analytics-engine/configuration.md   | 112 +++
 .../references/analytics-engine/gotchas.md         |  85 ++
 .../references/analytics-engine/patterns.md        |  83 ++
 .../cloudflare/references/api-shield/README.md     |  44 +
 .../skills/cloudflare/references/api-shield/api.md | 141 ++++
 .../references/api-shield/configuration.md         | 192 +++++
 .../cloudflare/references/api-shield/gotchas.md    | 125 +++
 .../cloudflare/references/api-shield/patterns.md   | 180 ++++
 .claude/skills/cloudflare/references/api/README.md |  66 ++
 .claude/skills/cloudflare/references/api/api.md    | 204 +++++
 .../cloudflare/references/api/configuration.md     | 160 ++++
 .../skills/cloudflare/references/api/gotchas.md    | 225 +++++
 .../skills/cloudflare/references/api/patterns.md   | 204 +++++
 .../references/argo-smart-routing/README.md        |  90 ++
 .../references/argo-smart-routing/api.md           | 240 ++++++
 .../references/argo-smart-routing/configuration.md | 197 +++++
 .../references/argo-smart-routing/gotchas.md       | 111 +++
 .../references/argo-smart-routing/patterns.md      | 104 +++
 .../cloudflare/references/artifacts/README.md      |  79 ++
 .../skills/cloudflare/references/artifacts/api.md  | 128 +++
 .../references/artifacts/configuration.md          |  92 ++
 .../cloudflare/references/bindings/README.md       | 122 +++
 .../skills/cloudflare/references/bindings/api.md   | 203 +++++
 .../references/bindings/configuration.md           | 188 +++++
 .../cloudflare/references/bindings/gotchas.md      | 208 +++++
 .../cloudflare/references/bindings/patterns.md     | 200 +++++
 .../cloudflare/references/bot-management/README.md |  94 +++
 .../cloudflare/references/bot-management/api.md    | 169 ++++
 .../references/bot-management/configuration.md     | 163 ++++
 .../references/bot-management/gotchas.md           | 114 +++
 .../references/bot-management/patterns.md          | 182 ++++
 .../references/browser-rendering/README.md         |  78 ++
 .../cloudflare/references/browser-rendering/api.md | 108 +++
 .../references/browser-rendering/configuration.md  |  78 ++
 .../references/browser-rendering/gotchas.md        |  88 ++
 .../references/browser-rendering/patterns.md       |  91 ++
 .claude/skills/cloudflare/references/c3/README.md  | 111 +++
 .claude/skills/cloudflare/references/c3/api.md     |  71 ++
 .../cloudflare/references/c3/configuration.md      |  81 ++
 .claude/skills/cloudflare/references/c3/gotchas.md |  92 ++
 .../skills/cloudflare/references/c3/patterns.md    |  82 ++
 .../cloudflare/references/cache-reserve/README.md  | 147 ++++
 .../cloudflare/references/cache-reserve/api.md     | 194 +++++
 .../references/cache-reserve/configuration.md      | 169 ++++
 .../cloudflare/references/cache-reserve/gotchas.md | 132 +++
 .../references/cache-reserve/patterns.md           | 197 +++++
 .../cloudflare/references/containers/README.md     |  85 ++
 .../skills/cloudflare/references/containers/api.md | 187 +++++
 .../references/containers/configuration.md         | 188 +++++
 .../cloudflare/references/containers/gotchas.md    | 178 ++++
 .../cloudflare/references/containers/patterns.md   | 202 +++++
 .../cloudflare/references/cron-triggers/README.md  |  99 +++
 .../cloudflare/references/cron-triggers/api.md     | 196 +++++
 .../references/cron-triggers/configuration.md      | 180 ++++
 .../cloudflare/references/cron-triggers/gotchas.md | 199 +++++
 .../references/cron-triggers/patterns.md           | 190 +++++
 .claude/skills/cloudflare/references/d1/README.md  | 133 +++
 .claude/skills/cloudflare/references/d1/api.md     | 196 +++++
 .../cloudflare/references/d1/configuration.md      | 191 +++++
 .claude/skills/cloudflare/references/d1/gotchas.md |  98 +++
 .../skills/cloudflare/references/d1/patterns.md    | 189 +++++
 .../skills/cloudflare/references/ddos/README.md    |  41 +
 .claude/skills/cloudflare/references/ddos/api.md   | 164 ++++
 .../cloudflare/references/ddos/configuration.md    |  93 +++
 .../skills/cloudflare/references/ddos/gotchas.md   | 107 +++
 .../skills/cloudflare/references/ddos/patterns.md  | 174 ++++
 .../cloudflare/references/do-storage/README.md     |  75 ++
 .../skills/cloudflare/references/do-storage/api.md | 102 +++
 .../references/do-storage/configuration.md         | 112 +++
 .../cloudflare/references/do-storage/gotchas.md    | 150 ++++
 .../cloudflare/references/do-storage/patterns.md   | 194 +++++
 .../cloudflare/references/do-storage/testing.md    | 183 ++++
 .../references/durable-objects/README.md           | 185 +++++
 .../cloudflare/references/durable-objects/api.md   | 187 +++++
 .../references/durable-objects/configuration.md    | 160 ++++
 .../references/durable-objects/gotchas.md          | 197 +++++
 .../references/durable-objects/patterns.md         | 201 +++++
 .../cloudflare/references/email-routing/README.md  |  89 ++
 .../cloudflare/references/email-routing/api.md     | 195 +++++
 .../references/email-routing/configuration.md      | 186 +++++
 .../cloudflare/references/email-routing/gotchas.md | 196 +++++
 .../references/email-routing/patterns.md           | 229 +++++
 .../cloudflare/references/email-workers/README.md  | 151 ++++
 .../cloudflare/references/email-workers/api.md     | 237 ++++++
 .../references/email-workers/configuration.md      | 112 +++
 .../cloudflare/references/email-workers/gotchas.md | 125 +++
 .../references/email-workers/patterns.md           | 102 +++
 .../cloudflare/references/flagship/README.md       |  59 ++
 .../skills/cloudflare/references/flagship/api.md   | 390 +++++++++
 .../references/flagship/configuration.md           | 202 +++++
 .../cloudflare/references/flagship/gotchas.md      | 178 ++++
 .../cloudflare/references/flagship/patterns.md     | 469 +++++++++++
 .../cloudflare/references/graphql-api/README.md    | 147 ++++
 .../cloudflare/references/graphql-api/api.md       | 175 ++++
 .../references/graphql-api/configuration.md        | 118 +++
 .../cloudflare/references/graphql-api/gotchas.md   | 110 +++
 .../cloudflare/references/graphql-api/patterns.md  | 225 +++++
 .../cloudflare/references/hyperdrive/README.md     |  82 ++
 .../skills/cloudflare/references/hyperdrive/api.md | 143 ++++
 .../references/hyperdrive/configuration.md         | 159 ++++
 .../cloudflare/references/hyperdrive/gotchas.md    |  77 ++
 .../cloudflare/references/hyperdrive/patterns.md   | 190 +++++
 .../skills/cloudflare/references/images/README.md  |  61 ++
 .claude/skills/cloudflare/references/images/api.md |  96 +++
 .../cloudflare/references/images/configuration.md  | 211 +++++
 .../skills/cloudflare/references/images/gotchas.md |  99 +++
 .../cloudflare/references/images/patterns.md       | 115 +++
 .claude/skills/cloudflare/references/kv/README.md  |  89 ++
 .claude/skills/cloudflare/references/kv/api.md     | 160 ++++
 .../cloudflare/references/kv/configuration.md      | 144 ++++
 .claude/skills/cloudflare/references/kv/gotchas.md | 131 +++
 .../skills/cloudflare/references/kv/patterns.md    | 196 +++++
 .../cloudflare/references/miniflare/README.md      | 105 +++
 .../skills/cloudflare/references/miniflare/api.md  | 187 +++++
 .../references/miniflare/configuration.md          | 173 ++++
 .../cloudflare/references/miniflare/gotchas.md     | 160 ++++
 .../cloudflare/references/miniflare/patterns.md    | 181 ++++
 .../references/network-interconnect/README.md      |  99 +++
 .../references/network-interconnect/api.md         | 199 +++++
 .../network-interconnect/configuration.md          | 114 +++
 .../references/network-interconnect/gotchas.md     | 165 ++++
 .../references/network-interconnect/patterns.md    | 166 ++++
 .../cloudflare/references/observability/README.md  |  88 ++
 .../cloudflare/references/observability/api.md     | 164 ++++
 .../references/observability/configuration.md      | 169 ++++
 .../cloudflare/references/observability/gotchas.md | 115 +++
 .../references/observability/patterns.md           | 105 +++
 .../references/pages-functions/README.md           |  98 +++
 .../cloudflare/references/pages-functions/api.md   | 143 ++++
 .../references/pages-functions/configuration.md    | 122 +++
 .../references/pages-functions/gotchas.md          |  94 +++
 .../references/pages-functions/patterns.md         | 137 +++
 .../skills/cloudflare/references/pages/README.md   |  88 ++
 .claude/skills/cloudflare/references/pages/api.md  | 204 +++++
 .../cloudflare/references/pages/configuration.md   | 201 +++++
 .../skills/cloudflare/references/pages/gotchas.md  | 203 +++++
 .../skills/cloudflare/references/pages/patterns.md | 204 +++++
 .../cloudflare/references/pipelines/README.md      |  90 ++
 .../skills/cloudflare/references/pipelines/api.md  | 124 +++
 .../references/pipelines/configuration.md          | 155 ++++
 .../cloudflare/references/pipelines/gotchas.md     |  58 ++
 .../cloudflare/references/pipelines/patterns.md    | 130 +++
 .../skills/cloudflare/references/pulumi/README.md  | 100 +++
 .claude/skills/cloudflare/references/pulumi/api.md | 200 +++++
 .../cloudflare/references/pulumi/configuration.md  | 198 +++++
 .../skills/cloudflare/references/pulumi/gotchas.md | 181 ++++
 .../cloudflare/references/pulumi/patterns.md       | 191 +++++
 .../skills/cloudflare/references/queues/README.md  |  96 +++
 .claude/skills/cloudflare/references/queues/api.md | 206 +++++
 .../cloudflare/references/queues/configuration.md  | 144 ++++
 .../skills/cloudflare/references/queues/gotchas.md | 206 +++++
 .../cloudflare/references/queues/patterns.md       | 220 +++++
 .../references/r2-data-catalog/README.md           |  75 ++
 .../cloudflare/references/r2-data-catalog/api.md   | 122 +++
 .../references/r2-data-catalog/configuration.md    |  98 +++
 .../references/r2-data-catalog/gotchas.md          |  55 ++
 .../references/r2-data-catalog/patterns.md         | 122 +++
 .../skills/cloudflare/references/r2-sql/README.md  |  64 ++
 .claude/skills/cloudflare/references/r2-sql/api.md | 121 +++
 .../cloudflare/references/r2-sql/configuration.md  |  50 ++
 .../skills/cloudflare/references/r2-sql/gotchas.md |  39 +
 .../cloudflare/references/r2-sql/patterns.md       | 118 +++
 .claude/skills/cloudflare/references/r2/README.md  |  95 +++
 .claude/skills/cloudflare/references/r2/api.md     | 200 +++++
 .../cloudflare/references/r2/configuration.md      | 165 ++++
 .claude/skills/cloudflare/references/r2/gotchas.md | 190 +++++
 .../skills/cloudflare/references/r2/patterns.md    | 193 +++++
 .../cloudflare/references/realtime-sfu/README.md   |  65 ++
 .../cloudflare/references/realtime-sfu/api.md      | 158 ++++
 .../references/realtime-sfu/configuration.md       | 137 +++
 .../cloudflare/references/realtime-sfu/gotchas.md  | 133 +++
 .../cloudflare/references/realtime-sfu/patterns.md | 174 ++++
 .../cloudflare/references/realtimekit/README.md    | 113 +++
 .../cloudflare/references/realtimekit/api.md       | 212 +++++
 .../references/realtimekit/configuration.md        | 203 +++++
 .../cloudflare/references/realtimekit/gotchas.md   | 169 ++++
 .../cloudflare/references/realtimekit/patterns.md  | 223 +++++
 .../skills/cloudflare/references/sandbox/README.md |  96 +++
 .../skills/cloudflare/references/sandbox/api.md    | 198 +++++
 .../cloudflare/references/sandbox/configuration.md | 143 ++++
 .../cloudflare/references/sandbox/gotchas.md       | 194 +++++
 .../cloudflare/references/sandbox/patterns.md      | 201 +++++
 .../cloudflare/references/secrets-store/README.md  |  74 ++
 .../cloudflare/references/secrets-store/api.md     | 200 +++++
 .../references/secrets-store/configuration.md      | 185 +++++
 .../cloudflare/references/secrets-store/gotchas.md |  97 +++
 .../references/secrets-store/patterns.md           | 207 +++++
 .../references/smart-placement/README.md           | 138 +++
 .../cloudflare/references/smart-placement/api.md   | 183 ++++
 .../references/smart-placement/configuration.md    | 196 +++++
 .../references/smart-placement/gotchas.md          | 174 ++++
 .../references/smart-placement/patterns.md         | 183 ++++
 .../cloudflare/references/snippets/README.md       |  68 ++
 .../skills/cloudflare/references/snippets/api.md   | 198 +++++
 .../references/snippets/configuration.md           | 227 +++++
 .../cloudflare/references/snippets/gotchas.md      |  86 ++
 .../cloudflare/references/snippets/patterns.md     | 135 +++
 .../cloudflare/references/spectrum/README.md       |  52 ++
 .../skills/cloudflare/references/spectrum/api.md   | 181 ++++
 .../references/spectrum/configuration.md           | 194 +++++
 .../cloudflare/references/spectrum/gotchas.md      | 145 ++++
 .../cloudflare/references/spectrum/patterns.md     | 196 +++++
 .../cloudflare/references/static-assets/README.md  |  65 ++
 .../cloudflare/references/static-assets/api.md     | 199 +++++
 .../references/static-assets/configuration.md      | 186 +++++
 .../cloudflare/references/static-assets/gotchas.md | 162 ++++
 .../references/static-assets/patterns.md           | 189 +++++
 .../skills/cloudflare/references/stream/README.md  | 114 +++
 .../cloudflare/references/stream/api-live.md       | 195 +++++
 .claude/skills/cloudflare/references/stream/api.md | 199 +++++
 .../cloudflare/references/stream/configuration.md  | 141 ++++
 .../skills/cloudflare/references/stream/gotchas.md | 130 +++
 .../cloudflare/references/stream/patterns.md       | 184 ++++
 .../cloudflare/references/tail-workers/README.md   |  89 ++
 .../cloudflare/references/tail-workers/api.md      | 200 +++++
 .../references/tail-workers/configuration.md       | 176 ++++
 .../cloudflare/references/tail-workers/gotchas.md  | 192 +++++
 .../cloudflare/references/tail-workers/patterns.md | 180 ++++
 .../cloudflare/references/terraform/README.md      | 102 +++
 .../skills/cloudflare/references/terraform/api.md  | 178 ++++
 .../references/terraform/configuration.md          | 197 +++++
 .../cloudflare/references/terraform/gotchas.md     | 150 ++++
 .../cloudflare/references/terraform/patterns.md    | 174 ++++
 .../skills/cloudflare/references/tunnel/README.md  | 129 +++
 .claude/skills/cloudflare/references/tunnel/api.md | 193 +++++
 .../cloudflare/references/tunnel/configuration.md  | 157 ++++
 .../skills/cloudflare/references/tunnel/gotchas.md | 147 ++++
 .../cloudflare/references/tunnel/networking.md     | 168 ++++
 .../cloudflare/references/tunnel/patterns.md       | 192 +++++
 .../skills/cloudflare/references/turn/README.md    |  82 ++
 .claude/skills/cloudflare/references/turn/api.md   | 239 ++++++
 .../cloudflare/references/turn/configuration.md    | 179 ++++
 .../skills/cloudflare/references/turn/gotchas.md   | 231 ++++++
 .../skills/cloudflare/references/turn/patterns.md  | 213 +++++
 .../cloudflare/references/turnstile/README.md      |  99 +++
 .../skills/cloudflare/references/turnstile/api.md  | 240 ++++++
 .../references/turnstile/configuration.md          | 222 +++++
 .../cloudflare/references/turnstile/gotchas.md     | 218 +++++
 .../cloudflare/references/turnstile/patterns.md    | 193 +++++
 .../cloudflare/references/vectorize/README.md      | 133 +++
 .../skills/cloudflare/references/vectorize/api.md  |  88 ++
 .../references/vectorize/configuration.md          |  88 ++
 .../cloudflare/references/vectorize/gotchas.md     |  76 ++
 .../cloudflare/references/vectorize/patterns.md    |  90 ++
 .claude/skills/cloudflare/references/waf/README.md | 113 +++
 .claude/skills/cloudflare/references/waf/api.md    | 202 +++++
 .../cloudflare/references/waf/configuration.md     | 203 +++++
 .../skills/cloudflare/references/waf/gotchas.md    | 204 +++++
 .../skills/cloudflare/references/waf/patterns.md   | 197 +++++
 .../cloudflare/references/web-analytics/README.md  | 141 ++++
 .../references/web-analytics/configuration.md      |  76 ++
 .../cloudflare/references/web-analytics/gotchas.md |  82 ++
 .../references/web-analytics/integration.md        |  60 ++
 .../references/web-analytics/patterns.md           |  91 ++
 .../skills/cloudflare/references/workerd/README.md |  78 ++
 .../skills/cloudflare/references/workerd/api.md    | 185 +++++
 .../cloudflare/references/workerd/configuration.md | 183 ++++
 .../cloudflare/references/workerd/gotchas.md       | 139 ++++
 .../cloudflare/references/workerd/patterns.md      | 192 +++++
 .../cloudflare/references/workers-ai/README.md     | 197 +++++
 .../skills/cloudflare/references/workers-ai/api.md | 112 +++
 .../references/workers-ai/configuration.md         |  97 +++
 .../cloudflare/references/workers-ai/gotchas.md    | 114 +++
 .../cloudflare/references/workers-ai/patterns.md   | 120 +++
 .../references/workers-best-practices/review.md    | 174 ++++
 .../references/workers-best-practices/rules.md     | 463 +++++++++++
 .../workers-best-practices.md                      | 126 +++
 .../references/workers-for-platforms/README.md     |  89 ++
 .../references/workers-for-platforms/api.md        | 196 +++++
 .../workers-for-platforms/configuration.md         | 167 ++++
 .../references/workers-for-platforms/gotchas.md    | 134 +++
 .../references/workers-for-platforms/patterns.md   | 188 +++++
 .../references/workers-playground/README.md        | 127 +++
 .../references/workers-playground/api.md           | 101 +++
 .../references/workers-playground/configuration.md | 163 ++++
 .../references/workers-playground/gotchas.md       |  88 ++
 .../references/workers-playground/patterns.md      | 132 +++
 .../cloudflare/references/workers-vpc/README.md    | 127 +++
 .../cloudflare/references/workers-vpc/api.md       | 202 +++++
 .../references/workers-vpc/configuration.md        | 147 ++++
 .../cloudflare/references/workers-vpc/gotchas.md   | 167 ++++
 .../cloudflare/references/workers-vpc/patterns.md  | 209 +++++
 .../skills/cloudflare/references/workers/README.md | 108 +++
 .../skills/cloudflare/references/workers/api.md    | 195 +++++
 .../cloudflare/references/workers/configuration.md | 185 +++++
 .../cloudflare/references/workers/frameworks.md    | 197 +++++
 .../cloudflare/references/workers/gotchas.md       | 137 +++
 .../cloudflare/references/workers/patterns.md      | 198 +++++
 .../cloudflare/references/workflows/README.md      |  77 ++
 .../skills/cloudflare/references/workflows/api.md  | 218 +++++
 .../references/workflows/configuration.md          | 152 ++++
 .../cloudflare/references/workflows/gotchas.md     |  90 ++
 .../cloudflare/references/workflows/patterns.md    | 175 ++++
 .../cloudflare/references/wrangler/README.md       | 136 +++
 .../skills/cloudflare/references/wrangler/api.md   | 188 +++++
 .../cloudflare/references/wrangler/cli-guide.md    | 921 +++++++++++++++++++++
 .../references/wrangler/configuration.md           | 197 +++++
 .../cloudflare/references/wrangler/gotchas.md      | 197 +++++
 .../cloudflare/references/wrangler/patterns.md     | 209 +++++
 .../references/zaraz/IMPLEMENTATION_SUMMARY.md     | 121 +++
 .../skills/cloudflare/references/zaraz/README.md   | 111 +++
 .claude/skills/cloudflare/references/zaraz/api.md  | 112 +++
 .../cloudflare/references/zaraz/configuration.md   |  90 ++
 .../skills/cloudflare/references/zaraz/gotchas.md  |  81 ++
 .../skills/cloudflare/references/zaraz/patterns.md |  74 ++
 .claude/skills/design-to-production/SKILL.md       | Unmerged
 .../references/report-template.md                  | Unmerged
 .../design-to-production/references/route-map.md   | Unmerged
 .claude/skills/graphify/SKILL.md                   | Unmerged
 .claude/skills/ipix-supabase/SKILL.md              | Unmerged
 .claude/skills/ipix-task-lifecycle/README.md       |   6 +-
 .claude/skills/ipix-task-lifecycle/SKILL.md        | 217 ++---
 .../skills/ipix-task-lifecycle/implementation.md   |  64 +-
 .claude/skills/ipix-task-lifecycle/planning.md     |  76 +-
 .../references/audit-checklist.md                  |   2 +-
 .../references/domain-skill-routing.md             | 122 +++
 .../references/linear-issue-steps.md               |   8 +-
 .../references/linear-prompt-engineering.md        |  28 +-
 .../references/linear-spec-template.md             |   6 +-
 .../references/migration-safety.md                 |   2 +-
 .../ipix-task-lifecycle/references/overview.md     |  48 +-
 .../ipix-task-lifecycle/references/prd-template.md |   2 +-
 .../references/shipping-templates.md               |   4 +-
 .../references/verifier-probes-ipix.md             |   2 +-
 .claude/skills/ipix-task-lifecycle/shipping.md     |  42 +-
 .claude/skills/ipix/SKILL.md                       |   1 +
 .claude/skills/mercur/SKILL.md                     | Unmerged
 .../references/verifier-probes-ipix.md             | Unmerged
 .../plan/booking-wizard/audit.md                   | 208 +++++
 .../design-prompts/00-review-and-conventions.md    | 103 +++
 .../design-prompts/SCR-32-planner-workspace.md     |  80 ++
 .../design-prompts/SCR-33-planner-dashboard.md     |  67 ++
 .../SCR-34-planner-instance-settings.md            |  76 ++
 .../plan/design-prompts/diagrams.md                | 166 ++++
 .../plan/planner/01-audit.md                       | 119 +++
 .../8eb2c2aa-9bdc-47a8-851b-84aa6a082b7e.png       | Bin 0 -> 178770 bytes
 .../a129ba7f-5282-4161-9f73-ccb40688ba59.png       | Bin 0 -> 178657 bytes
 .../plan/planner/architecture-plan.md              | 375 +++++++++
 .../plan/planner/mermaid-diagrams.md               | 506 +++++++++++
 .../plan/planner/wireframes.md                     | 333 ++++++++
 Universal-design-prompt-new/tasks/designtoreact.md | 522 ++++++++++++
 .../tests/ipi-395-deal-detail-stub.png             | Bin 0 -> 46021 bytes
 .../tests/ipi-395-pipeline-at-risk-empty.png       | Bin 0 -> 59390 bytes
 .../tests/ipi-395-pipeline-desktop.png             | Bin 0 -> 66648 bytes
 .../tests/ipi-395-pipeline-mobile-390.png          | Bin 0 -> 51052 bytes
 .../tests/ipi-410-booking-wizard-availability.png  | Bin 0 -> 81112 bytes
 .../tests/ipi-410-booking-wizard-draft.png         | Bin 0 -> 85182 bytes
 .../tests/ipi-410-booking-wizard-mobile-390.png    | Bin 0 -> 50393 bytes
 .../tests/ipi-410-booking-wizard-rejected.png      | Bin 0 -> 68090 bytes
 .../tests/ipi-410-booking-wizard-review.png        | Bin 0 -> 90719 bytes
 .../ipi-410-booking-wizard-send-qa-org-gap.png     | Bin 0 -> 90267 bytes
 .../tests/ipi-410-booking-wizard-step0.png         | Bin 0 -> 78114 bytes
 index-skills.md                                    |  13 +-
 385 files changed, 53994 insertions(+), 176 deletions(-)
```

## git log --oneline origin/main..HEAD (commits on this branch not yet on origin/main)
```
dedbe3da chore(design): un-ignore Universal design prompt in Claude index
84155521 chore(design): track Universal-design-prompt-new in git
```

## Untracked files (git ls-files --others --exclude-standard, full list)
```
.@worktrees/main-checkout-recovery-snapshot-2026-07-10.md
.agents/skills/brainstorming/SKILL.md
.agents/skills/brainstorming/scripts/frame-template.html
.agents/skills/brainstorming/scripts/helper.js
.agents/skills/brainstorming/scripts/server.cjs
.agents/skills/brainstorming/scripts/start-server.sh
.agents/skills/brainstorming/scripts/stop-server.sh
.agents/skills/brainstorming/spec-document-reviewer-prompt.md
.agents/skills/brainstorming/visual-companion.md
.agents/skills/prd/SKILL.md
.claude/skills/brainstorming/SKILL.md
.claude/skills/brainstorming/scripts/frame-template.html
.claude/skills/brainstorming/scripts/helper.js
.claude/skills/brainstorming/scripts/server.cjs
.claude/skills/brainstorming/scripts/start-server.sh
.claude/skills/brainstorming/scripts/stop-server.sh
.claude/skills/brainstorming/spec-document-reviewer-prompt.md
.claude/skills/brainstorming/visual-companion.md
.claude/skills/cloudflare/references/REMOVED-FOR-NOW.md
.claude/skills/cloudflare/references/mastra/README.md
.claude/skills/cloudflare/references/mastra/gotchas.md
.claude/skills/cloudflare/references/mastra/opennext-inprocess.md
.claude/skills/cloudflare/references/mastra/standalone-deployer.md
.claude/skills/cloudflare/references/mastra/workers-ai-wiring.md
.claude/skills/prd/SKILL.md
.infisical.json
.obsidian/app.json
.obsidian/appearance.json
.obsidian/core-plugins.json
.obsidian/workspace.json
Universal design prompt (4).zip
Universal-design-prompt-new/plan/planner/design-prompts/00-review-and-conventions.md
Universal-design-prompt-new/plan/planner/design-prompts/SCR-32-planner-workspace.md
Universal-design-prompt-new/plan/planner/design-prompts/SCR-33-planner-dashboard.md
Universal-design-prompt-new/plan/planner/design-prompts/SCR-34-planner-instance-settings.md
Universal-design-prompt-new/plan/planner/design-prompts/SCR-35-planner-hub.md
Universal-design-prompt-new/plan/planner/design-prompts/diagrams.md
Universal-design-prompt-new/plan/planner/planner.md
Universal-design-prompt-new/plan/planner/tasks/progress.md
Universal-design-prompt-new/plan/planner/tasks/prompt-design.md
Universal-design-prompt-new/plan/planner/tasks/review-prs.md
Universal-design-prompt5.MERGED-verify-then-delete/.thumbnail
Universal-design-prompt5.MERGED-verify-then-delete/AI-EXPLAINABILITY.md
Universal-design-prompt5.MERGED-verify-then-delete/ANALYTICS-PLAN.md
Universal-design-prompt5.MERGED-verify-then-delete/DESIGN.md
Universal-design-prompt5.MERGED-verify-then-delete/MOBILE-IMPROVE.md
Universal-design-prompt5.MERGED-verify-then-delete/MOBILE-PLAN.md
Universal-design-prompt5.MERGED-verify-then-delete/PAGES-REORG-PLAN.md
Universal-design-prompt5.MERGED-verify-then-delete/PLAN.md
Universal-design-prompt5.MERGED-verify-then-delete/Pages/Analytics.v2.image-first.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/Assets.v2.image-first.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/Brand Detail.v2.image-first.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/Brand List.v2.image-first.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/Campaign Performance.v2.image-first.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/Campaigns.v2.image-first.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/Channel Preview.v2.image-first.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/Command Center.v2.image-first.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/Component Library.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/DEMO-360-Agency.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/INDEX.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/Matching.v2.image-first.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/Onboarding.v2.zeely.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/SCR-09-Matching-Talent.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/SCR-15-Notification-Center.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/SCR-18-Collaboration-Audit.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/SCR-20-Talent-Profile.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/SCR-23-Availability-Editor.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/SCR-24-Talent-Onboarding.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/SCR-25-Role-Dashboards.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/SCR-26-CRM-Companies-List.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/SCR-27-CRM-Company-Detail.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/SCR-28-CRM-Contacts-List.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/SCR-29-CRM-Contact-Detail.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/SCR-30-CRM-Pipeline.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/SCR-31-CRM-Deal-Detail.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/SCR-MOBILE-Booking-Shell.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/SCR-MOBILE-BottomSheet.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/SCR-MOBILE-CRM-Gallery.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/SCR-MOBILE-Gallery.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/Shoot Detail.v2.image-first.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/Shoot Wizard.v2.image-first.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/Shoots List.v2.image-first.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/Pages/support.js
Universal-design-prompt5.MERGED-verify-then-delete/REFACTOR.md
Universal-design-prompt5.MERGED-verify-then-delete/SITEMAP.md
Universal-design-prompt5.MERGED-verify-then-delete/archive/Brand Detail.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/archive/Command Center.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/booking/SCR-09-Casting-Review.plan.md
Universal-design-prompt5.MERGED-verify-then-delete/booking/SCR-20-Model-Profile.plan.md
Universal-design-prompt5.MERGED-verify-then-delete/booking/SCR-21-Booking-Wizard.plan.md
Universal-design-prompt5.MERGED-verify-then-delete/booking/SCR-22-Booking-Detail.plan.md
Universal-design-prompt5.MERGED-verify-then-delete/booking/SCR-25-AI-Native-Dashboards.plan.md
Universal-design-prompt5.MERGED-verify-then-delete/changelog.md
Universal-design-prompt5.MERGED-verify-then-delete/checklist.md
Universal-design-prompt5.MERGED-verify-then-delete/components/AgentStatusIndicator.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/components/ApprovalCard.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/components/AssetCard.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/components/BottomNavigation.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/components/BottomSheet.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/components/BrandCard.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/components/COMPONENTS.md
Universal-design-prompt5.MERGED-verify-then-delete/components/CampaignCard.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/components/EmptyState.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/components/EvidenceBlock.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/components/FilterBar.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/components/IntelligencePanel.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/components/NavSidebar.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/components/OperatorShell.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/components/PageHeader.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/components/PersistentChatDock.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/components/SearchBar.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/components/ShootCard.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/components/SkeletonLoader.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/components/StatusChip.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/components/WizardStep.dc.html
Universal-design-prompt5.MERGED-verify-then-delete/components/support.js
Universal-design-prompt5.MERGED-verify-then-delete/crm/CRM-HANDOFF.md
Universal-design-prompt5.MERGED-verify-then-delete/crm/CRM-MOBILE-tasks.md
Universal-design-prompt5.MERGED-verify-then-delete/crm/CRM-REFACTOR-AUDIT.md
Universal-design-prompt5.MERGED-verify-then-delete/crm/PROFILE-360-template.md
Universal-design-prompt5.MERGED-verify-then-delete/crm/RELATIONSHIP-HUB.strategy.md
Universal-design-prompt5.MERGED-verify-then-delete/crm/SCHEMA-crew-location-360.claude-code.md
Universal-design-prompt5.MERGED-verify-then-delete/crm/crm-audit.md
Universal-design-prompt5.MERGED-verify-then-delete/crm/crm-plan.md
Universal-design-prompt5.MERGED-verify-then-delete/design-audit-2026-06-28-rev2.md
Universal-design-prompt5.MERGED-verify-then-delete/design-patched/00-README.md
Universal-design-prompt5.MERGED-verify-then-delete/design-patched/DESIGN.md
Universal-design-prompt5.MERGED-verify-then-delete/design-patched/archive/2026-06-design-setup-plan.md
Universal-design-prompt5.MERGED-verify-then-delete/design-patched/changelog.md
Universal-design-prompt5.MERGED-verify-then-delete/design-patched/image-strategy.md
Universal-design-prompt5.MERGED-verify-then-delete/design-patched/plan.md
Universal-design-prompt5.MERGED-verify-then-delete/design-patched/prompts/00-universal.md
Universal-design-prompt5.MERGED-verify-then-delete/design-patched/prompts/01-dashboard.md
Universal-design-prompt5.MERGED-verify-then-delete/design-patched/prompts/02-brand-detail.md
Universal-design-prompt5.MERGED-verify-then-delete/design-patched/prompts/03-shoots.md
Universal-design-prompt5.MERGED-verify-then-delete/design-patched/prompts/04-brand-list.md
Universal-design-prompt5.MERGED-verify-then-delete/design-patched/prompts/05-shoot-wizard.md
Universal-design-prompt5.MERGED-verify-then-delete/design-patched/prompts/06-campaigns.md
Universal-design-prompt5.MERGED-verify-then-delete/design-patched/prompts/07-assets.md
Universal-design-prompt5.MERGED-verify-then-delete/design-patched/prompts/08-onboarding-plan.md
Universal-design-prompt5.MERGED-verify-then-delete/design-patched/prompts/08-onboarding.md
Universal-design-prompt5.MERGED-verify-then-delete/design-patched/prompts/09-matching.md
Universal-design-prompt5.MERGED-verify-then-delete/design-patched/prompts/10-channel-preview.md
Universal-design-prompt5.MERGED-verify-then-delete/design-patched/redesign-spec.md
Universal-design-prompt5.MERGED-verify-then-delete/design-patched/todo.md
Universal-design-prompt5.MERGED-verify-then-delete/design-patched/tokens.css
Universal-design-prompt5.MERGED-verify-then-delete/docs/CLAUDE-CODE-HANDOFF.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/design/ACCESSIBILITY.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/design/AI-UX.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/design/ANIMATIONS.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/design/DESIGN-AUDIT-2026-07-01.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/design/DESIGN-PRINCIPLES.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/design/DESIGN-QA.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/design/DESIGN-TASKS.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/design/DESIGN-TOKENS.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/design/IMAGE-STANDARDS.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/design/IMPLEMENTATION-TASKS.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/design/PATTERNS.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/design/PERFORMANCE.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/design/README.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/design/STATES.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/design/WORKFLOWS.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/design/improve.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/handoff/01-overview.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/handoff/02-screen-map.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/handoff/03-component-map.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/handoff/04-user-journeys.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/handoff/05-feature-map.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/handoff/06-ai-workflows.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/handoff/07-navigation-map.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/handoff/08-state-map.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/handoff/09-react-implementation-map.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/handoff/10-implementation-order.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/handoff/11-screen-checklists.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/handoff/12-production-handoff.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/handoff/13-react-mobile-verification.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/handoff/14-ai-runtime-contract.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/handoff/SCREEN-REGISTRY.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/handoff/handoff.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/models/00-model-booking-plan.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/models/01-model-booking-engineering-handoff.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/models/02-engineering-reference.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/models/AUDIT-ipix.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/models/COMPOSER-PRIMITIVE.spec.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/models/IMPLEMENTATION-MATRICES.md
Universal-design-prompt5.MERGED-verify-then-delete/docs/models/handoff/composer-registry.ts
Universal-design-prompt5.MERGED-verify-then-delete/images/10-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/images/11-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/images/12-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/images/13-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/images/14-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/images/15-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/images/16-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/images/17-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/images/18-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/images/19-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/images/20-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/images/21-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/images/22-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/images/23-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/images/24-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/images/5-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/images/6-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/images/7-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/images/8-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/images/9-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/plan/02-implementation-audit.md
Universal-design-prompt5.MERGED-verify-then-delete/plan/audit/01-design-package-audit.md
Universal-design-prompt5.MERGED-verify-then-delete/plan/booking-wizard/audit.md
Universal-design-prompt5.MERGED-verify-then-delete/plan/design-prompts/00-review-and-conventions.md
Universal-design-prompt5.MERGED-verify-then-delete/plan/design-prompts/SCR-32-planner-workspace.md
Universal-design-prompt5.MERGED-verify-then-delete/plan/design-prompts/SCR-33-planner-dashboard.md
Universal-design-prompt5.MERGED-verify-then-delete/plan/design-prompts/SCR-34-planner-instance-settings.md
Universal-design-prompt5.MERGED-verify-then-delete/plan/design-prompts/diagrams.md
Universal-design-prompt5.MERGED-verify-then-delete/plan/designtoreact.md
Universal-design-prompt5.MERGED-verify-then-delete/plan/implement-summary.md
Universal-design-prompt5.MERGED-verify-then-delete/plan/planner/01-audit.md
Universal-design-prompt5.MERGED-verify-then-delete/plan/planner/8eb2c2aa-9bdc-47a8-851b-84aa6a082b7e.png
Universal-design-prompt5.MERGED-verify-then-delete/plan/planner/a129ba7f-5282-4161-9f73-ccb40688ba59.png
Universal-design-prompt5.MERGED-verify-then-delete/plan/planner/architecture-plan.md
Universal-design-prompt5.MERGED-verify-then-delete/plan/planner/mermaid-diagrams.md
Universal-design-prompt5.MERGED-verify-then-delete/plan/planner/wireframes.md
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/01-onb-6-12.png
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/01-onb-final.png
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/02-onb-6-12.png
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/02-onb-final.png
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/INDEX.md
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/assets-bulk.png
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/assets-evidence.png
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/bd-fashion.png
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/bd-fashion2.png
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/bd-real.png
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/bd-zeely.png
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/bl-bulk.png
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/bl-cardbody.png
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/brand-detail-moodboard.png
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/campperf-desktop.png
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/casting-actions.png
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/casting-desktop.png
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/cc-approvals.png
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/confirm-modal.png
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/crm-mobile.png
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/matching-table.png
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/menu-open.png
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/onb-13.png
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/review-dashboard.png
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/review-mid.png
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/shoots-chat-final.png
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/shoots-chat-selected.png
Universal-design-prompt5.MERGED-verify-then-delete/screenshots/shoots-chat-streaming.png
Universal-design-prompt5.MERGED-verify-then-delete/support.js
Universal-design-prompt5.MERGED-verify-then-delete/tasks/README.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/backend/BE-RT2-extend-get-shoot-detail-rpc-to-include-resource-type.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/checklists.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/designtoreact.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/mobile/MOB-01-bottom-sheet-primitive.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/mobile/MOB-02-bottom-navigation-shell.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/mobile/MOB-03-composer-primitive.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/mobile/MOB-04-operator-shell-integration.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/mobile/MOB-10-mvp-operator-screens.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/mobile/MOB-20-phase2-flows.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/mobile/MOB-30-channel-preview-mobile.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/mobile/MOB-31-selection-gestures-a11y.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/mobile/MOB-32-tablet-breakpoints.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/mobile/MOB-40-booking-set-mobile.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/mobile/MOB-90-verification-pass.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/refactor/README.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/refactor/RF-01-status-chip.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/refactor/RF-02-entity-list.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/refactor/RF-03-crm-list-screens.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/refactor/RF-04a-crm-company-detail.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/refactor/RF-04b-profile360-extract.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/refactor/RF-05-token-cleanup-touch-as-you-go.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/refactor/RF-A1-wizardshell-shoot-booking-flow-configs.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/refactor/RF-A1b-detailshell-booking-flow-config.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/refactor/RF-A3-icon-standardization-emoji-lucide.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/refactor/RF-A6-analytics-kpi-kit.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/refactor/RF-A7b-empty-error-state.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/refactor/RF-A9-matching-v2-vs-scr-09-registry-doc.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/refactor/RF-OPT-shootcard-statuschip.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/MATRIX.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/README.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-01-command-center.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-02-brand-list.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-03-brand-detail.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-04-shoots-list.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-05-shoot-detail.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-06-shoot-wizard.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-07-campaigns.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-08-assets.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-09-matching-talent.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-10-channel-preview.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-11-onboarding.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-15-notification-center.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-16-analytics-dashboard.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-17-campaign-performance.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-18-collaboration-activity-audit.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-20-talent-profile.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-21-booking-wizard-plan.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-21-booking-wizard.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-22-booking-detail-plan.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-22-booking-detail.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-23-availability-editor.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-24-talent-onboarding.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-25-role-dashboards.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-26-crm-companies-list.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-27-crm-company-detail.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-28-crm-contacts-list.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-29-crm-contact-detail.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-30-crm-pipeline.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-31-crm-deal-detail.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/SCR-TEMPLATE.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/diagrams/SCR-01-command-center.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/diagrams/SCR-02-brand-list.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/diagrams/SCR-03-brand-detail.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/diagrams/SCR-04-shoots-list.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/diagrams/SCR-05-shoot-detail.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/diagrams/SCR-06-shoot-wizard.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/diagrams/SCR-07-campaigns.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/diagrams/SCR-08-assets.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/diagrams/SCR-09-matching.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/diagrams/SCR-10-channel-preview.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/diagrams/SCR-11-onboarding.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/diagrams/SCR-15-notifications.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/diagrams/SCR-16-analytics.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/diagrams/SCR-17-campaign-performance.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/diagrams/SCR-18-collaboration.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/diagrams/SCR-20-talent-profile.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/diagrams/SCR-21-booking-wizard.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/diagrams/SCR-22-booking-detail.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/diagrams/SCR-23-availability.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/diagrams/SCR-24-talent-onboarding.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/diagrams/SCR-25-role-dashboards.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/diagrams/SCR-26-crm-companies.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/diagrams/SCR-27-crm-company-detail.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/diagrams/SCR-28-crm-contacts.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/diagrams/SCR-29-crm-contact-detail.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/diagrams/SCR-30-crm-pipeline.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/diagrams/SCR-31-crm-deal-detail.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/README.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/SCR-01-command-center.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/SCR-02-brand-list.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/SCR-03-brand-detail.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/SCR-04-shoots-list.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/SCR-05-shoot-detail.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/SCR-06-shoot-wizard.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/SCR-07-campaigns.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/SCR-08-assets.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/SCR-09-matching.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/SCR-10-channel-preview.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/SCR-11-onboarding.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/SCR-15-notifications.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/SCR-16-analytics.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/SCR-17-campaign-performance.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/SCR-18-collaboration.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/SCR-20-talent-profile.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/SCR-21-booking-wizard.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/SCR-22-booking-detail.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/SCR-23-availability.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/SCR-24-talent-onboarding.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/SCR-25-role-dashboards.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/SCR-26-crm-companies.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/SCR-27-crm-company-detail.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/SCR-28-crm-contacts.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/SCR-29-crm-contact-detail.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/SCR-30-crm-pipeline.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/screens/wireframes/SCR-31-crm-deal-detail.md
Universal-design-prompt5.MERGED-verify-then-delete/tasks/todo.md
Universal-design-prompt5.MERGED-verify-then-delete/todo.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/01-design-prompt.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/02-crm-design-master.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/02a-crm-companies-list.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/02b-crm-company-detail.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/02c-crm-contacts-list.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/02d-crm-contact-detail.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/02e-crm-pipeline.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/02f-crm-deal-detail.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/04-brand-list.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/05-shoot-wizard.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/06-campaigns.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/06-crm-supabase-design-reference.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/07-assets.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/09-matching.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/09-onboarding-24fe3123.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/09-onboarding.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/1-dash-c9d903fb.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/1-dash.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/1-modal.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/10-channel-preview.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/10-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/uploads/10-modal.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/11-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/uploads/11-modal.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/12-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/uploads/13-modal.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/14-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/uploads/15-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/uploads/16-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/uploads/17-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/uploads/18-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/uploads/19-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/uploads/20-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/uploads/2026-06-28-plan-todo-audit.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/21-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/uploads/3-dash-db8a9423.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/3-dash.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/3-modal.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/4-dash.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/4-modal.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/5-dash-21856b3b.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/5-dash.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/5-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/uploads/5-modal.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/6-dash-bb4fd6a6.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/6-dash.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/6-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/uploads/7-modal.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/8-modal.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/9-fashionos.jpeg
Universal-design-prompt5.MERGED-verify-then-delete/uploads/9-modal.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/README.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/claude-design/00-README.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/claude-design/00-upload-manifest.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/claude-design/21-component-dependencies.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/claude-design/DESIGN.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/claude-design/design-plan.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/claude-design/prompts/00-universal.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/claude-design/prompts/01-dashboard.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/claude-design/prompts/02-brand-detail.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/claude-design/prompts/03-shoots.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/pasted-1782673486676-0.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/pasted-1782773153627-0.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/pasted-1782777545471-0.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/pasted-1782778225798-0.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/pasted-1782780009006-0.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/pasted-1782780293500-0.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/pasted-1782780311259-0.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/pasted-1782780483389-0.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/pasted-1782780603054-0.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/pasted-1782780642607-0.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/pasted-1782780702033-0.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/pasted-1782780736297-0.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/pasted-1782780855917-0.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/pasted-1782780973456-0.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/pasted-1783119068195-0.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/pasted-1783156697138-0.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/pasted-1783157550705-0.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/pasted-1783313320867-0.png
Universal-design-prompt5.MERGED-verify-then-delete/uploads/plan.md
Universal-design-prompt5.MERGED-verify-then-delete/uploads/todo.md
app/index.md
app/open-next.config.ts
app/public/_headers
app/scripts/cf-ast-grep-stub.mjs
app/src/lib/copilotkit/runtime-internal.d.ts
app/src/lib/copilotkit/runtime-v2-fetch.ts
app/src/lib/planner/engine.test.ts
app/src/lib/planner/engine.ts
app/src/lib/planner/types.ts
app/src/middleware-auth-gate.test.ts
app/src/middleware.ts
app/wrangler.jsonc
docs/.obsidian/app.json
docs/.obsidian/appearance.json
docs/.obsidian/core-plugins.json
docs/.obsidian/workspace.json
docs/architecture/diagrams/01-system-overview.md
docs/architecture/diagrams/02-application-architecture.md
docs/architecture/diagrams/03-cloudflare-architecture.md
docs/architecture/diagrams/04-ai-architecture.md
docs/architecture/diagrams/05-agent-tool-registry.md
docs/architecture/diagrams/06-database-erd.md
docs/architecture/diagrams/07-auth-flow.md
docs/architecture/diagrams/08-brand-shoot-workflow.md
docs/architecture/diagrams/09-crm-booking-campaign.md
docs/architecture/diagrams/10-planner-architecture.md
docs/architecture/diagrams/11-media-pipeline.md
docs/architecture/diagrams/12-ai-request-flow.md
docs/architecture/diagrams/13-deployment-pipeline.md
docs/architecture/diagrams/14-production-runtime.md
docs/architecture/diagrams/15-feature-dependencies.md
docs/architecture/diagrams/16-roadmap-timeline.md
docs/architecture/diagrams/AUDIT-REPORT.md
docs/architecture/diagrams/VERIFIED-STATE.md
docs/architecture/diagrams/archive/01-overall-system-architecture.md
docs/architecture/diagrams/archive/02-cloudflare-workers-architecture.md
docs/architecture/diagrams/archive/03-opennext-deployment-architecture.md
docs/architecture/diagrams/archive/04-deployment-pipeline.md
docs/architecture/diagrams/archive/05-cicd-pipeline.md
docs/architecture/diagrams/archive/06-runtime-request-flow.md
docs/architecture/diagrams/archive/07-ai-platform-architecture.md
docs/architecture/diagrams/archive/08-mastra-architecture.md
docs/architecture/diagrams/archive/09-copilotkit-architecture.md
docs/architecture/diagrams/archive/10-ai-gateway-routing.md
docs/architecture/diagrams/archive/11-model-provider-routing.md
docs/architecture/diagrams/archive/12-shared-tool-registry.md
docs/architecture/diagrams/archive/13-prompt-registry.md
docs/architecture/diagrams/archive/14-agent-architecture.md
docs/architecture/diagrams/archive/15-hitl-flow.md
docs/architecture/diagrams/archive/16-brand-onboarding-workflow.md
docs/architecture/diagrams/archive/17-ai-brief-workflow.md
docs/architecture/diagrams/archive/18-shoot-workflow.md
docs/architecture/diagrams/archive/19-planner-workflow.md
docs/architecture/diagrams/archive/20-crm-workflow.md
docs/architecture/diagrams/archive/21-booking-workflow.md
docs/architecture/diagrams/archive/22-campaign-workflow.md
docs/architecture/diagrams/archive/23-media-cloudinary-workflow.md
docs/architecture/diagrams/archive/24-notification-workflow.md
docs/architecture/diagrams/archive/25-intelligence-workflow.md
docs/architecture/diagrams/archive/26-supabase-architecture.md
docs/architecture/diagrams/archive/27-database-entity-relationships.md
docs/architecture/diagrams/archive/28-storage-architecture.md
docs/architecture/diagrams/archive/29-authentication-flow.md
docs/architecture/diagrams/archive/30-realtime-architecture.md
docs/architecture/diagrams/archive/31-planner-system-architecture.md
docs/architecture/diagrams/archive/32-planner-template-engine.md
docs/architecture/diagrams/archive/33-planner-timeline.md
docs/architecture/diagrams/archive/34-planner-state-machine.md
docs/architecture/diagrams/archive/35-planner-dependencies.md
docs/architecture/diagrams/archive/36-planner-approval-flow.md
docs/architecture/diagrams/archive/37-workers-supabase-integration.md
docs/architecture/diagrams/archive/38-workers-mastra-integration.md
docs/architecture/diagrams/archive/39-durable-objects-flow.md
docs/architecture/diagrams/archive/40-queues-flow.md
docs/architecture/diagrams/archive/41-workers-ai-flow.md
docs/architecture/diagrams/archive/42-r2-kv-vectorize-status.md
docs/architecture/diagrams/archive/43-operator-app-navigation.md
docs/architecture/diagrams/archive/44-feature-dependency-graph.md
docs/architecture/diagrams/archive/45-component-hierarchy.md
docs/architecture/diagrams/archive/46-route-architecture.md
docs/architecture/diagrams/archive/47-design-system-component-relationships.md
docs/architecture/diagrams/archive/48-production-deployment-flow.md
docs/architecture/diagrams/archive/49-rollback-strategy.md
docs/architecture/diagrams/archive/50-monitoring-observability.md
docs/architecture/diagrams/archive/51-error-handling-flow.md
docs/architecture/diagrams/archive/52-audit-logging-flow.md
docs/architecture/diagrams/archive/FINAL-REPORT.md
docs/architecture/diagrams/index.md
docs/linear/issues/README.md
linear/ALL issues.csv
"linear/DESIGN V2 \342\200\224 Operator React Parity \342\200\272 Issues.csv"
linear/all-issues.md
linear/design.md
linear/issues/IPI-240-provider-options-alignment.md
linear/issues/IPI-457-cf-ai-005-unified-types-registry.md
linear/issues/IPI-461-cf-ai-004-provider-adapter.md
linear/issues/IPI-476-PLN-001-planner-schema-reusable-engine-core.md
linear/issues/IPI-477-PLN-002-shoot-production-timeline-template.md
linear/issues/IPI-478-PLN-003-hybrid-timeline-kanban-calendar-ui.md
linear/issues/IPI-479-PLN-004-role-based-views-assignments.md
linear/issues/IPI-480-PLN-005-real-time-sync-cloudflare-do.md
linear/issues/IPI-481-PLN-006-notification-rules-cloudflare-queue.md
linear/issues/IPI-482-PLN-007-mastra-planner-ai-tools-hitl.md
linear/issues/IPI-483-PLN-008-workflow-engine-dependencies-approvals.md
linear/issues/IPI-485-mastra-cf-001-provider-gateway-cutover.md
linear/issues/IPI-486-mastra-epic.md
linear/issues/IPI-487-cloudflare-epic.md
linear/issues/IPI-CF-MIG-110-opennext-foundation.md
linear/issues/IPI-CF-MIG-111-ci-opennext-build.md
linear/issues/IPI-CF-MIG-210-runtime-compat.md
linear/issues/IPI-CF-MIG-220-preview-smoke-gate.md
linear/issues/IPI-CF-MIG-810-production-cutover.md
linear/issues/IPI-MASTRA-CF-001-provider-gateway-cutover.md
mvp.md
prd.md
roadmap.md
scripts/cf-mcp-api-bridge.sh
scripts/cf-mcp-bridge.sh
scripts/cf-mcp-setup.sh
scripts/cursor-mcp-setup.sh
scripts/cursor-uninstall-cloudflare-plugin.sh
scripts/linear-apply-mastra-audit.py
scripts/linear-create-cf-mig-issues.py
scripts/mcp-env-bridge.sh
scripts/package-lock.json
scripts/package.json
scripts/worktree-sync-main.mjs
skills-lock.json
supabase/migrations/20260709000000_planner_schema_rls.sql
supabase/seed-planner-workflows.sql
tasks/.obsidian/app.json
tasks/.obsidian/appearance.json
tasks/.obsidian/core-plugins.json
tasks/.obsidian/workspace.json
"tasks/cloudflare/AI Platform \342\200\224 LLM Providers \342\200\272 Issues (5).md"
tasks/cloudflare/CLOUDFLARE-EPIC.md
tasks/cloudflare/audits/09-gemini-groq-audit.md
tasks/cloudflare/audits/audit-design.md
tasks/cloudflare/audits/audit-jul-9.md
tasks/cloudflare/audits/ipi-454-457-462-463-verification.md
tasks/cloudflare/audits/jul-8-linear-audit.md
tasks/cloudflare/audits/july-9-audit-plan.md
tasks/cloudflare/cursor-mcp-cloudflare.json
tasks/cloudflare/mastra/MASTRA-EPIC.md
tasks/cloudflare/mastra/cloudfalre-deployer.md
tasks/cloudflare/mastra/cloudflare-mastra-build.md
tasks/cloudflare/mastra/cloudflare-workersai.md
tasks/cloudflare/mastra/deploy-cloudflare.md
tasks/cloudflare/mastra/mastra issues.md
tasks/cloudflare/mastra/mastra-audit.md
tasks/cloudflare/migration/Migrate-Vercel-to-Cloudflare-Workers.md
tasks/cloudflare/migration/cloudflare-vercel.md
tasks/cloudflare/migration/docs/existing.md
tasks/cloudflare/migration/docs/migrate-vercel.md
tasks/cloudflare/migration/docs/nextjs-cloudflare.md
tasks/cloudflare/migration/docs/open-next.md
tasks/cloudflare/migration/notes-1.md
tasks/cloudflare/migration/notes-2.md
tasks/cloudflare/migration/notes-3.md
tasks/cloudflare/migration/notes-4.md
tasks/cloudflare/migration/plan-migrate.md
tasks/cloudflare/migration/startup.md
tasks/cloudflare/plan/ai-agent-architecture.md
tasks/cloudflare/plan/ai-provider-decision.md
tasks/cloudflare/plan/cf-000-platform-architecture.md
tasks/cloudflare/plan/cf-ai-migration-research.md
tasks/cloudflare/plan/deep-architecture-review.md
tasks/cloudflare/plan/intelligence-platform-plan.md
tasks/cloudflare/prompts/Deep-Architecture-AI-Strategy.md
tasks/cloudflare/tests/pr-279-workers-ai-url-verification.md
tasks/intelligence/ai/cursor-mcp.json
tasks/linear-audit/01-executive-summary.md
tasks/linear-audit/02-cloudflare-ai.md
tasks/linear-audit/03-data-agents.md
tasks/linear-audit/04-features-design.md
tasks/linear-audit/05-testing-operations.md
tasks/linear-audit/06-task-corrections.md
tasks/linear-audit/07-linear-update-plan.md
tasks/plan/Untitled.md
tasks/plan/audit/00-repo-ground-truth.md
tasks/plan/audit/01-cloudflare-infra-reconciliation.md
tasks/plan/audit/02-mastra-ai-reconciliation.md
tasks/plan/audit/03-linear-issues-reconciliation.md
tasks/plan/audit/04-design-docs-reconciliation.md
tasks/plan/audit/05-master-synthesis.md
tasks/plan/prompt-plan.md
worktrees/.claude/settings.local.json
```
