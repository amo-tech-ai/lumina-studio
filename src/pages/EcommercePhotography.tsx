import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Brain, BarChart3, TrendingUp, Eye, Sliders, ShoppingBag, Instagram, Megaphone, Building, CheckCircle, ArrowRight, Zap, Layers, Video } from "lucide-react";
import ecommerceHero from "@/assets/ecommerce-hero.jpg";
import ecommerceStudio from "@/assets/ecommerce-studio.jpg";
import ecommerceCasestudy from "@/assets/ecommerce-casestudy.jpg";
import portfolioProduct from "@/assets/portfolio-product.jpg";
import portfolioEcommerce from "@/assets/portfolio-ecommerce.jpg";
import portfolioStilllife from "@/assets/portfolio-stilllife.jpg";

const EcommercePhotography = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* ── HERO ── */}
        <section className="pt-32 pb-24 lg:pt-40 lg:pb-32 bg-surface-white">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-6">
                  eCommerce Photography
                </p>
                <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-light text-foreground leading-[1.05] mb-6">
                  Drive Sales with<br />
                  AI-Planned eCommerce<br />
                  <span className="italic">Photography.</span>
                </h1>
                <p className="font-sans text-base md:text-lg text-text-secondary leading-relaxed max-w-lg mb-10">
                  Content mapped by AI. Produced for performance. Delivered platform-ready for Amazon, Shopify, Instagram & Paid Media.
                </p>
                <div className="flex flex-wrap gap-4 mb-8">
                  <a href="#contact" className="font-sans text-sm font-medium tracking-wide bg-foreground text-primary-foreground px-8 py-4 hover:opacity-90 transition-opacity duration-300 uppercase">
                    Plan My Shoot
                  </a>
                  <a href="#portfolio" className="font-sans text-sm font-medium tracking-wide border border-foreground text-foreground px-8 py-4 hover:bg-foreground hover:text-primary-foreground transition-colors duration-300 uppercase">
                    View eCommerce Work
                  </a>
                </div>
                <p className="font-sans text-xs text-text-caption tracking-wide">
                  Amazon, Shopify, Social & Paid Media optimized.
                </p>
              </div>
              <div className="relative">
                <img
                  src={ecommerceHero}
                  alt="Premium eCommerce product photography flat lay"
                  className="w-full h-[500px] lg:h-[650px] object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── AI STRATEGY ── */}
        <section className="py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              <div>
                <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">AI-Driven Strategy</p>
                <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-6">
                  Before We Shoot,<br /><span className="italic">We Analyze.</span>
                </h2>
                <p className="font-sans text-base text-text-secondary leading-relaxed max-w-md">
                  Our AI maps your brand DNA, SKU performance data, and competitor landscapes to build shot lists that convert — before a single product hits the set.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: Eye, title: "Brand Style Analysis", desc: "AI ingests your guidelines, colors, and visual identity for pixel-perfect consistency." },
                  { icon: BarChart3, title: "SKU Performance Mapping", desc: "Historical sales and engagement data reveals which products need what type of content." },
                  { icon: TrendingUp, title: "Trend Detection", desc: "Real-time market and platform trend data shapes creative direction and styling." },
                  { icon: Brain, title: "Competitor Benchmarking", desc: "AI scans competitor listings and ads to identify gaps and visual opportunities." },
                ].map((item) => (
                  <div key={item.title} className="p-6 bg-surface-white border border-divider">
                    <item.icon size={24} strokeWidth={1.2} className="text-text-mid mb-4" />
                    <h3 className="font-serif text-lg font-medium text-foreground mb-2">{item.title}</h3>
                    <p className="font-sans text-sm text-text-secondary leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* AI Flow Diagram */}
            <div className="mt-20 flex flex-wrap items-center justify-center gap-4 text-center">
              {["Brand Data", "AI Engine", "Shot List", "Production", "Platform Optimization"].map((step, i) => (
                <div key={step} className="flex items-center gap-4">
                  <div className="px-6 py-3 border border-divider bg-surface-white">
                    <span className="font-sans text-xs font-medium tracking-wide text-foreground uppercase">{step}</span>
                  </div>
                  {i < 4 && <ArrowRight size={16} className="text-text-caption hidden sm:block" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PORTFOLIO GRID ── */}
        <section id="portfolio" className="py-24 lg:py-32 bg-surface-white">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Selected Work</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">eCommerce Portfolio</h2>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {["All", "Beauty", "Apparel", "Electronics", "Luxury", "Food", "Lifestyle"].map((f) => (
                <button key={f} className="font-sans text-xs font-medium tracking-wide text-text-caption hover:text-foreground uppercase px-4 py-2 border border-divider hover:border-foreground transition-colors">
                  {f}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-1">
              {[ecommerceHero, portfolioProduct, portfolioEcommerce, portfolioStilllife, ecommerceCasestudy, portfolioProduct].map((src, i) => (
                <div key={i} className="relative group overflow-hidden cursor-pointer aspect-[4/5]">
                  <img src={src} alt={`eCommerce portfolio ${i + 1}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-500" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PLATFORM-SPECIFIC DELIVERABLES ── */}
        <section className="py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Platform-Specific</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">Deliverables by Platform</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-divider">
              {[
                { icon: ShoppingBag, title: "Amazon & PDP", items: ["White background shots", "Detail angle close-ups", "Infographic overlays", "A+ Content imagery"] },
                { icon: Layers, title: "Shopify", items: ["Lifestyle hero images", "Conversion-optimized angles", "Hover variation shots", "Collection banners"] },
                { icon: Instagram, title: "Paid Social", items: ["Hook-driven compositions", "Cropped story formats", "A/B tested variations", "Ad-specific framing"] },
                { icon: Video, title: "Reels & Shorts", items: ["Short-form video cuts", "6–15 second edits", "Product reveal clips", "Unboxing sequences"] },
              ].map((col) => (
                <div key={col.title} className="bg-background p-8 lg:p-10">
                  <col.icon size={28} strokeWidth={1.2} className="text-text-mid mb-6" />
                  <h3 className="font-serif text-xl font-medium text-foreground mb-6">{col.title}</h3>
                  <ul className="space-y-3">
                    {col.items.map((item) => (
                      <li key={item} className="font-sans text-sm text-text-secondary flex items-start gap-2">
                        <CheckCircle size={14} className="text-text-mid mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CREATIVE TEMPERATURE ── */}
        <section className="py-24 lg:py-32 bg-surface-white">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="max-w-3xl mx-auto text-center">
              <Sliders size={32} strokeWidth={1.2} className="text-text-mid mx-auto mb-6" />
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Creative Control</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-6">
                Creative Temperature
              </h2>
              <p className="font-sans text-base text-text-secondary leading-relaxed max-w-xl mx-auto mb-12">
                Dial in the exact level of creative risk for every campaign. From safe, conversion-proven packshots to bold, trend-setting product visuals.
              </p>
              <div className="relative mx-auto max-w-lg mb-8">
                <div className="h-px bg-divider w-full relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-foreground" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-foreground" />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-foreground border-2 border-primary-foreground" />
                </div>
                <div className="flex justify-between mt-4">
                  <span className="font-sans text-xs text-text-caption uppercase tracking-wide">Conversion-Focused</span>
                  <span className="font-sans text-xs text-text-caption uppercase tracking-wide">Trend-Driven</span>
                </div>
              </div>
              <p className="font-sans text-sm text-text-secondary leading-relaxed max-w-md mx-auto">
                Teams adjust creative direction depending on campaign objective — ensuring every shoot aligns with goals from DTC product pages to viral social campaigns.
              </p>
            </div>
          </div>
        </section>

        {/* ── HIGH-VOLUME PRODUCTION ── */}
        <section className="py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">
              <img src={ecommerceStudio} alt="iPix production studio" className="w-full h-full min-h-[400px] object-cover" />
              <div className="bg-surface-white p-10 lg:p-16 flex flex-col justify-center">
                <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Scale</p>
                <h2 className="font-serif text-3xl md:text-4xl font-light text-foreground mb-6">
                  High-Volume Production<br /><span className="italic">Capability</span>
                </h2>
                <ul className="space-y-4">
                  {[
                    "100+ SKUs per week capacity",
                    "Standardized, repeatable workflows",
                    "Consistency across entire collections",
                    "Rapid turnaround on bulk orders",
                    "AI-driven pre-production planning",
                    "Multi-channel asset output",
                  ].map((item) => (
                    <li key={item} className="font-sans text-sm text-text-secondary flex items-center gap-3">
                      <Building size={14} className="text-text-mid shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── WORKFLOW ── */}
        <section className="py-24 lg:py-32 bg-surface-white">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">How It Works</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">From Strategy to Delivery</h2>
            </div>
            <div className="max-w-2xl mx-auto">
              {[
                { step: "01", title: "AI Strategy Mapping", desc: "Our AI analyzes your brand, SKU data, competitors, and market trends." },
                { step: "02", title: "Shot List Generation", desc: "Platform-specific shot lists with angles, styling, and composition guidance." },
                { step: "03", title: "Production", desc: "In-studio shoots executed by expert product photographers." },
                { step: "04", title: "Post-Production Optimization", desc: "Retouching, background removal, color correction, and format optimization." },
                { step: "05", title: "Platform Delivery", desc: "Assets delivered in platform-specific formats — Amazon, Shopify, social, and ads." },
              ].map((item, i) => (
                <div key={item.step} className={`flex gap-8 ${i < 4 ? "pb-12 border-l border-divider ml-4" : "ml-4"}`}>
                  <div className="w-8 h-8 rounded-full bg-foreground text-primary-foreground flex items-center justify-center font-sans text-xs font-medium -ml-4 shrink-0">
                    {item.step}
                  </div>
                  <div className="pt-1">
                    <h3 className="font-serif text-xl font-medium text-foreground mb-1">{item.title}</h3>
                    <p className="font-sans text-sm text-text-secondary">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── BENEFITS ── */}
        <section className="py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Why iPix</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">Measurable Impact</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-divider">
              {[
                { title: "Consistency Across Channels", desc: "Uniform product visuals from PDP to paid media." },
                { title: "Higher Conversion Rates", desc: "AI-optimized imagery proven to lift CTR and sales." },
                { title: "Fewer Revisions", desc: "Get it right the first time with data-backed creative." },
                { title: "Faster Time to Launch", desc: "AI pre-production cuts planning time by 60%." },
              ].map((b) => (
                <div key={b.title} className="bg-background p-8 lg:p-10 text-center">
                  <h3 className="font-serif text-lg font-medium text-foreground mb-3">{b.title}</h3>
                  <p className="font-sans text-sm text-text-secondary leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CASE STUDY ── */}
        <section className="py-24 lg:py-32 bg-surface-white">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <img src={ecommerceCasestudy} alt="eCommerce case study" className="w-full h-[450px] object-cover" />
              <div>
                <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Case Study</p>
                <h2 className="font-serif text-4xl font-light text-foreground mb-8">
                  AI-Driven Results for a Leading eCommerce Brand
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
                  {[
                    { metric: "+28%", label: "PDP Conversion" },
                    { metric: "+35%", label: "Social CTR" },
                    { metric: "−30%", label: "Fewer Reshoots" },
                    { metric: "2×", label: "Faster Turnaround" },
                  ].map((m) => (
                    <div key={m.label}>
                      <p className="font-serif text-3xl font-medium text-foreground">{m.metric}</p>
                      <p className="font-sans text-xs text-text-caption uppercase tracking-wide mt-1">{m.label}</p>
                    </div>
                  ))}
                </div>
                <a href="#" className="font-sans text-sm font-medium tracking-wide text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity uppercase">
                  View Full Case Study →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-16">
                <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Questions</p>
                <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">FAQ</h2>
              </div>
              <Accordion type="single" collapsible className="space-y-2">
                {[
                  { q: "How does AI choose what to shoot?", a: "Our AI analyzes your brand guidelines, historical sales data, current market trends, and competitor strategies to generate a data-backed shot list optimized for each platform and product category." },
                  { q: "Can we control creative direction?", a: "Absolutely. The Creative Temperature slider lets your team set the level of creative risk — from safe, conversion-proven packshots to bold, trend-setting product imagery." },
                  { q: "Do you scale large SKU volumes?", a: "Yes. We handle 100+ SKUs per week with standardized workflows that maintain consistency across entire collections and product lines." },
                  { q: "What platforms do you optimize for?", a: "Amazon, Shopify, Instagram, TikTok, Facebook Ads, Google Shopping, and more. Each platform receives assets in its optimal format, ratio, and specification." },
                  { q: "How fast is turnaround?", a: "AI pre-production cuts planning time by 60%. Standard turnaround is 5–7 business days for up to 50 SKUs, with rush options available for time-sensitive launches." },
                ].map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border-divider">
                    <AccordionTrigger className="font-serif text-lg text-foreground hover:no-underline py-5">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="font-sans text-sm text-text-secondary leading-relaxed">
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
                Ready to Turn Product Content<br />
                <span className="italic">Into Performance?</span>
              </h2>
              <p className="font-sans text-base text-text-secondary leading-relaxed max-w-xl mx-auto mb-10">
                Tell us about your brand and we'll craft an AI-driven content strategy — fewer revisions, faster execution, higher conversion.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a href="/#contact" className="font-sans text-sm font-medium tracking-wide bg-foreground text-primary-foreground px-10 py-4 hover:opacity-90 transition-opacity duration-300 uppercase">
                  Plan My Shoot
                </a>
                <a href="/#contact" className="font-sans text-sm font-medium tracking-wide border border-foreground text-foreground px-10 py-4 hover:bg-foreground hover:text-primary-foreground transition-colors duration-300 uppercase">
                  Book a Consultation
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default EcommercePhotography;
