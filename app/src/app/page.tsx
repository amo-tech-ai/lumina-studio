"use client";

import {
  useConfigureSuggestions,
  useFrontendTool,
  CopilotSidebar,
  CopilotChatConfigurationProvider,
} from "@copilotkit/react-core/v2";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

import { CommandCenter } from "@/components/command-center/command-center";
import { ThreadsDrawer } from "@/components/threads-drawer";
import { ThreadsPanelGate } from "@/components/threads-drawer/locked-state";
import styles from "@/components/threads-drawer/threads-drawer.module.css";

export default function CopilotKitPage() {
  const [threadId, setThreadId] = useState<string | undefined>(undefined);

  // One CopilotChatConfigurationProvider wraps the whole page so every hook
  // (incl. the page-level navigateTo tool + suggestions) resolves to the
  // production-planner agent. Without it those hooks fall back to CopilotKit's
  // default agentId "default" → "Agent 'default' not found after runtime sync".
  // It also shares the active threadId with the drawer.
  return (
    <CopilotChatConfigurationProvider
      agentId="production-planner"
      threadId={threadId}
    >
      <PageBody threadId={threadId} onThreadChange={setThreadId} />
    </CopilotChatConfigurationProvider>
  );
}

const SECTIONS = ["brand", "shoots", "assets", "campaigns", "matching"] as const;

function PageBody({
  threadId,
  onThreadChange,
}: {
  threadId: string | undefined;
  onThreadChange: (id: string | undefined) => void;
}) {
  const router = useRouter();

  // 🪁 Frontend tool: let the agent open an operator workspace (v2 useFrontendTool).
  useFrontendTool({
    name: "navigateTo",
    description: "Open an operator workspace section.",
    parameters: z.object({ section: z.enum(SECTIONS) }),
    // async required: useFrontendTool's handler signature returns Promise<unknown>.
    handler: async ({ section }) => {
      router.push(`/${section === "brand" ? "brand" : section}`);
      return `Opening ${section}.`;
    },
  });

  useConfigureSuggestions({
    available: "always",
    suggestions: [
      { title: "Brands", message: "Open the Brands workspace." },
      { title: "Plan a shoot", message: "Open Shoots and help me plan a shoot." },
      { title: "Assets", message: "Open Assets to review DNA compliance." },
      { title: "Campaigns", message: "Open Campaigns." },
      { title: "Matching", message: "Open Matching." },
    ],
  });

  return (
    <div className={`${styles.layout} threadsLayout`}>
      {/* In-flow threads drawer on the LEFT; inside the configuration provider so
          it shares the production-planner agent + threadId. */}
      <ThreadsPanelGate>
        <ThreadsDrawer
          agentId="production-planner"
          threadId={threadId}
          onThreadChange={onThreadChange}
        />
      </ThreadsPanelGate>
      <div className={styles.mainPanel}>
        <main>
          <CommandCenter />
          <CopilotSidebar
            defaultOpen
            labels={{
              modalHeaderTitle: "iPix Assistant",
              welcomeMessageText:
                "👋 Operator hub — ask about brands, shoots, assets, campaigns, or matching.",
            }}
          />
        </main>
      </div>
    </div>
  );
}
