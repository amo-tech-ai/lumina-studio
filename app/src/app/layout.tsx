import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond, Outfit } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// Operator UI font stack (CopilotKit/threads use Geist).
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// iPix marketing brand fonts — scoped to `.marketing` (see (marketing)/marketing.css).
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "iPix — AI-Powered Content Studio", template: "%s | iPix" },
  description:
    "AI-powered platform that plans photoshoots, generates shot lists, and creates on-brand content for fashion and DTC brands.",
};

// Root layout: html/body/fonts/metadata ONLY. No CopilotKit / OperatorPanel here —
// those are scoped to the (operator) group so marketing pages never load agent UI.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/*
        suppressHydrationWarning: browser extensions (e.g. Grammarly) inject
        attributes onto <body> before React hydrates; this relaxes the check for
        <body>'s own attributes only — children are still fully hydration-checked.
      */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} ${outfit.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
