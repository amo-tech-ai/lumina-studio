import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Film, Video, Smartphone, Layers, Play, Clapperboard, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import heroImg from "@/assets/video-hero.jpg";
import brandImg from "@/assets/video-brand.jpg";
import productImg from "@/assets/video-product.jpg";
import socialImg from "@/assets/video-social.jpg";
import motionImg from "@/assets/video-motion.jpg";

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

const services = [
  { icon: Film, title: "Brand Films", desc: "Cinematic brand stories that communicate your identity, values, and vision in 60–180 seconds." },
  { icon: Video, title: "Product Videos", desc: "360° reveals, unboxing sequences, and detail-driven films that convert browsers into buyers." },
  { icon: Smartphone, title: "Social Content", desc: "Platform-native vertical and square films optimized for Reels, TikTok, and Stories." },
  { icon: Layers, title: "Motion Graphics", desc: "Animated logos, kinetic typography, and data visualizations that elevate your visual language." },
  { icon: Play, title: "Campaign Edits", desc: "Polished 15–60 second ad cuts formatted for Meta, YouTube, and programmatic placements." },
  { icon: Clapperboard, title: "Behind the Scenes", desc: "Authentic production footage that builds brand transparency and audience connection." },
];

const processSteps = [
  "Creative Brief & Storyboarding",
  "Pre-Production Planning",
  "Location & Talent Coordination",
  "Principal Photography",
  "Post-Production & Color Grade",
  "Platform-Optimized Delivery",
];

const packages = [
  { name: "Brand Film Package", desc: "Hero brand film + social cutdowns + motion graphics intro.", cta: "Book Consultation" },
  { name: "Product Launch Suite", desc: "Product hero videos + 360° spins + lifestyle B-roll.", cta: "Plan Your Launch" },
  { name: "Ongoing Content Partnership", desc: "Monthly video production for brands operating at scale across platforms.", cta: "Explore Partnership" },
];

