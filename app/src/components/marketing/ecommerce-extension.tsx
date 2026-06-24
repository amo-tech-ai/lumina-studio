"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Brain, Camera, Search, Layers, Video, ImageIcon, ZoomIn, GitCompare, Zap, CheckCircle } from "lucide-react";
import { AnimatedSection } from "./animated-section";

// Parity with Vite EcommerceExtension.tsx — 7 sub-sections incl. two interactive
// pieces: the Amazon image slider (CSS transform + dots) and the Creative Temperature
// control. shadcn Slider → native range input; framer-motion → AnimatedSection/CSS.
const caption = { color: "var(--mk-text-muted)" } as const;
const surface = { background: "var(--mk-surface)" } as const;
const bordered = { background: "var(--mk-surface)", border: "1px solid var(--mk-border)" } as const;

const sliderImages = ["ecommerce-hero", "portfolio-product", "portfolio-ecommerce", "portfolio-stilllife", "ecommerce-casestudy"];
const temperatureLabels = ["Safe", "Balanced", "Bold"];
const temperatureDescriptions = [
  "Conversion-optimized, data-backed visuals. Clean, compliant, proven to perform.",
  "Marketplace-ready with brand personality. The sweet spot for most brands.",
  "Campaign-level, trend-driven impact. Stand out from the category.",
];
const imageTypes = [
  { icon: Camera, title: "Hero Packshots", desc: "White background, Amazon compliant, optimized for clarity and maximum click-through." },
  { icon: Layers, title: "Infographic Explainers", desc: "Feature callouts, dimension graphics, benefit overlays that communicate value instantly." },
  { icon: ImageIcon, title: "Lifestyle Context", desc: "Show your product in real-world use. Build emotional connection and trust." },
  { icon: ZoomIn, title: "Detail Close-Ups", desc: "Texture, stitching, materials, craftsmanship. Prove quality at pixel level." },
  { icon: GitCompare, title: "Comparison Graphics", desc: "Highlight advantages over competitors. Visual proof of superiority." },
  { icon: Video, title: "Video Snippets", desc: "Short-form motion content for ads and listings. 6–15 second product reveals." },
];
const steps = [
  { step: "01", title: "Strategy", desc: "AI analyzes your brand and marketplace positioning.", icon: Brain },
  { step: "02", title: "Planning", desc: "You receive a platform-specific shot list.", icon: Search },
  { step: "03", title: "Production", desc: "Shoot executed with clarity and precision.", icon: Camera },
  { step: "04", title: "Delivery", desc: "Optimized assets ready for Amazon, Shopify, and Ads.", icon: Zap },
];
const perfMetrics = [
  { metric: "+27%", label: "Average Increase in Click-Through Rate" },
  { metric: "+18%", label: "Higher Conversion on Optimized Listings" },
  { metric: "40%", label: "Fewer Reshoots with AI Planning" },
];

