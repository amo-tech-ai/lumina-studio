"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Parity with Vite ClothingSlider.tsx — dark, horizontal snap-scroll gallery with
// arrows + dots + gradient/label overlay. Native scroll (scrollTo + scroll listener);
// framer-motion dropped (hover scale via CSS group-hover).
const slides = [
  { image: "slider-clothing-1.jpg", label: "Creative Studio", headline: "Designed to Sell." },
  { image: "slider-clothing-2.webp", label: "Ghost Mannequin", headline: "Engineered for Conversion." },
  { image: "slider-clothing-3.jpg", label: "Lifestyle Apparel", headline: "Styled for Performance." },
  { image: "portfolio-fashion.jpg", label: "Detail-Focused", headline: "Crafted for Impact." },
  { image: "portfolio-product.jpg", label: "Editorial", headline: "Built for Authority." },
];

export function ClothingSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(index, slides.length - 1));
    setActiveIndex(clamped);
    const el = scrollRef.current;
    const first = el?.children[0] as HTMLElement | undefined;
    if (el && first) el.scrollTo({ left: clamped * (first.offsetWidth + 16), behavior: "smooth" });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const first = el.children[0] as HTMLElement | undefined;
      const w = (first?.offsetWidth ?? 0) + 16;
      if (w) setActiveIndex(Math.round(el.scrollLeft / w));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="relative overflow-hidden" style={{ background: "#0F0F10" }}>
      <div className="mx-auto flex flex-col items-start justify-between gap-4 px-6 pb-10 pt-20 sm:flex-row sm:items-end lg:px-12 lg:pb-14 lg:pt-28">
        <div>
          <h2 className="mb-3 text-4xl font-light leading-[1.05] text-white md:text-5xl lg:text-6xl">Clothing Photography.</h2>
          <p className="max-w-md text-sm text-white/60 md:text-base">Elevated product imagery designed to convert.</p>
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 md:text-xs">Editorial · Ghost · Flats · Lifestyle</p>
      </div>

      <div className="relative">
        <button onClick={() => scrollToIndex(activeIndex - 1)} aria-label="Previous" className="absolute left-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 lg:flex">
          <ChevronLeft size={20} />
        </button>
        <button onClick={() => scrollToIndex(activeIndex + 1)} aria-label="Next" className="absolute right-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 lg:flex">
          <ChevronRight size={20} />
        </button>

        <div ref={scrollRef} className="mk-noscroll flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-6 pb-6 lg:px-12">
          {slides.map((slide, i) => (
            <div key={i} className="group relative flex-shrink-0 snap-start overflow-hidden rounded-sm" style={{ width: "min(80vw, 900px)", height: "min(70vh, 550px)" }}>
              <Image src={`/images/${slide.image}`} alt={slide.label} fill sizes="80vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 lg:p-10">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.25em] text-white/70 md:text-xs">{slide.label}</p>
                <h3 className="mb-4 text-2xl font-light text-white md:text-3xl lg:text-4xl">{slide.headline}</h3>
                <span className="inline-block border-b border-white/40 pb-0.5 text-xs tracking-wide text-white/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100">View Service →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 py-6 lg:py-8">
        {slides.map((_, i) => (
          <button key={i} onClick={() => scrollToIndex(i)} aria-label={`Go to slide ${i + 1}`} className="h-1.5 rounded-full transition-all duration-300" style={{ width: i === activeIndex ? "2rem" : "0.375rem", background: i === activeIndex ? "#fff" : "rgba(255,255,255,0.3)" }} />
        ))}
      </div>

      <div className="pb-16 text-center lg:pb-24">
        <p className="text-sm text-white/50">
          Need Amazon-ready apparel images?{" "}
          <Link href="/services/amazon" className="text-white/80 underline underline-offset-4 hover:text-white">Plan your shoot with AI →</Link>
        </p>
      </div>
    </section>
  );
}
