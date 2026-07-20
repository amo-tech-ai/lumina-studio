"use client";

// IPI-110 — 3-panel shell: left NavSidebar (collapsed) · center workspace · right IntelligencePanel.
// IPI-218 — ActiveBrandContext wired: brand switcher in left nav, useAgentContext exposes activeBrandId
//           so agents never ask "which brand?". IPI-243 — IntelligencePanel briefing (no chat in right column).
// IPI-197 — Contextual copilot dock: dynamic welcome + route-specific suggestion chips in center column.

import {
  useAgentContext,
  useConfigureSuggestions,
  useFrontendTool,
  CopilotChatConfigurationProvider,
} from "@copilotkit/react-core/v2";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { useHideInternalToolCalls } from "@/components/copilot/copilot-tool-presentation";
import { IntelligencePanel } from "@/components/intelligence-panel";
import { ThreadsDrawer } from "@/components/threads-drawer";
import { ThreadsPanelGate } from "@/components/threads-drawer/locked-state";
import { useActiveBrand } from "@/context/active-brand-context";
import { useHeroBrandSync } from "@/lib/active-brand/use-hero-brand-sync";
import { DEV_PREVIEW_HERO_BRAND_ID, isDevPreviewBrandId, isDevSkipMode } from "./dev-skip-fixture";
import { IntelligenceDetailProvider } from "@/context/intelligence-detail-context";
import { NavSidebar } from "./nav-sidebar";
import { OperatorChatDock } from "./operator-chat-dock";
import { MobileSignOutBar } from "./mobile-sign-out-bar";
import { useOperatorBrands } from "./use-operator-brands";
import { useUnreadNotifications } from "./use-unread-notifications";
import styles from "./operator-shell.module.css";
import { resolveAgentId } from "@/lib/route-agent-map";
import { routeBrandId, routeShootId } from "@/lib/intelligence/normalize-route-path";
import { useRouteWelcome } from "@/lib/intelligence/use-route-welcome";
import { useRouteSuggestions } from "@/lib/intelligence/use-route-suggestions";

const SECTIONS = ["brand", "onboarding", "shoots", "assets", "campaigns", "matching", "preview", "crm"] as const;

const CRM_PAGES = ["companies", "contacts", "pipeline"] as const;

