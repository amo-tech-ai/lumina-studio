import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Camera, MapPin, Users, Palette, FileCheck, Globe, Plane, CheckCircle, ArrowRight, Sparkles, Layers, Monitor, Megaphone, ShoppingBag, Instagram, Zap } from "lucide-react";
import locationHero from "@/assets/location-hero.png";
import locationCoastal from "@/assets/location-coastal.png";
import locationUrban from "@/assets/location-urban.png";
import locationStreets from "@/assets/location-streets.jpg";
import locationInterior from "@/assets/location-interior.jpg";
import locationNature from "@/assets/location-nature.jpg";
import locationTravel from "@/assets/location-travel.jpg";
import portfolioFashion from "@/assets/portfolio-fashion.jpg";
import fashionHero from "@/assets/fashion-hero.jpg";

const LocationPhotography = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* ── HERO ── */}
        <section className="relative min-h-screen flex items-center">
          <img src={locationHero} alt="Cinematic location fashion photography" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-foreground/40" />
          <div className="relative z-10 container mx-auto px-6 lg:px-12 pt-20">
            <div className="max-w-2xl">
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-primary-foreground/70 uppercase mb-6">
                Location Fashion Photography
              </p>
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-light text-primary-foreground leading-[1.05] mb-6">
                Scenic Success.<br />
                <span className="italic">Location Fashion Photography</span><br />
                for Modern Brands.
              </h1>
              <p className="font-sans text-base md:text-lg text-primary-foreground/80 leading-relaxed max-w-lg mb-10">
                Cinematic campaigns designed to move product, elevate perception, and scale across every channel.
              </p>
              <div className="flex flex-wrap gap-4 mb-6">
                <a href="#contact" className="font-sans text-sm font-medium tracking-wide bg-primary-foreground text-foreground px-8 py-4 hover:opacity-90 transition-opacity duration-300 uppercase">
                  Start a Shoot
                </a>
                <a href="#process" className="font-sans text-sm font-medium tracking-wide border border-primary-foreground text-primary-foreground px-8 py-4 hover:bg-primary-foreground hover:text-foreground transition-colors duration-300 uppercase">
                  Talk to Production
                </a>
              </div>
              <p className="font-sans text-xs text-primary-foreground/60 tracking-wide">
                One shoot. Infinite assets.
              </p>
            </div>
          </div>
        </section>

        {/* ── WHY LOCATION ── */}
        <section className="py-24 lg:py-32" style={{ backgroundColor: "hsl(40 14% 96%)" }}>
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">The Case for Location</p>
                <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-6">
                  Why Location<br /><span className="italic">Photography Works</span>
                </h2>
                <p className="font-sans text-base text-text-secondary leading-relaxed max-w-md mb-8">
                  Location transforms garments into narrative. Instead of isolated studio images, your collection lives inside real environments — creating emotional resonance that drives action.
                </p>
                <ul className="space-y-3 mb-8">
                  {["Higher engagement rates", "Stronger emotional pull", "Better campaign differentiation", "More versatile marketing assets"].map((item) => (
                    <li key={item} className="font-sans text-sm text-text-secondary flex items-center gap-3">
                      <CheckCircle size={14} className="text-text-mid shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a href="#locations" className="font-sans text-sm font-medium tracking-wide text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity uppercase">
                  Explore Location Styles →
                </a>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <img src={locationCoastal} alt="Coastal fashion photography" className="w-full h-64 object-cover" />
                <img src={locationStreets} alt="Urban street fashion" className="w-full h-64 object-cover" />
                <img src={locationNature} alt="Nature fashion photography" className="w-full h-64 object-cover" />
                <img src={locationInterior} alt="Interior lifestyle fashion" className="w-full h-64 object-cover" />
              </div>
            </div>
          </div>
        </section>

        {/* ── LOCATION TYPES ── */}
        <section id="locations" className="py-24 lg:py-32 bg-surface-white">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="text-center mb-20">
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Location Styles</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">Environments That Sell</h2>
            </div>

            {/* Type 1 — Editorial */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 mb-1 overflow-hidden">
              <img src={fashionHero} alt="Studio editorial fashion" className="w-full h-[450px] lg:h-[550px] object-cover" />
              <div className="bg-background p-10 lg:p-16 flex flex-col justify-center">
                <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-3">01 — Controlled Precision</p>
                <h3 className="font-serif text-3xl md:text-4xl font-light text-foreground mb-4">Studio Editorial</h3>
                <p className="font-sans text-base text-text-secondary leading-relaxed mb-6">
                  Perfect for lookbooks, ecommerce heroes, and campaign imagery. Maximum consistency with flawless detail.
                </p>
                <a href="#contact" className="font-sans text-sm font-medium tracking-wide text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity uppercase">
                  Plan Editorial Shoot →
                </a>
              </div>
            </div>

            {/* Type 2 — Coastal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 mb-1 overflow-hidden">
              <div className="bg-background p-10 lg:p-16 flex flex-col justify-center order-2 lg:order-1">
                <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-3">02 — Organic Storytelling</p>
                <h3 className="font-serif text-3xl md:text-4xl font-light text-foreground mb-4">Coastal & Resort</h3>
                <p className="font-sans text-base text-text-secondary leading-relaxed mb-6">
                  Swimwear, summer capsules, resort collections. Natural motion and organic storytelling in sun-drenched settings.
                </p>
                <a href="#contact" className="font-sans text-sm font-medium tracking-wide text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity uppercase">
                  Plan Coastal Shoot →
                </a>
              </div>
              <img src={locationCoastal} alt="Coastal resort fashion photography" className="w-full h-[450px] lg:h-[550px] object-cover order-1 lg:order-2" />
            </div>

            {/* Type 3 — Urban */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 mb-1 overflow-hidden">
              <img src={locationUrban} alt="Urban industrial fashion photography" className="w-full h-[450px] lg:h-[550px] object-cover" />
              <div className="bg-background p-10 lg:p-16 flex flex-col justify-center">
                <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-3">03 — Aspirational Energy</p>
                <h3 className="font-serif text-3xl md:text-4xl font-light text-foreground mb-4">Urban / Industrial</h3>
                <p className="font-sans text-base text-text-secondary leading-relaxed mb-6">
                  Streetwear, Gen Z brands, high-energy drops. High-contrast architectural backdrops for aspirational positioning.
                </p>
                <a href="#contact" className="font-sans text-sm font-medium tracking-wide text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity uppercase">
                  Plan Urban Shoot →
                </a>
              </div>
            </div>

            {/* Type 4 — Nature */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 mb-1 overflow-hidden">
              <div className="bg-background p-10 lg:p-16 flex flex-col justify-center order-2 lg:order-1">
                <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-3">04 — Narrative Richness</p>
                <h3 className="font-serif text-3xl md:text-4xl font-light text-foreground mb-4">Nature & Scenic</h3>
                <p className="font-sans text-base text-text-secondary leading-relaxed mb-6">
                  Sustainable labels and artisan brands. Textured landscapes that communicate authenticity and depth.
                </p>
                <a href="#contact" className="font-sans text-sm font-medium tracking-wide text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity uppercase">
                  Plan Nature Shoot →
                </a>
              </div>
              <img src={locationNature} alt="Nature scenic fashion photography" className="w-full h-[450px] lg:h-[550px] object-cover order-1 lg:order-2" />
            </div>

            {/* Type 5 — Interior */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">
              <img src={locationInterior} alt="Interior lifestyle fashion photography" className="w-full h-[450px] lg:h-[550px] object-cover" />
              <div className="bg-background p-10 lg:p-16 flex flex-col justify-center">
                <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-3">05 — Emotional Warmth</p>
                <h3 className="font-serif text-3xl md:text-4xl font-light text-foreground mb-4">Interior Lifestyle</h3>
                <p className="font-sans text-base text-text-secondary leading-relaxed mb-6">
                  DTC lifestyle brands. Cafes, homes, minimal interiors — relatability and emotional warmth that builds connection.
                </p>
                <a href="#contact" className="font-sans text-sm font-medium tracking-wide text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity uppercase">
                  Plan Lifestyle Shoot →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── iPIX ADVANTAGE (Dark) ── */}
        <section className="py-24 lg:py-32 bg-foreground text-primary-foreground">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-primary-foreground/50 uppercase mb-4">What Makes Us Different</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light">
                Production Meets<br /><span className="italic">Intelligence.</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px">
              {[
                {
                  stage: "Stage 1",
                  title: "Professional Production",
                  items: ["Manual booking & scouting", "Casting & logistics", "On-location crew management", "High-end delivery"],
                },
                {
                  stage: "Stage 2",
                  title: "AI-Assisted Planning",
                  items: ["AI-generated shot lists", "Brand-aware moodboards", "Channel-based deliverables", "Asset reuse strategy"],
                },
                {
                  stage: "Stage 3",
                  title: "Automated Pipeline",
                  items: ["SKU auto-tagging", "Shopify + Amazon routing", "Social-ready crops", "Wholesale line sheets"],
                },
              ].map((card) => (
                <div key={card.stage} className="bg-primary-foreground/5 p-10 lg:p-12">
                  <p className="font-sans text-xs font-medium tracking-[0.25em] text-primary-foreground/40 uppercase mb-4">{card.stage}</p>
                  <h3 className="font-serif text-2xl font-medium text-primary-foreground mb-6">{card.title}</h3>
                  <ul className="space-y-3">
                    {card.items.map((item) => (
                      <li key={item} className="font-sans text-sm text-primary-foreground/70 flex items-start gap-2">
                        <CheckCircle size={14} className="text-primary-foreground/40 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="font-sans text-center text-sm text-primary-foreground/50 mt-10 tracking-wide">
              One campaign → Every channel.
            </p>
          </div>
        </section>

        {/* ── HOW WE EXECUTE ── */}
        <section id="process" className="py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">How It Works</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">Location Shoot Execution</h2>
            </div>
            <div className="max-w-2xl mx-auto">
              {[
                { step: "01", title: "Brand Strategy Call", desc: "Define positioning, channels, and campaign goals." },
                { step: "02", title: "Location Scouting", desc: "Permits, lighting plan, logistics, and weather contingency." },
                { step: "03", title: "Production Day", desc: "Mobile lighting setups. Efficient crew footprint. Maximum output." },
                { step: "04", title: "Post-Production", desc: "Retouching, compositing, color grading, multi-format delivery." },
                { step: "05", title: "Multi-Channel Output", desc: "Website, Social, eCommerce, Wholesale — platform-ready assets." },
              ].map((item, i) => (
                <div key={item.step} className={`flex gap-8 ${i < 4 ? "pb-12 border-l border-divider ml-4" : "ml-4"}`}>
                  <div className="w-8 h-8 rounded-full bg-foreground text-primary-foreground flex items-center justify-center font-sans text-xs font-medium -ml-4 shrink-0">
                    {item.step}
                  </div>
                  <div className="pt-1">
                    <h3 className="font-serif text-xl font-medium text-foreground mb-1">{item.title}</h3>
                    <p className="font-sans text-sm text-text-secondary">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STRATEGIC ADVANTAGE ── */}
        <section className="py-24 lg:py-32 bg-surface-white">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Multi-Channel Strategy</p>
                <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-6">
                  The Shoot Is the Beginning —<br /><span className="italic">Not the End.</span>
                </h2>
                <p className="font-sans text-base text-text-secondary leading-relaxed max-w-md mb-8">
                  One campaign generates assets for every channel. Modern brands scale by planning outputs before shooting.
                </p>
                <a href="#contact" className="font-sans text-sm font-medium tracking-wide bg-foreground text-primary-foreground px-8 py-4 hover:opacity-90 transition-opacity duration-300 uppercase inline-block">
                  Build Multi-Channel Campaign
                </a>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Monitor, label: "Homepage Hero" },
                  { icon: Instagram, label: "Instagram Reels" },
                  { icon: ShoppingBag, label: "Shopify PDP" },
                  { icon: Megaphone, label: "Paid Ads" },
                  { icon: Layers, label: "Wholesale Catalog" },
                  { icon: FileCheck, label: "Press Kit" },
                ].map((item) => (
                  <div key={item.label} className="p-6 bg-background border border-divider flex items-center gap-4">
                    <item.icon size={20} strokeWidth={1.2} className="text-text-mid shrink-0" />
                    <span className="font-sans text-sm font-medium text-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section className="py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Investment</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-4">Transparent Production Framework</h2>
              <p className="font-sans text-base text-text-secondary max-w-lg mx-auto">
                Typical range: $1,000 – $5,000+ per day. Bundled pricing available for multi-channel production.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-divider max-w-4xl mx-auto">
              {[
                { title: "Location Complexity", desc: "Urban, rural, interior, or international." },
                { title: "Crew Size", desc: "Photographer, director, assistants, stylists." },
                { title: "Deliverables", desc: "Number of final images, formats, and channels." },
                { title: "Licensing", desc: "Usage rights and distribution scope." },
              ].map((item) => (
                <div key={item.title} className="bg-background p-8 text-center">
                  <h3 className="font-serif text-lg font-medium text-foreground mb-2">{item.title}</h3>
                  <p className="font-sans text-sm text-text-secondary">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <a href="#contact" className="font-sans text-sm font-medium tracking-wide bg-foreground text-primary-foreground px-8 py-4 hover:opacity-90 transition-opacity duration-300 uppercase inline-block">
                Request Custom Quote
              </a>
            </div>
          </div>
        </section>

        {/* ── HAVE CAMERA WILL TRAVEL ── */}
        <section className="relative py-32 lg:py-40">
          <img src={locationTravel} alt="International fashion production on location" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-foreground/50" />
          <div className="relative z-10 container mx-auto px-6 lg:px-12 text-center">
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-primary-foreground mb-6">
              National & International<br /><span className="italic">Production.</span>
            </h2>
            <p className="font-sans text-base text-primary-foreground/80 leading-relaxed max-w-lg mx-auto mb-4">
              Weather contingency? We recreate environments in-studio using advanced compositing.
            </p>
            <p className="font-sans text-sm text-primary-foreground/60 italic">
              Location feel. Studio control.
            </p>
          </div>
        </section>

        {/* ── FULL PRODUCTION SERVICES ── */}
        <section className="py-24 lg:py-32 bg-surface-white">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">End-to-End</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">Full Production Services</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-divider">
              {[
                { icon: Palette, label: "Creative Direction" },
                { icon: Users, label: "Model Casting" },
                { icon: Sparkles, label: "Styling" },
                { icon: Camera, label: "Hair & Makeup" },
                { icon: MapPin, label: "Location Scouting" },
                { icon: FileCheck, label: "Permits" },
                { icon: Globe, label: "On-Site Management" },
                { icon: Zap, label: "Retouching" },
              ].map((item) => (
                <div key={item.label} className="bg-surface-white p-8 lg:p-10 text-center group hover:bg-background transition-colors duration-300">
                  <item.icon size={28} strokeWidth={1.2} className="text-text-mid mx-auto mb-4" />
                  <p className="font-sans text-sm font-medium text-foreground">{item.label}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <a href="#contact" className="font-sans text-sm font-medium tracking-wide text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity uppercase">
                Speak to Production Team →
              </a>
            </div>
          </div>
        </section>

        {/* ── PORTFOLIO SHOWCASE ── */}
        <section className="py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Selected Work</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">Location Portfolio</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-1">
              {[locationCoastal, locationStreets, locationUrban, locationNature, locationInterior, portfolioFashion].map((src, i) => (
                <div key={i} className="relative group overflow-hidden cursor-pointer aspect-[4/5]">
                  <img src={src} alt={`Location portfolio ${i + 1}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-500" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-24 lg:py-32 bg-surface-white">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-16">
                <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Common Questions</p>
                <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">FAQ</h2>
              </div>
              <Accordion type="single" collapsible className="w-full">
                {[
                  { q: "What locations do you shoot at?", a: "We shoot nationwide and internationally — from urban cityscapes and coastal landscapes to rural countryside and interior lifestyle settings. We handle all scouting, permits, and logistics." },
                  { q: "What happens if the weather is bad?", a: "We have weather contingency plans for every shoot. If conditions are unsuitable, we can reschedule or recreate the environment in-studio using advanced compositing techniques." },
                  { q: "How many images will I receive?", a: "This depends on the package and scope. A typical full-day location shoot delivers 40–80+ final retouched images across multiple formats and platforms." },
                  { q: "Do you provide models and stylists?", a: "Yes. We handle full production including model casting, styling, hair & makeup, and creative direction. You can also bring your own team." },
                  { q: "Can you shoot for multiple channels in one session?", a: "Absolutely. Our AI-assisted planning ensures we capture content optimized for website, social, eCommerce, wholesale, and paid media — all in one shoot." },
                  { q: "What is the typical turnaround time?", a: "Standard delivery is 7–10 business days from shoot date. Rush delivery is available for an additional fee." },
                ].map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border-divider">
                    <AccordionTrigger className="font-serif text-lg text-foreground hover:no-underline py-6">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="font-sans text-sm text-text-secondary leading-relaxed pb-6">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section id="contact" className="py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-6 lg:px-12 text-center">
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-6">
              Ready to Elevate<br /><span className="italic">Your Campaign?</span>
            </h2>
            <p className="font-sans text-base text-text-secondary leading-relaxed max-w-lg mx-auto mb-10">
              Location photography is storytelling at scale. Let's build something cinematic — and strategic.
            </p>
            <a href="mailto:hello@ipix.studio" className="font-sans text-sm font-medium tracking-wide bg-foreground text-primary-foreground px-10 py-4 hover:opacity-90 transition-opacity duration-300 uppercase inline-block">
              Start Your Campaign
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LocationPhotography;
