# Feature Specification Rules

42 rules across 8 categories for writing PRDs, requirements, and feature specs. Prioritized by impact.

## Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Scope Definition | CRITICAL | `scope-` |
| 2 | Requirements Clarity | CRITICAL | `req-` |
| 3 | Prioritization Frameworks | HIGH | `prio-` |
| 4 | Acceptance Criteria | HIGH | `accept-` |
| 5 | Stakeholder Alignment | MEDIUM-HIGH | `stake-` |
| 6 | Technical Specification | MEDIUM | `tech-` |
| 7 | Change Management | MEDIUM | `change-` |
| 8 | Documentation Standards | LOW | `doc-` |

## 1. Scope Definition (CRITICAL)

- `scope-define-boundaries` — Define explicit scope boundaries before writing any requirements
- `scope-document-assumptions` — Document all assumptions explicitly; hidden assumptions become bugs
- `scope-work-breakdown` — Break scope into measurable work items; vague scope = scope creep
- `scope-define-mvp` — Define MVP before full feature set; build the smallest thing that tests the hypothesis
- `scope-stakeholder-signoff` — Get stakeholder signoff on scope before implementation begins

## 2. Requirements Clarity (CRITICAL)

- `req-specific-measurable` — Write specific, measurable requirements ("response < 200ms", not "fast")
- `req-user-stories` — Structure requirements as user stories: "As a [role], I want [goal] so that [reason]"
- `req-avoid-solution-language` — Avoid solution-specific language in requirements (what, not how)
- `req-functional-nonfunctional` — Separate functional requirements from non-functional (perf, security, a11y)
- `req-consistent-terminology` — Use consistent terminology throughout; define terms once in a glossary
- `req-traceability` — Each requirement traceable to a user need; no orphan requirements

## 3. Prioritization Frameworks (HIGH)

- `prio-moscow-method` — MoSCoW: Must / Should / Could / Won't for each requirement
- `prio-rice-scoring` — RICE = (Reach × Impact × Confidence) / Effort for objective ranking
- `prio-value-vs-effort` — Map value vs effort explicitly; quick wins first, big bets last
- `prio-dependencies-first` — Identify and sequence dependencies before assigning priorities
- `prio-kano-model` — Kano: Must-Haves + min viable Performance features + zero Delighters for MVP

## 4. Acceptance Criteria (HIGH)

- `accept-given-when-then` — Given [context], When [action], Then [outcome] for every story
- `accept-testable-criteria` — Every criterion must be verifiable by a human or automated test
- `accept-edge-cases` — Include at least 2 edge cases per story (empty state, error, boundary)
- `accept-definition-of-done` — Define DoD: tests pass, reviewed, deployed to staging, docs updated
- `accept-avoid-over-specification` — Don't specify implementation details in acceptance criteria

## 5. Stakeholder Alignment (MEDIUM-HIGH)

- `stake-identify-stakeholders` — Name every stakeholder (approver, consulted, informed) before writing
- `stake-early-feedback` — Share draft spec before it's "done"; expensive to change late
- `stake-conflict-resolution` — Document conflicts and resolutions explicitly; never silently pick a side
- `stake-communication-plan` — Set review cadence upfront; avoid endless async comment threads
- `stake-success-metrics` — Align on numeric success metrics before implementation; "success" is not a feeling

## 6. Technical Specification (MEDIUM)

- `tech-system-context` — Document which systems are touched and which are out of scope
- `tech-api-contracts` — Define API shapes (request/response) before implementation; mock first
- `tech-data-model` — Specify schema changes with column names, types, constraints, migrations
- `tech-error-handling` — Define error states and recovery paths for every external call
- `tech-performance-requirements` — Specify p95 latency, throughput targets, and cache strategy
- `tech-security-considerations` — Document auth, authz, PII handling, and threat model for every endpoint

## 7. Change Management (MEDIUM)

- `change-formal-process` — All scope changes go through a formal request; no verbal approvals
- `change-impact-assessment` — Assess timeline, cost, and risk before approving any change
- `change-version-tracking` — Version spec docs; never overwrite history (use dated sections or git)
- `change-scope-freeze` — Set a scope freeze date; changes after freeze go to v2
- `change-defer-log` — Maintain a deferred items log; "cut" ≠ "forgotten"

## 8. Documentation Standards (LOW)

- `doc-single-source` — One canonical spec; don't maintain Notion + Confluence + Linear simultaneously
- `doc-consistent-templates` — Use the same template across features; reduces cognitive load in review
- `doc-decision-records` — Document key decisions with alternatives considered and rationale
- `doc-accessible-format` — Spec must be readable by engineers, designers, and stakeholders equally
- `doc-glossary-terms` — Define domain terms once at the top; never assume shared vocabulary
