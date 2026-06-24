import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle, Shirt, Camera, Package, Search, Scissors, Video,
  Upload, Cpu, SlidersHorizontal, FileText, ArrowRight, Sliders,
} from "lucide-react";
import { AnimatedSection } from "@/components/marketing/animated-section";
import { FAQ } from "@/components/marketing/faq";
import { ClothingSlider } from "@/components/marketing/clothing-slider";

export const metadata: Metadata = {
  title: "Clothing Photography",
  description: "AI-planned clothing photography. Ghost mannequin, on-model, and creative shoots.",
  openGraph: {
    title: "Clothing Photography | iPix — AI-Planned Apparel Content",
    description: "AI-planned clothing photography. Ghost mannequin, on-model, and creative shoots.",
    images: ["/images/clothing-hero.jpg"],
  },
};

const problemPoints = ["Your brand style guide", "Past product performance", "Market trends", "Platform requirements"];
const problemImages = ["clothing-hero", "portfolio-fashion", "portfolio-product", "clothing-studio"];
const contentTypes = [
  { icon: Shirt, title: "Ghost Mannequin", items: ["Front / Back / Side angles", "Detail priority mapping", "Fabric features to highlight", "Conversion-focused angle selection"] },
  { icon: Camera, title: "Clothing Flats", items: ["Hanging vs tabletop planning", "Natural movement vs controlled shape", "Background styling direction", "Crop variations for platforms"] },
  { icon: Package, title: "Apparel Still Life", items: ["Homepage banner compositions", "Collection drop layouts", "Campaign visual concepts", "Social-first compositions"] },
  { icon: Search, title: "Detail Shots", items: ["Buttons, zippers, texture", "Stitching & label close-ups", "Fabric macro planning", "Quality-signaling imagery"] },
  { icon: Scissors, title: "Accessories", items: ["Hero shot planning", "Contextual shot direction", "Detail shot mapping", "Ad variation strategy"] },
  { icon: Video, title: "Short-Form Video", items: ["Model movement direction", "Fit demonstration plans", "Close-up fabric motion", "Hook frame for ads"] },
];
const steps = [
  { icon: Upload, step: "01", title: "Brand Upload", desc: "Upload style guide, past images, target platform, and campaign goal." },
  { icon: Cpu, step: "02", title: "AI Analysis", desc: "System analyzes conversion patterns, benchmarks, saturation levels, and trend signals." },
  { icon: SlidersHorizontal, step: "03", title: "Creative Temperature", desc: "Set risk level from Safe → Balanced → Bold → Trend-Led across styling, color, and pose." },
  { icon: FileText, step: "04", title: "Output Routing", desc: "Receive shot list PDF, platform asset map, creative brief, caption & ad copy." },
];
const flow = ["Brand Upload", "AI Analysis", "Creative Temp", "Output Routing"];
const platformRows = [
  { platform: "Shopify", asset: "PDP Images", output: "Angle map + sequence" },
  { platform: "Amazon", asset: "White background + detail compliance", output: "Variation grid" },
  { platform: "Instagram", asset: "Carousel + Reel plan", output: "Caption hooks" },
  { platform: "Paid Ads", asset: "Static + UGC hybrid", output: "Ad scripts" },
  { platform: "Email", asset: "Banner + detail crop", output: "CTA copy" },
];
const tempAttrs = [
  { label: "Risk Level", desc: "Low → High" },
  { label: "Styling Intensity", desc: "Minimal → Maximal" },
  { label: "Color Contrast", desc: "Neutral → Vibrant" },
  { label: "Pose & Movement", desc: "Static → Dynamic" },
];
const benefits = [
  { title: "Right-First-Time Planning", desc: "Reduce reshoots and wasted budget." },
  { title: "Conversion-Aware", desc: "Every shot mapped to sales impact." },
  { title: "Creative Intelligence", desc: "Trend-aware but brand-safe." },
  { title: "Multi-Channel Ready", desc: "No resizing chaos later." },
  { title: "Faster Production", desc: "Walk into shoot day with clarity." },
  { title: "Reusable Assets", desc: "AI identifies modular content blocks." },
];
const metrics = [
  { metric: "42→18", label: "Shots Optimized" },
  { metric: "6", label: "Ad Variants Generated" },
  { metric: "+28%", label: "PDP Engagement" },
];
const faqs = [
  { q: "How does AI decide what to shoot?", a: "Our AI analyzes your brand guidelines, historical content performance, current market trends, and competitor strategies to generate a data-backed shot list optimized for each clothing type and platform." },
  { q: "Can we control creative direction?", a: "Yes. The Creative Temperature slider lets your team set the level of creative risk — from safe, conversion-proven compositions to bold, trend-setting imagery — across styling, color, pose, and movement." },
  { q: "Do you handle ghost mannequin and flats?", a: "Absolutely. AI plans the optimal approach for each garment — ghost mannequin for structured items, flats for casual wear, and creative layouts for campaign content." },
  { q: "Can you scale to large collections?", a: "We handle high-volume clothing shoots with AI-optimized workflows that maintain consistency across hundreds of SKUs per week." },
  { q: "What platforms do you optimize for?", a: "Shopify, Amazon, Instagram, TikTok, Facebook Ads, Google Shopping, and email campaigns. Each platform receives assets in its optimal format and ratio." },
];

