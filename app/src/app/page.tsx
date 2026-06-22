"use client";

import { ProverbsCard } from "@/components/proverbs";
import { WeatherCard } from "@/components/weather";
import { MoonCard } from "@/components/moon";
import { AgentState } from "@/lib/types";
import {
  useAgent,
  useConfigureSuggestions,
  useFrontendTool,
  useHumanInTheLoop,
  CopilotSidebar,
  CopilotChatConfigurationProvider,
} from "@copilotkit/react-core/v2";
import { useEffect, useState } from "react";
import { z } from "zod";

import { ThreadsDrawer } from "@/components/threads-drawer";
import { ThreadsPanelGate } from "@/components/threads-drawer/locked-state";
import styles from "@/components/threads-drawer/threads-drawer.module.css";

export default function CopilotKitPage() {
  const [threadId, setThreadId] = useState<string | undefined>(undefined);

  // One CopilotChatConfigurationProvider wraps the ENTIRE page so every hook —
  // including the page-level setThemeColor tool + suggestions below — resolves to
  // the production-planner agent. Without an enclosing provider, those top-level
  // hooks fall back to CopilotKit's default agentId "default", which iPix's Mastra
  // registry doesn't define (keys are production-planner / creative-director),
  // throwing "Agent 'default' not found after runtime sync". It also shares the
  // active threadId so selecting a thread in the drawer drives the same per-thread
  // agent clone.
  return (
    <CopilotChatConfigurationProvider
      agentId="production-planner"
      threadId={threadId}
    >
      <PageBody threadId={threadId} onThreadChange={setThreadId} />
    </CopilotChatConfigurationProvider>
  );
}

function PageBody({
  threadId,
  onThreadChange,
}: {
  threadId: string | undefined;
  onThreadChange: (id: string | undefined) => void;
}) {
  const [themeColor, setThemeColor] = useState("#6366f1");

  // 🪁 Frontend Actions: https://docs.copilotkit.ai/mastra/frontend-actions
  useFrontendTool({
    name: "setThemeColor",
    parameters: z.object({
      themeColor: z
        .string()
        .describe("The theme color to set. Make sure to pick nice colors."),
    }),
    handler: async ({ themeColor }) => {
      setThemeColor(themeColor);
      return `Changing theme color to ${themeColor}`;
    },
  });

  // 🪁 Suggestions: https://docs.copilotkit.ai/mastra/suggestions
  useConfigureSuggestions({
    available: "always",
    suggestions: [
      {
        title: "Generative UI",
        message: "Get the weather in San Francisco.",
      },
      {
        title: "Frontend Tools",
        message: "Set the theme to green.",
      },
      {
        title: "Human In the Loop",
        message: "Please go to the moon.",
      },
      {
        title: "Write Agent State",
        message: "Add a proverb about AI.",
      },
      {
        title: "Update Agent State",
        message:
          "Please remove 1 random proverb from the list if there are any.",
      },
      {
        title: "Read Agent State",
        message: "What are the proverbs?",
      },
    ],
  });

  return (
    <div className={`${styles.layout} threadsLayout`}>
      {/* In-flow threads drawer on the LEFT, themed light in globals.css to
          match the CopilotSidebar chat aesthetic. Now inside the configuration
          provider so it shares the production-planner agent + threadId. */}
      <ThreadsPanelGate>
        <ThreadsDrawer
          agentId="production-planner"
          threadId={threadId}
          onThreadChange={onThreadChange}
        />
      </ThreadsPanelGate>
      <div className={styles.mainPanel}>
        <main
          style={
            {
              "--copilot-kit-primary-color": themeColor,
            } as React.CSSProperties
          }
        >
          <YourMainContent themeColor={themeColor} />
          <CopilotSidebar
            defaultOpen={true}
            labels={{
              modalHeaderTitle: "Popup Assistant",
              welcomeMessageText: "👋 Hi, there! You're chatting with an agent.",
            }}
          />
        </main>
      </div>
    </div>
  );
}

function YourMainContent({ themeColor }: { themeColor: string }) {
  // 🪁 Shared State: https://docs.copilotkit.ai/mastra/shared-state/in-app-agent-read
  // V2: useAgent returns the agent; read agent.state and write via agent.setState.
  const { agent } = useAgent({ agentId: "production-planner" });
  const state = (agent.state as AgentState | undefined) ?? { proverbs: [] };
  const setState = (next: AgentState) => agent.setState(next);

  // Seed an initial proverb once (the V2 agent starts with proverbs:[] by default).
  useEffect(() => {
    if (
      ((agent.state as AgentState | undefined)?.proverbs?.length ?? 0) === 0
    ) {
      agent.setState({
        proverbs: [
          "CopilotKit may be new, but it's the best thing since sliced bread.",
        ],
      });
    }
  }, [agent]);

  //🪁 Generative UI: https://docs.copilotkit.ai/mastra/generative-ui/tool-based
  useFrontendTool(
    {
      name: "weatherTool",
      description: "Get the weather for a given location.",
      available: true,
      parameters: z.object({
        location: z.string(),
      }),
      render: ({ args }) => {
        return <WeatherCard location={args.location} themeColor={themeColor} />;
      },
    },
    [themeColor],
  );

  // 🪁 Human In the Loop: https://docs.copilotkit.ai/mastra/human-in-the-loop
  useHumanInTheLoop(
    {
      name: "go_to_moon",
      description: "Go to the moon on request.",
      render: ({ respond, status }) => {
        return (
          <MoonCard themeColor={themeColor} status={status} respond={respond} />
        );
      },
    },
    [themeColor],
  );

  return (
    <div
      style={{ backgroundColor: themeColor }}
      className="h-screen flex justify-center items-center flex-col transition-colors duration-300"
    >
      <ProverbsCard state={state} setState={setState} />
    </div>
  );
}
