import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Camera, Image as ImageIcon, Maximize, Eye, CheckCircle, ArrowRight, TrendingUp, DollarSign } from "lucide-react";
import { AnimatedSection } from "@/components/marketing/animated-section";
import { FAQ } from "@/components/marketing/faq";

export const metadata: Metadata = {
  title: "Shopify Photography",
  description: "Shopify-optimized product photography. AI-planned imagery that converts.",
  openGraph: {
    title: "Shopify Photography | iPix — Conversion-Optimized Product Images",
    description: "Shopify-optimized product photography. AI-planned imagery that converts.",
    images: ["/images/shopify-hero.jpg"],
  },
};

const diffPoints = ["Cropped for product grids", "Optimized for mobile", "Styled for brand elevation", "Structured for Shopify UX"];
const deliverables = [
  { icon: Camera, title: "Clean Studio Ecommerce", desc: "Crisp, color-accurate, high-resolution product images optimized for Shopify grids." },
  { icon: ImageIcon, title: "Editorial Conversion Frames", desc: "Lifestyle-driven imagery that increases perceived value and average order value." },
  { icon: Eye, title: "Detail & Texture Shots", desc: "Close-ups that communicate craftsmanship, material quality, and luxury positioning." },
  { icon: Maximize, title: "Format Optimization", desc: "Square (1:1) for product grids, Vertical (4:5) for mobile-first, hero banners, and transparent backgrounds." },
];
const shopifyFeatures = ["Collection page layouts", "Product variant displays", "Zoom & hover functionality", "Mobile-first design", "Conversion funnels"];
const packages = [
  { name: "Shopify Essential", skus: "10–25 SKUs", features: ["Clean studio photography", "White + neutral background", "Basic retouching", "Shopify-ready exports"], audience: "Ideal for emerging brands launching their first collection." },
  { name: "Shopify Editorial", skus: "25–75 SKUs", features: ["Studio + styled editorial", "Lifestyle frames", "Detail shots", "Conversion-based image sequencing"], audience: "Ideal for scaling DTC brands.", featured: true },
  { name: "Shopify Campaign", skus: "75+ SKUs", features: ["Full art direction", "Model styling", "Campaign visuals", "Homepage + collection banners", "Launch-ready asset system"], audience: "Ideal for luxury and premium brands." },
];
const processSteps = [
  { title: "Brand Alignment", desc: "We review your positioning, price point, and customer psychology." },
  { title: "Creative Direction", desc: "Shot list and styling developed for Shopify UX." },
  { title: "Studio Production", desc: "Precision lighting. Luxury finish. Editorial quality." },
  { title: "Retouching & Optimization", desc: "Color accuracy, file optimization, background cleanup." },
  { title: "Delivery", desc: "Shopify-ready files delivered in structured folders." },
];
const psychology = [
  { icon: Eye, stat: "Better images", label: "increase trust" },
  { icon: TrendingUp, stat: "Trust", label: "increases conversion" },
  { icon: DollarSign, stat: "Conversion", label: "increases revenue" },
];
const editorialFrames = [
  { src: "shopify-editorial.jpg", kicker: "Editorial Frames", title: "Lifestyle-Driven Conversion", alt: "Editorial lifestyle product photography" },
  { src: "shopify-detail.jpg", kicker: "Detail Shots", title: "Craftsmanship & Texture", alt: "Detail and texture close-up product photography" },
];
const faqs = [
  { q: "Do you shoot for Shopify specifically?", a: "Yes. Every image is formatted, cropped, and optimized specifically for Shopify's product grid, detail pages, zoom functionality, and mobile experience." },
  { q: "What formats do you deliver?", a: "We deliver in Square (1:1) for product grids, Vertical (4:5) for mobile-first design, hero banners, and transparent PNG backgrounds — all Shopify-ready." },
  { q: "Can you handle large product catalogs?", a: "Absolutely. Our Campaign package handles 75+ SKUs with full art direction, model styling, and launch-ready asset systems." },
  { q: "Do you provide retouching?", a: "Yes — color accuracy, background cleanup, file optimization, and conversion-focused post-production are included in every package." },
  { q: "What's the typical turnaround?", a: "Essential packages deliver within 5–7 business days. Editorial and Campaign packages typically take 10–14 business days depending on scope." },
];

