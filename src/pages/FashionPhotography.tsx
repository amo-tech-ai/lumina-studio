import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Brain, BarChart3, TrendingUp, Eye, Sparkles, Camera, Palette, Send, CheckCircle, ArrowRight, Sliders, ShoppingBag, Instagram, Megaphone, Building } from "lucide-react";
import fashionHero from "@/assets/fashion-hero.jpg";
import fashionStudio from "@/assets/fashion-studio.jpg";
import fashionCasestudy from "@/assets/fashion-casestudy.jpg";
import portfolioFashion from "@/assets/portfolio-fashion.jpg";

const FashionPhotography = () => {
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
                  Fashion Photography
                </p>
                <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-light text-foreground leading-[1.05] mb-6">
                  AI-Planned Fashion<br />
                  Photography.<br />
                  <span className="italic">Built to Perform.</span>
                </h1>
                <p className="font-sans text-base md:text-lg text-text-secondary leading-relaxed max-w-lg mb-10">
                  From luxury editorials to fast fashion eCommerce — our AI plans what to shoot before the camera turns on.
                </p>
                <div className="flex flex-wrap gap-4 mb-8">
                  <a href="#contact" className="font-sans text-sm font-medium tracking-wide bg-foreground text-primary-foreground px-8 py-4 hover:opacity-90 transition-opacity duration-300 uppercase">
                    Plan Your Shoot
                  </a>
                  <a href="#portfolio" className="font-sans text-sm font-medium tracking-wide border border-foreground text-foreground px-8 py-4 hover:bg-foreground hover:text-primary-foreground transition-colors duration-300 uppercase">
                    View Fashion Work
                  </a>
                </div>
                <p className="font-sans text-xs text-text-caption tracking-wide">
                  Platform-ready content for Amazon, Shopify, Instagram & Paid Media.
                </p>
              </div>
              <div className="relative">
                <img
                  src={fashionHero}
                  alt="High-end fashion photography by iPix"
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
                  Fashion Content,<br /><span className="italic">Decided by Data.</span>
                </h2>
                <p className="font-sans text-base text-text-secondary leading-relaxed max-w-md">
                  Our AI analyzes your brand DNA, past performance, and market trends to build a shot list that converts — before a single frame is captured.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: Eye, title: "Brand Style Analysis", desc: "AI reads your guidelines, tone, and visual identity to ensure every shot is on-brand." },
                  { icon: BarChart3, title: "Performance Analysis", desc: "Past content data reveals what works — informing angles, styling, and composition." },
                  { icon: TrendingUp, title: "Trend Intelligence", desc: "Real-time fashion and platform trend data shapes creative direction." },
                  { icon: Brain, title: "Competitive Benchmarking", desc: "AI scans competitor content to identify gaps and opportunities." },
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
              {["Brand DNA", "AI Analysis", "Shot List", "Production", "Optimized Output"].map((step, i) => (
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

        {/* ── PORTFOLIO SHOWCASE ── */}
        <section id="portfolio" className="py-24 lg:py-32 bg-surface-white">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Selected Work</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">Fashion Portfolio</h2>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {["All", "Luxury", "Streetwear", "Athleisure", "Editorial", "eCommerce"].map((f) => (
                <button key={f} className="font-sans text-xs font-medium tracking-wide text-text-caption hover:text-foreground uppercase px-4 py-2 border border-divider hover:border-foreground transition-colors">
                  {f}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-1">
              {[fashionHero, portfolioFashion, fashionCasestudy, fashionStudio, fashionHero, portfolioFashion].map((src, i) => (
                <div key={i} className="relative group overflow-hidden cursor-pointer aspect-[4/5]">
                  <img src={src} alt={`Fashion portfolio ${i + 1}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-500" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CREATIVE TEMPERATURE ── */}
        <section className="py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="max-w-3xl mx-auto text-center">
              <Sliders size={32} strokeWidth={1.2} className="text-text-mid mx-auto mb-6" />
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Creative Control</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-6">
                Creative Temperature
              </h2>
              <p className="font-sans text-base text-text-secondary leading-relaxed max-w-xl mx-auto mb-12">
                Dial in the exact level of creative risk for every campaign. From safe, conversion-proven compositions to bold, trend-setting imagery.
              </p>
              {/* Slider Visual */}
              <div className="relative mx-auto max-w-lg mb-8">
                <div className="h-px bg-divider w-full relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-foreground" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-foreground" />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-foreground border-2 border-primary-foreground" />
                </div>
                <div className="flex justify-between mt-4">
                  <span className="font-sans text-xs text-text-caption uppercase tracking-wide">Safe & Conversion-Focused</span>
                  <span className="font-sans text-xs text-text-caption uppercase tracking-wide">Bold & Trend-Driven</span>
                </div>
              </div>
              <p className="font-sans text-sm text-text-secondary leading-relaxed max-w-md mx-auto">
                Teams control how adventurous AI gets — ensuring every shoot aligns with campaign goals, whether it's DTC product pages or a viral social campaign.
              </p>
            </div>
          </div>
        </section>

        {/* ── DELIVERABLES BY PLATFORM ── */}
        <section className="py-24 lg:py-32 bg-surface-white">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Platform-Specific</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">Deliverables by Platform</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-divider">
              {[
                { icon: ShoppingBag, title: "Amazon & PDP", items: ["Multi-angle product shots", "On-model lifestyle imagery", "Detail & texture close-ups", "Infographic-ready assets"] },
                { icon: Instagram, title: "Instagram & Social", items: ["Scroll-stopping hero visuals", "Story & Reels-ready formats", "Carousel compositions", "UGC-style editorial"] },
                { icon: Megaphone, title: "Paid Media", items: ["Hook-first compositions", "A/B tested variations", "Ad-specific framing", "Platform-optimized ratios"] },
              ].map((col) => (
                <div key={col.title} className="bg-surface-white p-10 lg:p-12">
                  <col.icon size={28} strokeWidth={1.2} className="text-text-mid mb-6" />
                  <h3 className="font-serif text-2xl font-medium text-foreground mb-6">{col.title}</h3>
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

        {/* ── WORKFLOW ── */}
        <section className="py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">How It Works</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">From Strategy to Delivery</h2>
            </div>
            <div className="max-w-2xl mx-auto">
              {[
                { step: "01", title: "AI Strategy Mapping", desc: "Our AI analyzes your brand, competitors, and market trends." },
                { step: "02", title: "Shot List Generation", desc: "Platform-specific shot lists with styling, angles, and composition notes." },
                { step: "03", title: "Production", desc: "In-studio or on-location shoots executed by expert photographers." },
                { step: "04", title: "Post-Production", desc: "Retouching, color grading, and format optimization." },
                { step: "05", title: "Platform Delivery", desc: "Assets delivered in platform-specific formats, ready to publish." },
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
        <section className="py-24 lg:py-32 bg-surface-white">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Why iPix</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">Measurable Impact</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-divider">
              {[
                { title: "Consistency Across Channels", desc: "Uniform brand visuals from PDP to paid media." },
                { title: "Higher Conversion Rates", desc: "AI-optimized imagery proven to lift CTR and sales." },
                { title: "Fewer Revisions", desc: "Get it right the first time with data-backed creative." },
                { title: "Faster Time to Launch", desc: "AI pre-production cuts planning time by 60%." },
              ].map((b) => (
                <div key={b.title} className="bg-surface-white p-8 lg:p-10 text-center">
                  <h3 className="font-serif text-lg font-medium text-foreground mb-3">{b.title}</h3>
                  <p className="font-sans text-sm text-text-secondary leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CASE STUDY ── */}
        <section className="py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <img src={fashionCasestudy} alt="Fashion case study" className="w-full h-[450px] object-cover" />
              <div>
                <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Case Study</p>
                <h2 className="font-serif text-4xl font-light text-foreground mb-8">
                  AI-Driven Results for a Leading Fashion Brand
                </h2>
                <div className="grid grid-cols-3 gap-6 mb-8">
                  {[
                    { metric: "+32%", label: "PDP Conversion" },
                    { metric: "+40%", label: "Social Engagement" },
                    { metric: "−30%", label: "Reshoot Rate" },
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

        {/* ── STUDIO + AI INFRASTRUCTURE ── */}
        <section className="py-24 lg:py-32 bg-surface-white">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">
              <img src={fashionStudio} alt="iPix fashion studio" className="w-full h-full min-h-[400px] object-cover" />
              <div className="bg-background p-10 lg:p-16 flex flex-col justify-center">
                <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Infrastructure</p>
                <h2 className="font-serif text-3xl md:text-4xl font-light text-foreground mb-6">
                  Studio + AI, Under One Roof
                </h2>
                <ul className="space-y-4">
                  {[
                    "In-house production facility",
                    "AI-driven pre-production planning",
                    "High-volume SKU handling",
                    "Multi-channel asset output",
                    "Professional retouching team",
                    "Climate-controlled shooting bays",
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
                  { q: "How does AI decide what to shoot?", a: "Our AI analyzes your brand guidelines, historical content performance, current market trends, and competitor strategies to generate a data-backed shot list optimized for each platform." },
                  { q: "Can we control creative direction?", a: "Absolutely. The Creative Temperature slider lets your team set the level of creative risk — from safe, conversion-proven compositions to bold, trend-setting imagery." },
                  { q: "Do you match brand guidelines?", a: "Yes. AI ingests your brand style guide, color palettes, typography, and tone of voice to ensure every asset is perfectly on-brand." },
                  { q: "Can you scale to large collections?", a: "We handle high-volume SKU shoots with AI-optimized workflows that maintain consistency across hundreds or thousands of products." },
                  { q: "What platforms do you optimize for?", a: "Amazon, Shopify, Instagram, TikTok, Facebook Ads, Google Shopping, and more. Each platform receives assets in its optimal format and ratio." },
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
                Ready to Plan Your Next<br />
                <span className="italic">Fashion Campaign with AI?</span>
              </h2>
              <p className="font-sans text-base text-text-secondary leading-relaxed max-w-xl mx-auto mb-10">
                Tell us about your brand and we'll craft an AI-driven content strategy — fewer revisions, faster execution, higher conversion.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a href="/#contact" className="font-sans text-sm font-medium tracking-wide bg-foreground text-primary-foreground px-10 py-4 hover:opacity-90 transition-opacity duration-300 uppercase">
                  Plan Your Shoot
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

export default FashionPhotography;
