"use client";

import { Component, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  CopilotKit,
  CopilotPopup,
  useFrontendTool,
  useConfigureSuggestions,
  ToolCallStatus,
} from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import { z } from "zod";
import {
  hiddenInternalToolsMessageView,
  useHideInternalToolCalls,
} from "@/components/copilot/copilot-tool-presentation";
import { SERVICE_SLUGS } from "@/mastra/types/marketing-lead";

// ponytail: build-time flag — false by default; set NEXT_PUBLIC_MARKETING_CHAT_ENABLED=true to launch
const ENABLED = process.env.NEXT_PUBLIC_MARKETING_CHAT_ENABLED === "true";

// In-memory fallback for Safari private browsing / storage-full conditions.
// Module-scoped so the same UUID is reused for the page session lifetime.
let _memoryAnonId: string | null = null;

function getAnonId(): string {
  const key = "ipix_anon_id";
  try {
    let id = localStorage.getItem(key);
    if (!id) {
      id = `anon-${crypto.randomUUID()}`;
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    if (!_memoryAnonId) _memoryAnonId = `anon-${crypto.randomUUID()}`;
    return _memoryAnonId;
  }
}

const LeadSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  service_interest: z.enum(SERVICE_SLUGS),
  message_summary: z.string(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  website: z.string().optional(),
});

export const QUICK_PROMPTS = [
  { title: "Fashion photography", message: "Tell me about iPix fashion photography services." },
  { title: "Shopify products", message: "What Shopify product photography packages do you offer?" },
  { title: "Instagram content", message: "What Instagram content creation services do you offer?" },
  { title: "Pricing", message: "What are your pricing options?" },
] as const;

function LeadResultView({
  status,
  result,
}: {
  name: string;
  toolCallId: string;
  args: Partial<z.infer<typeof LeadSchema>>;
  status: ToolCallStatus;
  result: unknown;
}) {
  if (status !== ToolCallStatus.Complete) {
    return <p className="px-3 py-2 text-sm text-gray-400">Submitting your inquiry…</p>;
  }
  if (typeof result === "string" && result.startsWith("submitted:")) {
    const draftId = result.replace("submitted:", "");
    return (
      <div
        data-testid={`lead-draft-${draftId}`}
        className="mx-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"
      >
        ✅ Inquiry submitted!{" "}
        <span className="text-xs text-green-600">
          Ref: <code className="font-mono">{draftId}</code>
        </span>
      </div>
    );
  }
  return (
    <p className="px-3 py-2 text-sm text-red-500">
      Submission failed — please{" "}
      <a href="mailto:hello@fashionos.co" className="underline">
        email us
      </a>
      .
    </p>
  );
}

function MarketingChatInner() {
  useHideInternalToolCalls();

  useConfigureSuggestions({
    available: "before-first-message",
    suggestions: QUICK_PROMPTS.map(({ title, message }) => ({ title, message })),
  });

  useFrontendTool<z.infer<typeof LeadSchema>>(
    {
      name: "capture_lead",
      description: "Submit a qualified visitor lead to the iPix team when they are ready to connect",
      parameters: LeadSchema,
      handler: async (args) => {
        const anonId = getAnonId();
        const res = await fetch("/api/marketing-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...args, anon_id: anonId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return `error:${err.error ?? res.status}`;
        }
        const data: { draftId: string; status: string } = await res.json();
        return `submitted:${data.draftId}`;
      },
      render: LeadResultView,
    },
    [],
  );

  return (
    <CopilotPopup
      messageView={hiddenInternalToolsMessageView}
      labels={{
        modalHeaderTitle: "iPix Studio",
        chatInputPlaceholder: "Ask about our photography services…",
        welcomeMessageText:
          "Hi! I'm the iPix assistant. Ask about fashion photography, ecommerce shoots, Shopify, Instagram content, or pricing.",
      }}
      clickOutsideToClose
      // ponytail: onError union type (HTMLElement event + CopilotKit event) — any avoids the intersection noise
      onError={(e: any) => {
        // Gemini high-demand / rate-limit: log only, CopilotKit shows its own retry UI
        const msg = e.error?.message ?? "";
        if (msg.includes("high demand") || msg.includes("429") || msg.includes("overloaded")) {
          console.warn("[marketing-chat] Gemini temporarily busy:", msg);
        }
      }}
    />
  );
}

class ChatErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    if (this.state.error) {
      return (
        <div
          data-testid="chat-error-fallback"
          className="fixed bottom-4 right-4 z-50 max-w-xs rounded-lg border bg-white p-4 shadow-lg text-sm text-gray-600"
        >
          Chat is temporarily unavailable.{" "}
          <a href="mailto:hello@fashionos.co" className="underline text-orange-600">
            Email us
          </a>{" "}
          instead.
        </div>
      );
    }
    return this.props.children;
  }
}

export function MarketingChat() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!ENABLED || !mounted) return null;

  return (
    <ChatErrorBoundary>
      <CopilotKit runtimeUrl="/api/marketing-chat">
        <MarketingChatInner />
      </CopilotKit>
    </ChatErrorBoundary>
  );
}
