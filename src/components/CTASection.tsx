const CTASection = () => {
  return (
    <section id="contact" className="py-24 lg:py-32 bg-surface-white">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-6">
            Ready to Elevate<br />
            <span className="italic">Your Content?</span>
          </h2>
          <p className="font-sans text-base md:text-lg text-text-secondary leading-relaxed max-w-xl mx-auto mb-12">
            Tell us about your brand and we'll craft a tailored content strategy — 
            powered by AI, executed by experts.
          </p>

          <form className="max-w-lg mx-auto text-left space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <input
                type="text"
                placeholder="Name"
                className="w-full bg-transparent border-b border-divider py-3 font-sans text-sm text-foreground placeholder:text-text-caption focus:outline-none focus:border-foreground transition-colors"
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full bg-transparent border-b border-divider py-3 font-sans text-sm text-foreground placeholder:text-text-caption focus:outline-none focus:border-foreground transition-colors"
              />
            </div>
            <input
              type="text"
              placeholder="Company"
              className="w-full bg-transparent border-b border-divider py-3 font-sans text-sm text-foreground placeholder:text-text-caption focus:outline-none focus:border-foreground transition-colors"
            />
            <textarea
              placeholder="Tell us about your project"
              rows={4}
              className="w-full bg-transparent border-b border-divider py-3 font-sans text-sm text-foreground placeholder:text-text-caption focus:outline-none focus:border-foreground transition-colors resize-none"
            />
            <button
              type="submit"
              className="font-sans text-sm font-medium tracking-wide bg-foreground text-primary-foreground px-10 py-4 hover:opacity-90 transition-opacity duration-300 uppercase w-full sm:w-auto"
            >
              Send Inquiry
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
