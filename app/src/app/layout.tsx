import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CopilotKit } from "@copilotkit/react-core/v2";
import { OperatorPanel } from "@/components/operator-panel/operator-panel";
import "./globals.css";
import "@copilotkit/react-core/v2/styles.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lumina Operator — iPix",
  description:
    "AI-powered operator console for iPix fashion-content planning, shoot management, and brand intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/*
        suppressHydrationWarning: browser extensions (e.g. Grammarly) inject
        attributes like data-gr-ext-installed onto <body> before React hydrates,
        which would otherwise surface as a hydration mismatch on first load.
        This only relaxes the check for <body>'s own attributes (one level deep);
        everything rendered inside <body> is still fully hydration-checked.
      */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* Force REST transport so runtime-info + threads both hit the multi-route endpoint (auto-detect races the lazily-compiled API route in next dev). */}
        <CopilotKit runtimeUrl="/api/copilotkit" useSingleEndpoint={false}>
          {/* Reusable operator shell (IPI2-82): left threads · center workspace · right AI panel.
              Wraps every /app route so each gets the context-aware CopilotSidebar. */}
          <OperatorPanel>{children}</OperatorPanel>
        </CopilotKit>
      </body>
    </html>
  );
}
