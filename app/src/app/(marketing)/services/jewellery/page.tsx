import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles, Eye, Package, ShoppingBag, Monitor, Megaphone, Layers, FileCheck,
  CheckCircle, Zap, Search, Focus, Image as ImageIcon,
} from "lucide-react";
import { AnimatedSection } from "@/components/marketing/animated-section";
import { FAQ } from "@/components/marketing/faq";

export const metadata: Metadata = {
  title: "Jewellery Photography",
  description: "Precision jewellery photography. AI-planned macro, lifestyle, and ecommerce shots.",
  openGraph: {
    title: "Jewellery Photography | iPix — Precision Macro & Lifestyle",
    description: "Precision jewellery photography. AI-planned macro, lifestyle, and ecommerce shots.",
    images: ["/images/jewellery-hero.jpg"],
  },
};

const challenge = ["Reflective surface management", "Micro-detail at macro scale", "Colour accuracy for gemstones", "Luxury perception through imagery"];
const whyImages = [
  { src: "jewellery-macro.jpg", alt: "Macro jewellery detail" },
  { src: "jewellery-lifestyle.jpg", alt: "Jewellery lifestyle flat lay" },
  { src: "jewellery-packaging.jpg", alt: "Luxury jewellery packaging" },
  { src: "jewellery-ecommerce.jpg", alt: "Jewellery ecommerce product" },
];
const featureBlocks = [
  { num: "01 — Macro Detail", title: "Every Facet.", em: "Every Stone.", img: "jewellery-macro.jpg", alt: "Extreme macro jewellery photography", imgFirst: true,
    desc: "Our macro photography reveals the artistry invisible to the naked eye — the precision of prong settings, the fire within a diamond, the texture of hammered gold. These details communicate craftsmanship and justify premium pricing.",
    items: ["Focus stacking for infinite depth of field", "Controlled reflection management", "True-to-life colour reproduction", "8K capture for extreme crop flexibility"], cta: "Book Macro Session →" },
  { num: "02 — Lifestyle & Flat-Lay", title: "Context Creates", em: "Desire.", img: "jewellery-lifestyle.jpg", alt: "Jewellery lifestyle flat lay photography", imgFirst: false,
    desc: "Lifestyle flat-lays place your pieces in aspirational contexts — marble surfaces, soft morning light, curated styling props. These images drive social engagement and editorial features.",
    items: ["Curated prop styling & art direction", "Natural light & studio hybrid setups", "Instagram-ready compositions", "Editorial magazine quality"], cta: "Plan Lifestyle Shoot →" },
  { num: "03 — Packaging & Unboxing", title: "The Experience", em: "Before the Piece.", img: "jewellery-packaging.jpg", alt: "Luxury jewellery packaging photography", imgFirst: true,
    desc: "Luxury begins with the presentation. Our packaging photography captures the anticipation of unboxing — the velvet interior, the branded box, the tissue paper reveal. This imagery drives gifting sales and elevates perceived value.",
    items: ["Unboxing sequence photography", "Gift-ready presentation styling", "Brand identity integration", "Social-ready vertical formats"], cta: "Plan Packaging Shoot →" },
];
const imageTypes = [
  { icon: Focus, title: "Hero Packshots", desc: "White background, marketplace compliant, clarity-optimized for maximum conversion." },
  { icon: Search, title: "Macro Close-Ups", desc: "Texture, settings, stone clarity — the details that justify premium pricing." },
  { icon: ImageIcon, title: "Lifestyle Context", desc: "Flat-lays and styled scenes that create aspiration and social engagement." },
  { icon: Package, title: "Packaging & Unboxing", desc: "Gift-ready presentation that elevates perceived value and drives gifting sales." },
  { icon: Eye, title: "On-Model Imagery", desc: "Scale, drape, and wearability — showing how pieces live on the body." },
  { icon: Sparkles, title: "360° & Video", desc: "Motion content that captures light play, brilliance, and the full story of each piece." },
];
const stages = [
  { stage: "Stage 1", title: "Precision Production", items: ["Focus stacking & macro rigs", "Controlled lighting environments", "Colour-calibrated workflow", "Reflection management expertise"] },
  { stage: "Stage 2", title: "AI-Powered Planning", items: ["SKU-level shot list generation", "Competitor visual analysis", "Platform-specific asset planning", "Brand-consistency scoring"] },
  { stage: "Stage 3", title: "Multi-Channel Output", items: ["Marketplace-ready formats", "Social media crops & ratios", "Website hero & PDP images", "Wholesale catalogue assets"] },
];
const workflow = [
  { step: "01", title: "Brand & Product Brief", desc: "We analyse your collection, brand positioning, and target channels." },
  { step: "02", title: "AI Shot List Generation", desc: "Platform-specific shot lists, lighting plans, and prop recommendations." },
  { step: "03", title: "Studio Production", desc: "Macro rigs, focus stacking, and controlled lighting for flawless capture." },
  { step: "04", title: "Retouching & Grading", desc: "Reflection cleanup, colour accuracy, and format-specific optimisation." },
  { step: "05", title: "Multi-Format Delivery", desc: "Assets delivered for web, marketplace, social, wholesale, and print." },
];
const channels = [
  { icon: Monitor, label: "Website Hero" },
  { icon: ShoppingBag, label: "Shopify PDP" },
  { icon: Megaphone, label: "Paid Ads" },
  { icon: Layers, label: "Amazon Listings" },
  { icon: FileCheck, label: "Wholesale Catalogue" },
  { icon: Zap, label: "Social Content" },
];
const metrics = [
  { stat: "+34%", label: "Average increase in click-through rate for jewellery listings" },
  { stat: "+22%", label: "Higher conversion on optimised product detail pages" },
  { stat: "45%", label: "Fewer reshoots with AI-planned shot lists" },
];
const portfolio = ["jewellery-macro.jpg", "jewellery-lifestyle.jpg", "jewellery-packaging.jpg", "jewellery-ecommerce.jpg", "portfolio-jewellery.jpg", "portfolio-watch.jpg"];
const faqs = [
  { q: "What types of jewellery do you photograph?", a: "We photograph all categories — rings, necklaces, bracelets, earrings, watches, and bespoke pieces. From fine jewellery to fashion accessories, we adapt our technique to your product." },
  { q: "How do you handle reflective surfaces?", a: "We use specialised lighting tents, diffusion panels, and focus stacking rigs designed specifically for reflective jewellery. Every reflection is controlled to showcase the piece, not distort it." },
  { q: "Can you match specific brand colour standards?", a: "Absolutely. We work with colour-calibrated monitors and use X-Rite colour charts in every session. Your gemstone colours will be true-to-life across all screens and print." },
  { q: "How many images per day?", a: "A typical jewellery session produces 20–40+ final retouched images. Volume depends on complexity — macro detail shots take more time than packshots." },
  { q: "Do you provide images for Amazon and Shopify?", a: "Yes. Every delivery includes marketplace-compliant formats with correct dimensions, backgrounds, and file specifications for Amazon, Shopify, Etsy, and other platforms." },
  { q: "What is the turnaround time?", a: "Standard delivery is 5–7 business days. Rush delivery within 48 hours is available for an additional fee." },
];

