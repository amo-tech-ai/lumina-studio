import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Camera, Film, ShoppingBag, Layers, Play, ArrowRight } from "lucide-react";
import { AnimatedSection } from "@/components/marketing/animated-section";

export const metadata: Metadata = {
  title: "Instagram Campaigns",
  description: "Scroll-stopping Instagram content. AI-planned campaigns for Reels, Stories, and feed.",
  openGraph: {
    title: "Instagram Campaigns | iPix — Scroll-Stopping Content",
    description: "Scroll-stopping Instagram content. AI-planned campaigns for Reels, Stories, and feed.",
    images: ["/images/instagram-hero.jpg"],
  },
};

const approachPoints = ["Architectural backdrops", "Rooftop cityscapes", "Coastal light studies", "Minimalist urban textures", "Golden-hour natural light"];
const deliverables = [
  { icon: Film, title: "Instagram Reels", desc: "Cinematic short-form films with motion, texture, and rhythm." },
  { icon: Layers, title: "Carousel Stories", desc: "Multi-frame narratives designed for engagement and saves." },
  { icon: Camera, title: "Editorial Stills", desc: "Timeless imagery with depth, contrast, and atmosphere." },
  { icon: Play, title: "Feed Films", desc: "Polished 30–60 second campaign edits." },
  { icon: ShoppingBag, title: "Instagram Shop Visuals", desc: "Conversion-focused product imagery aligned with luxury positioning." },
];
const shopPoints = ["Optimized for clarity and scroll behavior", "Product focus without sacrificing brand identity", "Conversion-driven composition", "Platform-native formatting"];
const processSteps = ["Brand Immersion", "Location Curation", "Editorial Direction", "Production Execution", "Cinematic Post-Production", "Instagram-Optimized Delivery"];
const packages = [
  { name: "Signature Campaign", desc: "Full editorial shoot + short-form films + shop assets.", cta: "Book Consultation" },
  { name: "Seasonal Collection Launch", desc: "Campaign narrative + multi-location visuals.", cta: "Plan Your Season" },
  { name: "Ongoing Visual Partnership", desc: "Monthly content production for brands operating at scale.", cta: "Explore Partnership" },
];
const taglines = [
  "Designed for the Feed. Crafted Like a Campaign.",
  "Editorial Content for the Scroll Era.",
  "Cinematic Visuals. Commercial Precision.",
  "Where Location Becomes Identity.",
];

const caption = { color: "var(--mk-text-muted)" } as const;
const surface = { background: "var(--mk-surface)" } as const;
const warm = { background: "var(--mk-surface-warm)" } as const;
const bg = { background: "var(--mk-bg)" } as const;
const ink = { background: "var(--mk-text)" } as const;
const dot = { background: "color-mix(in srgb, var(--mk-text) 40%, transparent)" } as const;

