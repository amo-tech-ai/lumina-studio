"use client";

// IPI-110 — 3-panel shell: left NavSidebar (collapsed) · center workspace · right CopilotSidebar chatbot.
// ThreadsDrawer surfaces via NavSidebar "Threads" button as a side sheet.

import {
  useAgentContext,
  useConfigureSuggestions,
  useFrontendTool,
  CopilotSidebar,
  CopilotChatConfigurationProvider,
} from "@copilotkit/react-core/v2";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";

import {
  hiddenInternalToolsMessageView,
  useHideInternalToolCalls,
} from "@/components/copilot/copilot-tool-presentation";
import { ThreadsDrawer } from "@/components/threads-drawer";
import { ThreadsPanelGate } from "@/components/threads-drawer/locked-state";
import { NavSidebar } from "./nav-sidebar";
import styles from "./operator-shell.module.css";
import { resolveAgentId } from "@/lib/route-agent-map";

const SECTIONS = ["brand", "onboarding", "shoots", "assets", "campaigns", "matching", "preview"] as const;

export function OperatorPanel({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const agentId = resolveAgentId(pathname);
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  useEffect(() => { setThreadId(undefined); }, [agentId]);
  return (
    <CopilotChatConfigurationProvider agentId={agentId} threadId={threadId}>
      <div data-agent-id={agentId} style={{ display: "contents" }}>
        <OperatorShell agentId={agentId} threadId={threadId} onThreadChange={setThreadId}>
          {children}
        </OperatorShell>
      </div>
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
  const [threadsOpen, setThreadsOpen] = useState(false);

  useHideInternalToolCalls();

  useAgentContext({
    description: "The operator's current route in the iPix app (e.g. /app/brand, /app/shoots)",
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
      { title: "Brands",       message: "Open the Brands workspace." },
      { title: "Plan a shoot", message: "Open Shoots and help me plan a shoot." },
      { title: "Assets",       message: "Open Assets to review DNA compliance." },
      { title: "Campaigns",    message: "Open Campaigns." },
      { title: "Matching",     message: "Open Matching." },
    ],
  });

  return (
    <div className={styles.shell}>
      {/* Left nav rail — collapsed by default */}
      <NavSidebar onThreadsClick={() => setThreadsOpen((v) => !v)} />

      {/* Center — page content */}
      <main className={styles.content}>
        {children}
      </main>

      {/* Right — AI chatbot panel */}
      <div className={styles.chatPanel}>
        <CopilotSidebar
          defaultOpen
          messageView={hiddenInternalToolsMessageView}
          labels={{
            modalHeaderTitle: "iPix Assistant",
            welcomeMessageText:
              "👋 Ask about brands, shoots, assets, campaigns, or matching.",
          }}
        />
      </div>

      {/* Threads side-sheet — toggled from NavSidebar */}
      {threadsOpen && (
        <div className={styles.threadsOverlay} onClick={() => setThreadsOpen(false)}>
          <div className={styles.threadsSheet} onClick={(e) => e.stopPropagation()}>
            <ThreadsPanelGate>
              <ThreadsDrawer
                agentId={agentId}
                threadId={threadId}
                onThreadChange={(id) => { onThreadChange(id); setThreadsOpen(false); }}
              />
            </ThreadsPanelGate>
          </div>
        </div>
      )}
    </div>
  );
}
