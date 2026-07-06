# Known issues

## `Skill(skill: "ipix-supabase")` returns "Unknown skill"

Confirmed reproducible as of 2026-07-02, tested before and after the fixes below — still
fails. This is documentation for whoever re-investigates next, not something to re-derive
from scratch.

**Ruled out (not the cause):**

- Frontmatter/format defect — byte-identical structure to working skills like `ipix`/
  `nextjs-16`, valid UTF-8, no BOM.
- Size or file-count — `copilotkit` is larger in every dimension (102 files/1MB vs. 90
  files/700K) and registers fine.
- Duplicate nested `name:` frontmatter — one real duplicate existed (`postgres.md` and
  `references/postgres-best-practices.md` both declared `supabase-postgres-best-practices`,
  fixed by renaming the latter to `-detail`) but duplicates are common across many working
  skill trees (`code-reviewer` ×5, `vercel-react-best-practices` ×2, etc.), not unique to
  this one, and fixing it didn't change the outcome.
- `skills-lock.json` — a separate provenance ledger, not the live registry. Most working
  skills (`mastra`, `nextjs-16`, `pr-workflow`) aren't in it either.
- Plugin-name collision with the installed `supabase` plugin
  (`~/.claude/plugins/cache/claude-plugins-official/supabase`) — considered and refuted.
  That plugin's actual skill names are `supabase` / `supabase-postgres-best-practices`,
  neither of which string-matches `ipix-supabase` exactly. A same-shaped control case
  (`cloudinary`, also plugin-shadowed but under different exact names — `cloudinary-docs`/
  `cloudinary-transformations`) registers fine.

**Conclusion:** no further diagnosis is possible without harness-internal visibility this
session doesn't have. Don't attempt a speculative rename to "fix" this — a rename into the
plugin's own namespace (e.g. bare `supabase`) would create a real collision where none
currently exists, and no evidence suggests renaming helps at all.

**Fallback in force:** `Read` `SKILL.md` and the relevant `references/**` file directly
instead of relying on `Skill()` to resolve this hub.
