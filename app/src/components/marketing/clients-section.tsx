import { AnimatedSection } from "./animated-section";

// Parity with Vite ClientsSection.tsx — intro split + "Trusted By Leading Brands" row.
const clients = [
  "Pandora", "TK Maxx", "Tiffany & Co.", "Amazon", "Fenty",
  "The North Face", "Adidas", "Rolex", "Sony", "Selfridges",
];

export function ClientsSection() {
  return (
    <section id="about" className="py-24 lg:py-32" style={{ background: "var(--mk-bg)" }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <AnimatedSection className="mb-20 grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <h2 className="text-3xl font-light leading-tight md:text-4xl lg:text-5xl">
            With over 20 years of industry experience, our team has shot for top
            brands and independents alike.
          </h2>
          <p className="max-w-prose text-base leading-relaxed" style={{ color: "var(--mk-text-muted)" }}>
            We combine world-class photography with AI-driven creative planning.
            Every shoot is optimized for maximum impact across Amazon, Instagram,
            paid media, and your own channels. Consistency, precision, and
            conversion — guaranteed.
          </p>
        </AnimatedSection>

        <div className="border-t pt-16" style={{ borderColor: "var(--mk-border)" }}>
          <p className="mb-12 text-center text-xs font-medium uppercase tracking-[0.2em]" style={{ color: "var(--mk-text-muted)" }}>
            Trusted By Leading Brands
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {clients.map((client) => (
              <span
                key={client}
                className="text-lg tracking-wide md:text-xl"
                style={{ fontFamily: "var(--font-cormorant)", color: "var(--mk-text-muted)" }}
              >
                {client}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
