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

import {
  hiddenInternalToolsMessageView,
  useHideInternalToolCalls,
} from "@/components/copilot/copilot-tool-presentation";
import { ThreadsDrawer } from "@/components/threads-drawer";
import { ThreadsPanelGate } from "@/components/threads-drawer/locked-state";
import styles from "@/components/threads-drawer/threads-drawer.module.css";
import { resolveAgentId } from "@/lib/route-agent-map";

// IPI-110 — 3-panel shell: left threads drawer, center workspace (`children`),
// right CopilotSidebar. Agent ID resolves per-route via resolveAgentId (IPI-51).

const SECTIONS = ["brand", "onboarding", "shoots", "assets", "campaigns", "matching"] as const;

export function OperatorPanel({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const agentId = resolveAgentId(pathname);
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  return (
    <CopilotChatConfigurationProvider agentId={agentId} threadId={threadId}>
      <OperatorShell agentId={agentId} threadId={threadId} onThreadChange={setThreadId}>
        {children}
      </OperatorShell>
    </CopilotChatConfigurationProvider>
  );
}

function OperatorShell({
  children,
  agentId,
  threadId,
  onThreadChange,
}: {
  children: React.ReactNode;
  agentId: string;
  threadId: string | undefined;
  onThreadChange: (id: string | undefined) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useHideInternalToolCalls();

  // L1 context: tell the agent which route is active so answers stay relevant.
  useAgentContext({
    description: "The operator's current route in the iPix app (e.g. /brand, /shoots)",
    value: pathname,
  });

  useFrontendTool({
    name: "navigateTo",
    description: "Open an operator workspace section.",
    parameters: z.object({ section: z.enum(SECTIONS) }),
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
          agentId={agentId}
          threadId={threadId}
          onThreadChange={onThreadChange}
        />
      </ThreadsPanelGate>
      <div className={styles.mainPanel}>
        <main>
          {children}
          <CopilotSidebar
            defaultOpen
            messageView={hiddenInternalToolsMessageView}
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
