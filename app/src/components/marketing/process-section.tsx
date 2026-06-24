import { AnimatedSection } from "./animated-section";

// Parity with Vite ProcessSection.tsx — 4-step grid with numbered dividers.
const steps = [
  { num: "01", title: "Brief & Brand Analysis", desc: "Our AI ingests your brand guidelines, past content, and market trends to understand your visual language." },
  { num: "02", title: "Creative Strategy", desc: "We generate platform-specific shot lists, mood boards, and creative concepts — tuned to your Creative Temperature." },
  { num: "03", title: "Production", desc: "Professional photographers and videographers execute the plan in our fully-equipped studio." },
  { num: "04", title: "Delivery & Optimization", desc: "Retouched, formatted, and delivered with captions, CTAs, and ad copy for every platform." },
];

export function ProcessSection() {
  return (
    <section id="process" className="py-24 lg:py-32" style={{ background: "var(--mk-surface)" }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <AnimatedSection className="mb-20 max-w-2xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]" style={{ color: "var(--mk-text-muted)" }}>
            How We Work
          </p>
          <h2 className="text-4xl font-light md:text-5xl">
            From Brief to
            <br />
            <span className="italic">Brilliant.</span>
          </h2>
        </AnimatedSection>

        <div className="grid grid-cols-1 border-t md:grid-cols-2 lg:grid-cols-4" style={{ borderColor: "var(--mk-border)" }}>
          {steps.map((step) => (
            <div
              key={step.num}
              className="border-b p-8 last:border-r-0 lg:border-b-0 lg:border-r lg:p-10"
              style={{ borderColor: "var(--mk-border)" }}
            >
              <span className="text-xs font-medium uppercase tracking-[0.2em]" style={{ color: "var(--mk-text-muted)" }}>
                Step {step.num}
              </span>
              <h3 className="mb-4 mt-6 text-2xl font-medium">{step.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--mk-text-muted)" }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