const caption = { color: "var(--mk-text-muted)" } as const;
const surface = { background: "var(--mk-surface)" } as const;
const bg = { background: "var(--mk-bg)" } as const;
const ink = { background: "var(--mk-text)" } as const;

export default function ShopifyPhotographyPage() {
  return (
    <>
      {/* HERO */}
      <section className="pb-24 pt-32 lg:pb-32 lg:pt-40" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <AnimatedSection>
              <p className="mb-6 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Shopify Product Photography</p>
              <h1 className="mb-6 text-5xl font-light leading-[1.05] md:text-6xl lg:text-7xl">Shopify Product<br />Photography —<br /><span className="italic">Designed to Convert.</span></h1>
              <p className="mb-10 max-w-lg text-base leading-relaxed md:text-lg" style={caption}>
                Luxury editorial imagery crafted specifically for Shopify storefronts. Elevated aesthetics. Commercial precision. Conversion-driven results.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="#contact" className="px-8 py-4 text-sm font-medium uppercase tracking-wide text-white" style={ink}>Book Your Shoot</Link>
                <Link href="#portfolio" className="px-8 py-4 text-sm font-medium uppercase tracking-wide" style={{ border: "1px solid var(--mk-text)" }}>View Portfolio</Link>
              </div>
            </AnimatedSection>
            <AnimatedSection className="relative h-[500px] lg:h-[650px]">
              <Image src="/images/shopify-hero.jpg" alt="Luxury Shopify product photography flat lay" fill priority sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* THE DIFFERENCE */}
      <section className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <AnimatedSection>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>The Difference</p>
              <h2 className="mb-6 text-4xl font-light md:text-5xl">Not just product photos.<br /><span className="italic">Not just white backgrounds.</span></h2>
              <p className="mb-8 max-w-lg text-base leading-relaxed" style={caption}>
                We create conversion-optimized, brand-aligned visual systems engineered for Shopify. Because in ecommerce, clarity equals revenue.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {diffPoints.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle size={16} className="mt-0.5 flex-shrink-0" strokeWidth={1.5} style={{ color: "var(--mk-primary)" }} />
                    <span className="text-sm" style={caption}>{item}</span>
                  </div>
                ))}
              </div>
            </AnimatedSection>
            <AnimatedSection className="relative h-[500px]">
              <Image src="/images/shopify-studio.jpg" alt="Clean studio ecommerce product photography" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* WHAT WE DELIVER */}
      <section className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-16">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Service Overview</p>
            <h2 className="text-4xl font-light md:text-5xl">What We <span className="italic">Deliver.</span></h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 gap-px border-t md:grid-cols-2" style={{ borderColor: "var(--mk-border)", background: "var(--mk-border)" }}>
            {deliverables.map((d) => (
              <div key={d.title} className="p-10 lg:p-12" style={surface}>
                <d.icon size={28} strokeWidth={1.2} className="mb-6" style={caption} />
                <h3 className="mb-3 text-2xl font-medium">{d.title}</h3>
                <p className="text-sm leading-relaxed" style={caption}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EDITORIAL & DETAIL */}
      <section id="portfolio" className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {editorialFrames.map((f) => (
              <AnimatedSection key={f.src} className="relative h-[400px] overflow-hidden lg:h-[500px]">
                <Image src={`/images/${f.src}`} alt={f.alt} fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
                <div className="absolute inset-x-0 bottom-0 p-6" style={{ background: "linear-gradient(to top, rgba(26,23,20,0.6), transparent)" }}>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/80">{f.kicker}</p>
                  <p className="text-xl text-white" style={{ fontFamily: "var(--font-cormorant)" }}>{f.title}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* SHOPIFY PERFORMANCE (dark) */}
      <section className="py-24 lg:py-32" style={ink}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <AnimatedSection>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={{ color: "rgba(255,255,255,0.5)" }}>Shopify-Focused Strategy</p>
              <h2 className="mb-6 text-4xl font-light text-white md:text-5xl">Built for Shopify<br /><span className="italic">Performance.</span></h2>
              <p className="mb-10 max-w-lg text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                Your visuals are structured to reduce bounce rate and increase add-to-cart rates. Our photography aligns with every aspect of the Shopify experience.
              </p>
              <div className="space-y-4">
                {shopifyFeatures.map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <ArrowRight size={14} strokeWidth={1.5} style={{ color: "rgba(255,255,255,0.5)" }} />
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>{f}</span>
                  </div>
                ))}
              </div>
            </AnimatedSection>
            <AnimatedSection className="relative h-[400px] overflow-hidden rounded-sm lg:h-[500px]">
              <Image src="/images/shopify-mockup.jpg" alt="Shopify storefront with premium product photography" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* PACKAGES (featured) */}
      <section id="pricing" className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-16">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Packages</p>
            <h2 className="text-4xl font-light md:text-5xl">Tailored to Your <span className="italic">Scale.</span></h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 border-t md:grid-cols-3" style={{ borderColor: "var(--mk-border)" }}>
            {packages.map((pkg) => {
              const feat = pkg.featured;
              return (
                <div key={pkg.name} className="border-b p-10 last:border-r-0 md:border-b-0 md:border-r lg:p-12" style={feat ? { ...ink, color: "#fff", borderColor: "var(--mk-border)" } : { borderColor: "var(--mk-border)" }}>
                  <p className="mb-2 text-xs uppercase tracking-[0.2em]" style={{ color: feat ? "rgba(255,255,255,0.5)" : "var(--mk-text-muted)" }}>{pkg.skus}</p>
                  <h3 className="mb-6 text-2xl font-medium">{pkg.name}</h3>
                  <ul className="mb-8 space-y-3">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <CheckCircle size={14} className="mt-0.5 flex-shrink-0" strokeWidth={1.5} style={{ color: feat ? "rgba(255,255,255,0.6)" : "var(--mk-primary)" }} />
                        <span className="text-sm" style={{ color: feat ? "rgba(255,255,255,0.8)" : "var(--mk-text-muted)" }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs italic" style={{ color: feat ? "rgba(255,255,255,0.5)" : "var(--mk-text-muted)" }}>{pkg.audience}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-16">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Our Refined Workflow</p>
            <h2 className="text-4xl font-light md:text-5xl">From Brief to<br /><span className="italic">Brilliant.</span></h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 border-t md:grid-cols-5" style={{ borderColor: "var(--mk-border)" }}>
            {processSteps.map((step, i) => (
              <div key={step.title} className="border-b p-8 last:border-r-0 md:border-b-0 md:border-r" style={{ borderColor: "var(--mk-border)" }}>
                <span className="text-xs font-medium uppercase tracking-[0.2em]" style={caption}>{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mb-3 mt-4 text-lg font-medium">{step.title}</h3>
                <p className="text-sm leading-relaxed" style={caption}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONVERSION PSYCHOLOGY */}
      <section className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Why It Matters</p>
            <h2 className="mb-8 text-4xl font-light md:text-5xl">Why Premium Photography<br /><span className="italic">Matters.</span></h2>
            <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-3">
              {psychology.map((item) => (
                <div key={item.stat} className="text-center">
                  <item.icon size={32} strokeWidth={1} className="mx-auto mb-4" style={caption} />
                  <p className="mb-1 text-2xl font-medium" style={{ fontFamily: "var(--font-cormorant)" }}>{item.stat}</p>
                  <p className="text-sm" style={caption}>{item.label}</p>
                </div>
              ))}
            </div>
            <p className="mx-auto mt-12 max-w-xl text-base leading-relaxed" style={caption}>
              Luxury positioning requires visual discipline. Every pixel communicates value.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mx-auto mb-12 max-w-3xl">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>FAQ</p>
            <h2 className="text-4xl font-light md:text-5xl">Common <span className="italic">Questions.</span></h2>
          </AnimatedSection>
          <FAQ items={faqs} />
        </div>
      </section>

      {/* FINAL CTA (dark) */}
      <section id="contact" className="py-24 lg:py-32" style={ink}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-4xl font-light text-white md:text-5xl lg:text-6xl">Ready to Elevate<br />Your Shopify <span className="italic">Store?</span></h2>
            <p className="mx-auto mb-4 max-w-xl text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
              Your product deserves more than basic photography. It deserves imagery that sells.
            </p>
            <p className="mb-10 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Limited productions per month to maintain exclusivity.</p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="#contact" className="px-10 py-4 text-sm font-medium uppercase tracking-wide" style={{ background: "#fff", color: "var(--mk-text)" }}>Book Your Shopify Shoot</Link>
              <Link href="/#contact" className="border px-10 py-4 text-sm font-medium uppercase tracking-wide text-white" style={{ borderColor: "rgba(255,255,255,0.3)" }}>Schedule a Consultation</Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
