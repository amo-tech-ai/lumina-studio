import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Film, Video, Smartphone, Layers, Play, Clapperboard, ArrowRight } from "lucide-react";
import { AnimatedSection } from "@/components/marketing/animated-section";

export const metadata: Metadata = {
  title: "Video Production",
  description: "Cinematic fashion video production. AI-planned brand films and social content.",
  openGraph: {
    title: "Video Production | iPix — Cinematic Fashion Video",
    description: "Cinematic fashion video production. AI-planned brand films and social content.",
    images: ["/images/video-hero.jpg"],
  },
};

const brandFilmPoints = ["Narrative storyboarding & scripting", "Professional talent direction", "Cinematic color grading", "Multi-format deliverables", "Licensed music curation"];
const motionPoints = ["Animated brand identities", "Kinetic typography & title cards", "Data visualizations & infographics", "Social media motion templates", "Video intros & outros"];
const services = [
  { icon: Film, title: "Brand Films", desc: "Cinematic brand stories that communicate your identity, values, and vision in 60–180 seconds." },
  { icon: Video, title: "Product Videos", desc: "360° reveals, unboxing sequences, and detail-driven films that convert browsers into buyers." },
  { icon: Smartphone, title: "Social Content", desc: "Platform-native vertical and square films optimized for Reels, TikTok, and Stories." },
  { icon: Layers, title: "Motion Graphics", desc: "Animated logos, kinetic typography, and data visualizations that elevate your visual language." },
  { icon: Play, title: "Campaign Edits", desc: "Polished 15–60 second ad cuts formatted for Meta, YouTube, and programmatic placements." },
  { icon: Clapperboard, title: "Behind the Scenes", desc: "Authentic production footage that builds brand transparency and audience connection." },
];
const processSteps = ["Creative Brief & Storyboarding", "Pre-Production Planning", "Location & Talent Coordination", "Principal Photography", "Post-Production & Color Grade", "Platform-Optimized Delivery"];
const packages = [
  { name: "Brand Film Package", desc: "Hero brand film + social cutdowns + motion graphics intro.", cta: "Book Consultation" },
  { name: "Product Launch Suite", desc: "Product hero videos + 360° spins + lifestyle B-roll.", cta: "Plan Your Launch" },
  { name: "Ongoing Content Partnership", desc: "Monthly video production for brands operating at scale across platforms.", cta: "Explore Partnership" },
];
const taglines = ["Moving Images. Measurable Impact.", "Cinematic Quality. Commercial Precision.", "Every Frame Engineered to Convert.", "Where Vision Meets Production."];

const caption = { color: "var(--mk-text-muted)" } as const;
const surface = { background: "var(--mk-surface)" } as const;
const warm = { background: "var(--mk-surface-warm)" } as const;
const bg = { background: "var(--mk-bg)" } as const;
const ink = { background: "var(--mk-text)" } as const;
const dot = { background: "color-mix(in srgb, var(--mk-text) 40%, transparent)" } as const;