export default function InstagramCampaignsPage() {
  return (
    <>
      {/* HERO — full-bleed */}
      <section className="relative flex min-h-screen items-center pt-20">
        <Image src="/images/instagram-hero.jpg" alt="Cinematic rooftop fashion campaign" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0" style={{ background: "rgba(26,23,20,0.4)" }} />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-32 lg:px-12">
          <AnimatedSection className="max-w-2xl">
            <p className="mb-6 text-sm font-medium uppercase tracking-[0.25em] text-white/70">Instagram Location Campaigns</p>
            <h1 className="mb-8 text-5xl font-light leading-[1.05] text-white md:text-6xl lg:text-7xl">Cinematic Visuals<br /><span className="italic">Designed for the<br />Modern Feed.</span></h1>
            <p className="mb-10 max-w-prose text-base leading-relaxed text-white/80 md:text-lg">
              We create editorial-grade photography and film on location — crafted specifically for Reels, Carousel storytelling, and Instagram Shop performance.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="#contact" className="px-8 py-4 text-center text-sm font-medium uppercase tracking-wide" style={{ background: "#fff", color: "var(--mk-text)" }}>Book a Private Consultation</Link>
              <Link href="#portfolio" className="border border-white px-8 py-4 text-center text-sm font-medium uppercase tracking-wide text-white">View Campaign Portfolio</Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* THE APPROACH */}
      <section className="py-24 lg:py-32" style={warm}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <AnimatedSection>
              <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]" style={caption}>The Approach</p>
              <h2 className="mb-8 text-4xl font-light md:text-5xl">Where Editorial<br /><span className="italic">Meets Performance.</span></h2>
              <p className="mb-6 text-base leading-relaxed" style={caption}>
                Every frame is intentional. We begin with brand alignment — understanding your aesthetic codes, audience psychology, and commercial objectives.
              </p>
              <p className="mb-8 text-base leading-relaxed" style={caption}>From there, we curate:</p>
              <ul className="space-y-3">
                {approachPoints.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full" style={dot} />{item}
                  </li>
                ))}
              </ul>
            </AnimatedSection>
            <AnimatedSection className="group relative h-[500px] overflow-hidden lg:h-[600px]">
              <Image src="/images/instagram-editorial.jpg" alt="Editorial urban skyline fashion" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* WHAT WE PRODUCE */}
      <section className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-20 max-w-2xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]" style={caption}>What We Produce</p>
            <h2 className="text-4xl font-light md:text-5xl">A Complete Instagram<br /><span className="italic">Campaign System.</span></h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 gap-px border-t md:grid-cols-2 lg:grid-cols-3" style={{ borderColor: "var(--mk-border)", background: "var(--mk-border)" }}>
            {deliverables.map((d) => (
              <div key={d.title} className="p-8 lg:p-10" style={surface}>
                <d.icon size={28} strokeWidth={1.2} className="mb-6" style={caption} />
                <h3 className="mb-3 text-xl font-medium">{d.title}</h3>
                <p className="text-sm leading-relaxed" style={caption}>{d.desc}</p>
              </div>
            ))}
          </div>
          <AnimatedSection className="mt-16 text-center">
            <p className="text-xl italic" style={{ fontFamily: "var(--font-cormorant)", color: "var(--mk-text-muted)" }}>One production becomes a month of curated content.</p>
          </AnimatedSection>
        </div>
      </section>

      {/* MOTION + DETAIL GRID */}
      <section className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <AnimatedSection className="group relative h-[400px] overflow-hidden md:col-span-2 md:h-[500px]">
              <Image src="/images/instagram-motion.jpg" alt="Fashion model in motion on coastal location" fill sizes="(max-width:768px) 100vw, 66vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            </AnimatedSection>
            <AnimatedSection className="group relative h-[400px] overflow-hidden md:h-[500px]">
              <Image src="/images/instagram-detail.jpg" alt="Luxury fabric texture detail" fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* INSTAGRAM SHOP */}
      <section className="py-24 lg:py-32" style={warm}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <AnimatedSection className="group relative h-[500px] overflow-hidden">
              <Image src="/images/instagram-shop.jpg" alt="Luxury product photography for Instagram Shop" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            </AnimatedSection>
            <AnimatedSection>
              <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]" style={caption}>Instagram Shop — Elevated Commerce</p>
              <h2 className="mb-8 text-4xl font-light md:text-5xl">Luxury Commerce<br /><span className="italic">Is Visual Trust.</span></h2>
              <p className="mb-8 text-base leading-relaxed" style={caption}>
                We design shop imagery that feels clean yet atmospheric, detailed yet restrained, aspirational yet accessible.
              </p>
              <ul className="space-y-3">
                {shopPoints.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full" style={dot} />{item}
                  </li>
                ))}
              </ul>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* WHY LOCATION */}
      <section className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]" style={caption}>Why Location</p>
            <h2 className="mb-8 text-4xl font-light md:text-5xl">A Studio Isolates.<br /><span className="italic">A Location Contextualizes.</span></h2>
            <p className="mx-auto mb-6 max-w-xl text-base leading-relaxed md:text-lg" style={caption}>
              Location photography builds narrative, emotion, and perceived value. Your garments exist in movement — against skyline glass, coastal wind, architectural lines.
            </p>
            <p className="text-xl italic" style={{ fontFamily: "var(--font-cormorant)" }}>This is where brand mythology is created.</p>
          </AnimatedSection>
        </div>
      </section>

      {/* PROCESS */}
      <section className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-20 max-w-2xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]" style={caption}>Our Process</p>
            <h2 className="text-4xl font-light md:text-5xl">Structured. Discreet.<br /><span className="italic">Precise.</span></h2>
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
            <h2 className="text-4xl font-light md:text-5xl">Luxury Framing<br /><span className="italic">for Modern Brands.</span></h2>
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
            <h2 className="mb-6 text-4xl font-light md:text-5xl lg:text-6xl">Your Brand Deserves<br />More Than Content.</h2>
            <p className="mb-4 text-xl italic" style={{ fontFamily: "var(--font-cormorant)", color: "var(--mk-text-muted)" }}>It deserves a campaign.</p>
            <p className="mb-12 text-sm" style={caption}>Limited productions per month to maintain exclusivity.</p>
            <Link href="/#contact" className="inline-block px-10 py-4 text-sm font-medium uppercase tracking-wide text-white" style={ink}>Book Your Private Creative Consultation</Link>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
