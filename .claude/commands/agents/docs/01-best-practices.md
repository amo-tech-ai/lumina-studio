# Claude Code Best Practices - StartupAI16

> Systematic plan based on research from Anthropic, Builder.io, Dometrain, rosmur.github.io, and community sources.

---

## TL;DR - Quick Start Guide

### You're Doing Great At
- CLAUDE.md setup
- Skills system
- Documentation
- Backup/restore

### 3 Things Fixed ✅

| What | Status | Location |
|------|--------|----------|
| **`/clear` habit documented** | ✅ Done | CLAUDE.md - Context Management section |
| **Slash commands created** | ✅ Done | `.claude/commands/` (6 commands) |
| **Project Gotchas added** | ✅ Done | CLAUDE.md - Project Gotchas section |

### The 3 Golden Rules

```
1. PLAN FIRST     → Don't let Claude jump into code
2. CLEAR OFTEN    → /clear at 60k tokens or 30% context
3. BE SPECIFIC    → "Add settings page" ❌
                    "Add /settings with profile + notifications using Card component" ✅
```

### Quick Wins ✅ COMPLETED

All quick wins have been implemented:

```
✅ CLAUDE.local.md added to .gitignore
✅ .claude/commands/ directory created
✅ 6 slash commands added:
   - /catchup     - Resume work session
   - /pr          - Prepare pull request
   - /build-and-fix - Run quality checks
   - /code-review - Review code quality
   - /dev-docs    - Create task documentation
   - /test-route  - Test routes/endpoints
✅ Project Gotchas added to CLAUDE.md
✅ Context Management section added to CLAUDE.md
✅ tasks/ directory created
✅ CLAUDE.local.md template created
```

### Anti-Patterns (Stop Doing)

| Stop | Start |
|------|-------|
| Vague prompts | Specific file paths + patterns |
| Waiting for context limit | `/clear` proactively |
| Skipping planning | Always ask for plan first |
| Embedding docs in CLAUDE.md | Use pointers to `.claude/docs/` |

---

## Current State Assessment

### What We're Doing Well

| Practice | Status | Location |
|----------|--------|----------|
| CLAUDE.md exists | ✅ | `/CLAUDE.md` |
| Skills system | ✅ | `.claude/` with 7+ skills |
| Architecture documented | ✅ | CLAUDE.md |
| Commands documented | ✅ | CLAUDE.md |
| Data flow patterns | ✅ | CLAUDE.md |
| Code conventions | ✅ | CLAUDE.md |
| Testing instructions | ✅ | CLAUDE.md |
| Superpowers skills | ✅ | Installed from obra/superpowers |
| Reference docs per skill | ✅ | `.claude/{skill}/references/` |
| Backup/restore system | ✅ | `backup.sh`, `restore.sh` |

### Gaps to Address

| Practice | Status | Priority | Impact |
|----------|--------|----------|--------|
| Custom slash commands | ❌ Missing | HIGH | Workflow efficiency |
| Context clearing strategy | ❌ Missing | HIGH | Quality degradation prevention |
| Quality gate hooks | ❌ Missing | HIGH | Error prevention |
| Dev docs system | ❌ Missing | MEDIUM | Session continuity |
| CLAUDE.local.md | ❌ Missing | MEDIUM | Personal settings |
| Project gotchas section | ❌ Missing | MEDIUM | Error prevention |
| TDD workflow documented | ❌ Missing | MEDIUM | Code quality |
| Planning workflow | ❌ Missing | MEDIUM | Architecture quality |
| Incremental commit guidelines | ❌ Missing | LOW | Git hygiene |
| CLAUDE.md optimization | ⚠️ ~290 lines (target: 100-200) | LOW | Context efficiency |

---

## Systematic Improvement Plan

### Phase 1: Critical Infrastructure (Week 1)

#### 1.1 Custom Slash Commands

Create `.claude/commands/` directory with essential commands:

```
.claude/commands/
├── dev-docs.md        # Create strategic plan for task
├── catchup.md         # Read all changed files in branch
├── code-review.md     # Architectural review
├── build-and-fix.md   # Run builds and fix errors
├── pr.md              # Clean up code, prepare PR
└── test-route.md      # Test authenticated routes
```

**Command Template:**
```markdown
---
description: Brief description for command list
---

# Command Name

[Detailed instructions for Claude to follow]

$ARGUMENTS - placeholder for user input
```

#### 1.2 Context Clearing Strategy

**Rules:**
- Clear at **60k tokens** or **30% of context budget**
- Use `/clear` + `/catchup` pattern for simple restarts
- Use "Document & Clear" pattern for complex tasks:
  1. Write progress to `.md` file
  2. `/clear`
  3. Read `.md` in fresh session