export default function VideoProductionPage() {
  return (
    <>
      {/* HERO — full-bleed */}
      <section className="relative flex min-h-screen items-center pt-20">
        <Image src="/images/video-hero.jpg" alt="Professional video production studio with cinematic lighting" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0" style={{ background: "rgba(26,23,20,0.5)" }} />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-32 lg:px-12">
          <AnimatedSection className="max-w-2xl">
            <p className="mb-6 text-sm font-medium uppercase tracking-[0.25em] text-white/70">Video Production</p>
            <h1 className="mb-8 text-5xl font-light leading-[1.05] text-white md:text-6xl lg:text-7xl">Moving Images.<br /><span className="italic">Lasting Impressions.</span></h1>
            <p className="mb-10 max-w-prose text-base leading-relaxed text-white/80 md:text-lg">
              From cinematic brand films to scroll-stopping social content — we produce video that elevates perception, drives engagement, and converts at every touchpoint.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="#contact" className="px-8 py-4 text-center text-sm font-medium uppercase tracking-wide" style={{ background: "#fff", color: "var(--mk-text)" }}>Start Your Project</Link>
              <Link href="#portfolio" className="border border-white px-8 py-4 text-center text-sm font-medium uppercase tracking-wide text-white">View Showreel</Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* BRAND FILMS */}
      <section className="py-24 lg:py-32" style={warm}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <AnimatedSection>
              <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]" style={caption}>Brand Films</p>
              <h2 className="mb-8 text-4xl font-light md:text-5xl">Your Story,<br /><span className="italic">Cinematically Told.</span></h2>
              <p className="mb-6 text-base leading-relaxed" style={caption}>
                A brand film is more than a video — it&apos;s your visual manifesto. We craft narrative-driven films that distill your identity into cinematic moments that resonate across every channel.
              </p>
              <ul className="space-y-3">
                {brandFilmPoints.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm"><span className="h-1.5 w-1.5 rounded-full" style={dot} />{item}</li>
                ))}
              </ul>
            </AnimatedSection>
            <AnimatedSection className="group relative h-[500px] overflow-hidden lg:h-[600px]">
              <Image src="/images/video-brand.jpg" alt="Cinematic brand film production" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* WHAT WE PRODUCE */}
      <section className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-20 max-w-2xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]" style={caption}>What We Produce</p>
            <h2 className="text-4xl font-light md:text-5xl">A Full-Spectrum<br /><span className="italic">Video Suite.</span></h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 gap-px border-t md:grid-cols-2 lg:grid-cols-3" style={{ borderColor: "var(--mk-border)", background: "var(--mk-border)" }}>
            {services.map((d) => (
              <div key={d.title} className="p-8 lg:p-10" style={surface}>
                <d.icon size={28} strokeWidth={1.2} className="mb-6" style={caption} />
                <h3 className="mb-3 text-xl font-medium">{d.title}</h3>
                <p className="text-sm leading-relaxed" style={caption}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT + SOCIAL GRID */}
      <section className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <AnimatedSection className="group relative h-[400px] overflow-hidden md:col-span-2 md:h-[500px]">
              <Image src="/images/video-product.jpg" alt="Premium product video setup" fill sizes="(max-width:768px) 100vw, 66vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            </AnimatedSection>
            <AnimatedSection className="group relative h-[400px] overflow-hidden md:h-[500px]">
              <Image src="/images/video-social.jpg" alt="Social content creation" fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* MOTION GRAPHICS */}
      <section className="py-24 lg:py-32" style={warm}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <AnimatedSection className="group relative h-[500px] overflow-hidden">
              <Image src="/images/video-motion.jpg" alt="Motion graphics design on screen" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            </AnimatedSection>
            <AnimatedSection>
              <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]" style={caption}>Motion Graphics</p>
              <h2 className="mb-8 text-4xl font-light md:text-5xl">Design in<br /><span className="italic">Motion.</span></h2>
              <p className="mb-8 text-base leading-relaxed" style={caption}>
                From animated logos and title sequences to data-driven infographics and kinetic typography — we bring static brand elements to life with refined, purposeful motion.
              </p>
              <ul className="space-y-3">
                {motionPoints.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm"><span className="h-1.5 w-1.5 rounded-full" style={dot} />{item}</li>
                ))}
              </ul>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* WHY VIDEO */}
      <section className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]" style={caption}>Why Video</p>
            <h2 className="mb-8 text-4xl font-light md:text-5xl">A Photo Captures.<br /><span className="italic">A Film Immerses.</span></h2>
            <p className="mx-auto mb-6 max-w-xl text-base leading-relaxed md:text-lg" style={caption}>
              Video drives 1200% more shares than text and images combined. It builds trust, communicates complexity, and creates emotional connections that static content simply cannot.
            </p>
            <p className="text-xl italic" style={{ fontFamily: "var(--font-cormorant)" }}>This is where brands become unforgettable.</p>
          </AnimatedSection>
        </div>
      </section>

      {/* PROCESS */}
      <section className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-20 max-w-2xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]" style={caption}>Our Process</p>
            <h2 className="text-4xl font-light md:text-5xl">From Concept<br /><span className="italic">to Screen.</span></h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 gap-px border-t md:grid-cols-2 lg:grid-cols-3" style={{ borderColor: "var(--mk-border)", background: "var(--mk-border)" }}>
            {processSteps.map((step, i) => (
              <div key={step} className="p-8 lg:p-10" style={bg}>
                <span className="text-xs font-medium uppercase tracking-[0.2em]" style={caption}>Step {String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-6 text-2xl font-medium">{step}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PACKAGES */}
      <section className="py-24 lg:py-32" style={warm}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-20 max-w-2xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]" style={caption}>Package Structure</p>
            <h2 className="text-4xl font-light md:text-5xl">Production Tiers<br /><span className="italic">for Every Scale.</span></h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {packages.map((pkg) => (
              <div key={pkg.name} className="p-10 lg:p-12" style={{ ...surface, border: "1px solid var(--mk-border)" }}>
                <h3 className="mb-4 text-2xl font-medium">{pkg.name}</h3>
                <p className="mb-8 text-sm leading-relaxed" style={caption}>{pkg.desc}</p>
                <Link href="#contact" className="inline-flex items-center gap-2 border-b pb-1 text-sm font-medium" style={{ borderColor: "var(--mk-text)" }}>{pkg.cta} <ArrowRight size={14} /></Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TAGLINES (dark) */}
      <section className="py-24 lg:py-32" style={ink}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mx-auto max-w-3xl space-y-6 text-center">
            {taglines.map((t) => (
              <p key={t} className="text-xl font-light italic md:text-2xl" style={{ fontFamily: "var(--font-cormorant)", color: "rgba(255,255,255,0.8)" }}>&ldquo;{t}&rdquo;</p>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-4xl font-light md:text-5xl lg:text-6xl">Your Brand Deserves<br />More Than Footage.</h2>
            <p className="mb-4 text-xl italic" style={{ fontFamily: "var(--font-cormorant)", color: "var(--mk-text-muted)" }}>It deserves a film.</p>
            <p className="mb-12 text-sm" style={caption}>Limited productions per month to maintain cinematic standards.</p>
            <Link href="#contact" className="inline-block px-10 py-4 text-sm font-medium uppercase tracking-wide text-white" style={ink}>Book Your Creative Consultation</Link>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
