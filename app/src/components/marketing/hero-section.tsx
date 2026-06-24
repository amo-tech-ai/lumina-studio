import Image from "next/image";
import Link from "next/link";
import { AnimatedSection } from "./animated-section";

// Home hero (parity with Vite HeroSection.tsx): split copy/image, "Exceptional
// Imagery. Every Time.", two CTAs anchoring to #contact / #portfolio.
export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center pt-20">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <AnimatedSection className="max-w-xl">
            <p className="mb-6 text-sm font-medium uppercase tracking-[0.2em]" style={{ color: "var(--mk-text-muted)" }}>
              AI-Powered Content Studio
            </p>
            <h1 className="mb-8 text-5xl font-light leading-[1.05] md:text-6xl lg:text-7xl">
              Exceptional Imagery.
              <br />
              <span className="italic font-light">Every Time.</span>
            </h1>
            <p className="mb-10 max-w-prose text-base leading-relaxed md:text-lg" style={{ color: "var(--mk-text-muted)" }}>
              An AI-powered platform that plans photoshoots, generates shot lists,
              and creates on-brand content — from concept to delivery. Fewer
              revisions. Faster execution. Premium results.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="#contact"
                className="px-8 py-4 text-center text-sm font-medium uppercase tracking-wide text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--mk-text)" }}
              >
                Request a Quote
              </Link>
              <Link
                href="#portfolio"
                className="px-8 py-4 text-center text-sm font-medium uppercase tracking-wide transition-colors"
                style={{ border: "1px solid var(--mk-text)" }}
              >
                View Portfolio
              </Link>
            </div>
          </AnimatedSection>

          <AnimatedSection className="relative h-[500px] lg:h-[600px]">
            <Image
              src="/images/hero-product.jpg"
              alt="Premium product photography flat lay"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
