import { Camera, Gem, ShoppingBag, Shirt, Video, Palette, Sparkles, Building } from "lucide-react";
import { AnimatedSection } from "./animated-section";

// Parity with Vite ServicesSection.tsx — 8 cards, 4-col grid, lucide icons.
const services = [
  { icon: Camera, title: "Product Photography", desc: "Clean, consistent imagery that converts browsers into buyers." },
  { icon: Shirt, title: "Fashion Photography", desc: "On-model and editorial shoots that elevate your brand story." },
  { icon: ShoppingBag, title: "eCommerce Photography", desc: "High-volume, marketplace-ready assets for Amazon, Shopify, and beyond." },
  { icon: Gem, title: "Jewellery Photography", desc: "Precision macro shots that capture every facet and detail." },
  { icon: Palette, title: "Creative Still Life", desc: "Bold, artistic compositions that stop the scroll." },
  { icon: Video, title: "Video Production", desc: "Brand films, product videos, and social content with cinematic quality." },
  { icon: Sparkles, title: "AI Content Planning", desc: "Let AI analyze your brand and generate platform-specific shot lists." },
  { icon: Building, title: "Studio Hire", desc: "Book our fully-equipped studio for your own productions." },
];

export function ServicesSection() {
  return (
    <section id="services" className="py-24 lg:py-32" style={{ background: "var(--mk-surface)" }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <AnimatedSection className="mb-20 text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]" style={{ color: "var(--mk-text-muted)" }}>
            Our Services
          </p>
          <h2 className="text-4xl font-light md:text-5xl">Everything Your Brand Needs</h2>
        </AnimatedSection>

        <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ background: "var(--mk-border)" }}>
          {services.map((s) => (
            <div
              key={s.title}
              className="group cursor-pointer p-8 transition-colors lg:p-10"
              style={{ background: "var(--mk-surface)" }}
            >
              <s.icon size={28} strokeWidth={1.2} className="mb-6" style={{ color: "var(--mk-text-muted)" }} />
              <h3 className="mb-3 text-xl font-medium">{s.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--mk-text-muted)" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
