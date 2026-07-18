```text
Implement the next product workflow as a new Linear task and separate PR.

Task:
IPI-XXX · BRAND-AGENT-001 — Convert Guest Brand Analysis into Saved Brand Profile

Use:
- Linear MCP
- GitHub MCP
- Chrome DevTools MCP
- Playwright MCP
- Supabase MCP
- Cloudflare MCP
- Mastra skill
- CopilotKit skill
- Supabase skill
- task-verifier skill

Do not mix this with IPI-654 or IPI-655.
Do not deploy remotely.

## Goal

Turn the public marketing chat into a structured conversion flow:

brand analysis
→ campaign concepts
→ production plan
→ offer to save
→ signup
→ create brand profile
→ continue editing

The agent must deliver value before asking for contact details.

## 1. Create the Linear task

Create:

IPI-XXX · BRAND-AGENT-001 — Convert Guest Brand Analysis into Saved Brand Profile

Include:

- purpose
- user journey
- architecture
- database changes
- agent behavior
- UI states
- security
- tests
- analytics
- rollback
- non-goals
- acceptance criteria

Use one concern per PR.

## 2. Audit existing implementation first

Inspect before coding:

- public marketing chat
- CopilotKit runtime
- Mastra marketing agent
- current lead-capture logic
- signup/auth flow
- existing brand/profile tables
- Supabase RLS
- pgvector or vector-search usage
- Cloudflare Worker compatibility
- existing reusable forms, dialogs and buttons

Prefer existing components and database structures before adding new ones.

## 3. Agent behavior

Update the Mastra agent so it:

1. analyzes the brand using evidence;
2. labels assumptions clearly;
3. returns structured sections:
   - Brand identity
   - Audience
   - Visual language
   - Product focus
   - Content strengths
   - Content gaps
   - Campaign opportunities
4. creates three campaign concepts with:
   - objective
   - visual direction
   - channels
   - deliverables
   - effort
   - expected business value
5. turns the selected concept into a production plan with:
   - crew
   - models
   - shot list
   - wardrobe
   - location
   - equipment
   - timing
   - deliverables
   - weather fallback
   - approvals
6. asks whether to save only after useful output;
7. never repeats contact questions;
8. never claims data is saved until persistence succeeds;
9. asks no more than one chat question at a time.

Add a guard such as:

lead_capture_requested = true

Prevent duplicate CTA text before streaming the final answer.

## 4. CopilotKit UX

Add actions:

- Create brand profile
- Continue as guest
- Edit campaign
- Book a planning call

Use structured CopilotKit actions or UI components, not plain text pretending to be buttons.

Guest copy:

“You are currently exploring as a guest. Create a free profile to save this analysis and continue building the campaign.”

After Create brand profile:

- open a compact signup/profile form;
- do not collect every field through individual chat questions.

Fields:

- name
- work email
- company
- role
- brand website
- primary goal

## 5. Supabase data model

First inspect existing tables.

Reuse them when possible.

If new schema is needed, design:

- brand_profiles
- brand_analysis_drafts
- campaign_concepts
- production_plans

Minimum requirements:

- UUID primary keys
- user_id or organization_id ownership
- source_url
- structured JSONB analysis
- status: draft / reviewed / saved
- created_at / updated_at
- provenance fields
- AI-generated draft flag
- model/version metadata

Add RLS so:

- guests cannot read saved profiles;
- authenticated users access only their own or organization-owned records;
- service-role access is server-only;
- no client can set another user_id.

## 6. pgvector

Use pgvector only for a real retrieval need.

Allowed use:

- brand profile embeddings;
- previous campaign concept retrieval;
- similar visual-direction search;
- reusable production-plan recommendations.

Do not add embeddings merely because pgvector exists.

If used:

- store source text and embedding model;
- add dimension-compatible vector type;
- add index only after query pattern is proven;
- keep tenant filters in every search;
- test cross-tenant isolation.

## 7. Cloudflare Workers compatibility

Ensure:

- no Node-only runtime dependency is added to the Worker path;
- bundle size stays below existing gates;
- no direct long-running background work in the request;
- use supported fetch APIs;
- secrets remain in Cloudflare/Infisical, not source;
- `npm run build:cf` passes.

If analysis is long-running, use the existing supported async pattern rather than blocking the Worker.

## 8. Persistence flow

Expected flow:

guest analysis
→ unsaved client/session draft
→ user selects Create brand profile
→ signup/login
→ server validates ownership
→ save profile
→ save concepts and plan
→ return success
→ open saved profile

Failure flow:

save fails
→ keep draft in session
→ show retry
→ never claim success
→ do not lose generated work

## 9. Analytics

Track:

- brand_analysis_completed
- campaign_selected
- save_profile_clicked
- signup_started
- signup_completed
- brand_profile_saved
- save_failed
- planning_call_clicked

Do not include raw email, private prompts or sensitive profile content in analytics.

## 10. Tests

Unit:

- structured analysis shape
- duplicate lead-capture prevention
- one-question rule
- save CTA only after value delivered
- guest/signed-in state
- persistence success/failure
- ownership validation
- RLS

Integration:

- Mastra agent → CopilotKit action
- signup → Supabase save
- reload saved profile
- pgvector tenant isolation if implemented
- Cloudflare-compatible runtime

Playwright journey:

1. open `/`;
2. open marketing chat;
3. submit Maaji URL;
4. verify structured analysis;
5. verify three numbered campaigns;
6. select one;
7. generate production plan;
8. verify email is not requested too early;
9. click Create brand profile;
10. complete signup/profile form;
11. save;
12. verify success;
13. reload;
14. verify saved profile and plan;
15. verify no duplicate CTA;
16. verify zero unexpected 4xx/5xx;
17. verify zero page errors.

## 11. Validation

Run:

npm run typecheck
npm test
npm run build:cf

Run Supabase tests and RLS verification.

Use Chrome DevTools and Playwright for the full guest-to-saved-profile journey.

## 12. PR requirements

Open one PR titled:

IPI-XXX · BRAND-AGENT-001 — Convert Guest Brand Analysis into Saved Brand Profile

PR body must include:

- architecture
- user journey
- database changes
- RLS proof
- agent prompt changes
- CopilotKit actions
- Cloudflare compatibility
- bundle size
- test counts
- Playwright evidence
- no remote deploy
- rollback

Return:

| Item | Result |
|---|---|
| Linear task | full task name + URL |
| Existing schema reused | yes/no |
| New migrations | list |
| Agent changes | summary |
| CopilotKit actions | list |
| RLS tests | count |
| Full tests | count |
| build:cf | pass/fail |
| Bundle gzip | value |
| Playwright journey | pass/fail |
| Duplicate CTA | fixed/not fixed |
| Save failure recovery | pass/fail |
| PR | URL |
| Final readiness | /100 |
```
