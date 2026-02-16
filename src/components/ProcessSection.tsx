const steps = [
  {
    num: "01",
    title: "Brief & Brand Analysis",
    desc: "Our AI ingests your brand guidelines, past content, and market trends to understand your visual language.",
  },
  {
    num: "02",
    title: "Creative Strategy",
    desc: "We generate platform-specific shot lists, mood boards, and creative concepts — tuned to your Creative Temperature.",
  },
  {
    num: "03",
    title: "Production",
    desc: "Professional photographers and videographers execute the plan in our fully-equipped studio.",
  },
  {
    num: "04",
    title: "Delivery & Optimization",
    desc: "Retouched, formatted, and delivered with captions, CTAs, and ad copy for every platform.",
  },
];

const ProcessSection = () => {
  return (
    <section id="process" className="py-24 lg:py-32 bg-surface-white">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-2xl mb-20">
          <p className="font-sans text-sm font-medium tracking-[0.2em] text-text-caption uppercase mb-4">
            How We Work
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">
            From Brief to<br />
            <span className="italic">Brilliant.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-divider">
          {steps.map((step) => (
            <div key={step.num} className="border-b lg:border-b-0 lg:border-r last:border-r-0 border-divider p-8 lg:p-10">
              <span className="font-sans text-xs font-medium tracking-[0.2em] text-text-caption uppercase">
                Step {step.num}
              </span>
              <h3 className="font-serif text-2xl font-medium text-foreground mt-6 mb-4">
                {step.title}
              </h3>
              <p className="font-sans text-sm text-text-secondary leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
