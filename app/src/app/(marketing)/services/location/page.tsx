import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle, Monitor, Instagram, ShoppingBag, Megaphone, Layers, FileCheck,
  Palette, Users, Sparkles, Camera, MapPin, Globe, Zap,
} from "lucide-react";
import { AnimatedSection } from "@/components/marketing/animated-section";
import { FAQ } from "@/components/marketing/faq";

export const metadata: Metadata = {
  title: "Location Photography",
  description: "On-location fashion photography. Urban, coastal, and lifestyle shoots.",
  openGraph: {
    title: "Location Photography | iPix — On-Location Fashion Shoots",
    description: "On-location fashion photography. Urban, coastal, and lifestyle shoots.",
    images: ["/images/location-hero.png"],
  },
};

const whyPoints = ["Higher engagement rates", "Stronger emotional pull", "Better campaign differentiation", "More versatile marketing assets"];
const whyImages = [
  { src: "location-coastal.png", alt: "Coastal fashion photography" },
  { src: "location-streets.jpg", alt: "Urban street fashion" },
  { src: "location-nature.jpg", alt: "Nature fashion photography" },
  { src: "location-interior.jpg", alt: "Interior lifestyle fashion" },
];
const locationTypes = [
  { num: "01", sub: "Controlled Precision", title: "Studio Editorial", desc: "Perfect for lookbooks, ecommerce heroes, and campaign imagery. Maximum consistency with flawless detail.", cta: "Plan Editorial Shoot →", img: "fashion-hero.jpg", alt: "Studio editorial fashion", imgFirst: true },
  { num: "02", sub: "Organic Storytelling", title: "Coastal & Resort", desc: "Swimwear, summer capsules, resort collections. Natural motion and organic storytelling in sun-drenched settings.", cta: "Plan Coastal Shoot →", img: "location-coastal.png", alt: "Coastal resort fashion photography", imgFirst: false },
  { num: "03", sub: "Aspirational Energy", title: "Urban / Industrial", desc: "Streetwear, Gen Z brands, high-energy drops. High-contrast architectural backdrops for aspirational positioning.", cta: "Plan Urban Shoot →", img: "location-urban.png", alt: "Urban industrial fashion photography", imgFirst: true },
  { num: "04", sub: "Narrative Richness", title: "Nature & Scenic", desc: "Sustainable labels and artisan brands. Textured landscapes that communicate authenticity and depth.", cta: "Plan Nature Shoot →", img: "location-nature.jpg", alt: "Nature scenic fashion photography", imgFirst: false },
  { num: "05", sub: "Emotional Warmth", title: "Interior Lifestyle", desc: "DTC lifestyle brands. Cafes, homes, minimal interiors — relatability and emotional warmth that builds connection.", cta: "Plan Lifestyle Shoot →", img: "location-interior.jpg", alt: "Interior lifestyle fashion photography", imgFirst: true },
];
const stages = [
  { stage: "Stage 1", title: "Professional Production", items: ["Manual booking & scouting", "Casting & logistics", "On-location crew management", "High-end delivery"] },
  { stage: "Stage 2", title: "AI-Assisted Planning", items: ["AI-generated shot lists", "Brand-aware moodboards", "Channel-based deliverables", "Asset reuse strategy"] },
  { stage: "Stage 3", title: "Automated Pipeline", items: ["SKU auto-tagging", "Shopify + Amazon routing", "Social-ready crops", "Wholesale line sheets"] },
];
const execution = [
  { step: "01", title: "Brand Strategy Call", desc: "Define positioning, channels, and campaign goals." },
  { step: "02", title: "Location Scouting", desc: "Permits, lighting plan, logistics, and weather contingency." },
  { step: "03", title: "Production Day", desc: "Mobile lighting setups. Efficient crew footprint. Maximum output." },
  { step: "04", title: "Post-Production", desc: "Retouching, compositing, color grading, multi-format delivery." },
  { step: "05", title: "Multi-Channel Output", desc: "Website, Social, eCommerce, Wholesale — platform-ready assets." },
];
const channels = [
  { icon: Monitor, label: "Homepage Hero" },
  { icon: Instagram, label: "Instagram Reels" },
  { icon: ShoppingBag, label: "Shopify PDP" },
  { icon: Megaphone, label: "Paid Ads" },
  { icon: Layers, label: "Wholesale Catalog" },
  { icon: FileCheck, label: "Press Kit" },
];
const services = [
  { icon: Palette, label: "Creative Direction" },
  { icon: Users, label: "Model Casting" },
  { icon: Sparkles, label: "Styling" },
  { icon: Camera, label: "Hair & Makeup" },
  { icon: MapPin, label: "Location Scouting" },
  { icon: FileCheck, label: "Permits" },
  { icon: Globe, label: "On-Site Management" },
  { icon: Zap, label: "Retouching" },
];
const portfolio = ["location-coastal.png", "location-streets.jpg", "location-urban.png", "location-nature.jpg", "location-interior.jpg", "portfolio-fashion.jpg"];
const faqs = [
  { q: "What locations do you shoot at?", a: "We shoot nationwide and internationally — from urban cityscapes and coastal landscapes to rural countryside and interior lifestyle settings. We handle all scouting, permits, and logistics." },
  { q: "What happens if the weather is bad?", a: "We have weather contingency plans for every shoot. If conditions are unsuitable, we can reschedule or recreate the environment in-studio using advanced compositing techniques." },
  { q: "How many images will I receive?", a: "This depends on the package and scope. A typical full-day location shoot delivers 40–80+ final retouched images across multiple formats and platforms." },
  { q: "Do you provide models and stylists?", a: "Yes. We handle full production including model casting, styling, hair & makeup, and creative direction. You can also bring your own team." },
  { q: "Can you shoot for multiple channels in one session?", a: "Absolutely. Our AI-assisted planning ensures we capture content optimized for website, social, eCommerce, wholesale, and paid media — all in one shoot." },
  { q: "What is the typical turnaround time?", a: "Standard delivery is 7–10 business days from shoot date. Rush delivery is available for an additional fee." },
];

