import { Instagram, Linkedin, Youtube, MessageCircle } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-16 lg:py-20 bg-foreground text-primary-foreground">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 lg:gap-8 mb-16">
          {/* Column 1 — Logo + Social */}
          <div className="col-span-2 md:col-span-1">
            <a href="/" className="font-serif text-3xl font-semibold tracking-tight">
              iPix.
            </a>
            <p className="font-sans text-sm text-primary-foreground/60 mt-4 leading-relaxed max-w-[200px]">
              Scenic Success for Modern Fashion Brands.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a href="#" aria-label="Instagram" className="text-primary-foreground/50 hover:text-primary-foreground transition-colors">
                <Instagram size={18} strokeWidth={1.5} />
              </a>
              <a href="#" aria-label="TikTok" className="text-primary-foreground/50 hover:text-primary-foreground transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="text-primary-foreground/50 hover:text-primary-foreground transition-colors">
                <Linkedin size={18} strokeWidth={1.5} />
              </a>
              <a href="#" aria-label="YouTube" className="text-primary-foreground/50 hover:text-primary-foreground transition-colors">
                <Youtube size={18} strokeWidth={1.5} />
              </a>
              <a href="#" aria-label="WhatsApp" className="text-primary-foreground/50 hover:text-primary-foreground transition-colors">
                <MessageCircle size={18} strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Column 2 — Services */}
          <div>
            <h4 className="font-sans text-xs font-medium tracking-[0.2em] uppercase mb-6 text-primary-foreground/40">
              Services
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Location Photography", href: "/services/location" },
                { label: "Fashion Photography", href: "/services/fashion-photography" },
                { label: "eCommerce Photography", href: "/services/ecommerce-photography" },
                { label: "Clothing Photography", href: "/services/clothing" },
                { label: "Amazon Photography", href: "/services/amazon" },
                { label: "Jewellery Photography", href: "/services/jewellery" },
                { label: "Instagram Campaigns", href: "/services/instagram" },
                { label: "Video Production", href: "/services/video" },
              ].map((s) => (
                <li key={s.label}>
                  <a href={s.href} className="font-sans text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Platform */}
          <div>
            <h4 className="font-sans text-xs font-medium tracking-[0.2em] uppercase mb-6 text-primary-foreground/40">
              Platform
            </h4>
            <ul className="space-y-3">
              {[
                { label: "How It Works", href: "#process" },
                { label: "Book a Shoot", href: "#contact" },
                { label: "Pricing", href: "#pricing" },
                { label: "Dashboard", href: "#" },
                { label: "Asset Library", href: "#" },
              ].map((s) => (
                <li key={s.label}>
                  <a href={s.href} className="font-sans text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Channels */}
          <div>
            <h4 className="font-sans text-xs font-medium tracking-[0.2em] uppercase mb-6 text-primary-foreground/40">
              Channels
            </h4>
            <ul className="space-y-3">
              {["Shopify", "Amazon", "Instagram", "TikTok", "Webflow"].map((s) => (
                <li key={s}>
                  <a href="#" className="font-sans text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5 — Contact */}
          <div>
            <h4 className="font-sans text-xs font-medium tracking-[0.2em] uppercase mb-6 text-primary-foreground/40">
              Contact
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:hello@ipixstudio.com" className="font-sans text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  hello@ipixstudio.com
                </a>
              </li>
              <li className="font-sans text-sm text-primary-foreground/70">
                +57 XXX XXX XXXX
              </li>
              <li className="font-sans text-sm text-primary-foreground/70">
                Medellín, Colombia
              </li>
              <li>
                <a href="#" className="font-sans text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors flex items-center gap-2">
                  <MessageCircle size={14} strokeWidth={1.5} />
                  WhatsApp Chatbot
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-sans text-xs text-primary-foreground/40">
            © 2026 iPix. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms"].map((l) => (
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
