"use client";

import {
  useAgentContext,
  useConfigureSuggestions,
  useFrontendTool,
  CopilotSidebar,
  CopilotChatConfigurationProvider,
} from "@copilotkit/react-core/v2";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

import { ThreadsDrawer } from "@/components/threads-drawer";
import { ThreadsPanelGate } from "@/components/threads-drawer/locked-state";
import styles from "@/components/threads-drawer/threads-drawer.module.css";

// IPI2-82 — the reusable operator shell: left threads drawer, center workspace
// (`children`), right CopilotSidebar AI panel. One CopilotChatConfigurationProvider
// scopes every hook to the production-planner agent (so page-level tools/suggestions
// resolve, not the missing "default"). Used by the root layout so EVERY /app route
// gets the AI panel + route context — no per-page wiring.

const AGENT_ID = "production-planner";
const SECTIONS = ["brand", "shoots", "assets", "campaigns", "matching", "onboarding"] as const;

export function OperatorPanel({ children }: { children: React.ReactNode }) {
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  return (
    <CopilotChatConfigurationProvider agentId={AGENT_ID} threadId={threadId}>
      <OperatorShell threadId={threadId} onThreadChange={setThreadId}>
        {children}
      </OperatorShell>
    </CopilotChatConfigurationProvider>
  );
}

function OperatorShell({
  children,
  threadId,
  onThreadChange,
}: {
  children: React.ReactNode;
  threadId: string | undefined;
  onThreadChange: (id: string | undefined) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // L1 context (v2 useAgentContext): tell the agent which operator route is
  // active so answers are relevant to the current workspace. Streamed, not polled.
  useAgentContext({
    description: "The operator's current route in the iPix app (e.g. /brand, /shoots)",
    value: pathname,
  });

  // 🪁 Frontend tool: let the agent open an operator workspace.
  useFrontendTool({
    name: "navigateTo",
    description: "Open an operator workspace section.",
    parameters: z.object({ section: z.enum(SECTIONS) }),
    // async required: useFrontendTool's handler signature returns Promise<unknown>.
    handler: async ({ section }) => {
      router.push(`/app/${section}`);
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
      <ThreadsPanelGate>
        <ThreadsDrawer
          agentId={AGENT_ID}
          threadId={threadId}
          onThreadChange={onThreadChange}
        />
      </ThreadsPanelGate>
      <div className={styles.mainPanel}>
        <main>
          {children}
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
