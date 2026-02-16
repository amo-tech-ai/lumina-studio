import { useState, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import sliderImg1 from "@/assets/slider-clothing-1.jpg";
import sliderImg2 from "@/assets/slider-clothing-2.webp";
import sliderImg3 from "@/assets/slider-clothing-3.jpg";
import portfolioFashion from "@/assets/portfolio-fashion.jpg";
import portfolioProduct from "@/assets/portfolio-product.jpg";

const slides = [
  {
    image: sliderImg1,
    label: "Creative Studio",
    headline: "Designed to Sell.",
  },
  {
    image: sliderImg2,
    label: "Ghost Mannequin",
    headline: "Engineered for Conversion.",
  },
  {
    image: sliderImg3,
    label: "Lifestyle Apparel",
    headline: "Styled for Performance.",
  },
  {
    image: portfolioFashion,
    label: "Detail-Focused",
    headline: "Crafted for Impact.",
  },
  {
    image: portfolioProduct,
    label: "Editorial",
    headline: "Built for Authority.",
  },
];

const ClothingSlider = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const scrollToIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(index, slides.length - 1));
    setActiveIndex(clamped);
    if (scrollRef.current) {
      const slideWidth = scrollRef.current.children[0] as HTMLElement;
      if (slideWidth) {
        scrollRef.current.scrollTo({
          left: clamped * (slideWidth.offsetWidth + 16),
          behavior: "smooth",
        });
      }
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const slideWidth = (el.children[0] as HTMLElement)?.offsetWidth + 16;
    if (slideWidth) {
      const idx = Math.round(el.scrollLeft / slideWidth);
      setActiveIndex(idx);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-0 overflow-hidden"
      style={{ background: "#0F0F10" }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="container mx-auto px-6 lg:px-12 pt-20 lg:pt-28 pb-10 lg:pb-14 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4"
      >
        <div>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-white leading-[1.05] mb-3">
            Clothing Photography.
          </h2>
          <p className="font-sans text-sm md:text-base text-white/60 max-w-md">
            Elevated product imagery designed to convert.
          </p>
        </div>
        <p className="font-sans text-[10px] md:text-xs tracking-[0.2em] text-white/40 uppercase">
          Editorial · Ghost · Flats · Lifestyle
        </p>
      </motion.div>

      {/* Slider */}
      <div className="relative">
        {/* Arrows — desktop only */}
        <button
          onClick={() => scrollToIndex(activeIndex - 1)}
          className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm items-center justify-center text-white/80 hover:bg-white/20 transition-colors"
          aria-label="Previous"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => scrollToIndex(activeIndex + 1)}
          className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm items-center justify-center text-white/80 hover:bg-white/20 transition-colors"
          aria-label="Next"
        >
          <ChevronRight size={20} />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth px-6 lg:px-12 pb-6 no-scrollbar"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {slides.map((slide, i) => {
            const isActive = i === activeIndex;
            const isHovered = i === hoveredIndex;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.6,
                  delay: i * 0.1,
                  ease: [0.4, 0, 0.2, 1],
                }}
                className="relative flex-shrink-0 snap-start rounded-sm overflow-hidden cursor-pointer"
                style={{
                  width: "min(80vw, 900px)",
                  height: "min(70vh, 550px)",
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Image */}
                <motion.img
                  src={slide.image}
                  alt={slide.label}
                  className="w-full h-full object-cover"
                  animate={{
                    scale: isHovered ? 1.03 : 1,
                    filter: isActive
                      ? "brightness(1)"
                      : "brightness(0.85)",
                  }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                {/* Content overlay */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0 p-6 lg:p-10"
                  initial={false}
                  animate={{
                    opacity: isHovered || isActive ? 1 : 0.7,
                    y: isHovered ? 0 : 8,
                  }}
                  transition={{ duration: 0.35 }}
                >
                  <p className="font-sans text-[10px] md:text-xs font-medium tracking-[0.25em] text-white/70 uppercase mb-2">
                    {slide.label}
                  </p>
                  <h3 className="font-serif text-2xl md:text-3xl lg:text-4xl font-light text-white mb-4">
                    {slide.headline}
                  </h3>
                  <motion.span
                    className="inline-block font-sans text-xs tracking-wide text-white/80 border-b border-white/40 pb-0.5"
                    animate={{ opacity: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    View Service →
                  </motion.span>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 py-6 lg:py-8">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === activeIndex
                ? "w-8 bg-white"
                : "w-1.5 bg-white/30 hover:bg-white/50"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Micro CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="text-center pb-16 lg:pb-24"
      >
        <p className="font-sans text-sm text-white/50">
          Need Amazon-ready apparel images?{" "}
          <a
            href="/services/amazon"
            className="text-white/80 underline underline-offset-4 hover:text-white transition-colors"
          >
            Plan your shoot with AI →
          </a>
        </p>
      </motion.div>
    </section>
  );
};

export default ClothingSlider;
