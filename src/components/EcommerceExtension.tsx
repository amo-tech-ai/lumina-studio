import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, BarChart3, Camera, Search, Layers, Video, Image, ZoomIn, GitCompare, Zap, ArrowRight, CheckCircle } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import ecommerceHero from "@/assets/ecommerce-hero.jpg";
import ecommerceStudio from "@/assets/ecommerce-studio.jpg";
import ecommerceCasestudy from "@/assets/ecommerce-casestudy.jpg";
import portfolioProduct from "@/assets/portfolio-product.jpg";
import portfolioEcommerce from "@/assets/portfolio-ecommerce.jpg";
import portfolioStilllife from "@/assets/portfolio-stilllife.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const temperatureLabels = ["Safe", "Balanced", "Bold"];
const temperatureDescriptions = [
  "Conversion-optimized, data-backed visuals. Clean, compliant, proven to perform.",
  "Marketplace-ready with brand personality. The sweet spot for most brands.",
  "Campaign-level, trend-driven impact. Stand out from the category.",
];

const sliderImages = [ecommerceHero, portfolioProduct, portfolioEcommerce, portfolioStilllife, ecommerceCasestudy];

const EcommerceExtension = () => {
  const [tempValue, setTempValue] = useState([50]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const tempIndex = tempValue[0] < 33 ? 0 : tempValue[0] < 66 ? 1 : 2;

  return (
    <>
      {/* ── 1. AI-POWERED SHOOT PLANNING ── */}
      <section className="py-24 lg:py-32 bg-[#F5F5F5]">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-6">
                AI-Powered Planning
              </p>
              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-foreground leading-[1.08] mb-6">
                Plan Smarter.<br />
                <span className="italic">Shoot Once.</span>
              </h2>
              <div className="space-y-4 mb-8">
                <p className="font-sans text-base text-text-secondary leading-relaxed max-w-lg">
                  Traditional studios focus on production. iPix plans what to shoot before you step on set.
                </p>
                <p className="font-sans text-base text-text-secondary leading-relaxed max-w-lg">
                  Our AI analyzes your brand style guide, past performance data, Amazon listing requirements, and current marketplace trends — then generates a platform-ready shot list tailored to conversion.
                </p>
                <p className="font-sans text-sm font-medium text-foreground">
                  Less guesswork. Fewer revisions. Higher ROI.
                </p>
              </div>
              <a
                href="#contact"
                className="font-sans text-sm font-medium tracking-wide bg-foreground text-primary-foreground px-8 py-4 hover:opacity-90 transition-opacity duration-300 uppercase inline-block"
              >
                See AI Planning in Action
              </a>
            </motion.div>

            <motion.div variants={fadeUp} className="relative">
              <div className="bg-surface-white border border-divider p-8 lg:p-10">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-accent" />
                  <div className="w-3 h-3 rounded-full bg-muted-foreground/40" />
                  <span className="font-sans text-xs text-text-caption ml-2">iPix AI Planner</span>
                </div>
                <div className="space-y-4">
                  {["Brand Analysis Complete", "SKU Mapping: 48 products", "Shot List Generated: 127 frames", "Platform Optimization: Amazon, Shopify, Meta"].map((line, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle size={14} className="text-foreground shrink-0" />
                      <span className="font-sans text-sm text-text-secondary">{line}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-divider">
                  <div className="flex justify-between text-xs font-sans text-text-caption mb-2">
                    <span>Planning Progress</span>
                    <span>100%</span>
                  </div>
                  <div className="w-full h-1.5 bg-divider rounded-full overflow-hidden">
                    <div className="h-full w-full bg-foreground rounded-full" />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── 2. AMAZON OPTIMIZATION ── */}
      <section className="py-24 lg:py-32 bg-background relative overflow-hidden">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">
              Amazon-Ready
            </p>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-6">
              Optimized for <span className="italic">Amazon.</span>
            </h2>
            <p className="font-sans text-base text-text-secondary leading-relaxed max-w-xl mx-auto mb-4">
              Amazon doesn't reward pretty images. It rewards performance. We plan and produce every asset for ranking, clicks, and conversions.
            </p>
          </motion.div>

          {/* Image slider */}
          <div className="relative mb-12">
            <div className="overflow-hidden">
              <motion.div
                className="flex gap-4 transition-transform duration-500"
                animate={{ x: `-${currentSlide * 82}%` }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              >
                {sliderImages.map((src, i) => (
                  <div key={i} className="min-w-[80%] md:min-w-[60%] lg:min-w-[40%] aspect-[4/3] relative group flex-shrink-0">
                    <img
                      src={src}
                      alt={`Amazon optimized product ${i + 1}`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-500" />
                  </div>
                ))}
              </motion.div>
            </div>
            <div className="flex justify-center gap-2 mt-6">
              {sliderImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentSlide ? "bg-foreground w-6" : "bg-divider"}`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
            {["Main Images", "Infographics", "Lifestyle Shots", "Comparison Graphics", "A+ Content"].map((item) => (
              <div key={item} className="text-center p-4 border border-divider bg-surface-white">
                <span className="font-sans text-xs font-medium tracking-wide text-foreground uppercase">{item}</span>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <a href="#contact" className="font-sans text-sm font-medium tracking-wide border border-foreground text-foreground px-8 py-4 hover:bg-foreground hover:text-primary-foreground transition-colors duration-300 uppercase inline-block">
              Request Amazon Strategy
            </a>
          </div>
        </div>
      </section>

      {/* ── 3. IMAGE TYPES GRID ── */}
      <section className="py-24 lg:py-32 bg-surface-white">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Content Types</p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">Image Types That <span className="italic">Sell</span></h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {[
              { icon: Camera, title: "Hero Packshots", desc: "White background, Amazon compliant, optimized for clarity and maximum click-through." },
              { icon: Layers, title: "Infographic Explainers", desc: "Feature callouts, dimension graphics, benefit overlays that communicate value instantly." },
              { icon: Image, title: "Lifestyle Context", desc: "Show your product in real-world use. Build emotional connection and trust." },
              { icon: ZoomIn, title: "Detail Close-Ups", desc: "Texture, stitching, materials, craftsmanship. Prove quality at pixel level." },
              { icon: GitCompare, title: "Comparison Graphics", desc: "Highlight advantages over competitors. Visual proof of superiority." },
              { icon: Video, title: "Video Snippets", desc: "Short-form motion content for ads and listings. 6–15 second product reveals." },
            ].map((item) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className="group p-8 bg-background border border-divider hover:border-foreground/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-default"
              >
                <item.icon size={28} strokeWidth={1.2} className="text-text-mid mb-5 group-hover:text-foreground transition-colors" />
                <h3 className="font-serif text-xl font-medium text-foreground mb-3">{item.title}</h3>
                <p className="font-sans text-sm text-text-secondary leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 4. CREATIVE TEMPERATURE (Interactive) ── */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            className="max-w-2xl mx-auto text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">
              Creative Control
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-6">
              Control Your Creative <span className="italic">Direction</span>
            </h2>
            <p className="font-sans text-base text-text-secondary leading-relaxed max-w-xl mx-auto mb-12">
              Set your Creative Temperature. You decide how far to push the creative.
            </p>

            <div className="bg-surface-white border border-divider p-8 lg:p-12 mb-8">
              <div className="flex justify-between mb-3">
                {temperatureLabels.map((label, i) => (
                  <span
                    key={label}
                    className={`font-sans text-xs uppercase tracking-wide transition-colors duration-300 ${i === tempIndex ? "text-foreground font-medium" : "text-text-caption"}`}
                  >
                    {label}
                  </span>
                ))}
              </div>

              <Slider
                value={tempValue}
                onValueChange={setTempValue}
                max={100}
                step={1}
                className="mb-6"
              />

              <motion.p
                key={tempIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-sans text-sm text-text-secondary leading-relaxed"
              >
                {temperatureDescriptions[tempIndex]}
              </motion.p>
            </div>

            <a href="#contact" className="font-sans text-sm font-medium tracking-wide text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity uppercase">
              Adjust Your Creative Temperature →
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── 5. WORKFLOW (4-Step) ── */}
      <section className="py-24 lg:py-32 bg-surface-white">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Process</p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">How It <span className="italic">Works</span></h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-divider"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {[
              { step: "01", title: "Strategy", desc: "AI analyzes your brand and marketplace positioning.", icon: Brain },
              { step: "02", title: "Planning", desc: "You receive a platform-specific shot list.", icon: Search },
              { step: "03", title: "Production", desc: "Shoot executed with clarity and precision.", icon: Camera },
              { step: "04", title: "Delivery", desc: "Optimized assets ready for Amazon, Shopify, and Ads.", icon: Zap },
            ].map((item) => (
              <motion.div key={item.step} variants={fadeUp} className="bg-surface-white p-8 lg:p-10 text-center">
                <div className="w-12 h-12 rounded-full bg-foreground text-primary-foreground flex items-center justify-center font-sans text-sm font-medium mx-auto mb-6">
                  {item.step}
                </div>
                <item.icon size={24} strokeWidth={1.2} className="text-text-mid mx-auto mb-4" />
                <h3 className="font-serif text-xl font-medium text-foreground mb-3">{item.title}</h3>
                <p className="font-sans text-sm text-text-secondary leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 6. PERFORMANCE METRICS ── */}
      <section className="py-24 lg:py-32 bg-foreground">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <p className="font-sans text-xs font-medium tracking-[0.25em] text-primary-foreground/50 uppercase mb-4">
              Results
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-primary-foreground">
              Built for <span className="italic">Results</span>
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-12 lg:gap-20 max-w-3xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {[
              { metric: "+27%", label: "Average Increase in Click-Through Rate" },
              { metric: "+18%", label: "Higher Conversion on Optimized Listings" },
              { metric: "40%", label: "Fewer Reshoots with AI Planning" },
            ].map((item) => (
              <motion.div key={item.label} variants={fadeUp} className="text-center">
                <p className="font-serif text-5xl md:text-6xl font-light text-primary-foreground mb-3">{item.metric}</p>
                <p className="font-sans text-xs text-primary-foreground/60 uppercase tracking-wide leading-relaxed">{item.label}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.p
            className="font-sans text-sm text-primary-foreground/40 text-center mt-12 tracking-wide"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            Performance over aesthetics. Every time.
          </motion.p>
        </div>
      </section>

      {/* ── 7. FINAL CTA ── */}
      <section className="py-24 lg:py-32 bg-surface-white">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-6">
              Ready to Increase <span className="italic">Sales?</span>
            </h2>
            <p className="font-sans text-base text-text-secondary leading-relaxed max-w-xl mx-auto mb-10">
              Your product deserves images that convert. Let's plan it right the first time.
            </p>
            <a
              href="/#contact"
              className="font-sans text-sm font-medium tracking-wide bg-foreground text-primary-foreground px-10 py-4 hover:opacity-90 transition-opacity duration-300 uppercase inline-block"
            >
              Get a Custom Quote
            </a>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default EcommerceExtension;
