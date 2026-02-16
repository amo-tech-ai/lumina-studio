import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ClothingSlider from "@/components/ClothingSlider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Brain, BarChart3, TrendingUp, Eye, ArrowRight, Sliders, ShoppingBag, Instagram, Megaphone, Mail, CheckCircle, Building, Upload, Cpu, SlidersHorizontal, FileText, Shirt, Scissors, Camera, Package, Video, Search } from "lucide-react";
import clothingHero from "@/assets/clothing-hero.jpg";
import clothingStudio from "@/assets/clothing-studio.jpg";
import clothingCasestudy from "@/assets/clothing-casestudy.jpg";
import portfolioFashion from "@/assets/portfolio-fashion.jpg";
import portfolioProduct from "@/assets/portfolio-product.jpg";

const ClothingPhotography = () => {
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
                  Clothing Photography
                </p>
                <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-light text-foreground leading-[1.05] mb-6">
                  Clothing Content<br />
                  That Sells.<br />
                  <span className="italic">Planned by AI.</span>
                </h1>
                <p className="font-sans text-base md:text-lg text-text-secondary leading-relaxed max-w-lg mb-10">
                  AI-powered clothing photography planning for fashion brands.
                  Ghost mannequin. Flats. Creative. Ads. Social. All mapped before you shoot.
                </p>
                <div className="flex flex-wrap gap-4 mb-8">
                  <a href="#contact" className="font-sans text-sm font-medium tracking-wide bg-foreground text-primary-foreground px-8 py-4 hover:opacity-90 transition-opacity duration-300 uppercase">
                    Plan My Shoot
                  </a>
                  <a href="#content-types" className="font-sans text-sm font-medium tracking-wide border border-foreground text-foreground px-8 py-4 hover:bg-foreground hover:text-primary-foreground transition-colors duration-300 uppercase">
                    View Example Plan
                  </a>
                </div>
                <p className="font-sans text-xs text-text-caption tracking-wide">
                  Creative Temperature: Safe → Bold · Platform Output: Shopify | Amazon | Instagram | Paid Ads
                </p>
              </div>
              <div className="relative">
                <img
                  src={clothingHero}
                  alt="Premium clothing photography by iPix"
                  className="w-full h-[500px] lg:h-[650px] object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── PROBLEM → SOLUTION ── */}
        <section className="py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              <div>
                <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">The Problem</p>
                <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-6">
                  Stop Guessing<br /><span className="italic">What to Shoot.</span>
                </h2>
                <p className="font-sans text-base text-text-secondary leading-relaxed max-w-md mb-8">
                  Most brands overshoot, reshoot, or create content that doesn't convert. ipix analyzes your brand and generates a complete clothing content plan.
                </p>
                <ul className="space-y-3">
                  {[
                    "Your brand style guide",
                    "Past product performance",
                    "Market trends",
                    "Platform requirements",
                  ].map((item) => (
                    <li key={item} className="font-sans text-sm text-text-secondary flex items-center gap-3">
                      <CheckCircle size={14} className="text-text-mid shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {[clothingHero, portfolioFashion, portfolioProduct, clothingStudio].map((src, i) => (
                  <div key={i} className="aspect-square overflow-hidden">
                    <img src={src} alt={`Clothing type ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── IMAGE SLIDER ── */}
        <ClothingSlider />

        {/* ── CONTENT TYPES WE PLAN ── */}
        <section id="content-types" className="py-24 lg:py-32 bg-surface-white">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">What We Plan</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">Content Types</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-divider">
              {[
                { icon: Shirt, title: "Ghost Mannequin", items: ["Front / Back / Side angles", "Detail priority mapping", "Fabric features to highlight", "Conversion-focused angle selection"] },
                { icon: Camera, title: "Clothing Flats", items: ["Hanging vs tabletop planning", "Natural movement vs controlled shape", "Background styling direction", "Crop variations for platforms"] },
                { icon: Package, title: "Apparel Still Life", items: ["Homepage banner compositions", "Collection drop layouts", "Campaign visual concepts", "Social-first compositions"] },
                { icon: Search, title: "Detail Shots", items: ["Buttons, zippers, texture", "Stitching & label close-ups", "Fabric macro planning", "Quality-signaling imagery"] },
                { icon: Scissors, title: "Accessories", items: ["Hero shot planning", "Contextual shot direction", "Detail shot mapping", "Ad variation strategy"] },
                { icon: Video, title: "Short-Form Video", items: ["Model movement direction", "Fit demonstration plans", "Close-up fabric motion", "Hook frame for ads"] },
              ].map((card) => (
                <div key={card.title} className="bg-surface-white p-10 lg:p-12">
                  <card.icon size={28} strokeWidth={1.2} className="text-text-mid mb-6" />
                  <h3 className="font-serif text-2xl font-medium text-foreground mb-6">{card.title}</h3>
                  <ul className="space-y-3">
                    {card.items.map((item) => (
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

        {/* ── HOW IPIX WORKS (AI FLOW) ── */}
        <section className="py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">How It Works</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">AI-Powered Workflow</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-divider">
              {[
                { icon: Upload, step: "01", title: "Brand Upload", desc: "Upload style guide, past images, target platform, and campaign goal." },
                { icon: Cpu, step: "02", title: "AI Analysis", desc: "System analyzes conversion patterns, benchmarks, saturation levels, and trend signals." },
                { icon: SlidersHorizontal, step: "03", title: "Creative Temperature", desc: "Set risk level from Safe → Balanced → Bold → Trend-Led across styling, color, and pose." },
                { icon: FileText, step: "04", title: "Output Routing", desc: "Receive shot list PDF, platform asset map, creative brief, caption & ad copy." },
              ].map((item) => (
                <div key={item.step} className="bg-surface-white p-8 lg:p-10">
                  <div className="w-10 h-10 rounded-full bg-foreground text-primary-foreground flex items-center justify-center font-sans text-xs font-medium mb-6">
                    {item.step}
                  </div>
                  <item.icon size={24} strokeWidth={1.2} className="text-text-mid mb-4" />
                  <h3 className="font-serif text-xl font-medium text-foreground mb-2">{item.title}</h3>
                  <p className="font-sans text-sm text-text-secondary leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            {/* Flow Diagram */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-4 text-center">
              {["Brand Upload", "AI Analysis", "Creative Temp", "Output Routing"].map((step, i) => (
                <div key={step} className="flex items-center gap-4">
                  <div className="px-6 py-3 border border-divider bg-surface-white">
                    <span className="font-sans text-xs font-medium tracking-wide text-foreground uppercase">{step}</span>
                  </div>
                  {i < 3 && <ArrowRight size={16} className="text-text-caption hidden sm:block" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── OUTPUT ROUTING (PLATFORM TABLE) ── */}
        <section className="py-24 lg:py-32 bg-surface-white">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Platform-Specific</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">Built for Every Platform</h2>
            </div>
            <div className="max-w-4xl mx-auto overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-divider">
                    <th className="font-sans text-xs font-medium tracking-wide text-text-caption uppercase text-left py-4 pr-6">Platform</th>
                    <th className="font-sans text-xs font-medium tracking-wide text-text-caption uppercase text-left py-4 pr-6">Asset Type</th>
                    <th className="font-sans text-xs font-medium tracking-wide text-text-caption uppercase text-left py-4">AI Output</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { platform: "Shopify", asset: "PDP Images", output: "Angle map + sequence" },
                    { platform: "Amazon", asset: "White background + detail compliance", output: "Variation grid" },
                    { platform: "Instagram", asset: "Carousel + Reel plan", output: "Caption hooks" },
                    { platform: "Paid Ads", asset: "Static + UGC hybrid", output: "Ad scripts" },
                    { platform: "Email", asset: "Banner + detail crop", output: "CTA copy" },
                  ].map((row) => (
                    <tr key={row.platform} className="border-b border-divider last:border-0">
                      <td className="font-serif text-lg font-medium text-foreground py-5 pr-6">{row.platform}</td>
                      <td className="font-sans text-sm text-text-secondary py-5 pr-6">{row.asset}</td>
                      <td className="font-sans text-sm text-text-secondary py-5">{row.output}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                Teams adjust creative direction depending on campaign objective — from safe, conversion-proven compositions to bold, trend-setting imagery.
              </p>
              <div className="relative mx-auto max-w-lg mb-8">
                <div className="h-px bg-divider w-full relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-foreground" />
                  <div className="absolute left-1/3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-text-mid" />
                  <div className="absolute left-2/3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-text-mid" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-foreground" />
                  <div className="absolute left-[45%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-foreground border-2 border-primary-foreground" />
                </div>
                <div className="flex justify-between mt-4">
                  <span className="font-sans text-xs text-text-caption uppercase tracking-wide">Safe</span>
                  <span className="font-sans text-xs text-text-caption uppercase tracking-wide">Balanced</span>
                  <span className="font-sans text-xs text-text-caption uppercase tracking-wide">Bold</span>
                  <span className="font-sans text-xs text-text-caption uppercase tracking-wide">Trend-Led</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
                {[
                  { label: "Risk Level", desc: "Low → High" },
                  { label: "Styling Intensity", desc: "Minimal → Maximal" },
                  { label: "Color Contrast", desc: "Neutral → Vibrant" },
                  { label: "Pose & Movement", desc: "Static → Dynamic" },
                ].map((item) => (
                  <div key={item.label} className="p-4 border border-divider">
                    <p className="font-sans text-xs font-medium text-foreground uppercase tracking-wide mb-1">{item.label}</p>
                    <p className="font-sans text-xs text-text-caption">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── WHY IPIX ── */}
        <section className="py-24 lg:py-32 bg-surface-white">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Why iPix</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">Measurable Impact</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-divider">
              {[
                { title: "Right-First-Time Planning", desc: "Reduce reshoots and wasted budget." },
                { title: "Conversion-Aware", desc: "Every shot mapped to sales impact." },
                { title: "Creative Intelligence", desc: "Trend-aware but brand-safe." },
                { title: "Multi-Channel Ready", desc: "No resizing chaos later." },
                { title: "Faster Production", desc: "Walk into shoot day with clarity." },
                { title: "Reusable Assets", desc: "AI identifies modular content blocks." },
              ].map((b) => (
                <div key={b.title} className="bg-surface-white p-8 lg:p-10">
                  <h3 className="font-serif text-lg font-medium text-foreground mb-3">{b.title}</h3>
                  <p className="font-sans text-sm text-text-secondary leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CASE EXAMPLE ── */}
        <section className="py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <img src={clothingCasestudy} alt="Clothing case study" className="w-full h-[450px] object-cover" />
              <div>
                <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Case Example</p>
                <h2 className="font-serif text-4xl font-light text-foreground mb-8">
                  From Idea to Launch<br /><span className="italic">in 7 Days.</span>
                </h2>
                <div className="grid grid-cols-3 gap-6 mb-8">
                  {[
                    { metric: "42→18", label: "Shots Optimized" },
                    { metric: "6", label: "Ad Variants Generated" },
                    { metric: "+28%", label: "PDP Engagement" },
                  ].map((m) => (
                    <div key={m.label}>
                      <p className="font-serif text-3xl font-medium text-foreground">{m.metric}</p>
                      <p className="font-sans text-xs text-text-caption uppercase tracking-wide mt-1">{m.label}</p>
                    </div>
                  ))}
                </div>
                <p className="font-sans text-sm text-text-secondary leading-relaxed mb-6">
                  42 shots reduced to 18 high-impact images. 6 ad variants auto-generated. +28% PDP engagement increase within the first month.
                </p>
                <a href="#" className="font-sans text-sm font-medium tracking-wide text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity uppercase">
                  View Full Case Study →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-24 lg:py-32 bg-surface-white">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-16">
                <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Questions</p>
                <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">FAQ</h2>
              </div>
              <Accordion type="single" collapsible className="space-y-2">
                {[
                  { q: "How does AI decide what to shoot?", a: "Our AI analyzes your brand guidelines, historical content performance, current market trends, and competitor strategies to generate a data-backed shot list optimized for each clothing type and platform." },
                  { q: "Can we control creative direction?", a: "Yes. The Creative Temperature slider lets your team set the level of creative risk — from safe, conversion-proven compositions to bold, trend-setting imagery — across styling, color, pose, and movement." },
                  { q: "Do you handle ghost mannequin and flats?", a: "Absolutely. AI plans the optimal approach for each garment — ghost mannequin for structured items, flats for casual wear, and creative layouts for campaign content." },
                  { q: "Can you scale to large collections?", a: "We handle high-volume clothing shoots with AI-optimized workflows that maintain consistency across hundreds of SKUs per week." },
                  { q: "What platforms do you optimize for?", a: "Shopify, Amazon, Instagram, TikTok, Facebook Ads, Google Shopping, and email campaigns. Each platform receives assets in its optimal format and ratio." },
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
        <section id="contact" className="py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-6">
                Ready to Plan<br />
                <span className="italic">Smarter?</span>
              </h2>
              <p className="font-sans text-base text-text-secondary leading-relaxed max-w-xl mx-auto mb-10">
                Let AI define what to shoot before you step into a studio. Fewer revisions, faster execution, higher conversion.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a href="/#contact" className="font-sans text-sm font-medium tracking-wide bg-foreground text-primary-foreground px-10 py-4 hover:opacity-90 transition-opacity duration-300 uppercase">
                  Start Planning
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

export default ClothingPhotography;