export function OperatorPanel({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const agentId = resolveAgentId(pathname);
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  useEffect(() => { setThreadId(undefined); }, [agentId]);
  return (
    <IntelligenceDetailProvider>
      <CopilotChatConfigurationProvider agentId={agentId} threadId={threadId}>
        <div data-agent-id={agentId} style={{ display: "contents" }}>
          <Suspense fallback={<OperatorShellFallback agentId={agentId} />}>
            <OperatorShell agentId={agentId} threadId={threadId} onThreadChange={setThreadId}>
              {children}
            </OperatorShell>
          </Suspense>
        </div>
      </CopilotChatConfigurationProvider>
    </IntelligenceDetailProvider>
  );
}

function OperatorShellFallback({ agentId }: { agentId: string }) {
  return (
    <div className={styles.shell} data-agent-id={agentId} aria-busy="true" aria-label="Loading operator workspace">
      <div aria-hidden className={styles.fallbackNav} />
      <main className={styles.content}>
        <div className={styles.contentScroll} />
      </main>
      <div aria-hidden className={styles.intelligencePanel} />
    </div>
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
  const searchParams = useSearchParams();
  const skip = searchParams.get("skip");
  const signoutError = searchParams.get("signoutError");
  const devSkip = isDevSkipMode(skip);
  const [threadsOpen, setThreadsOpen] = useState(false);

  // IPI-725 — /auth/signout redirects here on failure; surface it (do not land on /login).
  useEffect(() => {
    if (signoutError !== "1") return;
    toast.error("Sign out failed. Your session may still be active — try again.");
    const next = new URLSearchParams(searchParams.toString());
    next.delete("signoutError");
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  }, [signoutError, searchParams, pathname, router]);
  const { activeBrandId, setActiveBrandId } = useActiveBrand();
  const { brands, brandsRef, brandsLoadingRef } = useOperatorBrands(devSkip);
  const unreadNotifications = useUnreadNotifications();

  useHeroBrandSync();

  // Dev layout QA — align active brand with fixture; clear fixture IDs when leaving skip mode
  useEffect(() => {
    if (devSkip) {
      if (activeBrandId !== DEV_PREVIEW_HERO_BRAND_ID) {
        setActiveBrandId(DEV_PREVIEW_HERO_BRAND_ID);
      }
      return;
    }
    if (activeBrandId && isDevPreviewBrandId(activeBrandId)) {
      setActiveBrandId(null);
    }
  }, [devSkip, activeBrandId, setActiveBrandId]);

  useHideInternalToolCalls();

  const routeBrandIdFromPath = useMemo(() => routeBrandId(pathname), [pathname]);
  const routeShootIdFromPath = useMemo(() => routeShootId(pathname), [pathname]);
  const routeBrandName = useMemo(
    () => brands.find((b) => b.id === routeBrandIdFromPath)?.name,
    [brands, routeBrandIdFromPath],
  );

  // Keep active brand aligned with brand detail URLs
  useEffect(() => {
    if (routeBrandIdFromPath && routeBrandIdFromPath !== activeBrandId) {
      setActiveBrandId(routeBrandIdFromPath);
    }
  }, [routeBrandIdFromPath, activeBrandId, setActiveBrandId]);

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
      router.push(section === "crm" ? "/app/crm/companies" : `/app/${section}`);
      return `Opening ${section}.`;
    },
  });

  useFrontendTool({
    name: "navigateToCrm",
    description: "Open a CRM list or record detail page in the Relationship Hub.",
    parameters: z.object({
      page: z.enum(CRM_PAGES),
      recordId: z.string().uuid().optional(),
    }),
    handler: async ({ page, recordId }) => {
      const path = recordId ? `/app/crm/${page}/${recordId}` : `/app/crm/${page}`;
      router.push(path);
      return recordId ? `Opening CRM ${page} record ${recordId}.` : `Opening CRM ${page}.`;
    },
  });

  useFrontendTool({
    name: "setActiveBrand",
    description: "Set the active brand context. Agents and the IntelligencePanel use the selected brand ID.",
    parameters: z.object({ brandId: z.string().uuid() }),
    handler: async ({ brandId }) => {
      if (brandsLoadingRef.current) {
        return "Brand list is still loading — please retry in a moment.";
      }
      if (brandsRef.current.length === 0) {
        return "No brands in your organization yet — create one in Brand Hub first.";
      }
      if (!brandsRef.current.some((b) => b.id === brandId)) {
        return `Brand ${brandId} is not accessible.`;
      }
      setActiveBrandId(brandId);
      return `Active brand set to ${brandId}.`;
    },
  });

  // IPI-197 — Dynamic welcome message based on route + context
  const welcomeText = useRouteWelcome({
    pathname,
    brandId: routeBrandIdFromPath ?? activeBrandId,
    context: {
      brandName: routeBrandName,
      brandCount: brands.length,
      hasBrands: brands.length > 0,
    },
  });

  // IPI-197 — Dynamic suggestion chips based on route + context
  const suggestions = useRouteSuggestions({
    pathname,
    context: {
      hasBrands: brands.length > 0,
      brandLoaded: Boolean(routeBrandIdFromPath),
      shootLoaded: Boolean(routeShootIdFromPath),
    },
  });

  useConfigureSuggestions({
    available: "always",
    suggestions,
  });

  const activeBrandName =
    brands.find((b) => b.id === activeBrandId)?.name ?? (devSkip ? "Nike" : null);

  return (
    <div className={styles.shell}>
      {/* Left nav rail — brand switcher + section nav */}
      <NavSidebar
        onThreadsClick={() => setThreadsOpen((v) => !v)}
        brands={brands}
        activeBrandId={activeBrandId}
        onBrandSelect={setActiveBrandId}
        unreadNotifications={unreadNotifications}
      />

      {/* Center — page content + bottom chat dock (DC PersistentChatDock) */}
      <main className={styles.content}>
        {/* IPI-725 — nav rail is display:none below 768px; keep Sign out reachable */}
        <MobileSignOutBar />
        <div className={styles.contentScroll}>{children}</div>
        <OperatorChatDock welcomeText={welcomeText} />
      </main>

      {/* Right — IntelligencePanel only (320px) — no CopilotSidebar */}
      <div className={styles.intelligencePanel}>
        <IntelligencePanel
          activeBrandId={activeBrandId}
          brandName={activeBrandName}
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
