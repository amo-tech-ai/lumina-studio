"use client";

import dynamic from "next/dynamic";

// IPI-706 · CF-BUNDLE-220 — client-only import boundary for the Worker bundle-size gate.
// MarketingChat pulls in @copilotkit/react-core/v2 (CopilotPopup + message-view
// rendering -> streamdown -> mermaid/cytoscape/katex, ~1.2-1.5 MiB uncompressed) even
// though it's already gated to render nothing until client mount (see the ENABLED/
// mounted check in marketing-chat.tsx). That mount gate only stops it from *rendering*
// during SSR — the module is still statically imported by the server-rendered
// (marketing)/page.tsx, so it still lands in the server bundle. ssr:false excludes the
// import itself from the server compilation. CopilotPopup is a fixed-position floating
// widget (not in document flow), so there is no layout-shift to guard against — no
// `loading` fallback needed.
export const MarketingChat = dynamic(
  () => import("./marketing-chat").then((m) => m.MarketingChat),
  { ssr: false },
);
