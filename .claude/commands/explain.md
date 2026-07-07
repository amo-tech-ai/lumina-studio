---
description: "Explain anything — code, a PR, an error, a decision, a concept — in plain English with a real-world analogy and a concrete example. No jargon."
argument-hint: "<thing to explain> [--eli5 | --dev] [--short]"
allowed-tools: ["Bash", "Read", "Grep", "Glob"]
---

# /explain — make it easy to understand

**Arguments:** `$ARGUMENTS` — what to explain: a concept, a file/function, a PR (`#235`), an error message, a Linear issue (`IPI-387`), a config, or "what you just did". Flags: `--eli5` (simplest possible), `--dev` (peer engineer, still plain), `--short` (one-screen answer). Default audience: **a smart person who isn't a specialist in this** (a stakeholder / PM / new teammate).

**Goal:** the reader *gets it* on the first read — no re-reading, no glossary, no bluffing.

---

## The rules (what "easy to understand" means here)

1. **Analogy first.** Open with a real-world comparison the reader already understands (an address book, LEGO bricks, a receipt, a bouncer at a door). Then map it to the actual thing.
2. **No unexplained jargon.** If a technical term is unavoidable, define it inline in 4–6 words the first time: *"RLS (the database's own per-row permission check)"*. Never assume the acronym.
3. **Concrete over abstract.** Use real values from the actual code/data, not placeholders. "8 of 10 shoots have a cover" beats "some records have the field".
4. **Big picture → then detail.** Lead with the one-sentence "what and why". Only then unpack how. A reader who stops after paragraph one should still have the gist.
5. **Show the shape.** A tiny table, a 3-line before/after, or an arrow diagram beats a paragraph when structure matters.
6. **Say why it matters.** End with the consequence in the reader's terms — what breaks without it, what it unlocks, what they can now do.
7. **Be honest.** Name the caveat, the risk, or the thing that's still unproven. "Easy to understand" never means "smoothed over".
8. **Right-size.** `--eli5` → no tech terms at all, kitchen-table language. `--dev` → precise but still analogy-led. `--short` → skip to Big picture + Why-it-matters + one-line takeaway.

---

## Workflow

1. **Ground it in reality first — don't explain from memory.** Look at the actual thing before describing it:
   - code / file → `Read` (after `graphify query "<concept>"` if it spans files)
   - PR → `gh pr view <N> --json title,body,files` + `gh pr diff <N>`
   - error → read the failing line + surrounding code
   - Linear issue → Linear MCP `get_issue`
   - live data claim → probe it (Supabase MCP / a command), never guess
2. **Find the everyday analogy** that matches the *behavior*, not just the surface.
3. **Write it in this shape** (drop sections that don't apply; obey `--short`):

```markdown
## <thing> — in plain terms

**The gist:** <one sentence — what it is and why it exists>.

**Think of it like:** <real-world analogy>. <how the analogy maps>.

**How it actually works:**
- <step / part 1 — concrete>
- <step / part 2>
(a 3-line before→after or arrow diagram if it clarifies)

**A real example:** <walk one actual case through, using real values>.

**Why it matters:** <consequence in the reader's terms — what breaks without it / what it unlocks>.

**One-line takeaway:** <the sentence they'd repeat to someone else>.
```

4. **Re-read as the audience.** Any sentence that needs a glossary → rewrite it. If the explanation is longer than it needs to be, cut.

---

## Guardrails

- **Explain-only — never change code** from this command. If the reader then wants a fix, hand off to `/pr fix` or normal editing.
- **Accuracy beats simplicity.** A simple-but-wrong explanation is worse than none. If a check is needed to be sure, run it (this command can Read/Bash/Grep) — don't hand-wave.
- Match the reader's language (the user has repeatedly asked for "easy to understand, real-world examples" — default to that register).
- Sensitive/serious topic → keep the analogy sober, not cute.

---

## Worked example — `/explain isDeliverableCover`

> **The gist:** a safety check that only lets a shoot's cover photo load if it comes from *our* image host — otherwise it quietly shows a placeholder instead of crashing the page.
>
> **Think of it like:** a bouncer with a guest list. The photo URL walks up; if it's not on the list (our Cloudinary account), it doesn't get in — and instead of a scene, we quietly seat a stand-in (the placeholder).
>
> **Why the bouncer exists:** Next.js's image tag doesn't just fail politely on an unknown host — it *throws and breaks the whole card*. Shoot cover URLs are free-form text, so one bad host would take down the grid. The guard turns a crash into a graceful fallback.
>
> **A real example:** `https://res.cloudinary.com/dzqy2ixl0/image/upload/…` → on the list → real cover shows. `https://evil.example.com/x.jpg` → not on the list → placeholder shows, no crash.
>
> **One-line takeaway:** it's the difference between "one weird link breaks the page" and "one weird link just shows a placeholder".

```text
/explain #246                 # the EntityList PR, for a stakeholder
/explain --eli5 "what is RLS" # kitchen-table simple
/explain --dev the shoot_portfolio_view auth filter   # precise, peer-level
/explain --short what you just did
```
