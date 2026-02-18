import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Camera, Image, Maximize, Smartphone, Grid3X3, ShoppingBag, CheckCircle, ArrowRight, Eye, TrendingUp, DollarSign } from "lucide-react";
import shopifyHero from "@/assets/shopify-hero.jpg";
import shopifyStudio from "@/assets/shopify-studio.jpg";
import shopifyEditorial from "@/assets/shopify-editorial.jpg";
import shopifyDetail from "@/assets/shopify-detail.jpg";
import shopifyMockup from "@/assets/shopify-mockup.jpg";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } } };
const fadeIn = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.8 } } };
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

const AnimatedSection = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} variants={stagger} className={className}>
      {children}
    </motion.div>
  );
};

const deliverables = [
  { icon: Camera, title: "Clean Studio Ecommerce", desc: "Crisp, color-accurate, high-resolution product images optimized for Shopify grids." },
  { icon: Image, title: "Editorial Conversion Frames", desc: "Lifestyle-driven imagery that increases perceived value and average order value." },
  { icon: Eye, title: "Detail & Texture Shots", desc: "Close-ups that communicate craftsmanship, material quality, and luxury positioning." },
  { icon: Maximize, title: "Format Optimization", desc: "Square (1:1) for product grids, Vertical (4:5) for mobile-first, hero banners, and transparent backgrounds." },
];

const shopifyFeatures = [
  "Collection page layouts",
  "Product variant displays",
  "Zoom & hover functionality",
  "Mobile-first design",
  "Conversion funnels",
];

const packages = [
  {
    name: "Shopify Essential",
    skus: "10–25 SKUs",
    features: ["Clean studio photography", "White + neutral background", "Basic retouching", "Shopify-ready exports"],
    audience: "Ideal for emerging brands launching their first collection.",
  },
  {
    name: "Shopify Editorial",
    skus: "25–75 SKUs",
    features: ["Studio + styled editorial", "Lifestyle frames", "Detail shots", "Conversion-based image sequencing"],
    audience: "Ideal for scaling DTC brands.",
    featured: true,
  },
  {
    name: "Shopify Campaign",
    skus: "75+ SKUs",
    features: ["Full art direction", "Model styling", "Campaign visuals", "Homepage + collection banners", "Launch-ready asset system"],
    audience: "Ideal for luxury and premium brands.",
  },
];

const processSteps = [
  { title: "Brand Alignment", desc: "We review your positioning, price point, and customer psychology." },
  { title: "Creative Direction", desc: "Shot list and styling developed for Shopify UX." },
  { title: "Studio Production", desc: "Precision lighting. Luxury finish. Editorial quality." },
  { title: "Retouching & Optimization", desc: "Color accuracy, file optimization, background cleanup." },
  { title: "Delivery", desc: "Shopify-ready files delivered in structured folders." },
];

