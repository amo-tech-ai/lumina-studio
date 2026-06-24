import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, CheckCircle, Camera, BarChart3, Layers, Target, Zap, ShieldCheck,
  Image as ImageIcon, Layout, Eye, Package, Grid3X3, TrendingUp,
} from "lucide-react";
import { AnimatedSection } from "@/components/marketing/animated-section";
import { FAQ } from "@/components/marketing/faq";

export const metadata: Metadata = {
  title: "Amazon Photography",
  description: "Amazon photography and listing optimization. AI-planned product images.",
  openGraph: {
    title: "Amazon Photography | iPix — AI-Planned Listing Images",
    description: "Amazon photography and listing optimization. AI-planned product images.",
    images: ["/images/amazon-hero.jpg"],
  },
};

const trust = ["Amazon Compliant", "A9-Aware Strategy", "Infographic Planning", "Multi-Variation Ready"];
const problems = ["Poor image sequencing.", "No keyword visual alignment.", "Weak infographics.", "No variation strategy."];
const plan = [
  { icon: ImageIcon, title: "Main Hero Image", items: ["White background compliance", "Proper cropping ratio", "Shadow consistency", "Category-optimized framing"] },
  { icon: Layout, title: "Infographic Images", items: ["Feature breakdown", "Problem → solution visuals", "Measurement callouts", "Icon-based highlights"] },
  { icon: Eye, title: "Lifestyle Images", items: ["Context placement", "Emotional positioning", "Demographic targeting", "Use-case sequencing"] },
  { icon: Camera, title: "Detail Shots", items: ["Texture clarity", "Material proof", "Scale reinforcement", "Competitive comparison"] },
  { icon: Layers, title: "A+ Content Mapping", items: ["Brand story flow", "Modular layout plan", "Cross-sell strategy", "Comparison charts"] },
  { icon: Grid3X3, title: "Variation Strategy", items: ["Color clustering", "Bundle logic", "Multi-pack visual hierarchy", "Parent-child optimization"] },
];
const steps = [
  { num: "01", title: "Product Upload", desc: "Upload product details, category, competitor ASINs, and target keywords." },
  { num: "02", title: "Competitive Scan", desc: "AI analyzes top 10 ranking listings, image sequencing patterns, infographic density, and emotional positioning." },
  { num: "03", title: "Conversion Modeling", desc: "System determines ideal image order, feature emphasis weight, trust badge placement, and risk reversal visuals." },
  { num: "04", title: "Output Routing", desc: "You receive a complete Amazon image shot list, infographic script, A+ layout map, creative brief, and variation grid strategy." },
];
const tableRows = [
  ["Image 1", "Click trigger", "White hero framing map"],
  ["Image 2", "Core benefit", "Feature overlay script"],
  ["Image 3", "Lifestyle", "Context placement brief"],
  ["Image 4", "Proof", "Detail macro plan"],
  ["Image 5", "Comparison", "Chart layout draft"],
  ["A+ Content", "Brand story", "Modular content map"],
];
const advantages = [
  { icon: Target, title: "A9-Aware Visual Strategy", desc: "Images aligned with ranking signals." },
  { icon: BarChart3, title: "Data-Backed Structure", desc: "Not creative guesswork." },
  { icon: Camera, title: "Reduced Reshoots", desc: "Plan once. Shoot with clarity." },
  { icon: Zap, title: "Faster Listing Launch", desc: "No revision chaos." },
  { icon: TrendingUp, title: "Competitive Positioning", desc: "Your images outperform category norms." },
  { icon: Package, title: "Multi-Channel Adaptable", desc: "Repurpose for Shopify, ads, email." },
];
const metrics = [
  { value: "+18%", label: "Click-Through Rate" },
  { value: "+22%", label: "Conversion Rate" },
  { value: "12 → 7", label: "Optimized Images" },
  { value: "+3", label: "Infographic Frames" },
];
const compliance = ["85% Frame Fill", "RGB Color Space", "2000px Minimum", "Pure White Background", "No Watermarks", "Pre-Validated"];
const faqs = [
  { q: "How does AI choose shots for Amazon?", a: "Our AI analyzes top-performing listings in your category, identifies image sequencing patterns, infographic density, and emotional positioning to generate a data-backed shot list optimized for A9 ranking." },
  { q: "Can we control creative direction?", a: "Absolutely. Our Creative Temperature control lets you adjust from conversion-safe to trend-driven. You approve every shot list before production begins." },
  { q: "Do you handle large SKU volumes?", a: "Yes. Our AI-driven workflows are built for scale — we routinely plan and produce content for 100+ SKUs per week with consistent quality." },
  { q: "What platforms do you optimize for?", a: "While this page focuses on Amazon, every plan can be extended to Shopify, social media, paid ads, and email — all from the same production session." },
  { q: "How fast is turnaround?", a: "AI planning is generated within 24 hours. Full production and delivery typically completes within 5–7 business days depending on volume." },
];

