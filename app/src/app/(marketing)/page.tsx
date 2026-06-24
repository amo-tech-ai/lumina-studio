import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { HeroSection } from "@/components/marketing/hero-section";
import { ServicesSection } from "@/components/marketing/services-section";
import { PortfolioSection } from "@/components/marketing/portfolio-section";
import { ProcessSection } from "@/components/marketing/process-section";
import { ClientsSection } from "@/components/marketing/clients-section";
import { CTASection } from "@/components/marketing/cta-section";

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
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ServicesSection />
      <PortfolioSection />
      <ProcessSection />
      <ClientsSection />
      <CTASection />
    </>
  );
}