const ShopifyPhotography = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* ── HERO ── */}
        <section className="pt-32 pb-24 lg:pt-40 lg:pb-32 bg-surface-white">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <AnimatedSection>
                <motion.p variants={fadeUp} className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-6">
                  Shopify Product Photography
                </motion.p>
                <motion.h1 variants={fadeUp} className="font-serif text-5xl md:text-6xl lg:text-7xl font-light text-foreground leading-[1.05] mb-6">
                  Shopify Product<br />Photography —<br />
                  <span className="italic">Designed to Convert.</span>
                </motion.h1>
                <motion.p variants={fadeUp} className="font-sans text-base md:text-lg text-text-secondary leading-relaxed max-w-lg mb-10">
                  Luxury editorial imagery crafted specifically for Shopify storefronts. Elevated aesthetics. Commercial precision. Conversion-driven results.
                </motion.p>
                <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
                  <a href="#contact" className="font-sans text-sm font-medium tracking-wide bg-foreground text-primary-foreground px-8 py-4 hover:opacity-90 transition-opacity duration-300 uppercase">
                    Book Your Shoot
                  </a>
                  <a href="#portfolio" className="font-sans text-sm font-medium tracking-wide border border-foreground text-foreground px-8 py-4 hover:bg-foreground hover:text-primary-foreground transition-colors duration-300 uppercase">
                    View Portfolio
                  </a>
                </motion.div>
              </AnimatedSection>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }}>
                <img src={shopifyHero} alt="Luxury Shopify product photography flat lay" className="w-full h-[500px] lg:h-[650px] object-cover" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── THE DIFFERENCE ── */}
        <section className="py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-6 lg:px-12">
            <AnimatedSection>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div>
                  <motion.p variants={fadeUp} className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">
                    The Difference
                  </motion.p>
                  <motion.h2 variants={fadeUp} className="font-serif text-4xl md:text-5xl font-light text-foreground mb-6">
                    Not just product photos.<br />
                    <span className="italic">Not just white backgrounds.</span>
                  </motion.h2>
                  <motion.p variants={fadeUp} className="font-sans text-base text-text-secondary leading-relaxed mb-8 max-w-lg">
                    We create conversion-optimized, brand-aligned visual systems engineered for Shopify. Because in ecommerce, clarity equals revenue.
                  </motion.p>
                  <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {["Cropped for product grids", "Optimized for mobile", "Styled for brand elevation", "Structured for Shopify UX"].map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <CheckCircle size={16} className="text-foreground mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                        <span className="font-sans text-sm text-text-secondary">{item}</span>
                      </div>
                    ))}
                  </motion.div>
                </div>
                <motion.div variants={fadeIn}>
                  <img src={shopifyStudio} alt="Clean studio ecommerce product photography" className="w-full h-[500px] object-cover" />
                </motion.div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ── WHAT WE DELIVER ── */}
        <section className="py-24 lg:py-32 bg-surface-white">
          <div className="container mx-auto px-6 lg:px-12">
            <AnimatedSection>
              <motion.p variants={fadeUp} className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">
                Service Overview
              </motion.p>
              <motion.h2 variants={fadeUp} className="font-serif text-4xl md:text-5xl font-light text-foreground mb-16">
                What We <span className="italic">Deliver.</span>
              </motion.h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-divider">
                {deliverables.map((d) => (
                  <motion.div key={d.title} variants={fadeUp} className="border-b border-r border-divider p-10 lg:p-12">
                    <d.icon size={28} strokeWidth={1.2} className="text-foreground mb-6" />
                    <h3 className="font-serif text-2xl font-medium text-foreground mb-3">{d.title}</h3>
                    <p className="font-sans text-sm text-text-secondary leading-relaxed">{d.desc}</p>
                  </motion.div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ── EDITORIAL & DETAIL IMAGES ── */}
        <section className="py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-6 lg:px-12">
            <AnimatedSection>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div variants={fadeUp} className="relative">
                  <img src={shopifyEditorial} alt="Editorial lifestyle product photography" className="w-full h-[400px] lg:h-[500px] object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-foreground/60 to-transparent">
                    <p className="font-sans text-xs tracking-[0.2em] text-primary-foreground/80 uppercase">Editorial Frames</p>
                    <p className="font-serif text-xl text-primary-foreground">Lifestyle-Driven Conversion</p>
                  </div>
                </motion.div>
                <motion.div variants={fadeUp} className="relative">
                  <img src={shopifyDetail} alt="Detail and texture close-up product photography" className="w-full h-[400px] lg:h-[500px] object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-foreground/60 to-transparent">
                    <p className="font-sans text-xs tracking-[0.2em] text-primary-foreground/80 uppercase">Detail Shots</p>
                    <p className="font-serif text-xl text-primary-foreground">Craftsmanship & Texture</p>
                  </div>
                </motion.div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ── SHOPIFY PERFORMANCE ── */}
        <section className="py-24 lg:py-32 bg-foreground text-primary-foreground">
          <div className="container mx-auto px-6 lg:px-12">
            <AnimatedSection>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div>
                  <motion.p variants={fadeUp} className="font-sans text-xs font-medium tracking-[0.25em] text-primary-foreground/50 uppercase mb-4">
                    Shopify-Focused Strategy
                  </motion.p>
                  <motion.h2 variants={fadeUp} className="font-serif text-4xl md:text-5xl font-light mb-6">
                    Built for Shopify<br /><span className="italic">Performance.</span>
                  </motion.h2>
                  <motion.p variants={fadeUp} className="font-sans text-base text-primary-foreground/70 leading-relaxed mb-10 max-w-lg">
                    Your visuals are structured to reduce bounce rate and increase add-to-cart rates. Our photography aligns with every aspect of the Shopify experience.
                  </motion.p>
                  <motion.div variants={fadeUp} className="space-y-4">
                    {shopifyFeatures.map((f) => (
                      <div key={f} className="flex items-center gap-3">
                        <ArrowRight size={14} className="text-primary-foreground/50" strokeWidth={1.5} />
                        <span className="font-sans text-sm text-primary-foreground/80">{f}</span>
                      </div>
                    ))}
                  </motion.div>
                </div>
                <motion.div variants={fadeIn}>
                  <img src={shopifyMockup} alt="Shopify storefront with premium product photography" className="w-full h-[400px] lg:h-[500px] object-cover rounded-sm" />
                </motion.div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ── PACKAGES ── */}
        <section id="pricing" className="py-24 lg:py-32 bg-surface-white">
          <div className="container mx-auto px-6 lg:px-12">
            <AnimatedSection>
              <motion.p variants={fadeUp} className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">
                Packages
              </motion.p>
              <motion.h2 variants={fadeUp} className="font-serif text-4xl md:text-5xl font-light text-foreground mb-16">
                Tailored to Your <span className="italic">Scale.</span>
              </motion.h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-divider">
                {packages.map((pkg) => (
                  <motion.div
                    key={pkg.name}
                    variants={fadeUp}
                    className={`border-b md:border-b-0 md:border-r last:border-r-0 border-divider p-10 lg:p-12 ${pkg.featured ? "bg-foreground text-primary-foreground" : ""}`}
                  >
                    <p className={`font-sans text-xs tracking-[0.2em] uppercase mb-2 ${pkg.featured ? "text-primary-foreground/50" : "text-text-caption"}`}>
                      {pkg.skus}
                    </p>
                    <h3 className="font-serif text-2xl font-medium mb-6">{pkg.name}</h3>
                    <ul className="space-y-3 mb-8">
                      {pkg.features.map((f) => (
                        <li key={f} className="flex items-start gap-3">
                          <CheckCircle size={14} className={`mt-0.5 flex-shrink-0 ${pkg.featured ? "text-primary-foreground/60" : "text-foreground"}`} strokeWidth={1.5} />
                          <span className={`font-sans text-sm ${pkg.featured ? "text-primary-foreground/80" : "text-text-secondary"}`}>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <p className={`font-sans text-xs italic ${pkg.featured ? "text-primary-foreground/50" : "text-text-caption"}`}>
                      {pkg.audience}
                    </p>
                  </motion.div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ── PROCESS ── */}
        <section className="py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-6 lg:px-12">
            <AnimatedSection>
              <motion.p variants={fadeUp} className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">
                Our Refined Workflow
              </motion.p>
              <motion.h2 variants={fadeUp} className="font-serif text-4xl md:text-5xl font-light text-foreground mb-16">
                From Brief to<br /><span className="italic">Brilliant.</span>
              </motion.h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-0 border-t border-divider">
                {processSteps.map((step, i) => (
                  <motion.div key={step.title} variants={fadeUp} className="border-b md:border-b-0 md:border-r last:border-r-0 border-divider p-8">
                    <span className="font-sans text-xs font-medium tracking-[0.2em] text-text-caption uppercase">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-serif text-lg font-medium text-foreground mt-4 mb-3">{step.title}</h3>
                    <p className="font-sans text-sm text-text-secondary leading-relaxed">{step.desc}</p>
                  </motion.div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ── CONVERSION PSYCHOLOGY ── */}
        <section className="py-24 lg:py-32 bg-surface-white">
          <div className="container mx-auto px-6 lg:px-12">
            <AnimatedSection>
              <div className="max-w-3xl mx-auto text-center">
                <motion.p variants={fadeUp} className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">
                  Why It Matters
                </motion.p>
                <motion.h2 variants={fadeUp} className="font-serif text-4xl md:text-5xl font-light text-foreground mb-8">
                  Why Premium Photography<br /><span className="italic">Matters.</span>
                </motion.h2>
                <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16">
                  {[
                    { icon: Eye, stat: "Better images", label: "increase trust" },
                    { icon: TrendingUp, stat: "Trust", label: "increases conversion" },
                    { icon: DollarSign, stat: "Conversion", label: "increases revenue" },
                  ].map((item) => (
                    <div key={item.stat} className="text-center">
                      <item.icon size={32} strokeWidth={1} className="text-foreground mx-auto mb-4" />
                      <p className="font-serif text-2xl font-medium text-foreground mb-1">{item.stat}</p>
                      <p className="font-sans text-sm text-text-secondary">{item.label}</p>
                    </div>
                  ))}
                </motion.div>
                <motion.p variants={fadeUp} className="font-sans text-base text-text-secondary leading-relaxed mt-12 max-w-xl mx-auto">
                  Luxury positioning requires visual discipline. Every pixel communicates value.
                </motion.p>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-6 lg:px-12">
            <AnimatedSection>
              <div className="max-w-3xl mx-auto">
                <motion.p variants={fadeUp} className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">
                  FAQ
                </motion.p>
                <motion.h2 variants={fadeUp} className="font-serif text-4xl md:text-5xl font-light text-foreground mb-12">
                  Common <span className="italic">Questions.</span>
                </motion.h2>
                <motion.div variants={fadeUp}>
                  <Accordion type="single" collapsible className="space-y-0">
                    {[
                      { q: "Do you shoot for Shopify specifically?", a: "Yes. Every image is formatted, cropped, and optimized specifically for Shopify's product grid, detail pages, zoom functionality, and mobile experience." },
                      { q: "What formats do you deliver?", a: "We deliver in Square (1:1) for product grids, Vertical (4:5) for mobile-first design, hero banners, and transparent PNG backgrounds — all Shopify-ready." },
                      { q: "Can you handle large product catalogs?", a: "Absolutely. Our Campaign package handles 75+ SKUs with full art direction, model styling, and launch-ready asset systems." },
                      { q: "Do you provide retouching?", a: "Yes — color accuracy, background cleanup, file optimization, and conversion-focused post-production are included in every package." },
                      { q: "What's the typical turnaround?", a: "Essential packages deliver within 5–7 business days. Editorial and Campaign packages typically take 10–14 business days depending on scope." },
                    ].map((faq, i) => (
                      <AccordionItem key={i} value={`faq-${i}`} className="border-b border-divider">
                        <AccordionTrigger className="font-serif text-lg text-foreground py-6 hover:no-underline">
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
            </AnimatedSection>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section id="contact" className="py-24 lg:py-32 bg-foreground text-primary-foreground">
          <div className="container mx-auto px-6 lg:px-12">
            <AnimatedSection>
              <div className="max-w-3xl mx-auto text-center">
                <motion.h2 variants={fadeUp} className="font-serif text-4xl md:text-5xl lg:text-6xl font-light mb-6">
                  Ready to Elevate<br />Your Shopify <span className="italic">Store?</span>
                </motion.h2>
                <motion.p variants={fadeUp} className="font-sans text-base text-primary-foreground/70 leading-relaxed max-w-xl mx-auto mb-4">
                  Your product deserves more than basic photography. It deserves imagery that sells.
                </motion.p>
                <motion.p variants={fadeUp} className="font-sans text-xs text-primary-foreground/40 mb-10">
                  Limited productions per month to maintain exclusivity.
                </motion.p>
                <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a href="mailto:hello@ipixstudio.com" className="font-sans text-sm font-medium tracking-wide bg-primary-foreground text-foreground px-10 py-4 hover:opacity-90 transition-opacity duration-300 uppercase">
                    Book Your Shopify Shoot
                  </a>
                  <a href="mailto:hello@ipixstudio.com" className="font-sans text-sm font-medium tracking-wide border border-primary-foreground/30 text-primary-foreground px-10 py-4 hover:bg-primary-foreground/10 transition-colors duration-300 uppercase">
                    Schedule a Consultation
                  </a>
                </motion.div>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ShopifyPhotography;
