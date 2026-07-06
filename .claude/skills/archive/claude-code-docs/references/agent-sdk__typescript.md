---
title: Agent SDK reference - TypeScript
source: https://code.claude.com/docs/en/agent-sdk/typescript
path: /docs/en/agent-sdk/typescript
---

# Agent SDK reference - TypeScript

> Complete API reference for the TypeScript Agent SDK, including all functions, types, and interfaces.
```bash
npm install @anthropic-ai/claude-agent-sdk
```
```typescript
import binPath from "@anthropic-ai/claude-agent-sdk-darwin-arm64/claude" with { type: "file" };
import { extractFromBunfs } from "@anthropic-ai/claude-agent-sdk/extract";
import { query } from "@anthropic-ai/claude-agent-sdk";

const cliPath = extractFromBunfs(binPath);

for await (const message of query({
  prompt: "Hello",
  options: { pathToClaudeCodeExecutable: cliPath },
})) {
  console.log(message);
}
```
```typescript
function query({
  prompt,
  options
}: {
  prompt: string | AsyncIterable<SDKUserMessage>;
  options?: Options;
}): Query;
```
```typescript
function startup(params?: {
  options?: Options;
  initializeTimeoutMs?: number;
}): Promise<WarmQuery>;
```
```typescript
import { startup } from "@anthropic-ai/claude-agent-sdk";

// Pay startup cost upfront
const warm = await startup({ options: { maxTurns: 3 } });

// Later, when a prompt is ready, this is immediate
for await (const message of warm.query("What files are here?")) {
  console.log(message);
}
```
```typescript
function tool<Schema extends AnyZodRawShape>(
  name: string,
  description: string,
  inputSchema: Schema,
  handler: (args: InferShape<Schema>, extra: unknown) => Promise<CallToolResult>,
  extras?: { annotations?: ToolAnnotations }
): SdkMcpToolDefinition<Schema>;
```
```typescript
import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const searchTool = tool(
  "search",
  "Search the web",
  { query: z.string() },
  async ({ query }) => {
    return { content: [{ type: "text", text: `Results for: ${query}` }] };
  },
  { annotations: { readOnlyHint: true, openWorldHint: true } }
);
```
```typescript
function createSdkMcpServer(options: {
  name: string;
  version?: string;
  tools?: Array<SdkMcpToolDefinition<any>>;
}): McpSdkServerConfigWithInstance;
```
```typescript
function listSessions(options?: ListSessionsOptions): Promise<SDKSessionInfo[]>;
```
```typescript
import { listSessions } from "@anthropic-ai/claude-agent-sdk";

const sessions = await listSessions({ dir: "/path/to/project", limit: 10 });

for (const session of sessions) {
  console.log(`${session.summary} (${session.sessionId})`);
}
```
```typescript
function getSessionMessages(
  sessionId: string,
  options?: GetSessionMessagesOptions
): Promise<SessionMessage[]>;
```
```typescript
import { listSessions, getSessionMessages } from "@anthropic-ai/claude-agent-sdk";

const [latest] = await listSessions({ dir: "/path/to/project", limit: 1 });

if (latest) {
  const messages = await getSessionMessages(latest.sessionId, {
    dir: "/path/to/project",
    limit: 20
  });

  for (const msg of messages) {
    console.log(`[${msg.type}] ${msg.uuid}`);
  }
}
```
```typescript
function getSessionInfo(
  sessionId: string,
  options?: GetSessionInfoOptions
): Promise<SDKSessionInfo | undefined>;
```
```typescript
function renameSession(
  sessionId: string,
  title: string,
  options?: SessionMutationOptions
): Promise<void>;
```
```typescript
function tagSession(
  sessionId: string,
  tag: string | null,
  options?: SessionMutationOptions
): Promise<void>;
```
```typescript
function resolveSettings(
  options?: ResolveSettingsOptions
): Promise<ResolvedSettings>;
```
```typescript
import { resolveSettings } from "@anthropic-ai/claude-agent-sdk";

const { effective, provenance } = await resolveSettings({
  cwd: "/path/to/project",
  settingSources: ["user", "project", "local"],
});

console.log(`Cleanup period: ${effective.cleanupPeriodDays} days`);
console.log(`Set by: ${provenance.cleanupPeriodDays?.source}`);
```
```typescript
const result = query({
  prompt: "Analyze this code",
  options: {
    env: {
      ...process.env,
      API_TIMEOUT_MS: "120000",
      CLAUDE_CODE_MAX_RETRIES: "2",
      CLAUDE_ASYNC_AGENT_STALL_TIMEOUT_MS: "120000",
    },
  },
});
```
```typescript
interface Query extends AsyncGenerator<SDKMessage, void> {
  interrupt(): Promise<void>;
  rewindFiles(
    userMessageId: string,
    options?: { dryRun?: boolean }
  ): Promise<RewindFilesResult>;
  setPermissionMode(mode: PermissionMode): Promise<void>;
  setModel(model?: string): Promise<void>;
  setMaxThinkingTokens(maxThinkingTokens: number | null): Promise<void>;
  applyFlagSettings(settings: { [K in keyof Settings]?: Settings[K] | null }): Promise<void>;
  initializationResult(): Promise<SDKControlInitializeResponse>;
  supportedCommands(): Promise<SlashCommand[]>;
  supportedModels(): Promise<ModelInfo[]>;
  supportedAgents(): Promise<AgentInfo[]>;
  mcpServerStatus(): Promise<McpServerStatus[]>;
  accountInfo(): Promise<AccountInfo>;
  reconnectMcpServer(serverName: string): Promise<void>;
  toggleMcpServer(serverName: string, enabled: boolean): Promise<void>;
  setMcpServers(servers: Record<string, McpServerConfig>): Promise<McpSetServersResult>;
  streamInput(stream: AsyncIterable<SDKUserMessage>): Promise<void>;
  stopTask(taskId: string): Promise<void>;
  close(): void;
}
```
```typescript
const q = query({ prompt: messageStream });

// Override the model for the rest of the session
await q.applyFlagSettings({ model: "claude-opus-4-6" });

// Later: clear the override and fall back to lower-precedence settings
await q.applyFlagSettings({ model: null });
```
```typescript
interface WarmQuery extends AsyncDisposable {
  query(prompt: string | AsyncIterable<SDKUserMessage>): Query;
  close(): void;
}
```
```typescript
type SDKControlInitializeResponse = {
  commands: SlashCommand[];
  agents: AgentInfo[];
  output_style: string;
  available_output_styles: string[];
  models: ModelInfo[];
  account: AccountInfo;
  fast_mode_state?: "off" | "cooldown" | "on";
};
```
```typescript
type AgentDefinition = {
  description: string;
  tools?: string[];
  disallowedTools?: string[];
  prompt: string;
  model?: string;
  mcpServers?: AgentMcpServerSpec[];
  skills?: string[];
  initialPrompt?: string;
  maxTurns?: number;
  background?: boolean;
  memory?: "user" | "project" | "local";
  effort?: "low" | "medium" | "high" | "xhigh" | "max" | number;
  permissionMode?: PermissionMode;
  criticalSystemReminder_EXPERIMENTAL?: string;
};
```
```typescript
type AgentMcpServerSpec = string | Record<string, McpServerConfigForProcessTransport>;
```
```typescript
type SettingSource = "user" | "project" | "local";
```
```typescript
// Do not load user, project, or local settings from disk
const result = query({
  prompt: "Analyze this code",
  options: { settingSources: [] }
});
```
```typescript
const result = query({
  prompt: "Analyze this code",
  options: {
    settingSources: ["user", "project", "local"] // Load all settings
  }
});
```
```typescript
// Load only project settings, ignore user and local
const result = query({
  prompt: "Run CI checks",
  options: {
    settingSources: ["project"] // Only .claude/settings.json
  }
});
```
```typescript
// Ensure consistent behavior in CI by excluding local settings
const result = query({
  prompt: "Run tests",
  options: {
    settingSources: ["project"], // Only team-shared settings
    permissionMode: "bypassPermissions"
  }
});
```
```typescript
// Define everything programmatically.
// Pass [] to opt out of filesystem setting sources.
const result = query({
  prompt: "Review this PR",
  options: {
    settingSources: [],
    agents: {
      /* ... */
    },
    mcpServers: {
      /* ... */
    },
    allowedTools: ["Read", "Grep", "Glob"]
  }
});
```
```typescript
// Load project settings to include CLAUDE.md files
const result = query({
  prompt: "Add a new feature following project conventions",
  options: {
    systemPrompt: {
      type: "preset",
      preset: "claude_code" // Use Claude Code's system prompt
    },
    settingSources: ["project"], // Loads CLAUDE.md from project directory
    allowedTools: ["Read", "Write", "Edit"]
  }
});
```
```typescript
type PermissionMode =
  | "default" // Standard permission behavior
  | "acceptEdits" // Auto-accept file edits
  | "bypassPermissions" // Bypass permission checks; explicit ask rules still prompt
  | "plan" // Planning mode - explore without editing
  | "dontAsk" // Don't prompt for permissions, deny if not pre-approved
  | "auto"; // Use a model classifier to approve or deny each tool call
```
```typescript
type CanUseTool = (
  toolName: string,
  input: Record<string, unknown>,
  options: {
    signal: AbortSignal;
    suggestions?: PermissionUpdate[];
    blockedPath?: string;
    decisionReason?: string;
    toolUseID: string;
    agentID?: string;
  }
) => Promise<PermissionResult>;
```
```typescript
type PermissionResult =
  | {
      behavior: "allow";
      updatedInput?: Record<string, unknown>;
      updatedPermissions?: PermissionUpdate[];
      toolUseID?: string;
    }
  | {
      behavior: "deny";
      message: string;
      interrupt?: boolean;
      toolUseID?: string;
    };
```
```typescript
type ToolConfig = {
  askUserQuestion?: {
    previewFormat?: "markdown" | "html";
  };
};
```
```typescript
type McpServerConfig =
  | McpStdioServerConfig
  | McpSSEServerConfig
  | McpHttpServerConfig
  | McpSdkServerConfigWithInstance;
```
```typescript
type McpStdioServerConfig = {
  type?: "stdio";
  command: string;
  args?: string[];
  env?: Record<string, string>;
};
```
```typescript
type McpSSEServerConfig = {
  type: "sse";
  url: string;
  headers?: Record<string, string>;
};
```
```typescript
type McpHttpServerConfig = {
  type: "http";
  url: string;
  headers?: Record<string, string>;
};
```
```typescript
type McpSdkServerConfigWithInstance = {
  type: "sdk";
  name: string;
  instance: McpServer;
};
```
```typescript
type McpClaudeAIProxyServerConfig = {
  type: "claudeai-proxy";
  url: string;
  id: string;
};
```
```typescript
type SdkPluginConfig = {
  type: "local";
  path: string;
  skipMcpDiscovery?: boolean;
};
```
```typescript
plugins: [
  { type: "local", path: "./my-plugin" },
  { type: "local", path: "/absolute/path/to/plugin" }
];
```
```typescript
type SDKMessage =
  | SDKAssistantMessage
  | SDKUserMessage
  | SDKUserMessageReplay
  | SDKResultMessage
  | SDKSystemMessage
  | SDKPartialAssistantMessage
  | SDKCompactBoundaryMessage
  | SDKStatusMessage
  | SDKLocalCommandOutputMessage
  | SDKHookStartedMessage
  | SDKHookProgressMessage
  | SDKHookResponseMessage
  | SDKPluginInstallMessage
  | SDKToolProgressMessage
  | SDKAuthStatusMessage
  | SDKTaskNotificationMessage
  | SDKTaskStartedMessage
  | SDKTaskProgressMessage
  | SDKTaskUpdatedMessage
  | SDKSessionStateChangedMessage
  | SDKWorkerShuttingDownMessage
  | SDKCommandsChangedMessage
  | SDKNotificationMessage
  | SDKFilesPersistedEvent
  | SDKToolUseSummaryMessage
  | SDKMemoryRecallMessage
  | SDKRateLimitEvent
  | SDKElicitationCompleteMessage
  | SDKPermissionDeniedMessage
  | SDKPromptSuggestionMessage
  | SDKAPIRetryMessage
  | SDKMirrorErrorMessage
  | SDKInformationalMessage;
```
```typescript
type SDKAssistantMessage = {
  type: "assistant";
  uuid: UUID;
  session_id: string;
  message: BetaMessage; // From Anthropic SDK
  parent_tool_use_id: string | null;
  error?: SDKAssistantMessageError;
};
```
```typescript
type SDKUserMessage = {
  type: "user";
  uuid?: UUID;
  session_id?: string;
  message: MessageParam; // From Anthropic SDK
  parent_tool_use_id: string | null;
  isSynthetic?: boolean;
  shouldQuery?: boolean;
  tool_use_result?: unknown;
  origin?: SDKMessageOrigin;
};
```
```typescript
type SDKUserMessageReplay = {
  type: "user";
  uuid: UUID;
  session_id: string;
  message: MessageParam;
  parent_tool_use_id: string | null;
  isSynthetic?: boolean;
  tool_use_result?: unknown;
  origin?: SDKMessageOrigin;
  isReplay: true;
};
```
```typescript
type SDKResultMessage =
  | {
      type: "result";
      subtype: "success";
      uuid: UUID;
      session_id: string;
      duration_ms: number;
      duration_api_ms: number;
      is_error: boolean;
      api_error_status?: number | null;
      num_turns: number;
      result: string;
      stop_reason: string | null;
      ttft_ms?: number;
      ttft_stream_ms?: number;
      total_cost_usd: number;
      usage: NonNullableUsage;
      modelUsage: { [modelName: string]: ModelUsage };
      permission_denials: SDKPermissionDenial[];
      structured_output?: unknown;
      deferred_tool_use?: { id: string; name: string; input: Record<string, unknown> };
      terminal_reason?: TerminalReason;
      fast_mode_state?: FastModeState;
      origin?: SDKMessageOrigin;
    }
  | {
      type: "result";
      subtype:
        | "error_max_turns"
        | "error_during_execution"
        | "error_max_budget_usd"
        | "error_max_structured_output_retries";
      uuid: UUID;
      session_id: string;
      duration_ms: number;
      duration_api_ms: number;
      is_error: boolean;
      num_turns: number;
      stop_reason: string | null;
      total_cost_usd: number;
      usage: NonNullableUsage;
      modelUsage: { [modelName: string]: ModelUsage };
      permission_denials: SDKPermissionDenial[];
      errors: string[];
      terminal_reason?: TerminalReason;
      fast_mode_state?: FastModeState;
      origin?: SDKMessageOrigin;
    };
```
```typescript
type SDKSystemMessage = {
  type: "system";
  subtype: "init";
  uuid: UUID;
  session_id: string;
  agents?: string[];
  apiKeySource: ApiKeySource;
  betas?: string[];
  claude_code_version: string;
  cwd: string;
  tools: string[];
  mcp_servers: {
    name: string;
    status: string;
  }[];
  model: string;
  permissionMode: PermissionMode;
  slash_commands: string[];
  output_style: string;
  skills: string[];
  plugins: { name: string; path: string }[];
};
```
```typescript
type SDKPartialAssistantMessage = {
  type: "stream_event";
  event: BetaRawMessageStreamEvent; // From Anthropic SDK
  parent_tool_use_id: string | null;
  uuid: UUID;
  session_id: string;
  ttft_ms?: number; // Time to first token in ms, present only on message_start events
};
```
```typescript
type SDKCompactBoundaryMessage = {
  type: "system";
  subtype: "compact_boundary";
  uuid: UUID;
  session_id: string;
  compact_metadata: {
    trigger: "manual" | "auto";
    pre_tokens: number;
  };
};
```
```typescript
type SDKInformationalMessage = {
  type: "system";
  subtype: "informational";
  content: string;
  level: "info" | "notice" | "suggestion" | "warning";
  tool_use_id?: string;
  prevent_continuation?: boolean;
  uuid: UUID;
  session_id: string;
};
```
```typescript
type SDKWorkerShuttingDownMessage = {
  type: "system";
  subtype: "worker_shutting_down";
  reason: string;
  uuid: UUID;
  session_id: string;
};
```
```typescript
type SDKPluginInstallMessage = {
  type: "system";
  subtype: "plugin_install";
  status: "started" | "installed" | "failed" | "completed";
  name?: string;
  error?: string;
  uuid: UUID;
  session_id: string;
};
```
```typescript
type SDKPermissionDeniedMessage = {
  type: "system";
  subtype: "permission_denied";
  tool_name: string;
  tool_use_id: string;
  agent_id?: string;
  decision_reason_type?: string;
  decision_reason?: string;
  message: string;
  uuid: UUID;
  session_id: string;
};
```
```typescript
type SDKPermissionDenial = {
  tool_name: string;
  tool_use_id: string;
  tool_input: Record<string, unknown>;
};
```
```typescript
type SDKMessageOrigin =
  | { kind: "human" }
  | { kind: "channel"; server: string }
  | { kind: "peer"; from: string; name?: string; senderTaskId?: string }
  | { kind: "task-notification" }
  | { kind: "coordinator" }
  | { kind: "auto-continuation" };
```
```typescript
type HookEvent =
  | "PreToolUse"
  | "PostToolUse"
  | "PostToolUseFailure"
  | "PostToolBatch"
  | "Notification"
  | "UserPromptSubmit"
  | "SessionStart"
  | "SessionEnd"
  | "Stop"
  | "SubagentStart"
  | "SubagentStop"
  | "PreCompact"
  | "PermissionRequest"
  | "Setup"
  | "TeammateIdle"
  | "TaskCompleted"
  | "ConfigChange"
  | "WorktreeCreate"
  | "WorktreeRemove"
  | "MessageDisplay";
```
```typescript
type HookCallback = (
  input: HookInput, // Union of all hook input types
  toolUseID: string | undefined,
  options: { signal: AbortSignal }
) => Promise<HookJSONOutput>;
```
```typescript
interface HookCallbackMatcher {
  matcher?: string;
  hooks: HookCallback[];
  timeout?: number; // Timeout in seconds for all hooks in this matcher
}
```
```typescript
type HookInput =
  | PreToolUseHookInput
  | PostToolUseHookInput
  | PostToolUseFailureHookInput
  | PostToolBatchHookInput
  | NotificationHookInput
  | UserPromptSubmitHookInput
  | SessionStartHookInput
  | SessionEndHookInput
  | StopHookInput
  | SubagentStartHookInput
  | SubagentStopHookInput
  | PreCompactHookInput
  | PermissionRequestHookInput
  | SetupHookInput
  | TeammateIdleHookInput
  | TaskCompletedHookInput
  | ConfigChangeHookInput
  | WorktreeCreateHookInput
  | WorktreeRemoveHookInput
  | MessageDisplayHookInput;
```
```typescript
type BaseHookInput = {
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode?: string;
  effort?: { level: string };
  agent_id?: string;
  agent_type?: string;
};
```
```typescript
type PreToolUseHookInput = BaseHookInput & {
  hook_event_name: "PreToolUse";
  tool_name: string;
  tool_input: unknown;
  tool_use_id: string;
};
```
```typescript
type PostToolUseHookInput = BaseHookInput & {
  hook_event_name: "PostToolUse";
  tool_name: string;
  tool_input: unknown;
  tool_response: unknown;
  tool_use_id: string;
  duration_ms?: number;
};
```
```typescript
type PostToolUseFailureHookInput = BaseHookInput & {
  hook_event_name: "PostToolUseFailure";
  tool_name: string;
  tool_input: unknown;
  tool_use_id: string;
  error: string;
  is_interrupt?: boolean;
  duration_ms?: number;
};
```
```typescript
type PostToolBatchHookInput = BaseHookInput & {
  hook_event_name: "PostToolBatch";
  tool_calls: PostToolBatchToolCall[];
};

type PostToolBatchToolCall = {
  tool_name: string;
  tool_input: unknown;
  tool_use_id: string;
  tool_response?: unknown;
};
```
```typescript
type NotificationHookInput = BaseHookInput & {
  hook_event_name: "Notification";
  message: string;
  title?: string;
  notification_type: string;
};
```
```typescript
type UserPromptSubmitHookInput = BaseHookInput & {
  hook_event_name: "UserPromptSubmit";
  prompt: string;
};
```
```typescript
type SessionStartHookInput = BaseHookInput & {
  hook_event_name: "SessionStart";
  source: "startup" | "resume" | "clear" | "compact";
  agent_type?: string;
  model?: string;
};
```
```typescript
type SessionEndHookInput = BaseHookInput & {
  hook_event_name: "SessionEnd";
  reason: ExitReason; // String from EXIT_REASONS array
};
```
```typescript
type StopHookInput = BaseHookInput & {
  hook_event_name: "Stop";
  stop_hook_active: boolean;
  last_assistant_message?: string;
  background_tasks?: BackgroundTaskSummary[];
  session_crons?: SessionCronSummary[];
};
```
```typescript
type SubagentStartHookInput = BaseHookInput & {
  hook_event_name: "SubagentStart";
  agent_id: string;
  agent_type: string;
};
```
```typescript
type SubagentStopHookInput = BaseHookInput & {
  hook_event_name: "SubagentStop";
  stop_hook_active: boolean;
  agent_id: string;
  agent_transcript_path: string;
  agent_type: string;
  last_assistant_message?: string;
  background_tasks?: BackgroundTaskSummary[];
  session_crons?: SessionCronSummary[];
};

type BackgroundTaskSummary = {
  id: string;
  type: string;
  status: string;
  description: string;
  command?: string;
  agent_type?: string;
  server?: string;
  tool?: string;
  name?: string;
};

type SessionCronSummary = {
  id: string;
  schedule: string;
  recurring: boolean;
  prompt: string;
};
```
```typescript
type PreCompactHookInput = BaseHookInput & {
  hook_event_name: "PreCompact";
  trigger: "manual" | "auto";
  custom_instructions: string | null;
};
```
```typescript
type PermissionRequestHookInput = BaseHookInput & {
  hook_event_name: "PermissionRequest";
  tool_name: string;
  tool_input: unknown;
  permission_suggestions?: PermissionUpdate[];
};
```
```typescript
type SetupHookInput = BaseHookInput & {
  hook_event_name: "Setup";
  trigger: "init" | "maintenance";
};
```
```typescript
type TeammateIdleHookInput = BaseHookInput & {
  hook_event_name: "TeammateIdle";
  teammate_name: string;
  /** @deprecated since v2.1.178. Carries the session-derived team name; will be removed. */
  team_name: string;
};
```
```typescript
type TaskCompletedHookInput = BaseHookInput & {
  hook_event_name: "TaskCompleted";
  task_id: string;
  task_subject: string;
  task_description?: string;
  teammate_name?: string;
  /** @deprecated since v2.1.178. Carries the session-derived team name; will be removed. */
  team_name?: string;
};
```
```typescript
type ConfigChangeHookInput = BaseHookInput & {
  hook_event_name: "ConfigChange";
  source:
    | "user_settings"
    | "project_settings"
    | "local_settings"
    | "policy_settings"
    | "skills";
  file_path?: string;
};
```
```typescript
type WorktreeCreateHookInput = BaseHookInput & {
  hook_event_name: "WorktreeCreate";
  name: string;
};
```
```typescript
type WorktreeRemoveHookInput = BaseHookInput & {
  hook_event_name: "WorktreeRemove";
  worktree_path: string;
};
```
```typescript
type MessageDisplayHookInput = BaseHookInput & {
  hook_event_name: "MessageDisplay";
  turn_id: string;
  message_id: string;
  index: number;
  final: boolean;
  delta: string;
};
```
```typescript
type HookJSONOutput = AsyncHookJSONOutput | SyncHookJSONOutput;
```
```typescript
type AsyncHookJSONOutput = {
  async: true;
  asyncTimeout?: number;
};
```
```typescript
type SyncHookJSONOutput = {
  continue?: boolean;
  suppressOutput?: boolean;
  stopReason?: string;
  decision?: "approve" | "block";
  systemMessage?: string;
  reason?: string;
  hookSpecificOutput?:
    | {
        hookEventName: "PreToolUse";
        permissionDecision?: "allow" | "deny" | "ask" | "defer";
        permissionDecisionReason?: string;
        updatedInput?: Record<string, unknown>;
        additionalContext?: string;
      }
    | {
        hookEventName: "UserPromptSubmit";
        additionalContext?: string;
      }
    | {
        hookEventName: "SessionStart";
        additionalContext?: string;
      }
    | {
        hookEventName: "Setup";
        additionalContext?: string;
      }
    | {
        hookEventName: "SubagentStart";
        additionalContext?: string;
      }
    | {
        hookEventName: "PostToolUse";
        additionalContext?: string;
        updatedToolOutput?: unknown;
        /** @deprecated Use `updatedToolOutput`, which works for all tools. */
        updatedMCPToolOutput?: unknown;
      }
    | {
        hookEventName: "PostToolUseFailure";
        additionalContext?: string;
      }
    | {
        hookEventName: "PostToolBatch";
        additionalContext?: string;
      }
    | {
        hookEventName: "Notification";
        additionalContext?: string;
      }
    | {
        hookEventName: "PermissionRequest";
        decision:
          | {
              behavior: "allow";
              updatedInput?: Record<string, unknown>;
              updatedPermissions?: PermissionUpdate[];
            }
          | {
              behavior: "deny";
              message?: string;
              interrupt?: boolean;
            };
      };
};
```
```typescript
type ToolInputSchemas =
  | AgentInput
  | AskUserQuestionInput
  | BashInput
  | TaskOutputInput
  | EnterWorktreeInput
  | ExitPlanModeInput
  | FileEditInput
  | FileReadInput
  | FileWriteInput
  | GlobInput
  | GrepInput
  | ListMcpResourcesInput
  | McpInput
  | MonitorInput
  | NotebookEditInput
  | ReadMcpResourceInput
  | SubscribeMcpResourceInput
  | SubscribePollingInput
  | TaskCreateInput
  | TaskGetInput
  | TaskListInput
  | TaskStopInput
  | TaskUpdateInput
  | TodoWriteInput
  | UnsubscribeMcpResourceInput
  | UnsubscribePollingInput
  | WebFetchInput
  | WebSearchInput
  | WorkflowInput;
```
```typescript
type AgentInput = {
  description: string;
  prompt: string;
  subagent_type: string;
  model?: "sonnet" | "opus" | "haiku" | "fable";
  resume?: string;
  run_in_background?: boolean;
  max_turns?: number;
  name?: string;
  mode?: "acceptEdits" | "bypassPermissions" | "default" | "dontAsk" | "plan";
  isolation?: "worktree";
};
```
```typescript
type AskUserQuestionInput = {
  questions: Array<{
    question: string;
    header: string;
    options: Array<{ label: string; description: string; preview?: string }>;
    multiSelect: boolean;
  }>;
};
```
```typescript
type BashInput = {
  command: string;
  timeout?: number;
  description?: string;
  run_in_background?: boolean;
  dangerouslyDisableSandbox?: boolean;
};
```
```typescript
type MonitorInput = {
  command: string;
  description: string;
  timeout_ms?: number;
  persistent?: boolean;
};
```
```typescript
type TaskOutputInput = {
  task_id: string;
  block: boolean;
  timeout: number;
};
```
```typescript
type FileEditInput = {
  file_path: string;
  old_string: string;
  new_string: string;
  replace_all?: boolean;
};
```
```typescript
type FileReadInput = {
  file_path: string;
  offset?: number;
  limit?: number;
  pages?: string;
};
```
```typescript
type FileWriteInput = {
  file_path: string;
  content: string;
};
```
```typescript
type GlobInput = {
  pattern: string;
  path?: string;
};
```
```typescript
type GrepInput = {
  pattern: string;
  path?: string;
  glob?: string;
  type?: string;
  output_mode?: "content" | "files_with_matches" | "count";
  "-i"?: boolean;
  "-n"?: boolean;
  "-B"?: number;
  "-A"?: number;
  "-C"?: number;
  context?: number;
  head_limit?: number;
  offset?: number;
  multiline?: boolean;
};
```
```typescript
type TaskStopInput = {
  task_id?: string;
  shell_id?: string; // Deprecated: use task_id
};
```
```typescript
type NotebookEditInput = {
  notebook_path: string;
  cell_id?: string;
  new_source: string;
  cell_type?: "code" | "markdown";
  edit_mode?: "replace" | "insert" | "delete";
};
```
```typescript
type WebFetchInput = {
  url: string;
  prompt: string;
};
```
```typescript
type WebSearchInput = {
  query: string;
  allowed_domains?: string[];
  blocked_domains?: string[];
};
```
```typescript
type WorkflowInput = {
  script?: string;
  name?: string;
  scriptPath?: string;
  args?: unknown;
  resumeFromRunId?: string;
};
```
```typescript
type TodoWriteInput = {
  todos: Array<{
    content: string;
    status: "pending" | "in_progress" | "completed";
    activeForm: string;
  }>;
};
```
```typescript
type TaskCreateInput = {
  subject: string;
  description: string;
  activeForm?: string;
  metadata?: Record<string, unknown>;
};
```
```typescript
type TaskUpdateInput = {
  taskId: string;
  status?: "pending" | "in_progress" | "completed" | "deleted";
  subject?: string;
  description?: string;
  activeForm?: string;
  addBlocks?: string[];
  addBlockedBy?: string[];
  owner?: string;
  metadata?: Record<string, unknown>;
};
```
```typescript
type TaskGetInput = {
  taskId: string;
};
```
```typescript
type TaskListInput = {};
```
```typescript
type ExitPlanModeInput = {
  allowedPrompts?: Array<{
    tool: "Bash";
    prompt: string;
  }>;
};
```
```typescript
type ListMcpResourcesInput = {
  server?: string;
};
```
```typescript
type ReadMcpResourceInput = {
  server: string;
  uri: string;
};
```
```typescript
type EnterWorktreeInput = {
  name?: string;
  path?: string;
};
```
```typescript
type ToolOutputSchemas =
  | AgentOutput
  | AskUserQuestionOutput
  | BashOutput
  | EnterWorktreeOutput
  | ExitPlanModeOutput
  | FileEditOutput
  | FileReadOutput
  | FileWriteOutput
  | GlobOutput
  | GrepOutput
  | ListMcpResourcesOutput
  | MonitorOutput
  | NotebookEditOutput
  | ReadMcpResourceOutput
  | TaskCreateOutput
  | TaskGetOutput
  | TaskListOutput
  | TaskStopOutput
  | TaskUpdateOutput
  | TodoWriteOutput
  | WebFetchOutput
  | WebSearchOutput
  | WorkflowOutput;
```
```typescript
type AgentOutput =
  | {
      status: "completed";
      agentId: string;
      content: Array<{ type: "text"; text: string }>;
      resolvedModel?: string;
      totalToolUseCount: number;
      totalDurationMs: number;
      totalTokens: number;
      usage: {
        input_tokens: number;
        output_tokens: number;
        cache_creation_input_tokens: number | null;
        cache_read_input_tokens: number | null;
        server_tool_use: {
          web_search_requests: number;
          web_fetch_requests: number;
        } | null;
        service_tier: ("standard" | "priority" | "batch") | null;
        cache_creation: {
          ephemeral_1h_input_tokens: number;
          ephemeral_5m_input_tokens: number;
        } | null;
      };
      prompt: string;
    }
  | {
      status: "async_launched";
      agentId: string;
      description: string;
      resolvedModel?: string;
      prompt: string;
      outputFile: string;
      canReadOutputFile?: boolean;
    }
  | {
      status: "sub_agent_entered";
      description: string;
      message: string;
    };
```
```typescript
type AskUserQuestionOutput = {
  questions: Array<{
    question: string;
    header: string;
    options: Array<{ label: string; description: string; preview?: string }>;
    multiSelect: boolean;
  }>;
  answers: Record<string, string>;
  response?: string;
};
```
```typescript
type BashOutput = {
  stdout: string;
  stderr: string;
  rawOutputPath?: string;
  interrupted: boolean;
  isImage?: boolean;
  backgroundTaskId?: string;
  backgroundedByUser?: boolean;
  dangerouslyDisableSandbox?: boolean;
  returnCodeInterpretation?: string;
  structuredContent?: unknown[];
  persistedOutputPath?: string;
  persistedOutputSize?: number;
};
```
```typescript
type MonitorOutput = {
  taskId: string;
  timeoutMs: number;
  persistent?: boolean;
};
```
```typescript
type FileEditOutput = {
  filePath: string;
  oldString: string;
  newString: string;
  originalFile: string;
  structuredPatch: Array<{
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: string[];
  }>;
  userModified: boolean;
  replaceAll: boolean;
  gitDiff?: {
    filename: string;
    status: "modified" | "added";
    additions: number;
    deletions: number;
    changes: number;
    patch: string;
  };
};
```
```typescript
type FileReadOutput =
  | {
      type: "text";
      file: {
        filePath: string;
        content: string;
        numLines: number;
        startLine: number;
        totalLines: number;
      };
    }
  | {
      type: "image";
      file: {
        base64: string;
        type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
        originalSize: number;
        dimensions?: {
          originalWidth?: number;
          originalHeight?: number;
          displayWidth?: number;
          displayHeight?: number;
        };
      };
    }
  | {
      type: "notebook";
      file: {
        filePath: string;
        cells: unknown[];
      };
    }
  | {
      type: "pdf";
      file: {
        filePath: string;
        base64: string;
        originalSize: number;
      };
    }
  | {
      type: "parts";
      file: {
        filePath: string;
        originalSize: number;
        count: number;
        outputDir: string;
      };
    };
```
```typescript
type FileWriteOutput = {
  type: "create" | "update";
  filePath: string;
  content: string;
  structuredPatch: Array<{
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: string[];
  }>;
  originalFile: string | null;
  gitDiff?: {
    filename: string;
    status: "modified" | "added";
    additions: number;
    deletions: number;
    changes: number;
    patch: string;
  };
};
```
```typescript
type GlobOutput = {
  durationMs: number;
  numFiles: number;
  filenames: string[];
  truncated: boolean;
};
```
```typescript
type GrepOutput = {
  mode?: "content" | "files_with_matches" | "count";
  numFiles: number;
  filenames: string[];
  content?: string;
  numLines?: number;
  numMatches?: number;
  appliedLimit?: number;
  appliedOffset?: number;
};
```
```typescript
type TaskStopOutput = {
  message: string;
  task_id: string;
  task_type: string;
  command?: string;
};
```
```typescript
type NotebookEditOutput = {
  new_source: string;
  cell_id?: string;
  cell_type: "code" | "markdown";
  language: string;
  edit_mode: string;
  error?: string;
  notebook_path: string;
  original_file: string;
  updated_file: string;
};
```
```typescript
type WebFetchOutput = {
  bytes: number;
  code: number;
  codeText: string;
  result: string;
  durationMs: number;
  url: string;
};
```
```typescript
type WebSearchOutput = {
  query: string;
  results: Array<
    | {
        tool_use_id: string;
        content: Array<{ title: string; url: string }>;
      }
    | string
  >;
  durationSeconds: number;
};
```
```typescript
type WorkflowOutput = {
  status: "async_launched";
  taskId: string;
  runId?: string;
  summary?: string;
  transcriptDir?: string;
  scriptPath?: string;
  error?: string;
};
```
```typescript
type TodoWriteOutput = {
  oldTodos: Array<{
    content: string;
    status: "pending" | "in_progress" | "completed";
    activeForm: string;
  }>;
  newTodos: Array<{
    content: string;
    status: "pending" | "in_progress" | "completed";
    activeForm: string;
  }>;
};
```
```typescript
type TaskCreateOutput = {
  task: {
    id: string;
    subject: string;
  };
};
```
```typescript
type TaskUpdateOutput = {
  success: boolean;
  taskId: string;
  updatedFields: string[];
  error?: string;
  statusChange?: {
    from: string;
    to: string;
  };
};
```
```typescript
type TaskGetOutput = {
  task: {
    id: string;
    subject: string;
    description: string;
    status: "pending" | "in_progress" | "completed";
    blocks: string[];
    blockedBy: string[];
  } | null;
};
```
```typescript
type TaskListOutput = {
  tasks: Array<{
    id: string;
    subject: string;
    status: "pending" | "in_progress" | "completed";
    owner?: string;
    blockedBy: string[];
  }>;
};
```
```typescript
type ExitPlanModeOutput = {
  plan: string | null;
  isAgent: boolean;
  filePath?: string;
  hasTaskTool?: boolean;
  awaitingLeaderApproval?: boolean;
  requestId?: string;
};
```
```typescript
type ListMcpResourcesOutput = Array<{
  uri: string;
  name: string;
  mimeType?: string;
  description?: string;
  server: string;
}>;
```
```typescript
type ReadMcpResourceOutput = {
  contents: Array<{
    uri: string;
    mimeType?: string;
    text?: string;
  }>;
};
```
```typescript
type EnterWorktreeOutput = {
  worktreePath: string;
  worktreeBranch?: string;
  message: string;
};
```
```typescript
type PermissionUpdate =
  | {
      type: "addRules";
      rules: PermissionRuleValue[];
      behavior: PermissionBehavior;
      destination: PermissionUpdateDestination;
    }
  | {
      type: "replaceRules";
      rules: PermissionRuleValue[];
      behavior: PermissionBehavior;
      destination: PermissionUpdateDestination;
    }
  | {
      type: "removeRules";
      rules: PermissionRuleValue[];
      behavior: PermissionBehavior;
      destination: PermissionUpdateDestination;
    }
  | {
      type: "setMode";
      mode: PermissionMode;
      destination: PermissionUpdateDestination;
    }
  | {
      type: "addDirectories";
      directories: string[];
      destination: PermissionUpdateDestination;
    }
  | {
      type: "removeDirectories";
      directories: string[];
      destination: PermissionUpdateDestination;
    };
```
```typescript
type PermissionBehavior = "allow" | "deny" | "ask";
```
```typescript
type PermissionUpdateDestination =
  | "userSettings" // Global user settings
  | "projectSettings" // Per-directory project settings
  | "localSettings" // Local project settings
  | "session" // Current session only
  | "cliArg"; // CLI argument
```
```typescript
type PermissionRuleValue = {
  toolName: string;
  ruleContent?: string;
};
```
```typescript
type ApiKeySource = "user" | "project" | "org" | "temporary" | "oauth";
```
```typescript
type SdkBeta = "context-1m-2025-08-07";
```
```typescript
type SlashCommand = {
  name: string;
  description: string;
  argumentHint: string;
  aliases?: string[];
};
```
```typescript
type ModelInfo = {
  value: string;
  displayName: string;
  description: string;
  supportsEffort?: boolean;
  supportedEffortLevels?: ("low" | "medium" | "high" | "xhigh" | "max")[];
  supportsAdaptiveThinking?: boolean;
  supportsFastMode?: boolean;
};
```
```typescript
type AgentInfo = {
  name: string;
  description: string;
  model?: string;
};
```
```typescript
type McpServerStatus = {
  name: string;
  status: "connected" | "failed" | "needs-auth" | "pending" | "disabled";
  serverInfo?: {
    name: string;
    version: string;
  };
  error?: string;
  config?: McpServerStatusConfig;
  scope?: string;
  tools?: {
    name: string;
    description?: string;
    annotations?: {
      readOnly?: boolean;
      destructive?: boolean;
      openWorld?: boolean;
    };
  }[];
};
```
```typescript
type McpServerStatusConfig =
  | McpStdioServerConfig
  | McpSSEServerConfig
  | McpHttpServerConfig
  | McpSdkServerConfig
  | McpClaudeAIProxyServerConfig;
```
```typescript
type AccountInfo = {
  email?: string;
  organization?: string;
  subscriptionType?: string;
  tokenSource?: string;
  apiKeySource?: string;
};
```
```typescript
type ModelUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
  webSearchRequests: number;
  costUSD: number;
  contextWindow: number;
  maxOutputTokens: number;
};
```
```typescript
type ConfigScope = "local" | "user" | "project";
```
```typescript
type NonNullableUsage = {
  [K in keyof Usage]: NonNullable<Usage[K]>;
};
```
```typescript
type Usage = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number | null;
  cache_read_input_tokens: number | null;
  cache_creation: {
    ephemeral_5m_input_tokens: number;
    ephemeral_1h_input_tokens: number;
  } | null;
  server_tool_use: BetaServerToolUsage | null;
  service_tier: "standard" | "priority" | "batch" | null;
  speed: "standard" | "fast" | null;
  inference_geo: string | null;
  iterations: BetaIterationsUsage | null;
};
```
```typescript
type CallToolResult = {
  content: Array<{
    type: "text" | "image" | "audio" | "resource" | "resource_link";
    // Additional fields vary by type
  }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};
```
```typescript
type ThinkingDisplay = "summarized" | "omitted";

type ThinkingConfig =
  | { type: "adaptive"; display?: ThinkingDisplay } // The model determines when and how much to reason (Opus 4.6+)
  | { type: "enabled"; budgetTokens?: number; display?: ThinkingDisplay } // Fixed thinking token budget
  | { type: "disabled" }; // No extended thinking
```
```typescript
interface SpawnedProcess {
  stdin: Writable;
  stdout: Readable;
  readonly killed: boolean;
  readonly exitCode: number | null;
  kill(signal: NodeJS.Signals): boolean;
  on(
    event: "exit",
    listener: (code: number | null, signal: NodeJS.Signals | null) => void
  ): void;
  on(event: "error", listener: (error: Error) => void): void;
  once(
    event: "exit",
    listener: (code: number | null, signal: NodeJS.Signals | null) => void
  ): void;
  once(event: "error", listener: (error: Error) => void): void;
  off(
    event: "exit",
    listener: (code: number | null, signal: NodeJS.Signals | null) => void
  ): void;
  off(event: "error", listener: (error: Error) => void): void;
}
```
```typescript
interface SpawnOptions {
  command: string;
  args: string[];
  cwd?: string;
  env: Record<string, string | undefined>;
  signal: AbortSignal;
}
```
```typescript
type McpSetServersResult = {
  added: string[];
  removed: string[];
  errors: Record<string, string>;
};
```
```typescript
type RewindFilesResult = {
  canRewind: boolean;
  error?: string;
  filesChanged?: string[];
  insertions?: number;
  deletions?: number;
};
```
```typescript
type SDKStatusMessage = {
  type: "system";
  subtype: "status";
  status: "compacting" | null;
  permissionMode?: PermissionMode;
  uuid: UUID;
  session_id: string;
};
```
```typescript
type SDKTaskNotificationMessage = {
  type: "system";
  subtype: "task_notification";
  task_id: string;
  tool_use_id?: string;
  status: "completed" | "failed" | "stopped";
  output_file: string;
  summary: string;
  usage?: {
    total_tokens: number;
    tool_uses: number;
    duration_ms: number;
  };
  uuid: UUID;
  session_id: string;
};
```
```typescript
type SDKToolUseSummaryMessage = {
  type: "tool_use_summary";
  summary: string;
  preceding_tool_use_ids: string[];
  uuid: UUID;
  session_id: string;
};
```
```typescript
type SDKHookStartedMessage = {
  type: "system";
  subtype: "hook_started";
  hook_id: string;
  hook_name: string;
  hook_event: string;
  uuid: UUID;
  session_id: string;
};
```
```typescript
type SDKHookProgressMessage = {
  type: "system";
  subtype: "hook_progress";
  hook_id: string;
  hook_name: string;
  hook_event: string;
  stdout: string;
  stderr: string;
  output: string;
  uuid: UUID;
  session_id: string;
};
```
```typescript
type SDKHookResponseMessage = {
  type: "system";
  subtype: "hook_response";
  hook_id: string;
  hook_name: string;
  hook_event: string;
  output: string;
  stdout: string;
  stderr: string;
  exit_code?: number;
  outcome: "success" | "error" | "cancelled";
  uuid: UUID;
  session_id: string;
};
```
```typescript
type SDKToolProgressMessage = {
  type: "tool_progress";
  tool_use_id: string;
  tool_name: string;
  parent_tool_use_id: string | null;
  elapsed_time_seconds: number;
  task_id?: string;
  uuid: UUID;
  session_id: string;
};
```
```typescript
type SDKAuthStatusMessage = {
  type: "auth_status";
  isAuthenticating: boolean;
  output: string[];
  error?: string;
  uuid: UUID;
  session_id: string;
};
```
```typescript
type SDKTaskStartedMessage = {
  type: "system";
  subtype: "task_started";
  task_id: string;
  tool_use_id?: string;
  description: string;
  task_type?: string;
  uuid: UUID;
  session_id: string;
};
```
```typescript
type SDKTaskProgressMessage = {
  type: "system";
  subtype: "task_progress";
  task_id: string;
  tool_use_id?: string;
  description: string;
  subagent_type?: string;
  usage: {
    total_tokens: number;
    tool_uses: number;
    duration_ms: number;
  };
  last_tool_name?: string;
  summary?: string;
  uuid: UUID;
  session_id: string;
};
```
```typescript
type SDKTaskUpdatedMessage = {
  type: "system";
  subtype: "task_updated";
  task_id: string;
  patch: {
    status?: "pending" | "running" | "completed" | "failed" | "killed";
    description?: string;
    end_time?: number;
    total_paused_ms?: number;
    error?: string;
    is_backgrounded?: boolean;
  };
  uuid: UUID;
  session_id: string;
};
```
```typescript
type SDKFilesPersistedEvent = {
  type: "system";
  subtype: "files_persisted";
  files: { filename: string; file_id: string }[];
  failed: { filename: string; error: string }[];
  processed_at: string;
  uuid: UUID;
  session_id: string;
};
```
```typescript
type SDKRateLimitEvent = {
  type: "rate_limit_event";
  rate_limit_info: {
    status: "allowed" | "allowed_warning" | "rejected";
    resetsAt?: number;
    utilization?: number;
    errorCode?: "credits_required";
    canUserPurchaseCredits?: boolean;
    hasChargeableSavedPaymentMethod?: boolean;
  };
  uuid: UUID;
  session_id: string;
};
```
```typescript
type SDKLocalCommandOutputMessage = {
  type: "system";
  subtype: "local_command_output";
  content: string;
  uuid: UUID;
  session_id: string;
};
```
```typescript
type SDKCommandsChangedMessage = {
  type: "system";
  subtype: "commands_changed";
  commands: SlashCommand[];
  uuid: UUID;
  session_id: string;
};
```
```typescript
type SDKPromptSuggestionMessage = {
  type: "prompt_suggestion";
  suggestion: string;
  uuid: UUID;
  session_id: string;
};
```
```typescript
class AbortError extends Error {}
```
```typescript
type SandboxSettings = {
  enabled?: boolean;
  failIfUnavailable?: boolean;
  autoAllowBashIfSandboxed?: boolean;
  excludedCommands?: string[];
  allowUnsandboxedCommands?: boolean;
  network?: SandboxNetworkConfig;
  filesystem?: SandboxFilesystemConfig;
  ignoreViolations?: Record<string, string[]>;
  enableWeakerNestedSandbox?: boolean;
  ripgrep?: { command: string; args?: string[] };
};
```
```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Build and test my project",
  options: {
    sandbox: {
      enabled: true,
      autoAllowBashIfSandboxed: true,
      network: {
        allowLocalBinding: true
      }
    }
  }
})) {
  if ("result" in message) console.log(message.result);
}
```
```typescript
type SandboxNetworkConfig = {
  allowedDomains?: string[];
  deniedDomains?: string[];
  allowManagedDomainsOnly?: boolean;
  allowLocalBinding?: boolean;
  allowUnixSockets?: string[];
  allowAllUnixSockets?: boolean;
  httpProxyPort?: number;
  socksProxyPort?: number;
};
```
```typescript
type SandboxFilesystemConfig = {
  allowWrite?: string[];
  denyWrite?: string[];
  denyRead?: string[];
};
```
```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Deploy my application",
  options: {
    sandbox: {
      enabled: true,
      allowUnsandboxedCommands: true // Model can request unsandboxed execution
    },
    permissionMode: "default",
    canUseTool: async (tool, input) => {
      // Check if the model is requesting to bypass the sandbox
      if (tool === "Bash" && input.dangerouslyDisableSandbox) {
        // The model is requesting to run this command outside the sandbox
        console.log(`Unsandboxed command requested: ${input.command}`);

        if (isCommandAuthorized(input.command)) {
          return { behavior: "allow" as const, updatedInput: input };
        }
        return {
          behavior: "deny" as const,
          message: "Command not authorized for unsandboxed execution"
        };
      }
      return { behavior: "allow" as const, updatedInput: input };
    }
  }
})) {
  if ("result" in message) console.log(message.result);
}
```
