const Footer = () => {
  return (
    <footer className="py-16 lg:py-20 bg-foreground text-primary-foreground">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div>
            <a href="/" className="font-serif text-3xl font-semibold tracking-tight">
              ipix.
            </a>
            <p className="font-sans text-sm text-primary-foreground/60 mt-4 leading-relaxed">
              AI-powered photography & video content platform for modern brands.
            </p>
          </div>

          <div>
            <h4 className="font-sans text-xs font-medium tracking-[0.2em] uppercase mb-6 text-primary-foreground/40">
              Services
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Product Photography", href: "#services" },
                { label: "Fashion Photography", href: "/services/fashion-photography" },
                { label: "eCommerce", href: "#services" },
                { label: "Jewellery", href: "#services" },
                { label: "Video Production", href: "#services" },
                { label: "Studio Hire", href: "#services" },
              ].map((s) => (
                <li key={s.label}>
                  <a href={s.href} className="font-sans text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-sans text-xs font-medium tracking-[0.2em] uppercase mb-6 text-primary-foreground/40">
              Company
            </h4>
            <ul className="space-y-3">
              {["About", "Portfolio", "Case Studies", "Process", "Contact"].map((s) => (
                <li key={s}>
                  <a href={`#${s.toLowerCase()}`} className="font-sans text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-sans text-xs font-medium tracking-[0.2em] uppercase mb-6 text-primary-foreground/40">
              Contact
            </h4>
            <p className="font-sans text-sm text-primary-foreground/70 leading-relaxed">
              hello@ipix.studio<br />
              +44 (0) 20 7946 0958
            </p>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-sans text-xs text-primary-foreground/40">
            © 2027 ipix. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms", "Usage Rights"].map((l) => (
              <a key={l} href="#" className="font-sans text-xs text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
