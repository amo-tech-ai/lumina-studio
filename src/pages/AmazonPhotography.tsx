import { ArrowRight, CheckCircle, Camera, BarChart3, Layers, Target, Zap, ShieldCheck, Image, Layout, Eye, Package, Grid3X3, TrendingUp } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import amazonHero from "@/assets/amazon-hero.jpg";
import amazonStudio from "@/assets/amazon-studio.jpg";
import amazonCaseStudy from "@/assets/amazon-casestudy.jpg";

const AmazonPhotography = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-20" style={{ backgroundColor: "#F4F3F1" }}>
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-xl">
              <p className="font-sans text-sm font-medium tracking-[0.2em] text-text-caption uppercase mb-6">
                Amazon Content Intelligence
              </p>
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-light leading-[1.05] text-foreground mb-8">
                Amazon Images That Rank.<br />
                Convert. <span className="italic">Win the Buy Box.</span>
              </h1>
              <p className="font-sans text-base md:text-lg text-text-secondary leading-relaxed max-w-prose mb-10">
                AI-powered Amazon content planning built around A9 ranking logic,
                category benchmarks, and conversion psychology.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <a href="#contact" className="font-sans text-sm font-medium tracking-wide bg-foreground text-primary-foreground px-8 py-4 hover:opacity-90 transition-opacity duration-300 uppercase text-center">
                  Plan My Amazon Content
                </a>
                <a href="#case-study" className="font-sans text-sm font-medium tracking-wide border border-foreground text-foreground px-8 py-4 hover:bg-foreground hover:text-primary-foreground transition-all duration-300 uppercase text-center">
                  See Example Output
                </a>
              </div>
              {/* Micro-trust row */}
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {["Amazon Compliant", "A9-Aware Strategy", "Infographic Planning", "Multi-Variation Ready"].map((t) => (
                  <span key={t} className="flex items-center gap-2 font-sans text-xs tracking-wide text-text-secondary">
                    <CheckCircle className="w-4 h-4 text-foreground" /> {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative">
              <img src={amazonHero} alt="Amazon product photography showcase" className="w-full h-[500px] lg:h-[600px] object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section className="py-24 lg:py-32 bg-surface-white">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="font-sans text-sm font-medium tracking-[0.2em] text-text-caption uppercase mb-4">The Problem</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-8">
                Most Amazon Listings<br /><span className="italic">Fail Before They Launch.</span>
              </h2>
            </div>
            <div className="space-y-6">
              {[
                "Poor image sequencing.",
                "No keyword visual alignment.",
                "Weak infographics.",
                "No variation strategy.",
              ].map((p) => (
                <p key={p} className="font-sans text-base text-text-secondary leading-relaxed border-l-2 border-divider pl-6">{p}</p>
              ))}
              <div className="pt-4 border-t border-divider">
                <p className="font-sans text-base text-foreground font-medium leading-relaxed">
                  Amazon is not just photography.<br />It's structured persuasion.
                </p>
                <p className="font-sans text-sm text-text-secondary mt-3">
                  ipix maps every asset before production.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT WE PLAN ── */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-2xl mb-20">
            <p className="font-sans text-sm font-medium tracking-[0.2em] text-text-caption uppercase mb-4">What We Plan</p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">
              Every Asset, <span className="italic">Mapped.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-divider">
            {[
              {
                icon: Image, title: "Main Hero Image",
                items: ["White background compliance", "Proper cropping ratio", "Shadow consistency", "Category-optimized framing"],
              },
              {
                icon: Layout, title: "Infographic Images",
                items: ["Feature breakdown", "Problem → solution visuals", "Measurement callouts", "Icon-based highlights"],
              },
              {
                icon: Eye, title: "Lifestyle Images",
                items: ["Context placement", "Emotional positioning", "Demographic targeting", "Use-case sequencing"],
              },
              {
                icon: Camera, title: "Detail Shots",
                items: ["Texture clarity", "Material proof", "Scale reinforcement", "Competitive comparison"],
              },
              {
                icon: Layers, title: "A+ Content Mapping",
                items: ["Brand story flow", "Modular layout plan", "Cross-sell strategy", "Comparison charts"],
              },
              {
                icon: Grid3X3, title: "Variation Strategy",
                items: ["Color clustering", "Bundle logic", "Multi-pack visual hierarchy", "Parent-child optimization"],
              },
            ].map((card) => (
              <div key={card.title} className="bg-surface-white p-10">
                <card.icon className="w-6 h-6 text-foreground mb-6" strokeWidth={1.5} />
                <h3 className="font-serif text-2xl font-medium text-foreground mb-4">{card.title}</h3>
                <ul className="space-y-2">
                  {card.items.map((item) => (
                    <li key={item} className="font-sans text-sm text-text-secondary leading-relaxed flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-text-caption mt-2 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 lg:py-32 bg-surface-white">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-2xl mb-20">
            <p className="font-sans text-sm font-medium tracking-[0.2em] text-text-caption uppercase mb-4">How It Works</p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">
              AI-Powered <span className="italic">Workflow.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-divider">
            {[
              { num: "01", title: "Product Upload", desc: "Upload product details, category, competitor ASINs, and target keywords." },
              { num: "02", title: "Competitive Scan", desc: "AI analyzes top 10 ranking listings, image sequencing patterns, infographic density, and emotional positioning." },
              { num: "03", title: "Conversion Modeling", desc: "System determines ideal image order, feature emphasis weight, trust badge placement, and risk reversal visuals." },
              { num: "04", title: "Output Routing", desc: "You receive a complete Amazon image shot list, infographic script, A+ layout map, creative brief, and variation grid strategy." },
            ].map((step) => (
              <div key={step.num} className="border-b lg:border-b-0 lg:border-r last:border-r-0 border-divider p-8 lg:p-10">
                <span className="font-sans text-xs font-medium tracking-[0.2em] text-text-caption uppercase">Step {step.num}</span>
                <h3 className="font-serif text-2xl font-medium text-foreground mt-6 mb-4">{step.title}</h3>
                <p className="font-sans text-sm text-text-secondary leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OUTPUT ROUTING ── */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-2xl mb-16">
            <p className="font-sans text-sm font-medium tracking-[0.2em] text-text-caption uppercase mb-4">Core Differentiator</p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">
              Built Specifically for <span className="italic">Amazon.</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-divider">
                  {["Asset", "Purpose", "AI Output"].map((h) => (
                    <th key={h} className="font-sans text-xs font-medium tracking-[0.2em] text-text-caption uppercase text-left pb-4 pr-8">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Image 1", "Click trigger", "White hero framing map"],
                  ["Image 2", "Core benefit", "Feature overlay script"],
                  ["Image 3", "Lifestyle", "Context placement brief"],
                  ["Image 4", "Proof", "Detail macro plan"],
                  ["Image 5", "Comparison", "Chart layout draft"],
                  ["A+ Content", "Brand story", "Modular content map"],
                ].map(([asset, purpose, output]) => (
                  <tr key={asset} className="border-b border-divider/50">
                    <td className="font-sans text-sm font-medium text-foreground py-5 pr-8">{asset}</td>
                    <td className="font-sans text-sm text-text-secondary py-5 pr-8">{purpose}</td>
                    <td className="font-sans text-sm text-text-secondary py-5">{output}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── WHY IPIX ── */}
      <section className="py-24 lg:py-32 bg-surface-white">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center mb-20">
            <p className="font-sans text-sm font-medium tracking-[0.2em] text-text-caption uppercase mb-4">Why ipix</p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">
              The Amazon <span className="italic">Advantage.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              { icon: Target, title: "A9-Aware Visual Strategy", desc: "Images aligned with ranking signals." },
              { icon: BarChart3, title: "Data-Backed Structure", desc: "Not creative guesswork." },
              { icon: Camera, title: "Reduced Reshoots", desc: "Plan once. Shoot with clarity." },
              { icon: Zap, title: "Faster Listing Launch", desc: "No revision chaos." },
              { icon: TrendingUp, title: "Competitive Positioning", desc: "Your images outperform category norms." },
              { icon: Package, title: "Multi-Channel Adaptable", desc: "Repurpose for Shopify, ads, email." },
            ].map((b) => (
              <div key={b.title} className="text-center">
                <b.icon className="w-8 h-8 text-foreground mx-auto mb-5" strokeWidth={1.5} />
                <h3 className="font-serif text-xl font-medium text-foreground mb-3">{b.title}</h3>
                <p className="font-sans text-sm text-text-secondary leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CASE STUDY ── */}
      <section id="case-study" className="py-24 lg:py-32 bg-background">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <img src={amazonCaseStudy} alt="Amazon case study results" className="w-full h-[400px] lg:h-[500px] object-cover" />
            <div>
              <p className="font-sans text-sm font-medium tracking-[0.2em] text-text-caption uppercase mb-4">Case Study</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-8">
                From Listing Draft to<br /><span className="italic">Category Leader.</span>
              </h2>
              <div className="grid grid-cols-2 gap-6 mb-10">
                {[
                  { value: "+18%", label: "Click-Through Rate" },
                  { value: "+22%", label: "Conversion Rate" },
                  { value: "12 → 7", label: "Optimized Images" },
                  { value: "+3", label: "Infographic Frames" },
                ].map((m) => (
                  <div key={m.label} className="border-l-2 border-foreground pl-4">
                    <p className="font-serif text-3xl font-light text-foreground">{m.value}</p>
                    <p className="font-sans text-xs text-text-caption uppercase tracking-wide mt-1">{m.label}</p>
                  </div>
                ))}
              </div>
              <a href="#contact" className="inline-flex items-center gap-2 font-sans text-sm font-medium tracking-wide text-foreground hover:opacity-70 transition-opacity uppercase">
                View Full Case Study <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPLIANCE ── */}
      <section className="py-24 lg:py-32 bg-surface-white">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="font-sans text-sm font-medium tracking-[0.2em] text-text-caption uppercase mb-4">Compliance</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-6">
                Amazon Rules.<br /><span className="italic">Zero Surprises.</span>
              </h2>
              <p className="font-sans text-sm text-text-secondary leading-relaxed">
                ipix validates compliance before shoot day.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {[
                { icon: ShieldCheck, label: "85% Frame Fill" },
                { icon: ShieldCheck, label: "RGB Color Space" },
                { icon: ShieldCheck, label: "2000px Minimum" },
                { icon: ShieldCheck, label: "Pure White Background" },
                { icon: ShieldCheck, label: "No Watermarks" },
                { icon: ShieldCheck, label: "Pre-Validated" },
              ].map((c) => (
                <div key={c.label} className="flex items-start gap-3">
                  <c.icon className="w-5 h-5 text-foreground shrink-0 mt-0.5" strokeWidth={1.5} />
                  <span className="font-sans text-sm text-text-secondary">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <p className="font-sans text-sm font-medium tracking-[0.2em] text-text-caption uppercase mb-4">FAQ</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">
                Common <span className="italic">Questions.</span>
              </h2>
            </div>
            <Accordion type="single" collapsible className="space-y-0">
              {[
                { q: "How does AI choose shots for Amazon?", a: "Our AI analyzes top-performing listings in your category, identifies image sequencing patterns, infographic density, and emotional positioning to generate a data-backed shot list optimized for A9 ranking." },
                { q: "Can we control creative direction?", a: "Absolutely. Our Creative Temperature control lets you adjust from conversion-safe to trend-driven. You approve every shot list before production begins." },
                { q: "Do you handle large SKU volumes?", a: "Yes. Our AI-driven workflows are built for scale — we routinely plan and produce content for 100+ SKUs per week with consistent quality." },
                { q: "What platforms do you optimize for?", a: "While this page focuses on Amazon, every plan can be extended to Shopify, social media, paid ads, and email — all from the same production session." },
                { q: "How fast is turnaround?", a: "AI planning is generated within 24 hours. Full production and delivery typically completes within 5–7 business days depending on volume." },
              ].map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-b border-divider">
                  <AccordionTrigger className="font-sans text-base font-medium text-foreground py-6 hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="font-sans text-sm text-text-secondary leading-relaxed pb-6">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section id="contact" className="py-24 lg:py-32 bg-surface-white">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-6">
              Ready to Win<br /><span className="italic">Your Category?</span>
            </h2>
            <p className="font-sans text-base md:text-lg text-text-secondary leading-relaxed max-w-xl mx-auto mb-12">
              Let AI define what Amazon actually needs before you produce content.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="#contact" className="font-sans text-sm font-medium tracking-wide bg-foreground text-primary-foreground px-10 py-4 hover:opacity-90 transition-opacity duration-300 uppercase">
                Start My Amazon Plan
              </a>
              <a href="#contact" className="font-sans text-sm font-medium tracking-wide border border-foreground text-foreground px-10 py-4 hover:bg-foreground hover:text-primary-foreground transition-all duration-300 uppercase">
                Book a Consultation
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AmazonPhotography;
