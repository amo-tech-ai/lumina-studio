import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Instagram, Camera, Film, ShoppingBag, Layers, Play, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import heroImg from "@/assets/instagram-hero.jpg";
import editorialImg from "@/assets/instagram-editorial.jpg";
import detailImg from "@/assets/instagram-detail.jpg";
import motionImg from "@/assets/instagram-motion.jpg";
import shopImg from "@/assets/instagram-shop.jpg";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } } };
const fadeIn = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.8 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.15 } } };

const AnimatedSection = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} variants={fadeUp} className={className}>
      {children}
    </motion.div>
  );
};

const deliverables = [
  { icon: Film, title: "Instagram Reels", desc: "Cinematic short-form films with motion, texture, and rhythm." },
  { icon: Layers, title: "Carousel Stories", desc: "Multi-frame narratives designed for engagement and saves." },
  { icon: Camera, title: "Editorial Stills", desc: "Timeless imagery with depth, contrast, and atmosphere." },
  { icon: Play, title: "Feed Films", desc: "Polished 30–60 second campaign edits." },
  { icon: ShoppingBag, title: "Instagram Shop Visuals", desc: "Conversion-focused product imagery aligned with luxury positioning." },
];

const processSteps = [
  "Brand Immersion",
  "Location Curation",
  "Editorial Direction",
  "Production Execution",
  "Cinematic Post-Production",
  "Instagram-Optimized Delivery",
];

const packages = [
  {
    name: "Signature Campaign",
    desc: "Full editorial shoot + short-form films + shop assets.",
    cta: "Book Consultation",
  },
  {
    name: "Seasonal Collection Launch",
    desc: "Campaign narrative + multi-location visuals.",
    cta: "Plan Your Season",
  },
  {
    name: "Ongoing Visual Partnership",
    desc: "Monthly content production for brands operating at scale.",
    cta: "Explore Partnership",
  },
];

