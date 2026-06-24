import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Brain, BarChart3, TrendingUp, Eye, Sliders, ShoppingBag, Instagram, Layers,
  Video, Building, CheckCircle, ArrowRight,
} from "lucide-react";
import { AnimatedSection } from "@/components/marketing/animated-section";
import { FAQ } from "@/components/marketing/faq";
import { EcommerceExtension } from "@/components/marketing/ecommerce-extension";

export const metadata: Metadata = {
  title: "eCommerce Photography",
  description: "AI-planned eCommerce photography that drives sales. Marketplace-ready assets.",
  openGraph: {
    title: "eCommerce Photography | iPix — AI-Planned Product Imagery",
    description: "AI-planned eCommerce photography that drives sales. Marketplace-ready assets.",
    images: ["/images/ecommerce-hero.jpg"],
  },
};

const strategy = [
  { icon: Eye, title: "Brand Style Analysis", desc: "AI ingests your guidelines, colors, and visual identity for pixel-perfect consistency." },
  { icon: BarChart3, title: "SKU Performance Mapping", desc: "Historical sales and engagement data reveals which products need what type of content." },
  { icon: TrendingUp, title: "Trend Detection", desc: "Real-time market and platform trend data shapes creative direction and styling." },
  { icon: Brain, title: "Competitor Benchmarking", desc: "AI scans competitor listings and ads to identify gaps and visual opportunities." },
];
const flow = ["Brand Data", "AI Engine", "Shot List", "Production", "Platform Optimization"];
const portfolio = ["ecommerce-hero", "portfolio-product", "portfolio-ecommerce", "portfolio-stilllife", "ecommerce-casestudy", "portfolio-product"];
const deliverables = [
  { icon: ShoppingBag, title: "Amazon & PDP", items: ["White background shots", "Detail angle close-ups", "Infographic overlays", "A+ Content imagery"] },
  { icon: Layers, title: "Shopify", items: ["Lifestyle hero images", "Conversion-optimized angles", "Hover variation shots", "Collection banners"] },
  { icon: Instagram, title: "Paid Social", items: ["Hook-driven compositions", "Cropped story formats", "A/B tested variations", "Ad-specific framing"] },
  { icon: Video, title: "Reels & Shorts", items: ["Short-form video cuts", "6–15 second edits", "Product reveal clips", "Unboxing sequences"] },
];
const highVolume = [
  "100+ SKUs per week capacity", "Standardized, repeatable workflows", "Consistency across entire collections",
  "Rapid turnaround on bulk orders", "AI-driven pre-production planning", "Multi-channel asset output",
];
const workflow = [
  { step: "01", title: "AI Strategy Mapping", desc: "Our AI analyzes your brand, SKU data, competitors, and market trends." },
  { step: "02", title: "Shot List Generation", desc: "Platform-specific shot lists with angles, styling, and composition guidance." },
  { step: "03", title: "Production", desc: "In-studio shoots executed by expert product photographers." },
  { step: "04", title: "Post-Production Optimization", desc: "Retouching, background removal, color correction, and format optimization." },
  { step: "05", title: "Platform Delivery", desc: "Assets delivered in platform-specific formats — Amazon, Shopify, social, and ads." },
];
const benefits = [
  { title: "Consistency Across Channels", desc: "Uniform product visuals from PDP to paid media." },
  { title: "Higher Conversion Rates", desc: "AI-optimized imagery proven to lift CTR and sales." },
  { title: "Fewer Revisions", desc: "Get it right the first time with data-backed creative." },
  { title: "Faster Time to Launch", desc: "AI pre-production cuts planning time by 60%." },
];
const metrics = [
  { metric: "+28%", label: "PDP Conversion" },
  { metric: "+35%", label: "Social CTR" },
  { metric: "−30%", label: "Fewer Reshoots" },
  { metric: "2×", label: "Faster Turnaround" },
];
const faqs = [
  { q: "How does AI choose what to shoot?", a: "Our AI analyzes your brand guidelines, historical sales data, current market trends, and competitor strategies to generate a data-backed shot list optimized for each platform and product category." },
  { q: "Can we control creative direction?", a: "Absolutely. The Creative Temperature slider lets your team set the level of creative risk — from safe, conversion-proven packshots to bold, trend-setting product imagery." },
  { q: "Do you scale large SKU volumes?", a: "Yes. We handle 100+ SKUs per week with standardized workflows that maintain consistency across entire collections and product lines." },
  { q: "What platforms do you optimize for?", a: "Amazon, Shopify, Instagram, TikTok, Facebook Ads, Google Shopping, and more. Each platform receives assets in its optimal format, ratio, and specification." },
  { q: "How fast is turnaround?", a: "AI pre-production cuts planning time by 60%. Standard turnaround is 5–7 business days for up to 50 SKUs, with rush options available for time-sensitive launches." },
];