const caption = { color: "var(--mk-text-muted)" } as const;
const surface = { background: "var(--mk-surface)" } as const;
const bg = { background: "var(--mk-bg)" } as const;

export default function ClothingPhotographyPage() {
  return (
    <>
      {/* HERO */}
      <section className="pb-24 pt-32 lg:pb-32 lg:pt-40" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <AnimatedSection>
              <p className="mb-6 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Clothing Photography</p>
              <h1 className="mb-6 text-5xl font-light leading-[1.05] md:text-6xl lg:text-7xl">
                Clothing Content<br />That Sells.<br /><span className="italic">Planned by AI.</span>
              </h1>
              <p className="mb-10 max-w-lg text-base leading-relaxed md:text-lg" style={caption}>
                AI-powered clothing photography planning for fashion brands. Ghost mannequin. Flats. Creative. Ads. Social. All mapped before you shoot.
              </p>
              <div className="mb-8 flex flex-wrap gap-4">
                <Link href="#contact" className="px-8 py-4 text-sm font-medium uppercase tracking-wide text-white" style={{ background: "var(--mk-text)" }}>Plan My Shoot</Link>
                <Link href="#content-types" className="px-8 py-4 text-sm font-medium uppercase tracking-wide" style={{ border: "1px solid var(--mk-text)" }}>View Example Plan</Link>
              </div>
              <p className="text-xs tracking-wide" style={caption}>Creative Temperature: Safe → Bold · Platform Output: Shopify | Amazon | Instagram | Paid Ads</p>
            </AnimatedSection>
            <AnimatedSection className="relative h-[500px] lg:h-[650px]">
              <Image src="/images/clothing-hero.jpg" alt="Premium clothing photography by iPix" fill priority sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* PROBLEM → SOLUTION */}
      <section className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-2">
            <AnimatedSection>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>The Problem</p>
              <h2 className="mb-6 text-4xl font-light md:text-5xl">Stop Guessing<br /><span className="italic">What to Shoot.</span></h2>
              <p className="mb-8 max-w-md text-base leading-relaxed" style={caption}>
                Most brands overshoot, reshoot, or create content that doesn&apos;t convert. ipix analyzes your brand and generates a complete clothing content plan.
              </p>
              <ul className="space-y-3">
                {problemPoints.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm" style={caption}>
                    <CheckCircle size={14} className="shrink-0" style={{ color: "var(--mk-primary)" }} />{item}
                  </li>
                ))}
              </ul>
            </AnimatedSection>
            <div className="grid grid-cols-2 gap-1">
              {problemImages.map((src, i) => (
                <div key={i} className="relative aspect-square overflow-hidden">
                  <Image src={`/images/${src}.jpg`} alt={`Clothing type ${i + 1}`} fill sizes="(max-width:1024px) 50vw, 25vw" className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* IMAGE SLIDER */}
      <ClothingSlider />

      {/* CONTENT TYPES */}
      <section id="content-types" className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-16 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>What We Plan</p>
            <h2 className="text-4xl font-light md:text-5xl">Content Types</h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3" style={{ background: "var(--mk-border)" }}>
            {contentTypes.map((card) => (
              <div key={card.title} className="p-10 lg:p-12" style={surface}>
                <card.icon size={28} strokeWidth={1.2} className="mb-6" style={caption} />
                <h3 className="mb-6 text-2xl font-medium">{card.title}</h3>
                <ul className="space-y-3">
                  {card.items.map((item) => (
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

      {/* AI WORKFLOW */}
      <section className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-16 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>How It Works</p>
            <h2 className="text-4xl font-light md:text-5xl">AI-Powered Workflow</h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 gap-px md:grid-cols-2 lg:grid-cols-4" style={{ background: "var(--mk-border)" }}>
            {steps.map((item) => (
              <div key={item.step} className="p-8 lg:p-10" style={surface}>
                <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-full text-xs font-medium text-white" style={{ background: "var(--mk-text)" }}>{item.step}</div>
                <item.icon size={24} strokeWidth={1.2} className="mb-4" style={caption} />
                <h3 className="mb-2 text-xl font-medium">{item.title}</h3>
                <p className="text-sm leading-relaxed" style={caption}>{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-16 flex flex-wrap items-center justify-center gap-4 text-center">
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

      {/* PLATFORM TABLE */}
      <section className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-16 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Platform-Specific</p>
            <h2 className="text-4xl font-light md:text-5xl">Built for Every Platform</h2>
          </AnimatedSection>
          <div className="mx-auto max-w-4xl overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--mk-border)" }}>
                  <th className="py-4 pr-6 text-left text-xs font-medium uppercase tracking-wide" style={caption}>Platform</th>
                  <th className="py-4 pr-6 text-left text-xs font-medium uppercase tracking-wide" style={caption}>Asset Type</th>
                  <th className="py-4 text-left text-xs font-medium uppercase tracking-wide" style={caption}>AI Output</th>
                </tr>
              </thead>
              <tbody>
                {platformRows.map((row) => (
                  <tr key={row.platform} className="border-b last:border-0" style={{ borderColor: "var(--mk-border)" }}>
                    <td className="py-5 pr-6 text-lg font-medium" style={{ fontFamily: "var(--font-cormorant)" }}>{row.platform}</td>
                    <td className="py-5 pr-6 text-sm" style={caption}>{row.asset}</td>
                    <td className="py-5 text-sm" style={caption}>{row.output}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CREATIVE TEMPERATURE */}
      <section className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mx-auto max-w-3xl text-center">
            <Sliders size={32} strokeWidth={1.2} className="mx-auto mb-6" style={caption} />
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Creative Control</p>
            <h2 className="mb-6 text-4xl font-light md:text-5xl">Creative Temperature</h2>
            <p className="mx-auto mb-12 max-w-xl text-base leading-relaxed" style={caption}>
              Teams adjust creative direction depending on campaign objective — from safe, conversion-proven compositions to bold, trend-setting imagery.
            </p>
            <div className="relative mx-auto mb-8 max-w-lg">
              <div className="relative h-px w-full" style={{ background: "var(--mk-border)" }}>
                <div className="absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full" style={{ background: "var(--mk-text)" }} />
                <div className="absolute left-1/3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full" style={{ background: "var(--mk-text-muted)" }} />
                <div className="absolute left-2/3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full" style={{ background: "var(--mk-text-muted)" }} />
                <div className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full" style={{ background: "var(--mk-text)" }} />
                <div className="absolute left-[45%] top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" style={{ background: "var(--mk-primary)" }} />
              </div>
              <div className="mt-4 flex justify-between">
                {["Safe", "Balanced", "Bold", "Trend-Led"].map((l) => (
                  <span key={l} className="text-xs uppercase tracking-wide" style={caption}>{l}</span>
                ))}
              </div>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
              {tempAttrs.map((item) => (
                <div key={item.label} className="p-4" style={{ border: "1px solid var(--mk-border)" }}>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide">{item.label}</p>
                  <p className="text-xs" style={caption}>{item.desc}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* WHY IPIX */}
      <section className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-16 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Why iPix</p>
            <h2 className="text-4xl font-light md:text-5xl">Measurable Impact</h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3" style={{ background: "var(--mk-border)" }}>
            {benefits.map((b) => (
              <div key={b.title} className="p-8 lg:p-10" style={surface}>
                <h3 className="mb-3 text-lg font-medium">{b.title}</h3>
                <p className="text-sm leading-relaxed" style={caption}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CASE EXAMPLE */}
      <section className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <AnimatedSection className="relative h-[450px]">
              <Image src="/images/clothing-casestudy.jpg" alt="Clothing case study" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
            </AnimatedSection>
            <AnimatedSection>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Case Example</p>
              <h2 className="mb-8 text-4xl font-light">From Idea to Launch<br /><span className="italic">in 7 Days.</span></h2>
              <div className="mb-8 grid grid-cols-3 gap-6">
                {metrics.map((m) => (
                  <div key={m.label}>
                    <p className="text-3xl font-medium" style={{ fontFamily: "var(--font-cormorant)" }}>{m.metric}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide" style={caption}>{m.label}</p>
                  </div>
                ))}
              </div>
              <p className="mb-6 text-sm leading-relaxed" style={caption}>
                42 shots reduced to 18 high-impact images. 6 ad variants auto-generated. +28% PDP engagement increase within the first month.
              </p>
              <Link href="#contact" className="text-sm font-medium uppercase tracking-wide underline underline-offset-4">View Full Case Study →</Link>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Questions</p>
            <h2 className="text-4xl font-light md:text-5xl">FAQ</h2>
          </AnimatedSection>
          <FAQ items={faqs} />
        </div>
      </section>

      {/* FINAL CTA */}
      <section id="contact" className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-4xl font-light md:text-5xl lg:text-6xl">Ready to Plan<br /><span className="italic">Smarter?</span></h2>
            <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed" style={caption}>
              Let AI define what to shoot before you step into a studio. Fewer revisions, faster execution, higher conversion.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/#contact" className="px-10 py-4 text-sm font-medium uppercase tracking-wide text-white" style={{ background: "var(--mk-text)" }}>Start Planning</Link>
              <Link href="/#contact" className="px-10 py-4 text-sm font-medium uppercase tracking-wide" style={{ border: "1px solid var(--mk-text)" }}>Book a Consultation</Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
