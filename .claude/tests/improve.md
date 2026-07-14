Use **Claude Code like a surgeon, not like a full-time employee**. The speed problem is usually not the model — it is **too much context, too many files, too many checks, and mixed tasks**.

## Best setup without Morph

| Area         | Fix                                                      |
| ------------ | -------------------------------------------------------- |
| Context      | Give Claude fewer files and exact paths                  |
| Tasks        | One Linear issue / one PR at a time                      |
| Editing      | Ask for minimal diffs only                               |
| Verification | Run targeted checks first, full checks last              |
| Worktrees    | Claude uses `/home/sk/wt-*`, Cursor uses `/home/sk/ipix` |
| PRs          | Split scope before fixing                                |
| Memory       | Stop unused Docker/dev servers                           |

## Claude Code speed rules

### 1. Start with a 2-minute repo map

```text
Before editing, inspect only:
- relevant route
- relevant component
- related tests
- related schema/RPC if needed

Do not scan the whole repo.
Return exact files you need to touch.
```

### 2. Force minimal diffs

```text
Make the smallest safe change.
Do not rewrite whole files.
Do not refactor unrelated code.
Do not improve style unless required.
```

### 3. Use targeted verification first

Instead of running everything after every edit:

```bash
cd app
npm run typecheck
npm test -- talent-tab
```

Then before push:

```bash
npm run lint
npm test
infisical run -- npm run supabase:verify-rls
```

### 4. Use worktrees correctly

Since you use Cursor in `/home/sk/ipix`, tell Claude:

```text
Cursor owns /home/sk/ipix.
Claude must work only in a dedicated /home/sk/wt-* worktree.
Do not inspect, modify, revert, or validate unrelated Cursor changes.
```

### 5. Make Claude write a file-touch plan first

```text
Before coding, list:
- files to edit
- files to read
- tests to run
- risks
- stop conditions

Do not edit until the plan is approved.
```

## Best prompt for fast Claude development

```text
Act as a fast senior engineer.

Task: [PASTE TASK]

Rules:
- Work only in this worktree: [PATH]
- Do not scan the whole repo.
- Do not touch unrelated files.
- Produce a file-touch plan first.
- Make the smallest safe diff.
- Prefer existing patterns.
- Run targeted tests first.
- Run full verification only before commit.
- Stop if dependency, schema, auth, RLS, or merge conflict risk appears.

Output:
1. files to read
2. files to edit
3. exact implementation steps
4. targeted tests
5. full verification command
```

## Biggest speed boosters for your setup

| Fix                                        |    Impact |
| ------------------------------------------ | --------: |
| Keep Cursor and Claude in separate folders | Very high |
| Stop unused Docker stacks                  |      High |
| Do not let Claude scan `tasks/github`      |      High |
| Use exact file paths in prompts            | Very high |
| Ask for minimal diffs                      | Very high |
| Targeted tests before full test suite      |      High |
| One PR per task                            | Very high |

## Simple workflow

1. You use Cursor in `/home/sk/ipix`.
2. Claude creates a task worktree:

   ```bash
   git worktree add /home/sk/wt-ipi-XXX -b ipi/XXX-task-name main
   ```
3. Claude edits only that worktree.
4. Claude runs targeted checks.
5. Claude opens PR.
6. After merge, delete the worktree.

That alone will speed things up more than adding another tool.