const caption = { color: "var(--mk-text-muted)" } as const;
const surface = { background: "var(--mk-surface)" } as const;
const bg = { background: "var(--mk-bg)" } as const;
const border = { borderColor: "var(--mk-border)" } as const;

export default function EcommercePhotographyPage() {
  return (
    <>
      {/* HERO */}
      <section className="pb-24 pt-32 lg:pb-32 lg:pt-40" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <AnimatedSection>
              <p className="mb-6 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>eCommerce Photography</p>
              <h1 className="mb-6 text-5xl font-light leading-[1.05] md:text-6xl lg:text-7xl">
                Drive Sales with<br />AI-Planned eCommerce<br /><span className="italic">Photography.</span>
              </h1>
              <p className="mb-10 max-w-lg text-base leading-relaxed md:text-lg" style={caption}>
                Content mapped by AI. Produced for performance. Delivered platform-ready for Amazon, Shopify, Instagram &amp; Paid Media.
              </p>
              <div className="mb-8 flex flex-wrap gap-4">
                <Link href="#contact" className="px-8 py-4 text-sm font-medium uppercase tracking-wide text-white" style={{ background: "var(--mk-text)" }}>Plan My Shoot</Link>
                <Link href="#portfolio" className="px-8 py-4 text-sm font-medium uppercase tracking-wide" style={{ border: "1px solid var(--mk-text)" }}>View eCommerce Work</Link>
              </div>
              <p className="text-xs tracking-wide" style={caption}>Amazon, Shopify, Social &amp; Paid Media optimized.</p>
            </AnimatedSection>
            <AnimatedSection className="relative h-[500px] lg:h-[650px]">
              <Image src="/images/ecommerce-hero.jpg" alt="Premium eCommerce product photography flat lay" fill priority sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* AI STRATEGY */}
      <section className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-2">
            <AnimatedSection>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>AI-Driven Strategy</p>
              <h2 className="mb-6 text-4xl font-light md:text-5xl">Before We Shoot,<br /><span className="italic">We Analyze.</span></h2>
              <p className="max-w-md text-base leading-relaxed" style={caption}>
                Our AI maps your brand DNA, SKU performance data, and competitor landscapes to build shot lists that convert — before a single product hits the set.
              </p>
            </AnimatedSection>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {strategy.map((item) => (
                <div key={item.title} className="p-6" style={{ ...surface, border: "1px solid var(--mk-border)" }}>
                  <item.icon size={24} strokeWidth={1.2} className="mb-4" style={caption} />
                  <h3 className="mb-2 text-lg font-medium">{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={caption}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-20 flex flex-wrap items-center justify-center gap-4 text-center">
            {flow.map((step, i) => (
              <div key={step} className="flex items-center gap-4">
                <div className="px-6 py-3" style={{ ...surface, border: "1px solid var(--mk-border)" }}>
                  <span className="text-xs font-medium uppercase tracking-wide">{step}</span>
                </div>
                {i < flow.length - 1 && <ArrowRight size={16} className="hidden sm:block" style={caption} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PORTFOLIO */}
      <section id="portfolio" className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-16 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Selected Work</p>
            <h2 className="text-4xl font-light md:text-5xl">eCommerce Portfolio</h2>
          </AnimatedSection>
          <div className="mb-12 flex flex-wrap justify-center gap-4">
            {["All", "Beauty", "Apparel", "Electronics", "Luxury", "Food", "Lifestyle"].map((f) => (
              <span key={f} className="px-4 py-2 text-xs font-medium uppercase tracking-wide" style={{ ...caption, border: "1px solid var(--mk-border)" }}>{f}</span>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1 lg:grid-cols-3">
            {portfolio.map((src, i) => (
              <div key={i} className="group relative aspect-[4/5] overflow-hidden">
                <Image src={`/images/${src}.jpg`} alt={`eCommerce portfolio ${i + 1}`} fill sizes="(max-width:1024px) 50vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DELIVERABLES (4-col) */}
      <section className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-16 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Platform-Specific</p>
            <h2 className="text-4xl font-light md:text-5xl">Deliverables by Platform</h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ background: "var(--mk-border)" }}>
            {deliverables.map((col) => (
              <div key={col.title} className="p-8 lg:p-10" style={bg}>
                <col.icon size={28} strokeWidth={1.2} className="mb-6" style={caption} />
                <h3 className="mb-6 text-xl font-medium">{col.title}</h3>
                <ul className="space-y-3">
                  {col.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm" style={caption}>
                      <CheckCircle size={14} className="mt-0.5 shrink-0" style={{ color: "var(--mk-primary)" }} />{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CREATIVE TEMPERATURE (static) */}
      <section className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mx-auto max-w-3xl text-center">
            <Sliders size={32} strokeWidth={1.2} className="mx-auto mb-6" style={caption} />
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Creative Control</p>
            <h2 className="mb-6 text-4xl font-light md:text-5xl">Creative Temperature</h2>
            <p className="mx-auto mb-12 max-w-xl text-base leading-relaxed" style={caption}>
              Dial in the exact level of creative risk for every campaign. From safe, conversion-proven packshots to bold, trend-setting product visuals.
            </p>
            <div className="relative mx-auto mb-8 max-w-lg">
              <div className="relative h-px w-full" style={{ background: "var(--mk-border)" }}>
                <div className="absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full" style={{ background: "var(--mk-text)" }} />
                <div className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full" style={{ background: "var(--mk-text)" }} />
                <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" style={{ background: "var(--mk-primary)" }} />
              </div>
              <div className="mt-4 flex justify-between">
                <span className="text-xs uppercase tracking-wide" style={caption}>Conversion-Focused</span>
                <span className="text-xs uppercase tracking-wide" style={caption}>Trend-Driven</span>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* HIGH-VOLUME PRODUCTION */}
      <section className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 overflow-hidden lg:grid-cols-2">
            <div className="relative min-h-[400px]">
              <Image src="/images/ecommerce-studio.jpg" alt="iPix production studio" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
            </div>
            <div className="flex flex-col justify-center p-10 lg:p-16" style={surface}>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Scale</p>
              <h2 className="mb-6 text-3xl font-light md:text-4xl">High-Volume Production<br /><span className="italic">Capability</span></h2>
              <ul className="space-y-4">
                {highVolume.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm" style={caption}>
                    <Building size={14} className="shrink-0" style={{ color: "var(--mk-primary)" }} />{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-16 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>How It Works</p>
            <h2 className="text-4xl font-light md:text-5xl">From Strategy to Delivery</h2>
          </AnimatedSection>
          <div className="mx-auto max-w-2xl">
            {workflow.map((item, i) => (
              <div key={item.step} className={`ml-4 flex gap-8 ${i < workflow.length - 1 ? "border-l pb-12" : ""}`} style={border}>
                <div className="-ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white" style={{ background: "var(--mk-text)" }}>{item.step}</div>
                <div className="pt-1">
                  <h3 className="mb-1 text-xl font-medium">{item.title}</h3>
                  <p className="text-sm" style={caption}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-16 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Why iPix</p>
            <h2 className="text-4xl font-light md:text-5xl">Measurable Impact</h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ background: "var(--mk-border)" }}>
            {benefits.map((b) => (
              <div key={b.title} className="p-8 text-center lg:p-10" style={bg}>
                <h3 className="mb-3 text-lg font-medium">{b.title}</h3>
                <p className="text-sm leading-relaxed" style={caption}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXTENSION (7 sub-sections, interactive) */}
      <EcommerceExtension />

      {/* CASE STUDY */}
      <section className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <AnimatedSection className="relative h-[450px]">
              <Image src="/images/ecommerce-casestudy.jpg" alt="eCommerce case study" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
            </AnimatedSection>
            <AnimatedSection>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Case Study</p>
              <h2 className="mb-8 text-4xl font-light">AI-Driven Results for a Leading eCommerce Brand</h2>
              <div className="mb-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
                {metrics.map((m) => (
                  <div key={m.label}>
                    <p className="text-3xl font-medium" style={{ fontFamily: "var(--font-cormorant)" }}>{m.metric}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide" style={caption}>{m.label}</p>
                  </div>
                ))}
              </div>
              <Link href="#contact" className="text-sm font-medium uppercase tracking-wide underline underline-offset-4">View Full Case Study →</Link>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Questions</p>
            <h2 className="text-4xl font-light md:text-5xl">FAQ</h2>
          </AnimatedSection>
          <FAQ items={faqs} />
        </div>
      </section>

      {/* FINAL CTA */}
      <section id="contact" className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-4xl font-light md:text-5xl lg:text-6xl">
              Ready to Turn Product Content<br /><span className="italic">Into Performance?</span>
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed" style={caption}>
              Tell us about your brand and we&apos;ll craft an AI-driven content strategy — fewer revisions, faster execution, higher conversion.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/#contact" className="px-10 py-4 text-sm font-medium uppercase tracking-wide text-white" style={{ background: "var(--mk-text)" }}>Plan My Shoot</Link>
              <Link href="/#contact" className="px-10 py-4 text-sm font-medium uppercase tracking-wide" style={{ border: "1px solid var(--mk-text)" }}>Book a Consultation</Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
