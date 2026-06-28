"use client";

// IPI-110 — 3-panel shell: left NavSidebar (collapsed) · center workspace · right CopilotSidebar chatbot.
// IPI-218 — ActiveBrandContext wired: brand switcher in left nav, useAgentContext exposes activeBrandId
//           so agents never ask "which brand?". BrandContextPanel lives inside right slot (IPI-242+).

import {
  useAgentContext,
  useConfigureSuggestions,
  useFrontendTool,
  CopilotSidebar,
  CopilotChatConfigurationProvider,
} from "@copilotkit/react-core/v2";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

import {
  hiddenInternalToolsMessageView,
  useHideInternalToolCalls,
} from "@/components/copilot/copilot-tool-presentation";
import { ThreadsDrawer } from "@/components/threads-drawer";
import { ThreadsPanelGate } from "@/components/threads-drawer/locked-state";
import { ActiveBrandProvider, useActiveBrand } from "@/context/active-brand-context";
import { NavSidebar } from "./nav-sidebar";
import styles from "./operator-shell.module.css";
import { resolveAgentId } from "@/lib/route-agent-map";

const SECTIONS = ["brand", "onboarding", "shoots", "assets", "campaigns", "matching", "preview"] as const;

interface Brand { id: string; name: string; status: string; }

export function OperatorPanel({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const agentId = resolveAgentId(pathname);
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  useEffect(() => { setThreadId(undefined); }, [agentId]);
  return (
    <ActiveBrandProvider>
      <CopilotChatConfigurationProvider agentId={agentId} threadId={threadId}>
        <div data-agent-id={agentId} style={{ display: "contents" }}>
          <OperatorShell agentId={agentId} threadId={threadId} onThreadChange={setThreadId}>
            {children}
          </OperatorShell>
        </div>
      </CopilotChatConfigurationProvider>
    </ActiveBrandProvider>
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
  const { activeBrandId, setActiveBrandId } = useActiveBrand();
  const [brands, setBrands] = useState<Brand[]>([]);
  const brandsRef = useRef<Brand[]>([]);
  useEffect(() => { brandsRef.current = brands; }, [brands]);

  // Fetch brand list once on mount for the left panel switcher
  useEffect(() => {
    fetch("/api/brands")
      .then((r) => {
        if (!r.ok) {
          console.error(`[brands] fetch failed: ${r.status}`);
          return;
        }
        return (r.json() as Promise<Brand[]>).then(setBrands);
      })
      .catch((err) => console.error("[brands] fetch error:", err));
  }, []);

  useHideInternalToolCalls();

  // Expose current route to agents
  useAgentContext({
    description: "The operator's current route in the iPix app (e.g. /app/brand, /app/shoots)",
    value: pathname,
  });

  // Expose active brand to agents so they never ask "which brand?"
  useAgentContext({
    description: "The brand the operator is currently working on (UUID, or null if none selected)",
    value: activeBrandId,
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

  useFrontendTool({
    name: "setActiveBrand",
    description: "Set the active brand context so the right panel shows that brand's profile and DNA scores.",
    parameters: z.object({ brandId: z.string().uuid() }),
    handler: async ({ brandId }) => {
      if (!brandsRef.current.some((b) => b.id === brandId)) {
        return `Brand ${brandId} is not accessible.`;
      }
      setActiveBrandId(brandId);
      return `Active brand set to ${brandId}.`;
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
      {/* Left nav rail — brand switcher + section nav */}
      <NavSidebar
        onThreadsClick={() => setThreadsOpen((v) => !v)}
        brands={brands}
        activeBrandId={activeBrandId}
        onBrandSelect={setActiveBrandId}
      />

      {/* Center — page content */}
      <main className={styles.content}>
        {children}
      </main>

      {/* Right — AI chatbot panel (IntelligencePanel content to be added inside here, IPI-242+) */}
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
