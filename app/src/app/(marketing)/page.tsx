import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { HeroSection } from "@/components/marketing/hero-section";
import { ServicesSection } from "@/components/marketing/services-section";
import { PortfolioSection } from "@/components/marketing/portfolio-section";
import { ProcessSection } from "@/components/marketing/process-section";
import { ClientsSection } from "@/components/marketing/clients-section";
import { CTASection } from "@/components/marketing/cta-section";
import MarketingChat from "@/components/marketing/marketing-chat-lazy";

export const metadata: Metadata = {
  title: { absolute: "iPix — AI-Powered Content Studio for Fashion Brands" },
  description:
    "AI-powered platform that plans photoshoots, generates shot lists, and creates on-brand content.",
  openGraph: {
    title: "iPix — AI-Powered Content Studio for Fashion Brands",
    description:
      "AI-powered platform that plans photoshoots, generates shot lists, and creates on-brand content.",
    url: SITE_URL,
    images: ["/images/hero-product.jpg"],
  },
};

// WEB-002 — Home page: 6 sections (parity with Vite Index.tsx composition).
// WEB-015.5 — MarketingChat mounts as a client island (feature-flag gated, no SSR).
// IPI-706 · CF-BUNDLE-220 — imported via marketing-chat-lazy (next/dynamic ssr:false)
// to remove MarketingChat's direct contribution from the Worker's server bundle.
// Note: this does NOT remove streamdown/mermaid/katex/cytoscape entirely — the shared
// @copilotkit/react-core/v2 vendor chunk still retains them via always-mounted
// CopilotKit hooks elsewhere in the app (see PR #624 metafile evidence).
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ServicesSection />
      <PortfolioSection />
      <ProcessSection />
      <ClientsSection />
      <CTASection />
      <MarketingChat />
    </>
  );
}
