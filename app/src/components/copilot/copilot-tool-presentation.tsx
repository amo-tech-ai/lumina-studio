"use client";

import type { AssistantMessage, Message, ToolMessage } from "@ag-ui/core";
import {
  CopilotChatMessageView,
  useDefaultRenderTool,
  useRenderToolCall,
} from "@copilotkit/react-core/v2";
import { Fragment, type HTMLAttributes } from "react";

import { isCopilotDebugToolsEnabled } from "@/lib/copilot-debug";
import { shouldHideTool, shouldHideToolCall } from "@/lib/copilot-tool-presentation";

type ToolRenderProps = {
  name: string;
  status: "inProgress" | "executing" | "complete";
};

type ToolCallsViewProps = {
  message: AssistantMessage;
  messages?: Message[];
};

function DebugToolCallCard({
  name,
  status,
}: ToolRenderProps) {
  return (
    <div
      data-testid="copilot-debug-tool-call"
      className="cpk:mx-4 cpk:my-1 cpk:rounded-md cpk:border cpk:border-dashed cpk:border-amber-500/50 cpk:bg-amber-500/5 cpk:px-3 cpk:py-2 cpk:font-mono cpk:text-xs cpk:text-amber-900"
    >
      <span className="cpk:font-semibold">[debug]</span> {name} — {status}
    </div>
  );
}

/** Wildcard renderer: hides internal tool cards in production; optional debug cards in dev. */
export function useHideInternalToolCalls() {
  useDefaultRenderTool({
    render: ({ name, status }: ToolRenderProps) => {
      if (!isCopilotDebugToolsEnabled() && shouldHideTool(name)) {
        return <></>;
      }
      if (isCopilotDebugToolsEnabled()) {
        return <DebugToolCallCard name={name} status={status} />;
      }
      return null;
    },
  });
}

/** Filters internal tool calls from assistant message tool-call rows. */
export function HiddenToolCallsView({ message, messages = [] }: ToolCallsViewProps) {
  const renderToolCall = useRenderToolCall();
  const toolCalls = message.toolCalls ?? [];
  if (toolCalls.length === 0) return null;

  const visible = isCopilotDebugToolsEnabled()
    ? toolCalls
    : toolCalls.filter((tc) => !shouldHideToolCall(tc));

  if (visible.length === 0) return null;

  return (
    <>
      {visible.map((toolCall) => {
        const toolMessage = messages.find(
          (m): m is ToolMessage =>
            m.role === "tool" && m.toolCallId === toolCall.id,
        );
        return (
          <Fragment key={toolCall.id}>
            {renderToolCall({ toolCall, toolMessage })}
          </Fragment>
        );
      })}
    </>
  );
}

/** Subtle thinking state instead of default tool-call pulse cursor. */
export function HiddenToolCallsCursor(props: HTMLAttributes<HTMLDivElement>) {
  if (isCopilotDebugToolsEnabled()) {
    return <CopilotChatMessageView.Cursor {...props} />;
  }

  const { className, ...rest } = props;
  return (
    <div
      {...rest}
      data-testid="copilot-thinking-indicator"
      className={`cpk:flex cpk:items-center cpk:gap-2 cpk:px-4 cpk:py-2 ${className ?? ""}`}
    >
      <span
        aria-hidden
        className="cpk:inline-block cpk:h-2 cpk:w-2 cpk:animate-pulse cpk:rounded-full cpk:bg-muted-foreground/60"
      />
      <span className="cpk:text-sm cpk:text-muted-foreground">Thinking…</span>
    </div>
  );
}

/** Slot overrides for CopilotSidebar / CopilotPopup messageView. */
export const hiddenInternalToolsMessageView = {
  assistantMessage: { toolCallsView: HiddenToolCallsView },
  cursor: HiddenToolCallsCursor,
} as const;