**Avoid:** `/compact` (opaque, error-prone)

#### 1.3 Quality Gate Hooks

Create `.claude/hooks/` or use Claude Code's built-in hooks system:

| Hook | Trigger | Action |
|------|---------|--------|
| Build Checker | After file edits | Run `npm run build` |
| Type Checker | After .ts/.tsx edits | Run `npx tsc --noEmit` |
| Lint Checker | After file edits | Run `npm run lint` |
| Test Runner | After implementation | Run `npm run test` |

**Hook Example (settings.json):**
```json
{
  "hooks": {
    "postFileWrite": {
      "command": "npm run lint -- --fix",
      "pattern": "*.{ts,tsx}"
    }
  }
}
```

---

### Phase 2: Workflow Optimization (Week 2)

#### 2.1 Dev Docs System (Three-File Pattern)

For each significant task, create:

```
~/dev/active/[task-name]/
├── [task-name]-plan.md      # Accepted plan
├── [task-name]-context.md   # Key files, decisions
└── [task-name]-tasks.md     # Work checklist
```

Or simpler in-project:
```
tasks/
├── current-task.md          # What you're working on
└── session-notes.md         # Progress between sessions
```

#### 2.2 TDD Workflow Documentation

Add to CLAUDE.md or create `.claude/workflows/tdd.md`:

```markdown
## Test-Driven Development Workflow

1. **Write tests FIRST** based on requirements
2. **Confirm tests fail** (no mock implementations)
3. **Commit tests separately**
4. **Implement until tests pass**
5. **NEVER modify tests during implementation**
6. **Commit implementation**
7. **Refactor if needed**
```

#### 2.3 Planning Workflow Documentation

```markdown
## Planning Workflow

1. Enter Planning Mode with high-level description
2. Let Claude research and propose approaches
3. Review thoroughly to catch misunderstandings
4. Exit plan mode and create dev docs
5. Start fresh context with plan document
6. Implement in 1-2 section stages
7. Update plan during implementation
```

---

### Phase 3: Context Efficiency (Week 3)

#### 3.1 CLAUDE.md Optimization

**Target:** <2,000 tokens (~100-200 lines)

**Current:** ~290 lines (needs trimming)

**Strategy:**
1. Move detailed skill docs to `skills.md` (already done partially)
2. Move architecture details to `.claude/docs/architecture.md`
3. Keep only critical, frequently-referenced info in root CLAUDE.md
4. Use pointers: "For complex usage, see `.claude/docs/X.md`"

**Optimized Structure:**
```markdown
# CLAUDE.md

## Commands (essential only)
## Architecture (one-liner + pointer)
## Code Conventions (critical rules only)
## Testing (one-liner)
## Skills (table + pointer to skills.md)
## Gotchas (project-specific warnings)
```

#### 3.2 CLAUDE.local.md

Create `CLAUDE.local.md` (git-ignored) for personal settings:

```markdown
# Personal Claude Code Settings

## Preferences
- Always show diffs before commits
- Prefer verbose explanations
- Run tests after every file change

## Local Environment
- Node version: 20.x
- Supabase local running on port 54321
```

Add to `.gitignore`:
```
CLAUDE.local.md
```

#### 3.3 Project Gotchas Section

Add to CLAUDE.md:

```markdown
## Project Gotchas

- **Auto-generated files:** Never modify `src/integrations/supabase/types.ts` manually
- **RLS policies:** Test with both anon and authenticated users
- **Edge functions:** Always handle CORS preflight requests
- **React Query:** Invalidate queries after mutations
- **Lovable sync:** `docs/` folder syncs from GitHub/Lovable - local changes may be overwritten
```

---

### Phase 4: Advanced Patterns (Week 4)

#### 4.1 Skills Auto-Activation

Create `skill-rules.json` for dynamic activation:

```json
{
  "rules": [
    {
      "pattern": "database|migration|schema|RLS",
      "skill": "supabase"
    },
    {
      "pattern": "edge function|serverless|Deno",
      "skill": "edge-functions"
    },
    {
      "pattern": "UI|component|page|dashboard",
      "skill": "frontend-design"
    }
  ]
}
```

#### 4.2 Multi-Claude Verification

For production code:
1. Claude A writes code
2. Claude B reviews (fresh context)
3. Claude C implements feedback

**Git Worktrees Pattern:**
```bash
git worktree add ../startupai16-feature-x feature-x
cd ../startupai16-feature-x && claude
```

#### 4.3 Subagent Patterns

**Preferred:** Clone/Master Pattern
- Use `Task(...)` to spawn clones of main agent
- Agent manages own orchestration
- Preserves context better

