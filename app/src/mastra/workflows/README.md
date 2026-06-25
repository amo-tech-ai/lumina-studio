# Workflow Snapshots

This directory contains Mastra workflows that use the snapshot/persistence pattern for long-running, human-in-the-loop (HITL) processes.

## Pattern: Research → Approve → Commit

Every workflow follows a three-step pattern:

1. **Research** — Gathers and processes input data, returns a structured result.
2. **Approval** — Suspends execution via `ctx.suspend()`, waits for human input to resume.
3. **Commit** — Applies the approved change to the system.

## Creating Runs

```ts
const workflow = mastra.getWorkflow("brandApprovalWorkflow");
const run = await workflow.createRun({ runId: "my-run-id" });
const result = await run.start({ inputData: { brandName: "...", industry: "..." } });
```

## Suspending and Resuming

When a step calls `ctx.suspend(payload)`, the workflow engine persists the step's state to the configured storage store and returns `{ status: "suspended", suspendPayload: payload }`.

To resume:

```ts
const result = await run.resume({ approved: true, approver: "admin" });
```

The resume data is passed back as the return value of `ctx.suspend()` inside the step, allowing the step to continue with the user's input.

## Recovery After Restart

Snapshots are persisted in the PostgresStore (or LibSQLStore) configured on the Mastra instance. After a server restart, active suspended runs can be recovered by loading the workflow from the store and calling `run.resume()` with the same `runId`.

## Persistence

Workflow persistence is provided by the storage backend configured on the Mastra instance (`mastra.storage`). By default, LibSQLStore with `:memory:` is used for development. For production, switch to PostgresStore (or a persistent LibSQLStore) to survive process restarts.
