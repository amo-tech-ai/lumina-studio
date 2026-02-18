import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Gem, Camera, Sparkles, Eye, Package, ShoppingBag, Monitor, Megaphone, Layers, FileCheck, CheckCircle, Zap, Search, Focus, Image } from "lucide-react";
import jewelleryHero from "@/assets/jewellery-hero.jpg";
import jewelleryMacro from "@/assets/jewellery-macro.jpg";
import jewelleryLifestyle from "@/assets/jewellery-lifestyle.jpg";
import jewelleryPackaging from "@/assets/jewellery-packaging.jpg";
import jewelleryEcommerce from "@/assets/jewellery-ecommerce.jpg";
import portfolioJewellery from "@/assets/portfolio-jewellery.jpg";
import portfolioWatch from "@/assets/portfolio-watch.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const staggerContainer = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const AnimatedSection = ({ children, className, style, id }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; id?: string }) => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      id={id}
      className={className}
      style={style}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={staggerContainer}
    >
      {children}
    </motion.section>
  );
};

const JewelleryPhotography = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* ── HERO ── */}
        <section className="relative min-h-screen flex items-center">
          <img src={jewelleryHero} alt="Luxury jewellery macro photography" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-foreground/50" />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="relative z-10 container mx-auto px-6 lg:px-12 pt-20"
          >
            <div className="max-w-2xl">
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-primary-foreground/70 uppercase mb-6">
                Jewellery Photography
              </p>
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-light text-primary-foreground leading-[1.05] mb-6">
                Every Facet.<br />
                <span className="italic">Perfectly Captured.</span>
              </h1>
              <p className="font-sans text-base md:text-lg text-primary-foreground/80 leading-relaxed max-w-lg mb-10">
                Precision macro photography and AI-driven content planning for luxury jewellery brands. From diamond close-ups to lifestyle campaigns — imagery that sells.
              </p>
              <div className="flex flex-wrap gap-4 mb-6">
                <a href="#contact" className="font-sans text-sm font-medium tracking-wide bg-primary-foreground text-foreground px-8 py-4 hover:opacity-90 transition-opacity duration-300 uppercase">
                  Plan My Shoot
                </a>
                <a href="#portfolio" className="font-sans text-sm font-medium tracking-wide border border-primary-foreground text-primary-foreground px-8 py-4 hover:bg-primary-foreground hover:text-foreground transition-colors duration-300 uppercase">
                  View Portfolio
                </a>
              </div>
              <p className="font-sans text-xs text-primary-foreground/60 tracking-wide">
                Macro precision. Campaign-ready.
              </p>
            </div>
          </motion.div>
        </section>

        {/* ── WHY JEWELLERY PHOTOGRAPHY MATTERS ── */}
        <AnimatedSection className="py-24 lg:py-32" style={{ backgroundColor: "hsl(40 14% 96%)" }}>
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div variants={fadeUp} transition={{ duration: 0.6 }}>
                <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">The Challenge</p>
                <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-6">
                  Why Jewellery Is<br /><span className="italic">the Hardest to Shoot</span>
                </h2>
                <p className="font-sans text-base text-text-secondary leading-relaxed max-w-md mb-8">
                  Reflective surfaces, microscopic details, and the need to convey luxury through a screen — jewellery photography demands technical mastery and creative vision in equal measure.
                </p>
                <ul className="space-y-3 mb-8">
                  {["Reflective surface management", "Micro-detail at macro scale", "Colour accuracy for gemstones", "Luxury perception through imagery"].map((item) => (
                    <li key={item} className="font-sans text-sm text-text-secondary flex items-center gap-3">
                      <CheckCircle size={14} className="text-text-mid shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a href="#types" className="font-sans text-sm font-medium tracking-wide text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity uppercase">
                  See Image Types →
                </a>
              </motion.div>
              <motion.div variants={fadeUp} transition={{ duration: 0.6, delay: 0.2 }} className="grid grid-cols-2 gap-2">
                <img src={jewelleryMacro} alt="Macro jewellery detail" className="w-full h-64 object-cover" />
                <img src={jewelleryLifestyle} alt="Jewellery lifestyle flat lay" className="w-full h-64 object-cover" />
                <img src={jewelleryPackaging} alt="Luxury jewellery packaging" className="w-full h-64 object-cover" />
                <img src={jewelleryEcommerce} alt="Jewellery ecommerce product" className="w-full h-64 object-cover" />
              </motion.div>
            </div>
          </div>
        </AnimatedSection>

        {/* ── MACRO DETAIL SECTION ── */}
        <AnimatedSection className="py-24 lg:py-32 bg-surface-white">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">
              <img src={jewelleryMacro} alt="Extreme macro jewellery photography" className="w-full h-[450px] lg:h-[600px] object-cover" />
              <div className="bg-background p-10 lg:p-16 flex flex-col justify-center">
                <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-3">01 — Macro Detail</p>
                <h3 className="font-serif text-3xl md:text-4xl font-light text-foreground mb-4">
                  Every Facet.<br /><span className="italic">Every Stone.</span>
                </h3>
                <p className="font-sans text-base text-text-secondary leading-relaxed mb-6">
                  Our macro photography reveals the artistry invisible to the naked eye — the precision of prong settings, the fire within a diamond, the texture of hammered gold. These details communicate craftsmanship and justify premium pricing.
                </p>
                <ul className="space-y-2 mb-6">
                  {["Focus stacking for infinite depth of field", "Controlled reflection management", "True-to-life colour reproduction", "8K capture for extreme crop flexibility"].map((item) => (
                    <li key={item} className="font-sans text-sm text-text-secondary flex items-center gap-2">
                      <CheckCircle size={12} className="text-text-mid shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a href="#contact" className="font-sans text-sm font-medium tracking-wide text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity uppercase">
                  Book Macro Session →
                </a>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* ── LIFESTYLE FLAT-LAY ── */}
        <AnimatedSection className="py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">
              <div className="bg-surface-white p-10 lg:p-16 flex flex-col justify-center order-2 lg:order-1">
                <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-3">02 — Lifestyle & Flat-Lay</p>
                <h3 className="font-serif text-3xl md:text-4xl font-light text-foreground mb-4">
                  Context Creates<br /><span className="italic">Desire.</span>
                </h3>
                <p className="font-sans text-base text-text-secondary leading-relaxed mb-6">
                  Lifestyle flat-lays place your pieces in aspirational contexts — marble surfaces, soft morning light, curated styling props. These images drive social engagement and editorial features.
                </p>
                <ul className="space-y-2 mb-6">
                  {["Curated prop styling & art direction", "Natural light & studio hybrid setups", "Instagram-ready compositions", "Editorial magazine quality"].map((item) => (
                    <li key={item} className="font-sans text-sm text-text-secondary flex items-center gap-2">
                      <CheckCircle size={12} className="text-text-mid shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a href="#contact" className="font-sans text-sm font-medium tracking-wide text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity uppercase">
                  Plan Lifestyle Shoot →
                </a>
              </div>
              <img src={jewelleryLifestyle} alt="Jewellery lifestyle flat lay photography" className="w-full h-[450px] lg:h-[600px] object-cover order-1 lg:order-2" />
            </div>
          </div>
        </AnimatedSection>

        {/* ── PACKAGING PHOTOGRAPHY ── */}
        <AnimatedSection className="py-24 lg:py-32 bg-surface-white">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">
              <img src={jewelleryPackaging} alt="Luxury jewellery packaging photography" className="w-full h-[450px] lg:h-[600px] object-cover" />
              <div className="bg-background p-10 lg:p-16 flex flex-col justify-center">
                <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-3">03 — Packaging & Unboxing</p>
                <h3 className="font-serif text-3xl md:text-4xl font-light text-foreground mb-4">
                  The Experience<br /><span className="italic">Before the Piece.</span>
                </h3>
                <p className="font-sans text-base text-text-secondary leading-relaxed mb-6">
                  Luxury begins with the presentation. Our packaging photography captures the anticipation of unboxing — the velvet interior, the branded box, the tissue paper reveal. This imagery drives gifting sales and elevates perceived value.
                </p>
                <ul className="space-y-2 mb-6">
                  {["Unboxing sequence photography", "Gift-ready presentation styling", "Brand identity integration", "Social-ready vertical formats"].map((item) => (
                    <li key={item} className="font-sans text-sm text-text-secondary flex items-center gap-2">
                      <CheckCircle size={12} className="text-text-mid shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a href="#contact" className="font-sans text-sm font-medium tracking-wide text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity uppercase">
                  Plan Packaging Shoot →
                </a>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* ── IMAGE TYPES GRID ── */}
        <AnimatedSection id="types" className="py-24 lg:py-32" style={{ backgroundColor: "hsl(40 14% 96%)" }}>
          <div className="container mx-auto px-6 lg:px-12">
            <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-16">
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Deliverables</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">Image Types That Sell</h2>
            </motion.div>
            <motion.div variants={fadeUp} transition={{ duration: 0.5, delay: 0.15 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-divider">
              {[
                { icon: Focus, title: "Hero Packshots", desc: "White background, marketplace compliant, clarity-optimized for maximum conversion." },
                { icon: Search, title: "Macro Close-Ups", desc: "Texture, settings, stone clarity — the details that justify premium pricing." },
                { icon: Image, title: "Lifestyle Context", desc: "Flat-lays and styled scenes that create aspiration and social engagement." },
                { icon: Package, title: "Packaging & Unboxing", desc: "Gift-ready presentation that elevates perceived value and drives gifting sales." },
                { icon: Eye, title: "On-Model Imagery", desc: "Scale, drape, and wearability — showing how pieces live on the body." },
                { icon: Sparkles, title: "360° & Video", desc: "Motion content that captures light play, brilliance, and the full story of each piece." },
              ].map((item) => (
                <div key={item.title} className="bg-surface-white p-8 lg:p-10 group hover:bg-background transition-colors duration-500">
                  <item.icon size={28} strokeWidth={1.2} className="text-text-mid mb-6 group-hover:text-foreground transition-colors duration-300" />
                  <h3 className="font-serif text-xl font-medium text-foreground mb-3">{item.title}</h3>
                  <p className="font-sans text-sm text-text-secondary leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </AnimatedSection>

        {/* ── iPIX ADVANTAGE (Dark) ── */}
        <AnimatedSection className="py-24 lg:py-32 bg-foreground text-primary-foreground">
          <div className="container mx-auto px-6 lg:px-12">
            <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-16">
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-primary-foreground/50 uppercase mb-4">What Makes Us Different</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light">
                Technical Mastery Meets<br /><span className="italic">AI Intelligence.</span>
              </h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px">
              {[
                { stage: "Stage 1", title: "Precision Production", items: ["Focus stacking & macro rigs", "Controlled lighting environments", "Colour-calibrated workflow", "Reflection management expertise"] },
                { stage: "Stage 2", title: "AI-Powered Planning", items: ["SKU-level shot list generation", "Competitor visual analysis", "Platform-specific asset planning", "Brand-consistency scoring"] },
                { stage: "Stage 3", title: "Multi-Channel Output", items: ["Marketplace-ready formats", "Social media crops & ratios", "Website hero & PDP images", "Wholesale catalogue assets"] },
              ].map((card, i) => (
                <motion.div key={card.stage} variants={fadeUp} transition={{ duration: 0.5, delay: i * 0.1 }} className="bg-primary-foreground/5 p-10 lg:p-12">
                  <p className="font-sans text-xs font-medium tracking-[0.25em] text-primary-foreground/40 uppercase mb-4">{card.stage}</p>
                  <h3 className="font-serif text-2xl font-medium text-primary-foreground mb-6">{card.title}</h3>
                  <ul className="space-y-3">
                    {card.items.map((item) => (
                      <li key={item} className="font-sans text-sm text-primary-foreground/70 flex items-start gap-2">
                        <CheckCircle size={14} className="text-primary-foreground/40 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
            <motion.p variants={fadeIn} transition={{ duration: 0.5, delay: 0.4 }} className="font-sans text-center text-sm text-primary-foreground/50 mt-10 tracking-wide">
              One shoot → Every channel. Every marketplace.
            </motion.p>
          </div>
        </AnimatedSection>

        {/* ── HOW IT WORKS ── */}
        <AnimatedSection id="process" className="py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-6 lg:px-12">
            <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-16">
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">How It Works</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">Jewellery Shoot Workflow</h2>
            </motion.div>
            <div className="max-w-2xl mx-auto">
              {[
                { step: "01", title: "Brand & Product Brief", desc: "We analyse your collection, brand positioning, and target channels." },
                { step: "02", title: "AI Shot List Generation", desc: "Platform-specific shot lists, lighting plans, and prop recommendations." },
                { step: "03", title: "Studio Production", desc: "Macro rigs, focus stacking, and controlled lighting for flawless capture." },
                { step: "04", title: "Retouching & Grading", desc: "Reflection cleanup, colour accuracy, and format-specific optimisation." },
                { step: "05", title: "Multi-Format Delivery", desc: "Assets delivered for web, marketplace, social, wholesale, and print." },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  variants={fadeUp}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`flex gap-8 ${i < 4 ? "pb-12 border-l border-divider ml-4" : "ml-4"}`}
                >
                  <div className="w-8 h-8 rounded-full bg-foreground text-primary-foreground flex items-center justify-center font-sans text-xs font-medium -ml-4 shrink-0">
                    {item.step}
                  </div>
                  <div className="pt-1">
                    <h3 className="font-serif text-xl font-medium text-foreground mb-1">{item.title}</h3>
                    <p className="font-sans text-sm text-text-secondary">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* ── MULTI-CHANNEL OUTPUT ── */}
        <AnimatedSection className="py-24 lg:py-32 bg-surface-white">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div variants={fadeUp} transition={{ duration: 0.6 }}>
                <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Multi-Channel Strategy</p>
                <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-6">
                  One Collection Shoot.<br /><span className="italic">Every Platform Covered.</span>
                </h2>
                <p className="font-sans text-base text-text-secondary leading-relaxed max-w-md mb-8">
                  A single jewellery session produces assets optimised for every sales and marketing channel — from your website hero to Amazon compliance to Instagram Reels.
                </p>
                <a href="#contact" className="font-sans text-sm font-medium tracking-wide bg-foreground text-primary-foreground px-8 py-4 hover:opacity-90 transition-opacity duration-300 uppercase inline-block">
                  Plan Multi-Channel Shoot
                </a>
              </motion.div>
              <motion.div variants={fadeUp} transition={{ duration: 0.6, delay: 0.15 }} className="grid grid-cols-2 gap-4">
                {[
                  { icon: Monitor, label: "Website Hero" },
                  { icon: ShoppingBag, label: "Shopify PDP" },
                  { icon: Megaphone, label: "Paid Ads" },
                  { icon: Layers, label: "Amazon Listings" },
                  { icon: FileCheck, label: "Wholesale Catalogue" },
                  { icon: Zap, label: "Social Content" },
                ].map((item) => (
                  <div key={item.label} className="p-6 bg-background border border-divider flex items-center gap-4">
                    <item.icon size={20} strokeWidth={1.2} className="text-text-mid shrink-0" />
                    <span className="font-sans text-sm font-medium text-foreground">{item.label}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </AnimatedSection>

        {/* ── PERFORMANCE METRICS (Dark) ── */}
        <AnimatedSection className="py-24 lg:py-32 bg-foreground text-primary-foreground">
          <div className="container mx-auto px-6 lg:px-12">
            <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-16">
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-primary-foreground/50 uppercase mb-4">Measurable Impact</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light">Built for Results</h2>
            </motion.div>
            <motion.div variants={fadeUp} transition={{ duration: 0.5, delay: 0.15 }} className="grid grid-cols-1 md:grid-cols-3 gap-px">
              {[
                { stat: "+34%", label: "Average increase in click-through rate for jewellery listings" },
                { stat: "+22%", label: "Higher conversion on optimised product detail pages" },
                { stat: "45%", label: "Fewer reshoots with AI-planned shot lists" },
              ].map((item) => (
                <div key={item.stat} className="bg-primary-foreground/5 p-10 lg:p-12 text-center">
                  <p className="font-serif text-5xl md:text-6xl font-light text-primary-foreground mb-4">{item.stat}</p>
                  <p className="font-sans text-sm text-primary-foreground/60 leading-relaxed">{item.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </AnimatedSection>

        {/* ── PORTFOLIO SHOWCASE ── */}
        <AnimatedSection id="portfolio" className="py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-6 lg:px-12">
            <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-16">
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Selected Work</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">Jewellery Portfolio</h2>
            </motion.div>
            <motion.div variants={fadeUp} transition={{ duration: 0.6, delay: 0.15 }} className="grid grid-cols-2 lg:grid-cols-3 gap-1">
              {[jewelleryMacro, jewelleryLifestyle, jewelleryPackaging, jewelleryEcommerce, portfolioJewellery, portfolioWatch].map((src, i) => (
                <div key={i} className="relative group overflow-hidden cursor-pointer aspect-[4/5]">
                  <img src={src} alt={`Jewellery portfolio ${i + 1}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-500" />
                </div>
              ))}
            </motion.div>
          </div>
        </AnimatedSection>

        {/* ── FAQ ── */}
        <AnimatedSection className="py-24 lg:py-32 bg-surface-white">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="max-w-2xl mx-auto">
              <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-16">
                <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Common Questions</p>
                <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">FAQ</h2>
              </motion.div>
              <motion.div variants={fadeUp} transition={{ duration: 0.5, delay: 0.15 }}>
                <Accordion type="single" collapsible className="w-full">
                  {[
                    { q: "What types of jewellery do you photograph?", a: "We photograph all categories — rings, necklaces, bracelets, earrings, watches, and bespoke pieces. From fine jewellery to fashion accessories, we adapt our technique to your product." },
                    { q: "How do you handle reflective surfaces?", a: "We use specialised lighting tents, diffusion panels, and focus stacking rigs designed specifically for reflective jewellery. Every reflection is controlled to showcase the piece, not distort it." },
                    { q: "Can you match specific brand colour standards?", a: "Absolutely. We work with colour-calibrated monitors and use X-Rite colour charts in every session. Your gemstone colours will be true-to-life across all screens and print." },
                    { q: "How many images per day?", a: "A typical jewellery session produces 20–40+ final retouched images. Volume depends on complexity — macro detail shots take more time than packshots." },
                    { q: "Do you provide images for Amazon and Shopify?", a: "Yes. Every delivery includes marketplace-compliant formats with correct dimensions, backgrounds, and file specifications for Amazon, Shopify, Etsy, and other platforms." },
                    { q: "What is the turnaround time?", a: "Standard delivery is 5–7 business days. Rush delivery within 48 hours is available for an additional fee." },
                  ].map((faq, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="border-divider">
                      <AccordionTrigger className="font-serif text-lg text-foreground hover:no-underline py-6">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="font-sans text-sm text-text-secondary leading-relaxed pb-6">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            </div>
          </div>
        </AnimatedSection>

        {/* ── FINAL CTA ── */}
        <AnimatedSection id="contact" className="py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-6 lg:px-12 text-center">
            <motion.h2 variants={fadeUp} transition={{ duration: 0.6 }} className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-6">
              Ready to Showcase<br /><span className="italic">Your Collection?</span>
            </motion.h2>
            <motion.p variants={fadeUp} transition={{ duration: 0.5, delay: 0.1 }} className="font-sans text-base text-text-secondary leading-relaxed max-w-lg mx-auto mb-10">
              Every facet deserves to be seen. Let's create imagery that captures the artistry of your jewellery — and converts browsers into buyers.
            </motion.p>
            <motion.a variants={fadeUp} transition={{ duration: 0.5, delay: 0.2 }} href="mailto:hello@ipixstudio.com" className="font-sans text-sm font-medium tracking-wide bg-foreground text-primary-foreground px-10 py-4 hover:opacity-90 transition-opacity duration-300 uppercase inline-block">
              Start Your Shoot
            </motion.a>
          </div>
        </AnimatedSection>
      </main>
      <Footer />
    </div>
  );
};

export default JewelleryPhotography;
