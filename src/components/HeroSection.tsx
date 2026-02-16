import heroImage from "@/assets/hero-product.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center bg-background pt-20">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — Copy */}
          <div className="max-w-xl animate-fade-up">
            <p className="font-sans text-sm font-medium tracking-[0.2em] text-text-caption uppercase mb-6">
              AI-Powered Content Studio
            </p>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-light leading-[1.05] text-foreground mb-8">
              Exceptional Imagery.<br />
              <span className="italic font-light">Every Time.</span>
            </h1>
            <p className="font-sans text-base md:text-lg text-text-secondary leading-relaxed max-w-prose mb-10">
              An AI-powered platform that plans photoshoots, generates shot lists, 
              and creates on-brand content — from concept to delivery. Fewer revisions. 
              Faster execution. Premium results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#contact"
                className="font-sans text-sm font-medium tracking-wide bg-foreground text-primary-foreground px-8 py-4 hover:opacity-90 transition-opacity duration-300 uppercase text-center"
              >
                Request a Quote
              </a>
              <a
                href="#portfolio"
                className="font-sans text-sm font-medium tracking-wide border border-foreground text-foreground px-8 py-4 hover:bg-foreground hover:text-primary-foreground transition-all duration-300 uppercase text-center"
              >
                View Portfolio
              </a>
            </div>
          </div>

          {/* Right — Image */}
          <div className="relative animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <img
              src={heroImage}
              alt="Premium product photography flat lay"
              className="w-full h-[500px] lg:h-[600px] object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