const VideoProduction = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Professional video production studio with cinematic lighting" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-foreground/50" />
        </div>
        <div className="relative container mx-auto px-6 lg:px-12 py-32">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }} className="max-w-2xl">
            <p className="font-sans text-sm font-medium tracking-[0.25em] text-primary-foreground/70 uppercase mb-6">
              Video Production
            </p>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-light leading-[1.05] text-primary-foreground mb-8">
              Moving Images.<br />
              <span className="italic">Lasting Impressions.</span>
            </h1>
            <p className="font-sans text-base md:text-lg text-primary-foreground/80 leading-relaxed max-w-prose mb-10">
              From cinematic brand films to scroll-stopping social content — we produce video that elevates perception, drives engagement, and converts at every touchpoint.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#contact" className="font-sans text-sm font-medium tracking-wide bg-primary-foreground text-foreground px-8 py-4 hover:opacity-90 transition-opacity duration-300 uppercase text-center">
                Start Your Project
              </a>
              <a href="#portfolio" className="font-sans text-sm font-medium tracking-wide border border-primary-foreground text-primary-foreground px-8 py-4 hover:bg-primary-foreground hover:text-foreground transition-all duration-300 uppercase text-center">
                View Showreel
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── BRAND FILMS ── */}
      <section className="py-24 lg:py-32 bg-surface-warm">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <p className="font-sans text-sm font-medium tracking-[0.2em] text-text-caption uppercase mb-4">Brand Films</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-8">
                Your Story,<br /><span className="italic">Cinematically Told.</span>
              </h2>
              <p className="font-sans text-base text-text-secondary leading-relaxed mb-6">
                A brand film is more than a video — it's your visual manifesto. We craft narrative-driven films that distill your identity into cinematic moments that resonate across every channel.
              </p>
              <ul className="space-y-3">
                {["Narrative storyboarding & scripting", "Professional talent direction", "Cinematic color grading", "Multi-format deliverables", "Licensed music curation"].map((item) => (
                  <li key={item} className="font-sans text-sm text-foreground flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                    {item}
                  </li>
                ))}
              </ul>
            </AnimatedSection>
            <AnimatedSection>
              <div className="overflow-hidden">
                <img src={brandImg} alt="Cinematic brand film production" className="w-full h-[500px] lg:h-[600px] object-cover transition-transform duration-700 hover:scale-105" />
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
              A Full-Spectrum<br /><span className="italic">Video Suite.</span>
            </h2>
          </AnimatedSection>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-divider">
            {services.map((d) => (
              <motion.div key={d.title} variants={fadeUp} className="border-b border-r border-divider p-8 lg:p-10 last:border-r-0 [&:nth-child(3)]:lg:border-r-0">
                <d.icon size={28} strokeWidth={1.2} className="text-foreground/60 mb-6" />
                <h3 className="font-serif text-xl font-medium text-foreground mb-3">{d.title}</h3>
                <p className="font-sans text-sm text-text-secondary leading-relaxed">{d.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── PRODUCT + SOCIAL IMAGE GRID ── */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatedSection className="md:col-span-2">
              <div className="overflow-hidden">
                <img src={productImg} alt="Premium product video setup" className="w-full h-[400px] md:h-[500px] object-cover transition-transform duration-700 hover:scale-105" />
              </div>
            </AnimatedSection>
            <AnimatedSection>
              <div className="overflow-hidden h-full">
                <img src={socialImg} alt="Social content creation" className="w-full h-[400px] md:h-[500px] object-cover transition-transform duration-700 hover:scale-105" />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── MOTION GRAPHICS ── */}
      <section className="py-24 lg:py-32 bg-surface-warm">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <div className="overflow-hidden">
                <img src={motionImg} alt="Motion graphics design on screen" className="w-full h-[500px] object-cover transition-transform duration-700 hover:scale-105" />
              </div>
            </AnimatedSection>
            <AnimatedSection>
              <p className="font-sans text-sm font-medium tracking-[0.2em] text-text-caption uppercase mb-4">Motion Graphics</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-8">
                Design in<br /><span className="italic">Motion.</span>
              </h2>
              <p className="font-sans text-base text-text-secondary leading-relaxed mb-8">
                From animated logos and title sequences to data-driven infographics and kinetic typography — we bring static brand elements to life with refined, purposeful motion.
              </p>
              <ul className="space-y-3">
                {["Animated brand identities", "Kinetic typography & title cards", "Data visualizations & infographics", "Social media motion templates", "Video intros & outros"].map((item) => (
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

      {/* ── WHY VIDEO ── */}
      <section className="py-24 lg:py-32 bg-surface-white">
        <div className="container mx-auto px-6 lg:px-12">
          <AnimatedSection className="max-w-3xl mx-auto text-center">
            <p className="font-sans text-sm font-medium tracking-[0.2em] text-text-caption uppercase mb-4">Why Video</p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-8">
              A Photo Captures.<br /><span className="italic">A Film Immerses.</span>
            </h2>
            <p className="font-sans text-base md:text-lg text-text-secondary leading-relaxed max-w-xl mx-auto mb-6">
              Video drives 1200% more shares than text and images combined. It builds trust, communicates complexity, and creates emotional connections that static content simply cannot.
            </p>
            <p className="font-serif text-xl italic text-foreground">
              This is where brands become unforgettable.
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
              From Concept<br /><span className="italic">to Screen.</span>
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
              Production Tiers<br /><span className="italic">for Every Scale.</span>
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
                "Moving Images. Measurable Impact.",
                "Cinematic Quality. Commercial Precision.",
                "Every Frame Engineered to Convert.",
                "Where Vision Meets Production.",
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
              Your Brand Deserves<br />More Than Footage.
            </h2>
            <p className="font-serif text-xl italic text-text-secondary mb-4">It deserves a film.</p>
            <p className="font-sans text-sm text-text-caption mb-12">
              Limited productions per month to maintain cinematic standards.
            </p>
            <a href="#contact" className="font-sans text-sm font-medium tracking-wide bg-foreground text-primary-foreground px-10 py-4 hover:opacity-90 transition-opacity duration-300 uppercase inline-block">
              Book Your Creative Consultation
            </a>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default VideoProduction;
