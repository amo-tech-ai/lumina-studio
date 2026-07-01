---
name: architecture-brief
description: >
  Turn a big, open-ended "build X" ask into a single scoped architecture brief before any code
  gets written. Use whenever the user hands you a goal-first, role-based prompt like "act as a
  senior software architect, build a production-ready X" or asks for an executive summary +
  architecture + database + frontend + backend + APIs + roadmap + risks all in one shot — this
  includes a pasted prompt template with a Requirements/Tasks/Output list, not just a plain-English
  ask. Forces explicit MVP-now-vs-later scoping and a risk section before routing each part of the
  brief to the skill that already owns it (graphify for analysis, ipix-supabase for schema,
  mermaid-diagrams for diagrams, frontend-design for UI, mastra for agents, writing-plans for the
  task breakdown) instead of freelancing a monolithic doc from scratch. Do NOT use for single-file
  fixes, for iterative back-and-forth design dialogue where the user wants to be asked questions
  one at a time (use brainstorming), or once a Linear IPI issue already has an approved spec (use
  ipix-task-lifecycle).
---

# Architecture Brief

**BLUF:** One-shot front door for "build X, give me the whole architecture" asks. Produce a single
brief document covering the sections the user actually asked for, each one written the way its
owning skill would write it — never freelanced from scratch. Terminal handoff: `writing-plans`
(or `ipix-task-lifecycle` Phase 1 for IPI-tracked work).

**Announce at start:** "I'm using the architecture-brief skill to scope this before designing."

## When this is (and isn't) the right skill

- **Use for:** monolithic goal-first prompts, role-based asks ("senior software architect,
  build..."), any single message bundling analysis + design + schema + API + UI + roadmap + risk.
- **Don't use for:** one-file fixes; iterative Q&A design where the user wants to be walked
  through one question at a time (`brainstorming`); work already scoped in an approved IPI issue
  (`ipix-task-lifecycle`).

## Step 0 — State scope explicitly, don't infer it

Claude follows instructions literally rather than silently generalizing them — lean into that
here instead of fighting it. Before writing anything, restate in one paragraph: what's actually
being built, what's MVP-now vs. later-or-never, and what "production-ready" concretely means for
*this* ask (which of secure / scalable / tested / monitored actually apply — not all four by
default). If the ask is genuinely ambiguous on scope, ask one clarifying question. Don't guess,
and don't quietly expand scope to "do it properly" — that's how a bug fix turns into a rewrite.

## Step 1 — Analyze (graphify first, always)

Per root `CLAUDE.md`, query graphify before reading source: `graphify query "<question>"`.
Identify what already exists — agents in `app/src/mastra/`, components in `app/src/components/`,
shared helpers in `supabase/functions/_shared/`, relevant skills in `.claude/skills/`. Reuse
before building, and say so explicitly in the brief so the reader can see what's new vs. reused.

## Step 2 — Identify risks (before design, not after)

Name what's hard to reverse or high blast-radius in *this specific ask*: schema/migration
changes, auth/RLS/JWT flows, Stripe webhooks, secrets, anything touching production data. One
line each: what could go wrong, how reversible it is, what mitigates it. This section is not
optional even for small asks — scale its length to the actual risk, not to zero.

## Step 3 — Design, routing each domain to its owner

Don't re-derive what another skill already owns — write each section the way its owning skill
would, using that skill's process:

| Brief section | Owning skill / convention |
|---|---|
| Database schema | `ipix-supabase` |
| Mermaid diagrams | `mermaid-diagrams` |
| Frontend / UI | `frontend-design` (production) or `ipix-wireframe` (early / lo-fi) |
| AI agents / workflows | `mastra` |
| API routes | Existing `app/src/app/api/` conventions — reuse the pattern, don't invent one |
| Backend / Supabase surface | `AGENTS.md` architecture section + `ipix-supabase` |

## Step 4 — MVP discipline

List what you are **not** building yet, and why — a "Later / Not Now" list is required output,
not optional. This is where over-engineering gets caught before it's written into an architecture
doc rather than after. Don't design for hypothetical future requirements; the `simplify` skill and
root `CLAUDE.md` both codify this — the right amount of complexity is the minimum the current ask
needs.

## Step 5 — Implementation plan & tasks → hand off, don't reinvent

"Create implementation plan" and "generate tasks" belong to `writing-plans`, not this skill.
Invoke it (or `ipix-task-lifecycle` Phase 1 for IPI-tracked work) once the brief is approved.
This skill's own roadmap section is a pointer to that handoff, not a full task breakdown.

## Step 6 — Verify against best practices (before calling the brief done)

Close every brief with a short checklist, answered, not just asked:

- Hard rules honored? (worktree-per-task, one-concern-per-PR/commit, no `VITE_`/client-side AI
  keys, pre-push hook not bypassed)
- Does every "production-ready" claim have a way to verify it (typecheck / tests / manual QA),
  rather than just an assertion?
- Is anything hard-to-reverse flagged with a confirm-before-proceeding note?

## Output structure

Full section-by-section template: [`references/output-template.md`](references/output-template.md).
Sections are additive, not mandatory — skip ones the user didn't ask for rather than padding the
brief to hit a fixed shape.

**Save to:** `docs/plan/tasks/YYYY-MM-DD-<topic>-architecture-brief.md`

## Next

After the user approves the brief: `writing-plans` for the implementation plan, or
`ipix-task-lifecycle` Phase 1 if this is IPI-tracked work. Do not start implementation from
inside this skill.
