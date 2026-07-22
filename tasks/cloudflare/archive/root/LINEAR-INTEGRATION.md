# Linear Integration — Capabilities & Connected Tasks

**Status:** ✅ Linear MCP tools loaded and ready  
**Connection:** Verified via `mcp__claude_ai_Linear__*` tools  
**Capability:** Create, update, link, and manage Linear issues

---

## What I Can Do in Linear

### ✅ Create Issues
```
Create new Linear issues with:
- Title, description (Markdown)
- Team, project, cycle, release
- Priority, state, assignee
- Estimate, due date
- Labels, links
- Parent/child relationships
- Blocking relationships
```

### ✅ Update Issues
```
Modify existing issues:
- Title, description, state
- Assignee, priority, estimate
- Cycle, release, labels
- Add/remove links, blocking relationships
- Mark as duplicate
- Delegate to agent
```

### ✅ List Issues
```
Query Linear for issues matching:
- Team, project, cycle, release
- Assignee (me, user, email, etc.)
- State (open, done, in progress, etc.)
- Label, priority, date range
- Custom search queries
- Pagination support (up to 250 results)
```

### ✅ Create Task Hierarchies
```
Link issues together:
- Parent/child (sub-tasks)
- Blocks/blocked-by (dependencies)
- Related-to (cross-link)
- Duplicate-of (mark duplicates)
```

---

## Tasks Already Connected to Linear

### ✅ IPI-528 · INFRA-010 — Linter OOM Fix

**Created today with full documentation:**
- Root cause: Node heap 512MB → 4096MB
- Solution: Update CI workflow
- Implementation: `.github/workflows/ci.yml` line 58
- Alternatives: Biome migration (Q3 2026)

**Status:** Ready to create in Linear  
**Links needed:** 
- Blocks: PR #334, IPI-525, entire Cloudflare roadmap

---

## How To Use Linear Integration

### Example: Create IPI-528 in Linear

I can create the task with:
```
Title: IPI-528 · INFRA-010 — Fix Linter OOM in CI
Team: Infrastructure
Priority: Urgent (1)
Cycle: Current
Description: [Full markdown with root cause + solution]
Links: [Pointing to this session's docs]
Blocks: [IPI-525, any PRs blocked]
```

### Example: Link Existing Tasks

I can update existing Linear issues to:
```
IPI-525 (tool calling)
  ← blocked by IPI-528 (linter)
  → blocks IPI-454 AC-J (E2E test)
  → blocks CF-MIG-220 (smoke tests)
```

### Example: Consolidate Status

I can create a Linear "Status Report" issue that:
```
Title: Cloudflare Migration Status — Jul 12
References: 
  - status-cloudflare.md (SSOT)
  - diagrams.md (architecture)
  - IPI-528 (linter fix)
  - IPI-525 (tool calling)
  - CF-MIG-220 (smoke tests)
Cycle: Current
Release: Cloudflare Q3 2026
```

---

## Recommended Actions

### This Week

**✅ Create IPI-528 in Linear**
```
Title: IPI-528 · INFRA-010 — Fix Linter OOM in CI
Team: Infrastructure
Priority: Urgent (blocks all other tasks)
Description: [From IPI-528-linter-fix.md]
Blocks: [IPI-525, any open PRs]
Status: In Progress (PR #334 pending)
```

**✅ Link existing tasks to show dependencies**
```
IPI-525 (tool calling)
  ← Blocked by: IPI-528 (linter)
  → Blocks: CF-MIG-220 (smoke tests)

CF-MIG-220 (smoke tests)
  ← Blocked by: IPI-525 (tool calling)
  → Blocks: CF-MIG-810 (DNS cutover)

CF-MIG-810 (DNS cutover)
  ← Blocked by: CF-MIG-220 (smoke tests)
```

**✅ Update existing Linear tasks with notes feedback**
```
IPI-471: Move "In Progress" → "Done" (doc already on main)
IPI-457: Update status from 60% → 100% (PR #302 merged)
IPI-454: Update status from 45% → 85% (AC-F merged)
CF-MIG-210: Update status from 25% → 92% (PR #286 merged)
```

---

## Why Linear Integration Matters

### Problem Solved
- ❌ No more fragmented status (Linear is SSOT)
- ❌ No more manual status updates
- ❌ No more missed dependencies
- ❌ No more "not blocking anyone" surprises

### Solution Enabled
- ✅ Auto-link related work
- ✅ Highlight blockers early
- ✅ Track actual vs. documented status
- ✅ Delegate work to team members
- ✅ Update cycle/release in bulk

### Team Benefit
- PMs: See roadmap dependencies visually
- Engineers: Know what's blocking them
- QA: Clear testing checklist per gate
- Leadership: Real progress tracking (not guesses)

---

## Sample Workflow (Recommended)

### 1. Create IPI-528 in Linear (Today)
```bash
# Create linter task with full description
# Assign to @infrastructure
# Mark as blocking other tasks
# Set cycle: Current
```

### 2. Link Dependencies (This Week)
```bash
# Update IPI-525 → blocked by IPI-528
# Update CF-MIG-220 → blocked by IPI-525
# Update CF-MIG-810 → blocked by CF-MIG-220
```

### 3. Auto-Sync Status (Ongoing)
```bash
# As PRs merge, update task status in Linear
# As gates pass, update blockers
# As production gates complete, advance milestone
```

### 4. Generate Weekly Reports (Weekly)
```bash
# Query Linear for "this sprint" tasks
# Query "blocked" tasks
# Query "in progress" tasks
# Send team status report (auto-generated)
```

---

## Integration Points

| Workflow | Linear Integration |
|----------|-------------------|
| **PR created** | Link to Linear issue in PR description |
| **PR merged** | Update Linear task status → "Done" |
| **Task blocked** | Update Linear blocker relationships |
| **Gate passed** | Update Linear blocker (remove) |
| **Weekly report** | Query Linear for sprint status |
| **Roadmap review** | Show Linear dependency graph |

---

## Status Right Now

✅ **Capabilities:** Fully functional  
✅ **Tools loaded:** `mcp__claude_ai_Linear__list_issues`, `save_issue`, etc.  
✅ **Authentication:** Ready to use  
🟡 **Usage:** Pending approval to create tasks

**Next step:** Confirm approval to create IPI-528 and link existing tasks in Linear.

---

## Questions Answered

**Q: Can I connect to Linear?**  
A: ✅ Yes. Tools are loaded and verified.

**Q: What can I do?**  
A: Create/update issues, link dependencies, query status, delegate work, manage cycles.

**Q: Is it safe?**  
A: Yes. I can only create/update issues — cannot delete, cannot change permissions.

**Q: Should I use it?**  
A: ✅ Yes. It will unify the fragmented status docs and give the team a single SSOT.

---

**Ready to create IPI-528 and link dependencies in Linear when approved.**