export function EcommerceExtension() {
  const [temp, setTemp] = useState(50);
  const [slide, setSlide] = useState(0);
  const tempIndex = temp < 33 ? 0 : temp < 66 ? 1 : 2;

  return (
    <>
      {/* 1. AI-POWERED PLANNING */}
      <section className="py-24 lg:py-32" style={{ background: "#F5F5F5" }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <AnimatedSection>
              <p className="mb-6 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>AI-Powered Planning</p>
              <h2 className="mb-6 text-4xl font-light leading-[1.08] md:text-5xl lg:text-6xl">Plan Smarter.<br /><span className="italic">Shoot Once.</span></h2>
              <div className="mb-8 space-y-4">
                <p className="max-w-lg text-base leading-relaxed" style={caption}>Traditional studios focus on production. iPix plans what to shoot before you step on set.</p>
                <p className="max-w-lg text-base leading-relaxed" style={caption}>Our AI analyzes your brand style guide, past performance data, Amazon listing requirements, and current marketplace trends — then generates a platform-ready shot list tailored to conversion.</p>
                <p className="text-sm font-medium">Less guesswork. Fewer revisions. Higher ROI.</p>
              </div>
              <Link href="#contact" className="inline-block px-8 py-4 text-sm font-medium uppercase tracking-wide text-white" style={{ background: "var(--mk-text)" }}>See AI Planning in Action</Link>
            </AnimatedSection>
            <AnimatedSection>
              <div className="p-8 lg:p-10" style={bordered}>
                <div className="mb-6 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ background: "var(--mk-primary)" }} />
                  <div className="h-3 w-3 rounded-full" style={{ background: "var(--mk-accent)" }} />
                  <div className="h-3 w-3 rounded-full" style={{ background: "var(--mk-border)" }} />
                  <span className="ml-2 text-xs" style={caption}>iPix AI Planner</span>
                </div>
                <div className="space-y-4">
                  {["Brand Analysis Complete", "SKU Mapping: 48 products", "Shot List Generated: 127 frames", "Platform Optimization: Amazon, Shopify, Meta"].map((line) => (
                    <div key={line} className="flex items-center gap-3">
                      <CheckCircle size={14} className="shrink-0" style={{ color: "var(--mk-primary)" }} />
                      <span className="text-sm" style={caption}>{line}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 border-t pt-6" style={{ borderColor: "var(--mk-border)" }}>
                  <div className="mb-2 flex justify-between text-xs" style={caption}><span>Planning Progress</span><span>100%</span></div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--mk-border)" }}>
                    <div className="h-full w-full rounded-full" style={{ background: "var(--mk-text)" }} />
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* 2. AMAZON OPTIMIZATION + slider */}
      <section className="py-24 lg:py-32" style={{ background: "var(--mk-bg)" }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-16 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Amazon-Ready</p>
            <h2 className="mb-6 text-4xl font-light md:text-5xl lg:text-6xl">Optimized for <span className="italic">Amazon.</span></h2>
            <p className="mx-auto mb-4 max-w-xl text-base leading-relaxed" style={caption}>Amazon doesn&apos;t reward pretty images. It rewards performance. We plan and produce every asset for ranking, clicks, and conversions.</p>
          </AnimatedSection>

          <div className="relative mb-12 overflow-hidden">
            <div className="flex gap-4 transition-transform duration-500" style={{ transform: `translateX(-${slide * 82}%)` }}>
              {sliderImages.map((src, i) => (
                <div key={i} className="group relative aspect-[4/3] w-[80%] shrink-0 md:w-[60%] lg:w-[40%]">
                  <Image src={`/images/${src}.jpg`} alt={`Amazon optimized product ${i + 1}`} fill sizes="(max-width:1024px) 80vw, 40vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-center gap-2">
              {sliderImages.map((_, i) => (
                <button key={i} type="button" aria-label={`Slide ${i + 1}`} onClick={() => setSlide(i)} className="h-2 rounded-full transition-all duration-300" style={{ width: i === slide ? "1.5rem" : "0.5rem", background: i === slide ? "var(--mk-text)" : "var(--mk-border)" }} />
              ))}
            </div>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {["Main Images", "Infographics", "Lifestyle Shots", "Comparison Graphics", "A+ Content"].map((item) => (
              <div key={item} className="p-4 text-center" style={bordered}><span className="text-xs font-medium uppercase tracking-wide">{item}</span></div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="#contact" className="inline-block px-8 py-4 text-sm font-medium uppercase tracking-wide" style={{ border: "1px solid var(--mk-text)" }}>Request Amazon Strategy</Link>
          </div>
        </div>
      </section>

      {/* 3. IMAGE TYPES GRID */}
      <section className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-16 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Content Types</p>
            <h2 className="text-4xl font-light md:text-5xl">Image Types That <span className="italic">Sell</span></h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {imageTypes.map((item) => (
              <div key={item.title} className="group p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={{ background: "var(--mk-bg)", border: "1px solid var(--mk-border)" }}>
                <item.icon size={28} strokeWidth={1.2} className="mb-5" style={caption} />
                <h3 className="mb-3 text-xl font-medium">{item.title}</h3>
                <p className="text-sm leading-relaxed" style={caption}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. CREATIVE TEMPERATURE (interactive) */}
      <section className="py-24 lg:py-32" style={{ background: "var(--mk-bg)" }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Creative Control</p>
            <h2 className="mb-6 text-4xl font-light md:text-5xl">Control Your Creative <span className="italic">Direction</span></h2>
            <p className="mx-auto mb-12 max-w-xl text-base leading-relaxed" style={caption}>Set your Creative Temperature. You decide how far to push the creative.</p>
            <div className="mb-8 p-8 lg:p-12" style={bordered}>
              <div className="mb-3 flex justify-between">
                {temperatureLabels.map((label, i) => (
                  <span key={label} className="text-xs uppercase tracking-wide" style={{ color: i === tempIndex ? "var(--mk-text)" : "var(--mk-text-muted)", fontWeight: i === tempIndex ? 600 : 400 }}>{label}</span>
                ))}
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={temp}
                onChange={(e) => setTemp(Number(e.target.value))}
                aria-label="Creative temperature"
                className="mb-6 w-full accent-[var(--mk-primary)]"
              />
              <p className="text-sm leading-relaxed" style={caption}>{temperatureDescriptions[tempIndex]}</p>
            </div>
            <Link href="#contact" className="text-sm font-medium uppercase tracking-wide underline underline-offset-4">Adjust Your Creative Temperature →</Link>
          </div>
        </div>
      </section>

      {/* 5. WORKFLOW */}
      <section className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-16 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Process</p>
            <h2 className="text-4xl font-light md:text-5xl">How It <span className="italic">Works</span></h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ background: "var(--mk-border)" }}>
            {steps.map((item) => (
              <div key={item.step} className="p-8 text-center lg:p-10" style={surface}>
                <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full text-sm font-medium text-white" style={{ background: "var(--mk-text)" }}>{item.step}</div>
                <item.icon size={24} strokeWidth={1.2} className="mx-auto mb-4" style={caption} />
                <h3 className="mb-3 text-xl font-medium">{item.title}</h3>
                <p className="text-sm leading-relaxed" style={caption}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. PERFORMANCE METRICS (dark) */}
      <section className="py-24 lg:py-32" style={{ background: "var(--mk-text)" }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-16 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={{ color: "rgba(255,255,255,0.5)" }}>Results</p>
            <h2 className="text-4xl font-light text-white md:text-5xl">Built for <span className="italic">Results</span></h2>
          </AnimatedSection>
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-12 sm:grid-cols-3 lg:gap-20">
            {perfMetrics.map((item) => (
              <div key={item.label} className="text-center">
                <p className="mb-3 text-5xl font-light text-white md:text-6xl" style={{ fontFamily: "var(--font-cormorant)" }}>{item.metric}</p>
                <p className="text-xs uppercase leading-relaxed tracking-wide" style={{ color: "rgba(255,255,255,0.6)" }}>{item.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-12 text-center text-sm tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>Performance over aesthetics. Every time.</p>
        </div>
      </section>

      {/* 7. FINAL CTA */}
      <section className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-4xl font-light md:text-5xl lg:text-6xl">Ready to Increase <span className="italic">Sales?</span></h2>
            <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed" style={caption}>Your product deserves images that convert. Let&apos;s plan it right the first time.</p>
            <Link href="/#contact" className="inline-block px-10 py-4 text-sm font-medium uppercase tracking-wide text-white" style={{ background: "var(--mk-text)" }}>Get a Custom Quote</Link>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