const caption = { color: "var(--mk-text-muted)" } as const;
const surface = { background: "var(--mk-surface)" } as const;
const bg = { background: "var(--mk-bg)" } as const;
const ink = { background: "var(--mk-text)" } as const;

export default function LocationPhotographyPage() {
  return (
    <>
      {/* HERO — full-screen image + dark overlay */}
      <section className="relative flex min-h-screen items-center">
        <Image src="/images/location-hero.png" alt="Cinematic location fashion photography" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0" style={{ background: "rgba(26,23,20,0.45)" }} />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-20 lg:px-12">
          <AnimatedSection className="max-w-2xl">
            <p className="mb-6 text-xs font-medium uppercase tracking-[0.25em] text-white/70">Location Fashion Photography</p>
            <h1 className="mb-6 text-5xl font-light leading-[1.05] text-white md:text-6xl lg:text-7xl">
              Scenic Success.<br /><span className="italic">Location Fashion Photography</span><br />for Modern Brands.
            </h1>
            <p className="mb-10 max-w-lg text-base leading-relaxed text-white/80 md:text-lg">
              Cinematic campaigns designed to move product, elevate perception, and scale across every channel.
            </p>
            <div className="mb-6 flex flex-wrap gap-4">
              <Link href="#contact" className="px-8 py-4 text-sm font-medium uppercase tracking-wide" style={{ background: "#fff", color: "var(--mk-text)" }}>Start a Shoot</Link>
              <Link href="#process" className="border border-white px-8 py-4 text-sm font-medium uppercase tracking-wide text-white">Talk to Production</Link>
            </div>
            <p className="text-xs tracking-wide text-white/60">One shoot. Infinite assets.</p>
          </AnimatedSection>
        </div>
      </section>

      {/* WHY LOCATION */}
      <section className="py-24 lg:py-32" style={{ backgroundColor: "hsl(40 14% 96%)" }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <AnimatedSection>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>The Case for Location</p>
              <h2 className="mb-6 text-4xl font-light md:text-5xl">Why Location<br /><span className="italic">Photography Works</span></h2>
              <p className="mb-8 max-w-md text-base leading-relaxed" style={caption}>
                Location transforms garments into narrative. Instead of isolated studio images, your collection lives inside real environments — creating emotional resonance that drives action.
              </p>
              <ul className="mb-8 space-y-3">
                {whyPoints.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm" style={caption}>
                    <CheckCircle size={14} className="shrink-0" style={{ color: "var(--mk-primary)" }} />{item}
                  </li>
                ))}
              </ul>
              <Link href="#locations" className="text-sm font-medium uppercase tracking-wide underline underline-offset-4">Explore Location Styles →</Link>
            </AnimatedSection>
            <AnimatedSection className="grid grid-cols-2 gap-2">
              {whyImages.map((im) => (
                <div key={im.src} className="relative h-64">
                  <Image src={`/images/${im.src}`} alt={im.alt} fill sizes="(max-width:1024px) 50vw, 25vw" className="object-cover" />
                </div>
              ))}
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* LOCATION TYPES (alternating) */}
      <section id="locations" className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-20 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Location Styles</p>
            <h2 className="text-4xl font-light md:text-5xl">Environments That Sell</h2>
          </AnimatedSection>
          {locationTypes.map((loc, i) => {
            const Img = (
              <div className="relative h-[450px] lg:h-[550px]">
                <Image src={`/images/${loc.img}`} alt={loc.alt} fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
              </div>
            );
            const Copy = (
              <div className="flex flex-col justify-center p-10 lg:p-16" style={bg}>
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>{loc.num} — {loc.sub}</p>
                <h3 className="mb-4 text-3xl font-light md:text-4xl">{loc.title}</h3>
                <p className="mb-6 text-base leading-relaxed" style={caption}>{loc.desc}</p>
                <Link href="#contact" className="text-sm font-medium uppercase tracking-wide underline underline-offset-4">{loc.cta}</Link>
              </div>
            );
            return (
              <div key={loc.num} className={`grid grid-cols-1 overflow-hidden lg:grid-cols-2 ${i < locationTypes.length - 1 ? "mb-1" : ""}`}>
                {loc.imgFirst ? <>{Img}{Copy}</> : <><div className="order-2 lg:order-1">{Copy}</div><div className="order-1 lg:order-2">{Img}</div></>}
              </div>
            );
          })}
        </div>
      </section>

      {/* iPIX ADVANTAGE (dark) */}
      <section className="py-24 lg:py-32" style={{ background: "var(--mk-text)" }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-16 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={{ color: "rgba(255,255,255,0.5)" }}>What Makes Us Different</p>
            <h2 className="text-4xl font-light text-white md:text-5xl">Production Meets<br /><span className="italic">Intelligence.</span></h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 gap-px md:grid-cols-3">
            {stages.map((card) => (
              <div key={card.stage} className="p-10 lg:p-12" style={{ background: "rgba(255,255,255,0.05)" }}>
                <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={{ color: "rgba(255,255,255,0.4)" }}>{card.stage}</p>
                <h3 className="mb-6 text-2xl font-medium text-white">{card.title}</h3>
                <ul className="space-y-3">
                  {card.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                      <CheckCircle size={14} className="mt-0.5 shrink-0" style={{ color: "rgba(255,255,255,0.4)" }} />{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-10 text-center text-sm tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>One campaign → Every channel.</p>
        </div>
      </section>

      {/* HOW WE EXECUTE */}
      <section id="process" className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-16 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>How It Works</p>
            <h2 className="text-4xl font-light md:text-5xl">Location Shoot Execution</h2>
          </AnimatedSection>
          <div className="mx-auto max-w-2xl">
            {execution.map((item, i) => (
              <div key={item.step} className={`ml-4 flex gap-8 ${i < execution.length - 1 ? "border-l pb-12" : ""}`} style={{ borderColor: "var(--mk-border)" }}>
                <div className="-ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white" style={ink}>{item.step}</div>
                <div className="pt-1">
                  <h3 className="mb-1 text-xl font-medium">{item.title}</h3>
                  <p className="text-sm" style={caption}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STRATEGIC ADVANTAGE */}
      <section className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <AnimatedSection>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Multi-Channel Strategy</p>
              <h2 className="mb-6 text-4xl font-light md:text-5xl">The Shoot Is the Beginning —<br /><span className="italic">Not the End.</span></h2>
              <p className="mb-8 max-w-md text-base leading-relaxed" style={caption}>
                One campaign generates assets for every channel. Modern brands scale by planning outputs before shooting.
              </p>
              <Link href="#contact" className="inline-block px-8 py-4 text-sm font-medium uppercase tracking-wide text-white" style={ink}>Build Multi-Channel Campaign</Link>
            </AnimatedSection>
            <AnimatedSection className="grid grid-cols-2 gap-4">
              {channels.map((item) => (
                <div key={item.label} className="flex items-center gap-4 p-6" style={{ ...bg, border: "1px solid var(--mk-border)" }}>
                  <item.icon size={20} strokeWidth={1.2} className="shrink-0" style={caption} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              ))}
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* PRICING + story grid */}
      <section className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-16 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Investment</p>
            <h2 className="mb-4 text-4xl font-light md:text-5xl">Transparent Production Framework</h2>
            <p className="mx-auto max-w-lg text-base" style={caption}>Typical range: $1,000 – $5,000+ per day. Bundled pricing available for multi-channel production.</p>
          </AnimatedSection>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { src: "location-coastal.png", ratio: "aspect-[4/3]", alt: "Coastal location fashion photography" },
              { src: "location-streets.jpg", ratio: "aspect-[3/4]", alt: "Full-body outdoor fashion shot on location" },
              { src: "location-nature.jpg", ratio: "aspect-square", alt: "Close-up detail texture fashion photography" },
            ].map((im) => (
              <div key={im.src} className={`group relative overflow-hidden ${im.ratio}`}>
                <Image src={`/images/${im.src}`} alt={im.alt} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="#contact" className="inline-block px-8 py-4 text-sm font-medium uppercase tracking-wide text-white" style={ink}>Request Custom Quote</Link>
          </div>
        </div>
      </section>

      {/* HAVE CAMERA WILL TRAVEL — full-bleed */}
      <section className="relative py-32 lg:py-40">
        <Image src="/images/location-travel.jpg" alt="International fashion production on location" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0" style={{ background: "rgba(26,23,20,0.5)" }} />
        <AnimatedSection className="relative z-10 mx-auto max-w-7xl px-6 text-center lg:px-12">
          <h2 className="mb-6 text-4xl font-light text-white md:text-5xl lg:text-6xl">National &amp; International<br /><span className="italic">Production.</span></h2>
          <p className="mx-auto mb-4 max-w-lg text-base leading-relaxed text-white/80">Weather contingency? We recreate environments in-studio using advanced compositing.</p>
          <p className="text-sm italic text-white/60">Location feel. Studio control.</p>
        </AnimatedSection>
      </section>

      {/* FULL PRODUCTION SERVICES */}
      <section className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-16 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>End-to-End</p>
            <h2 className="text-4xl font-light md:text-5xl">Full Production Services</h2>
          </AnimatedSection>
          <div className="grid grid-cols-2 gap-px md:grid-cols-4" style={{ background: "var(--mk-border)" }}>
            {services.map((item) => (
              <div key={item.label} className="p-8 text-center lg:p-10" style={surface}>
                <item.icon size={28} strokeWidth={1.2} className="mx-auto mb-4" style={caption} />
                <p className="text-sm font-medium">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="#contact" className="text-sm font-medium uppercase tracking-wide underline underline-offset-4">Speak to Production Team →</Link>
          </div>
        </div>
      </section>

      {/* PORTFOLIO */}
      <section className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-16 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Selected Work</p>
            <h2 className="text-4xl font-light md:text-5xl">Location Portfolio</h2>
          </AnimatedSection>
          <div className="grid grid-cols-2 gap-1 lg:grid-cols-3">
            {portfolio.map((src, i) => (
              <div key={i} className="group relative aspect-[4/5] overflow-hidden">
                <Image src={`/images/${src}`} alt={`Location portfolio ${i + 1}`} fill sizes="(max-width:1024px) 50vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Common Questions</p>
            <h2 className="text-4xl font-light md:text-5xl">FAQ</h2>
          </AnimatedSection>
          <FAQ items={faqs} />
        </div>
      </section>

      {/* FINAL CTA */}
      <section id="contact" className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-12">
          <AnimatedSection className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-4xl font-light md:text-5xl lg:text-6xl">Ready to Elevate<br /><span className="italic">Your Campaign?</span></h2>
            <p className="mx-auto mb-10 max-w-lg text-base leading-relaxed" style={caption}>
              Location photography is storytelling at scale. Let&apos;s build something cinematic — and strategic.
            </p>
            <Link href="/#contact" className="inline-block px-10 py-4 text-sm font-medium uppercase tracking-wide text-white" style={ink}>Start Your Campaign</Link>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
