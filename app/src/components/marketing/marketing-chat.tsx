"use client";

import { Component, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  CopilotKit,
  CopilotPopup,
  useFrontendTool,
  useConfigureSuggestions,
} from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import { z } from "zod";
import {
  getAnonId,
  LeadResultView,
  LeadSchema,
  submitMarketingLead,
} from "./marketing-chat-lead";

// ponytail: build-time flag — false by default; set NEXT_PUBLIC_MARKETING_CHAT_ENABLED=true to launch
const ENABLED = process.env.NEXT_PUBLIC_MARKETING_CHAT_ENABLED === "true";

export const QUICK_PROMPTS = [
  { title: "Fashion photography", message: "Tell me about iPix fashion photography services." },
  { title: "Shopify products", message: "What Shopify product photography packages do you offer?" },
  { title: "Instagram content", message: "What Instagram content creation services do you offer?" },
  { title: "Pricing", message: "What are your pricing options?" },
] as const;

function MarketingChatInner() {
  useConfigureSuggestions({
    available: "before-first-message",
    suggestions: QUICK_PROMPTS.map(({ title, message }) => ({ title, message })),
  });

  useFrontendTool<z.infer<typeof LeadSchema>>(
    {
      name: "capture_lead",
      description: "Submit a qualified visitor lead to the iPix team when they are ready to connect",
      parameters: LeadSchema,
      handler: async (args) => submitMarketingLead(args, getAnonId()),
      render: LeadResultView,
    },
    [],
  );

  return (
    <CopilotPopup
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