const InstagramCampaigns = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Cinematic rooftop fashion campaign" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-foreground/40" />
        </div>
        <div className="relative container mx-auto px-6 lg:px-12 py-32">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }} className="max-w-2xl">
            <p className="font-sans text-sm font-medium tracking-[0.25em] text-primary-foreground/70 uppercase mb-6">
              Instagram Location Campaigns
            </p>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-light leading-[1.05] text-primary-foreground mb-8">
              Cinematic Visuals<br />
              <span className="italic">Designed for the<br />Modern Feed.</span>
            </h1>
            <p className="font-sans text-base md:text-lg text-primary-foreground/80 leading-relaxed max-w-prose mb-10">
              We create editorial-grade photography and film on location — crafted specifically for Reels, Carousel storytelling, and Instagram Shop performance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#contact" className="font-sans text-sm font-medium tracking-wide bg-primary-foreground text-foreground px-8 py-4 hover:opacity-90 transition-opacity duration-300 uppercase text-center">
                Book a Private Consultation
              </a>
              <a href="#portfolio" className="font-sans text-sm font-medium tracking-wide border border-primary-foreground text-primary-foreground px-8 py-4 hover:bg-primary-foreground hover:text-foreground transition-all duration-300 uppercase text-center">
                View Campaign Portfolio
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── THE APPROACH ── */}
      <section className="py-24 lg:py-32 bg-surface-warm">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <p className="font-sans text-sm font-medium tracking-[0.2em] text-text-caption uppercase mb-4">The Approach</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-8">
                Where Editorial<br /><span className="italic">Meets Performance.</span>
              </h2>
              <p className="font-sans text-base text-text-secondary leading-relaxed mb-6">
                Every frame is intentional. We begin with brand alignment — understanding your aesthetic codes, audience psychology, and commercial objectives.
              </p>
              <p className="font-sans text-base text-text-secondary leading-relaxed mb-8">From there, we curate:</p>
              <ul className="space-y-3">
                {["Architectural backdrops", "Rooftop cityscapes", "Coastal light studies", "Minimalist urban textures", "Golden-hour natural light"].map((item) => (
                  <li key={item} className="font-sans text-sm text-foreground flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                    {item}
                  </li>
                ))}
              </ul>
            </AnimatedSection>
            <AnimatedSection>
              <div className="overflow-hidden">
                <img src={editorialImg} alt="Editorial urban skyline fashion" className="w-full h-[500px] lg:h-[600px] object-cover transition-transform duration-700 hover:scale-105" />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── WHAT WE PRODUCE ── */}
      <section className="py-24 lg:py-32 bg-surface-white">
        <div className="container mx-auto px-6 lg:px-12">
          <AnimatedSection className="max-w-2xl mb-20">
            <p className="font-sans text-sm font-medium tracking-[0.2em] text-text-caption uppercase mb-4">What We Produce</p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">
              A Complete Instagram<br /><span className="italic">Campaign System.</span>
            </h2>
          </AnimatedSection>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-divider">
            {deliverables.map((d) => (
              <motion.div key={d.title} variants={fadeUp} className="border-b border-r border-divider p-8 lg:p-10 last:border-r-0 [&:nth-child(3)]:border-r-0 [&:nth-child(3)]:lg:border-r-0">
                <d.icon size={28} strokeWidth={1.2} className="text-foreground/60 mb-6" />
                <h3 className="font-serif text-xl font-medium text-foreground mb-3">{d.title}</h3>
                <p className="font-sans text-sm text-text-secondary leading-relaxed">{d.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          <AnimatedSection className="mt-16 text-center">
            <p className="font-serif text-xl italic text-text-secondary">
              One production becomes a month of curated content.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ── MOTION + DETAIL IMAGE GRID ── */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatedSection className="md:col-span-2">
              <div className="overflow-hidden">
                <img src={motionImg} alt="Fashion model in motion on coastal location" className="w-full h-[400px] md:h-[500px] object-cover transition-transform duration-700 hover:scale-105" />
              </div>
            </AnimatedSection>
            <AnimatedSection>
              <div className="overflow-hidden h-full">
                <img src={detailImg} alt="Luxury fabric texture detail" className="w-full h-[400px] md:h-[500px] object-cover transition-transform duration-700 hover:scale-105" />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── INSTAGRAM SHOP ── */}
      <section className="py-24 lg:py-32 bg-surface-warm">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <div className="overflow-hidden">
                <img src={shopImg} alt="Luxury product photography for Instagram Shop" className="w-full h-[500px] object-cover transition-transform duration-700 hover:scale-105" />
              </div>
            </AnimatedSection>
            <AnimatedSection>
              <p className="font-sans text-sm font-medium tracking-[0.2em] text-text-caption uppercase mb-4">Instagram Shop — Elevated Commerce</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-8">
                Luxury Commerce<br /><span className="italic">Is Visual Trust.</span>
              </h2>
              <p className="font-sans text-base text-text-secondary leading-relaxed mb-8">
                We design shop imagery that feels clean yet atmospheric, detailed yet restrained, aspirational yet accessible.
              </p>
              <ul className="space-y-3">
                {["Optimized for clarity and scroll behavior", "Product focus without sacrificing brand identity", "Conversion-driven composition", "Platform-native formatting"].map((item) => (
                  <li key={item} className="font-sans text-sm text-foreground flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                    {item}
                  </li>
                ))}
              </ul>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── WHY LOCATION ── */}
      <section className="py-24 lg:py-32 bg-surface-white">
        <div className="container mx-auto px-6 lg:px-12">
          <AnimatedSection className="max-w-3xl mx-auto text-center">
            <p className="font-sans text-sm font-medium tracking-[0.2em] text-text-caption uppercase mb-4">Why Location</p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-8">
              A Studio Isolates.<br /><span className="italic">A Location Contextualizes.</span>
            </h2>
            <p className="font-sans text-base md:text-lg text-text-secondary leading-relaxed max-w-xl mx-auto mb-6">
              Location photography builds narrative, emotion, and perceived value. Your garments exist in movement — against skyline glass, coastal wind, architectural lines.
            </p>
            <p className="font-serif text-xl italic text-foreground">
              This is where brand mythology is created.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="container mx-auto px-6 lg:px-12">
          <AnimatedSection className="max-w-2xl mb-20">
            <p className="font-sans text-sm font-medium tracking-[0.2em] text-text-caption uppercase mb-4">Our Process</p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">
              Structured. Discreet.<br /><span className="italic">Precise.</span>
            </h2>
          </AnimatedSection>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-divider">
            {processSteps.map((step, i) => (
              <motion.div key={step} variants={fadeUp} className="border-b border-r border-divider p-8 lg:p-10 last:border-r-0">
                <span className="font-sans text-xs font-medium tracking-[0.2em] text-text-caption uppercase">
                  Step {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-serif text-2xl font-medium text-foreground mt-6">{step}</h3>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── PACKAGES ── */}
      <section className="py-24 lg:py-32 bg-surface-warm">
        <div className="container mx-auto px-6 lg:px-12">
          <AnimatedSection className="max-w-2xl mb-20">
            <p className="font-sans text-sm font-medium tracking-[0.2em] text-text-caption uppercase mb-4">Package Structure</p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">
              Luxury Framing<br /><span className="italic">for Modern Brands.</span>
            </h2>
          </AnimatedSection>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <motion.div key={pkg.name} variants={fadeUp} className="bg-surface-white p-10 lg:p-12 border border-divider">
                <h3 className="font-serif text-2xl font-medium text-foreground mb-4">{pkg.name}</h3>
                <p className="font-sans text-sm text-text-secondary leading-relaxed mb-8">{pkg.desc}</p>
                <a href="#contact" className="font-sans text-sm font-medium tracking-wide text-foreground border-b border-foreground pb-1 hover:opacity-70 transition-opacity inline-flex items-center gap-2">
                  {pkg.cta} <ArrowRight size={14} />
                </a>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TAGLINES ── */}
      <section className="py-24 lg:py-32 bg-foreground text-primary-foreground">
        <div className="container mx-auto px-6 lg:px-12">
          <AnimatedSection className="max-w-3xl mx-auto text-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-6">
              {[
                "Designed for the Feed. Crafted Like a Campaign.",
                "Editorial Content for the Scroll Era.",
                "Cinematic Visuals. Commercial Precision.",
                "Where Location Becomes Identity.",
              ].map((tagline) => (
                <motion.p key={tagline} variants={fadeUp} className="font-serif text-xl md:text-2xl font-light italic text-primary-foreground/80">
                  "{tagline}"
                </motion.p>
              ))}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="contact" className="py-24 lg:py-32 bg-surface-white">
        <div className="container mx-auto px-6 lg:px-12">
          <AnimatedSection className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-6">
              Your Brand Deserves<br />More Than Content.
            </h2>
            <p className="font-serif text-xl italic text-text-secondary mb-4">It deserves a campaign.</p>
            <p className="font-sans text-sm text-text-caption mb-12">
              Limited productions per month to maintain exclusivity.
            </p>
            <a href="#contact" className="font-sans text-sm font-medium tracking-wide bg-foreground text-primary-foreground px-10 py-4 hover:opacity-90 transition-opacity duration-300 uppercase inline-block">
              Book Your Private Creative Consultation
            </a>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default InstagramCampaigns;
