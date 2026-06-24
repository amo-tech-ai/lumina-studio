"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { AnimatedSection } from "./animated-section";

// Parity with Vite FashionPackages.tsx — shoot-type toggle (Ghost/Model/Creative)
// switches the 3 tier prices; "Most Popular" badge on the middle card. framer-motion
// dropped (AnimatedSection handles reveal; price swaps instantly).
type ShootType = "ghost" | "model" | "creative";

const shootTypeLabels: Record<ShootType, string> = {
  ghost: "Ghost Mannequin",
  model: "On-Model",
  creative: "Creative",
};

const packages = [
  {
    name: "Starter Fashion Shoot",
    description: "Best for small collections or lookbooks.",
    prices: { ghost: "£350", model: "£400", creative: "£450" },
    features: ["Up to 4 hours studio time", "1 photographer", "Basic lighting setup", "15 edited images", "White / neutral backdrop"],
    cta: "Book Starter",
    featured: false,
  },
  {
    name: "Full Collection Shoot",
    description: "Ideal for seasonal campaigns or ecommerce launches.",
    prices: { ghost: "£650", model: "£750", creative: "£850" },
    features: ["Full-day studio session", "Creative direction", "On-model or ghost mannequin", "40 edited images", "Styling consultation", "Background options"],
    cta: "Plan My Shoot",
    featured: true,
  },
  {
    name: "Premium Campaign",
    description: "Designed for brands ready to elevate.",
    prices: { ghost: "£1,000", model: "£1,200", creative: "£1,400" },
    features: ["Full-day + art direction", "Multi-set environments", "Lifestyle & detail shots", "Advanced retouching", "Social-ready formats", "Creative concept board"],
    cta: "Start Campaign",
    featured: false,
  },
];

const addOns = [
  { title: "Post-Production Services", items: ["Basic Editing", "Advanced Retouching", "Background Replacement", "Cropping for marketplace"] },
  { title: "Model & Styling Add-Ons", items: ["Professional model sourcing", "Hair & makeup", "Stylist support"] },
  { title: "Studio Enhancements", items: ["Custom set builds", "Coloured backdrops", "Prop sourcing"] },
];

export function FashionPackages() {
  const [shootType, setShootType] = useState<ShootType>("model");

  return (
    <section id="packages" className="py-24 lg:py-32" style={{ background: "var(--mk-bg)" }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <AnimatedSection className="mb-12 text-center">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={{ color: "var(--mk-text-muted)" }}>Packages</p>
          <h2 className="mb-4 text-4xl font-light md:text-5xl">Fashion Photography Packages.</h2>
          <p className="mx-auto max-w-xl text-base leading-relaxed" style={{ color: "var(--mk-text-muted)" }}>
            Whether you&apos;re launching a capsule collection or scaling seasonal campaigns, choose a package designed to deliver results.
          </p>
        </AnimatedSection>

        {/* Shoot-type toggle */}
        <div className="mb-16 flex justify-center">
          <div className="inline-flex rounded-lg p-1" style={{ border: "1px solid var(--mk-border)", background: "var(--mk-surface)" }}>
            {(Object.keys(shootTypeLabels) as ShootType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setShootType(type)}
                aria-pressed={shootType === type}
                className="rounded-md px-5 py-2.5 text-xs font-medium uppercase tracking-wide transition-all"
                style={
                  shootType === type
                    ? { background: "var(--mk-text)", color: "#fff" }
                    : { color: "var(--mk-text-muted)" }
                }
              >
                {shootTypeLabels[type]}
              </button>
            ))}
          </div>
        </div>

        {/* Package cards */}
        <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-10">
          {packages.map((pkg) => {
            const featured = pkg.featured;
            return (
              <div
                key={pkg.name}
                className={`relative flex flex-col rounded-2xl p-8 transition-transform duration-300 hover:-translate-y-1 lg:p-10 ${featured ? "order-first shadow-2xl md:order-none" : ""}`}
                style={
                  featured
                    ? { background: "var(--mk-text)", color: "#fff" }
                    : { background: "var(--mk-surface)", border: "1px solid var(--mk-border)" }
                }
              >
                {featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ background: "#fff", color: "var(--mk-text)" }}>
                      <Sparkles size={10} /> Most Popular
                    </span>
                  </div>
                )}
                <h3 className="mb-2 text-2xl font-medium">{pkg.name}</h3>
                <p className="mb-6 text-sm" style={{ color: featured ? "rgba(255,255,255,0.7)" : "var(--mk-text-muted)" }}>{pkg.description}</p>
                <div className="mb-8">
                  <span className="text-xs uppercase tracking-wide" style={{ color: featured ? "rgba(255,255,255,0.5)" : "var(--mk-text-muted)" }}>From</span>
                  <p className="mt-1 text-5xl font-medium" style={{ fontFamily: "var(--font-cormorant)" }}>{pkg.prices[shootType]}</p>
                </div>
                <ul className="mb-10 flex-1 space-y-3">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckCircle size={14} className="mt-0.5 shrink-0" style={{ color: featured ? "rgba(255,255,255,0.6)" : "var(--mk-primary)" }} />
                      <span className="text-sm" style={{ color: featured ? "rgba(255,255,255,0.85)" : "var(--mk-text-muted)" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="#contact"
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-8 py-4 text-sm font-medium uppercase tracking-wide transition-opacity hover:opacity-90"
                  style={featured ? { background: "#fff", color: "var(--mk-text)" } : { background: "var(--mk-text)", color: "#fff" }}
                >
                  {pkg.cta} <ArrowRight size={14} />
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mb-20 text-center text-sm" style={{ color: "var(--mk-text-muted)" }}>
          Not sure which package fits?{" "}
          <Link href="#contact" className="underline underline-offset-4" style={{ color: "var(--mk-text)" }}>Talk to our team →</Link>
        </p>

        {/* Add-ons */}
        <p className="mb-8 text-center text-xs font-medium uppercase tracking-[0.25em]" style={{ color: "var(--mk-text-muted)" }}>Additional Services</p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {addOns.map((addon) => (
            <div key={addon.title} className="rounded-xl p-6 transition-shadow hover:shadow-md lg:p-8" style={{ background: "var(--mk-surface)", border: "1px solid var(--mk-border)" }}>
              <h4 className="mb-4 text-lg font-medium">{addon.title}</h4>
              <ul className="space-y-2">
                {addon.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm" style={{ color: "var(--mk-text-muted)" }}>
                    <CheckCircle size={12} className="shrink-0" style={{ color: "var(--mk-primary)" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-20 text-center text-xs uppercase tracking-[0.2em]" style={{ color: "var(--mk-text-muted)" }}>
          Trusted by leading fashion brands.
        </p>
      </div>
    </section>
  );
}