**Alternative:** Specialized subagents for:
- Code architecture review
- Build error resolution
- Strategic planning

---

## Best Practices Quick Reference

### The Big Three Principles

1. **Context Management is Paramount**
   - Clear at 60k tokens
   - Keep CLAUDE.md under 2,000 tokens
   - Use dev docs for session continuity

2. **Planning Before Implementation**
   - Always enter Planning Mode first
   - Review plan before coding
   - Update plan during implementation

3. **Simplicity Over Complexity**
   - Simple control loops > multi-agent systems
   - Low-level tools (Bash, Read, Edit) + selective abstractions
   - Avoid heavy MCP usage (>20k tokens cripples context)

### Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Alternative |
|--------------|--------------|-------------|
| Auto-formatting hooks | 160k tokens in 3 rounds | Manual Prettier between sessions |
| Heavy MCP usage | >20k tokens cripples context | Skills > MCP for most cases |
| Skipping planning | Premature coding = rework | Always plan first |
| Vague instructions | Vague = vague results | Be specific with files, patterns |
| Letting context fill | Quality degrades at limits | Clear at 60k tokens |
| Embedding files in CLAUDE.md | Wastes context | Use pointers instead |

### Prompt Specificity

**Bad:**
```
Add a user settings page
```

**Good:**
```
Add a user settings page with:
- Profile section (name, email, avatar)
- Notification preferences (email, push toggles)
- Use existing Card component from src/components/ui/card.tsx
- Follow the pattern in src/pages/Dashboard.tsx
- Add route at /settings
- Write tests in src/pages/__tests__/Settings.test.tsx
```

### Code Review Checklist

Before committing, verify:
- [ ] No spaghetti code
- [ ] No substantial unplanned API changes
- [ ] No unnecessary imports
- [ ] Error handling present (try-catch + Sentry)
- [ ] No security vulnerabilities
- [ ] Tests pass
- [ ] TypeScript compiles without errors

---

## Implementation Checklist

### Week 1: Critical Infrastructure
- [x] Create `.claude/commands/` directory ✅ DONE
- [x] Add `dev-docs.md` command ✅ DONE
- [x] Add `catchup.md` command ✅ DONE
- [x] Add `code-review.md` command ✅ DONE
- [x] Add `build-and-fix.md` command ✅ DONE
- [x] Add `pr.md` command ✅ DONE
- [x] Add `test-route.md` command ✅ DONE
- [x] Document context clearing strategy in CLAUDE.md ✅ DONE
- [ ] Set up build/lint quality gate hooks (optional - can cause high token usage)

### Week 2: Workflow Optimization
- [x] Create `tasks/` directory for dev docs ✅ DONE
- [ ] Document TDD workflow
- [ ] Document planning workflow
- [ ] Add incremental commit guidelines

### Week 3: Context Efficiency
- [ ] Audit CLAUDE.md token count
- [ ] Move detailed docs to `.claude/docs/`
- [x] Create CLAUDE.local.md template ✅ DONE
- [x] Add `.gitignore` entry for CLAUDE.local.md ✅ DONE
- [x] Add "Project Gotchas" section ✅ DONE

### Week 4: Advanced Patterns
- [ ] Create `skill-rules.json` for auto-activation
- [ ] Document git worktrees workflow
- [ ] Document multi-Claude verification pattern
- [ ] Set up subagent review workflow

---

## Measuring Success

### Code Quality Metrics
- Test coverage: >80% for new code
- TypeScript errors: Zero before commits
- Production bugs from AI code: Decreasing trend

### Productivity Metrics
- Time from plan to PR
- Plan iterations needed (target: 1-3)
- Context compaction frequency (should decrease)

### Continuous Improvement
- Track code review findings
- Update CLAUDE.md based on repeated mistakes
- Refine skills based on usage patterns

---

## Resources

### Official Documentation
- [Anthropic: Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Anthropic: Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

### Community Guides
- [Builder.io: CLAUDE.md Guide](https://www.builder.io/blog/claude-md-guide)
- [Dometrain: Creating the Perfect CLAUDE.md](https://dometrain.com/blog/creating-the-perfect-claudemd-for-claude-code/)
- [rosmur: Claude Code Best Practices](https://rosmur.github.io/claudecode-best-practices/)

### Project-Specific
- [CLAUDE.md](/CLAUDE.md) - Main project instructions
- [skills.md](/skills.md) - Skills reference
- [.claude/](/home/sk/startupai16/.claude/) - Skills and docs directory

---

*Last updated: 2026-01-22*
*Based on research from 8+ authoritative sources*
