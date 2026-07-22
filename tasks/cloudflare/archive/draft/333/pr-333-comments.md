Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In @.claude/skills/cloudflare-workflow/SKILL.md at line 50, Update the fenced
text blocks in SKILL.md, including the blocks around the referenced locations,
to specify the text language after each opening fence. Use text for these fences
and leave their contents unchanged.

Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In @.claude/skills/cloudflare-workflow/SKILL.md around lines 50 - 63, Reorder
the workflow checklist so the Graphify architecture orientation step runs before
“Read Current Code (git show / Read tool)” and any other raw source inspection.
Update the surrounding “Architecture Review” entry to reflect this earlier
Graphify-first step, while preserving the remaining research stages and their
intent.

Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In @.claude/skills/cloudflare-workflow/SKILL.md around lines 162 - 179, Update
the Stage 4 testing guidance and the related sections around deployment
verification to make heavyweight checks conditional on the change class: require
focused validation for all changes, but require builds, bundle audits, runtime
verification, and OpenNext or preview checks only when runtime artifacts or
deployment behavior are affected. Keep rollout, rollback, and observability
gates for deployments, while allowing docs-only and similarly low-risk changes
to skip unnecessary heavyweight validation.

Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In @.claude/skills/cloudflare-workflow/SKILL.md around lines 214 - 220, Update
the “No secrets in bundle” checklist entry to scan the built artifact with the
repository’s secret-scanner command rather than grepping specific binding
identifiers. Document expected server-side binding names separately, and retain
the rule that detected secret values must cause investigation or failure.

Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@CLAUDE.md` at line 31, Update the cloudflare-workflow entry in the skill
table to describe the gate as “nine stages (0–8)” and explicitly include Stage 0
Research & Architecture Review in the sequence, preserving the existing
Cloudflare-related scope description.

Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@docs/linear/issues/IPI-526-bedrock-provider-fallback.md` at line 34, Update
the proof checklist command in IPI-526-bedrock-provider-fallback.md to use
recursive grep when searching the providers directory, preserving the existing
search pattern and target path.

Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@docs/linear/issues/IPI-526-bedrock-provider-fallback.md` around lines 124 -
127, Replace the absolute credential path in the “Credentials” section and every
hardcoded /home/sk/ipix/ reference in the proof commands with
repository-relative paths such as app/.env.local and
services/cloudflare-worker/. Preserve the documented credential variable names
without exposing machine-specific filesystem locations.