const caption = { color: "var(--mk-text-muted)" } as const;
const surface = { background: "var(--mk-surface)" } as const;
const bg = { background: "var(--mk-bg)" } as const;
const ink = { background: "var(--mk-text)" } as const;

export default function AmazonPhotographyPage() {
  return (
    <>
      {/* HERO (unique #F4F3F1 bg) */}
      <section className="relative flex min-h-screen items-center pt-20" style={{ backgroundColor: "#F4F3F1" }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <AnimatedSection className="max-w-xl">
              <p className="mb-6 text-sm font-medium uppercase tracking-[0.2em]" style={caption}>Amazon Content Intelligence</p>
              <h1 className="mb-8 text-5xl font-light leading-[1.05] md:text-6xl lg:text-7xl">
                Amazon Images That Rank.<br />Convert. <span className="italic">Win the Buy Box.</span>
              </h1>
              <p className="mb-10 max-w-prose text-base leading-relaxed md:text-lg" style={caption}>
                AI-powered Amazon content planning built around A9 ranking logic, category benchmarks, and conversion psychology.
              </p>
              <div className="mb-10 flex flex-col gap-4 sm:flex-row">
                <Link href="#contact" className="px-8 py-4 text-center text-sm font-medium uppercase tracking-wide text-white" style={ink}>Plan My Amazon Content</Link>
                <Link href="#case-study" className="px-8 py-4 text-center text-sm font-medium uppercase tracking-wide" style={{ border: "1px solid var(--mk-text)" }}>See Example Output</Link>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {trust.map((t) => (
                  <span key={t} className="flex items-center gap-2 text-xs tracking-wide" style={caption}>
                    <CheckCircle className="h-4 w-4" style={{ color: "var(--mk-primary)" }} /> {t}
                  </span>
                ))}
              </div>
            </AnimatedSection>
            <AnimatedSection className="relative h-[500px] lg:h-[600px]">
              <Image src="/images/amazon-hero.jpg" alt="Amazon product photography showcase" fill priority sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <AnimatedSection>
              <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]" style={caption}>The Problem</p>
              <h2 className="text-4xl font-light md:text-5xl">Most Amazon Listings<br /><span className="italic">Fail Before They Launch.</span></h2>
            </AnimatedSection>
            <div className="space-y-6">
              {problems.map((p) => (
                <p key={p} className="border-l-2 pl-6 text-base leading-relaxed" style={{ ...caption, borderColor: "var(--mk-border)" }}>{p}</p>
              ))}
              <div className="border-t pt-4" style={{ borderColor: "var(--mk-border)" }}>
                <p className="text-base font-medium leading-relaxed">Amazon is not just photography.<br />It&apos;s structured persuasion.</p>
                <p className="mt-3 text-sm" style={caption}>ipix maps every asset before production.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT WE PLAN */}
      <section className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-20 max-w-2xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]" style={caption}>What We Plan</p>
            <h2 className="text-4xl font-light md:text-5xl">Every Asset, <span className="italic">Mapped.</span></h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 gap-px md:grid-cols-2 lg:grid-cols-3" style={{ background: "var(--mk-border)" }}>
            {plan.map((card) => (
              <div key={card.title} className="p-10" style={surface}>
                <card.icon className="mb-6 h-6 w-6" strokeWidth={1.5} style={caption} />
                <h3 className="mb-4 text-2xl font-medium">{card.title}</h3>
                <ul className="space-y-2">
                  {card.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm leading-relaxed" style={caption}>
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full" style={{ background: "var(--mk-text-muted)" }} />{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-20 max-w-2xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]" style={caption}>How It Works</p>
            <h2 className="text-4xl font-light md:text-5xl">AI-Powered <span className="italic">Workflow.</span></h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 border-t md:grid-cols-2 lg:grid-cols-4" style={{ borderColor: "var(--mk-border)" }}>
            {steps.map((step) => (
              <div key={step.num} className="border-b p-8 last:border-r-0 lg:border-b-0 lg:border-r lg:p-10" style={{ borderColor: "var(--mk-border)" }}>
                <span className="text-xs font-medium uppercase tracking-[0.2em]" style={caption}>Step {step.num}</span>
                <h3 className="mb-4 mt-6 text-2xl font-medium">{step.title}</h3>
                <p className="text-sm leading-relaxed" style={caption}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OUTPUT ROUTING TABLE */}
      <section className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-16 max-w-2xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]" style={caption}>Core Differentiator</p>
            <h2 className="text-4xl font-light md:text-5xl">Built Specifically for <span className="italic">Amazon.</span></h2>
          </AnimatedSection>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--mk-border)" }}>
                  {["Asset", "Purpose", "AI Output"].map((h) => (
                    <th key={h} className="pb-4 pr-8 text-left text-xs font-medium uppercase tracking-[0.2em]" style={caption}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map(([asset, purpose, output]) => (
                  <tr key={asset} className="border-b" style={{ borderColor: "var(--mk-border)" }}>
                    <td className="py-5 pr-8 text-sm font-medium">{asset}</td>
                    <td className="py-5 pr-8 text-sm" style={caption}>{purpose}</td>
                    <td className="py-5 text-sm" style={caption}>{output}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* WHY IPIX */}
      <section className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-20 text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]" style={caption}>Why ipix</p>
            <h2 className="text-4xl font-light md:text-5xl">The Amazon <span className="italic">Advantage.</span></h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
            {advantages.map((b) => (
              <div key={b.title} className="text-center">
                <b.icon className="mx-auto mb-5 h-8 w-8" strokeWidth={1.5} style={caption} />
                <h3 className="mb-3 text-xl font-medium">{b.title}</h3>
                <p className="text-sm leading-relaxed" style={caption}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CASE STUDY */}
      <section id="case-study" className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <AnimatedSection className="relative h-[400px] lg:h-[500px]">
              <Image src="/images/amazon-casestudy.jpg" alt="Amazon case study results" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
            </AnimatedSection>
            <AnimatedSection>
              <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]" style={caption}>Case Study</p>
              <h2 className="mb-8 text-4xl font-light md:text-5xl">From Listing Draft to<br /><span className="italic">Category Leader.</span></h2>
              <div className="mb-10 grid grid-cols-2 gap-6">
                {metrics.map((m) => (
                  <div key={m.label} className="border-l-2 pl-4" style={{ borderColor: "var(--mk-text)" }}>
                    <p className="text-3xl font-light" style={{ fontFamily: "var(--font-cormorant)" }}>{m.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide" style={caption}>{m.label}</p>
                  </div>
                ))}
              </div>
              <Link href="#contact" className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wide">View Full Case Study <ArrowRight className="h-4 w-4" /></Link>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* COMPLIANCE */}
      <section className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <AnimatedSection>
              <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]" style={caption}>Compliance</p>
              <h2 className="mb-6 text-4xl font-light md:text-5xl">Amazon Rules.<br /><span className="italic">Zero Surprises.</span></h2>
              <p className="text-sm leading-relaxed" style={caption}>ipix validates compliance before shoot day.</p>
            </AnimatedSection>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
              {compliance.map((label) => (
                <div key={label} className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.5} style={{ color: "var(--mk-primary)" }} />
                  <span className="text-sm" style={caption}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mx-auto mb-16 max-w-3xl text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]" style={caption}>FAQ</p>
            <h2 className="text-4xl font-light md:text-5xl">Common <span className="italic">Questions.</span></h2>
          </AnimatedSection>
          <FAQ items={faqs} />
        </div>
      </section>

      {/* FINAL CTA */}
      <section id="contact" className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-4xl font-light md:text-5xl lg:text-6xl">Ready to Win<br /><span className="italic">Your Category?</span></h2>
            <p className="mx-auto mb-12 max-w-xl text-base leading-relaxed md:text-lg" style={caption}>Let AI define what Amazon actually needs before you produce content.</p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/#contact" className="px-10 py-4 text-sm font-medium uppercase tracking-wide text-white" style={ink}>Start My Amazon Plan</Link>
              <Link href="/#contact" className="px-10 py-4 text-sm font-medium uppercase tracking-wide" style={{ border: "1px solid var(--mk-text)" }}>Book a Consultation</Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
