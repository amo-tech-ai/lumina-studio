const clients = [
  "Pandora", "TK Maxx", "Tiffany & Co.", "Amazon", "Fenty",
  "The North Face", "Adidas", "Rolex", "Sony", "Selfridges",
];

const ClientsSection = () => {
  return (
    <section id="about" className="py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-foreground leading-tight">
              With over 20 years of industry experience, our team has shot for top brands and independents alike.
            </h2>
          </div>
          <div>
            <p className="font-sans text-base text-text-secondary leading-relaxed max-w-prose">
              We combine world-class photography with AI-driven creative planning. 
              Every shoot is optimized for maximum impact across Amazon, Instagram, 
              paid media, and your own channels. Consistency, precision, and conversion 
              — guaranteed.
            </p>
          </div>
        </div>

        <div className="border-t border-divider pt-16">
          <p className="font-sans text-xs font-medium tracking-[0.2em] text-text-caption uppercase text-center mb-12">
            Trusted By Leading Brands
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6">
            {clients.map((client) => (
              <span
                key={client}
                className="font-serif text-lg md:text-xl text-text-caption tracking-wide"
              >
                {client}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClientsSection;