const caption = { color: "var(--mk-text-muted)" } as const;
const surface = { background: "var(--mk-surface)" } as const;
const bg = { background: "var(--mk-bg)" } as const;
const ink = { background: "var(--mk-text)" } as const;

export default function JewelleryPhotographyPage() {
  return (
    <>
      {/* HERO — full-bleed dark overlay */}
      <section className="relative flex min-h-screen items-center">
        <Image src="/images/jewellery-hero.jpg" alt="Luxury jewellery macro photography" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0" style={{ background: "rgba(26,23,20,0.5)" }} />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-20 lg:px-12">
          <AnimatedSection className="max-w-2xl">
            <p className="mb-6 text-xs font-medium uppercase tracking-[0.25em] text-white/70">Jewellery Photography</p>
            <h1 className="mb-6 text-5xl font-light leading-[1.05] text-white md:text-6xl lg:text-7xl">Every Facet.<br /><span className="italic">Perfectly Captured.</span></h1>
            <p className="mb-10 max-w-lg text-base leading-relaxed text-white/80 md:text-lg">
              Precision macro photography and AI-driven content planning for luxury jewellery brands. From diamond close-ups to lifestyle campaigns — imagery that sells.
            </p>
            <div className="mb-6 flex flex-wrap gap-4">
              <Link href="#contact" className="px-8 py-4 text-sm font-medium uppercase tracking-wide" style={{ background: "#fff", color: "var(--mk-text)" }}>Plan My Shoot</Link>
              <Link href="#portfolio" className="border border-white px-8 py-4 text-sm font-medium uppercase tracking-wide text-white">View Portfolio</Link>
            </div>
            <p className="text-xs tracking-wide text-white/60">Macro precision. Campaign-ready.</p>
          </AnimatedSection>
        </div>
      </section>

      {/* WHY IT MATTERS */}
      <section className="py-24 lg:py-32" style={{ backgroundColor: "hsl(40 14% 96%)" }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <AnimatedSection>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>The Challenge</p>
              <h2 className="mb-6 text-4xl font-light md:text-5xl">Why Jewellery Is<br /><span className="italic">the Hardest to Shoot</span></h2>
              <p className="mb-8 max-w-md text-base leading-relaxed" style={caption}>
                Reflective surfaces, microscopic details, and the need to convey luxury through a screen — jewellery photography demands technical mastery and creative vision in equal measure.
              </p>
              <ul className="mb-8 space-y-3">
                {challenge.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm" style={caption}>
                    <CheckCircle size={14} className="shrink-0" style={{ color: "var(--mk-primary)" }} />{item}
                  </li>
                ))}
              </ul>
              <Link href="#types" className="text-sm font-medium uppercase tracking-wide underline underline-offset-4">See Image Types →</Link>
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

      {/* FEATURE BLOCKS (Macro / Lifestyle / Packaging — alternating) */}
      {featureBlocks.map((b) => {
        const Img = (
          <div className="relative h-[450px] lg:h-[600px]">
            <Image src={`/images/${b.img}`} alt={b.alt} fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
          </div>
        );
        const Copy = (
          <div className="flex flex-col justify-center p-10 lg:p-16" style={bg}>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>{b.num}</p>
            <h3 className="mb-4 text-3xl font-light md:text-4xl">{b.title}<br /><span className="italic">{b.em}</span></h3>
            <p className="mb-6 text-base leading-relaxed" style={caption}>{b.desc}</p>
            <ul className="mb-6 space-y-2">
              {b.items.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm" style={caption}>
                  <CheckCircle size={12} className="shrink-0" style={{ color: "var(--mk-primary)" }} />{item}
                </li>
              ))}
            </ul>
            <Link href="#contact" className="text-sm font-medium uppercase tracking-wide underline underline-offset-4">{b.cta}</Link>
          </div>
        );
        return (
          <section key={b.num} className="py-24 lg:py-32" style={b.imgFirst ? surface : bg}>
            <div className="mx-auto max-w-7xl px-6 lg:px-12">
              <div className="grid grid-cols-1 overflow-hidden lg:grid-cols-2">
                {b.imgFirst ? <>{Img}{Copy}</> : <><div className="order-2 lg:order-1">{Copy}</div><div className="order-1 lg:order-2">{Img}</div></>}
              </div>
            </div>
          </section>
        );
      })}

      {/* IMAGE TYPES GRID */}
      <section id="types" className="py-24 lg:py-32" style={{ backgroundColor: "hsl(40 14% 96%)" }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-16 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Deliverables</p>
            <h2 className="text-4xl font-light md:text-5xl">Image Types That Sell</h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3" style={{ background: "var(--mk-border)" }}>
            {imageTypes.map((item) => (
              <div key={item.title} className="p-8 lg:p-10" style={surface}>
                <item.icon size={28} strokeWidth={1.2} className="mb-6" style={caption} />
                <h3 className="mb-3 text-xl font-medium">{item.title}</h3>
                <p className="text-sm leading-relaxed" style={caption}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* iPIX ADVANTAGE (dark) */}
      <section className="py-24 lg:py-32" style={{ background: "var(--mk-text)" }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-16 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={{ color: "rgba(255,255,255,0.5)" }}>What Makes Us Different</p>
            <h2 className="text-4xl font-light text-white md:text-5xl">Technical Mastery Meets<br /><span className="italic">AI Intelligence.</span></h2>
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
          <p className="mt-10 text-center text-sm tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>One shoot → Every channel. Every marketplace.</p>
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="process" className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-16 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>How It Works</p>
            <h2 className="text-4xl font-light md:text-5xl">Jewellery Shoot Workflow</h2>
          </AnimatedSection>
          <div className="mx-auto max-w-2xl">
            {workflow.map((item, i) => (
              <div key={item.step} className={`ml-4 flex gap-8 ${i < workflow.length - 1 ? "border-l pb-12" : ""}`} style={{ borderColor: "var(--mk-border)" }}>
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

      {/* MULTI-CHANNEL */}
      <section className="py-24 lg:py-32" style={surface}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <AnimatedSection>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Multi-Channel Strategy</p>
              <h2 className="mb-6 text-4xl font-light md:text-5xl">One Collection Shoot.<br /><span className="italic">Every Platform Covered.</span></h2>
              <p className="mb-8 max-w-md text-base leading-relaxed" style={caption}>
                A single jewellery session produces assets optimised for every sales and marketing channel — from your website hero to Amazon compliance to Instagram Reels.
              </p>
              <Link href="#contact" className="inline-block px-8 py-4 text-sm font-medium uppercase tracking-wide text-white" style={ink}>Plan Multi-Channel Shoot</Link>
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

      {/* PERFORMANCE METRICS (dark) */}
      <section className="py-24 lg:py-32" style={{ background: "var(--mk-text)" }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-16 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={{ color: "rgba(255,255,255,0.5)" }}>Measurable Impact</p>
            <h2 className="text-4xl font-light text-white md:text-5xl">Built for Results</h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 gap-px md:grid-cols-3">
            {metrics.map((item) => (
              <div key={item.stat} className="p-10 text-center lg:p-12" style={{ background: "rgba(255,255,255,0.05)" }}>
                <p className="mb-4 text-5xl font-light text-white md:text-6xl" style={{ fontFamily: "var(--font-cormorant)" }}>{item.stat}</p>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PORTFOLIO */}
      <section id="portfolio" className="py-24 lg:py-32" style={bg}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatedSection className="mb-16 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em]" style={caption}>Selected Work</p>
            <h2 className="text-4xl font-light md:text-5xl">Jewellery Portfolio</h2>
          </AnimatedSection>
          <div className="grid grid-cols-2 gap-1 lg:grid-cols-3">
            {portfolio.map((src, i) => (
              <div key={i} className="group relative aspect-[4/5] overflow-hidden">
                <Image src={`/images/${src}`} alt={`Jewellery portfolio ${i + 1}`} fill sizes="(max-width:1024px) 50vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
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
            <h2 className="mb-6 text-4xl font-light md:text-5xl lg:text-6xl">Ready to Showcase<br /><span className="italic">Your Collection?</span></h2>
            <p className="mx-auto mb-10 max-w-lg text-base leading-relaxed" style={caption}>
              Every facet deserves to be seen. Let&apos;s create imagery that captures the artistry of your jewellery — and converts browsers into buyers.
            </p>
            <Link href="/#contact" className="inline-block px-10 py-4 text-sm font-medium uppercase tracking-wide text-white" style={ink}>Start Your Shoot</Link>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
