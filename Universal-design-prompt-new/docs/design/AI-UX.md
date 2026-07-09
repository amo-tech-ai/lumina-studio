# AI UX — Per-Screen Interaction Contract

> The design contract for AI on every screen. Behaviour spec for designers + a hand-off to engineering (`../handoff/06-ai-workflows.md` for agents/durability). Tone, states, and the per-screen contract below.

## AI tone & voice
- **Named & specific** — always reference the active object: *"Sofia Marlowe is a 90% fit for Nike…"* Never "How can I help?".
- **Action-ending** — every message ends with a next step or offer.
- **Short** — ≤2 sentences. Confident, calm, never salesy.
- **Honest** — surface uncertainty (confidence %, "results may vary"); never fake certainty or a live status when stale.

## AI states (visual)
| State | Visual | Rule |
|---|---|---|
| idle | greeting + chips | names object + next action |
| thinking/streaming | live steps: ✅ done · ● pulsing active · ○ pending | **never a spinner** |
| awaiting-approval | ApprovalCard: confidence% + evidence + (before/after on edits) | Approve=black · Edit=outline · Reject=ghost |
| success | brief confirm (toast/inline), returns to idle greeting | auto-dismiss |
| error | message + **Retry · Report · Go back** | never a dead end; show cause when known |
| loading (data) | SkeletonLoader matching layout | not a spinner |

## Per-screen AI contract
Each screen's dock defines: **Goal · Context · Inputs · Outputs · Confidence · Approval? · Evidence · Fallback · Error/Retry.**

| Screen | Agent | Goal | Context (knows) | Quick actions | Approval? |
|---|---|---|---|---|---|
| Command Center | production-planner | orient + next best action | portfolio, approvals due, status | Plan a shoot · Review approvals · Improve brand | approvals (HITL) |
| Brand List | brand-intelligence | improve/triage brands | brand count, weakest brand | Improve visuals · Plan a shoot · Review assets | analyse (HITL) |
| Brand Detail | brand-intelligence | explain + lift DNA | brand, DNA pillars, gaps | Improve Visual · Plan a shoot · Review assets | edits/drafts |
| Shoots List | production-planner | plan/triage shoots | shoot counts, blockers | Plan a shoot · Find blockers · Summarize | — |
| Shoot Wizard | production-planner | draft + score the shoot | brand/campaign/season, DNA, past shoots | per-step (Fix all · Assign · Export) | create (confirm) |
| Shoot Detail | production-planner | run the shoot | 9 facets, missing shots, risks | Fix issues · Notify crew · Export call sheet | approvals |
| Campaigns | creative-director | track deliverables | campaign, deliverables, timeline | Generate content plan · Find blockers | edits |
| Assets | creative-director | curate on-brand assets | selected asset, DNA match, readiness | Review low matches · Suggest replacements · Bulk tag | replace/use |
| Matching | social-discovery | find on-brand creators | match score, audience, safety | Find 90%+ · More TikTok · Flag risks | invite |
| Channel Preview | visual-identity | safe multi-channel publish | platform, crop, DNA per channel | Check safe zones · Suggest crops · Export all | publish (confirm) |
| Onboarding | brand-intelligence | first value fast (DNA) | URL, goals, channels | — (guided) | — |

## Confidence · Evidence · Fallback (design rules)
- **Confidence** on every AI write (e.g. "92%"); drives auto vs review (future: auto-approve >X%).
- **Evidence** = drill-down to source (which pages/images/posts produced the score). Every score should be explainable.
- **Before/After** mandatory on edits & drafts (image-diff in Brand Detail).
- **Fallback** — if the agent can't act (non-durable drop), degrade to determinate progress + Retry, never a resumable-stream illusion (`brand-intelligence` is not durable).
- **HITL** — AI never writes without a visible Approve/Edit/Reject path.

## Agentic direction (future — see IMPLEMENTATION-TASKS AI-03)
Move from advisory to **"do it"** actions with HITL: auto-fix DNA, auto-plan shoot, auto-generate content pack, auto-draft outreach, auto-crop per channel — each gated by confidence + an approval card + an audit entry.
