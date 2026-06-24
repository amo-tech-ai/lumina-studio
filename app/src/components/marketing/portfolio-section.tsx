import Image from "next/image";
import { AnimatedSection } from "./animated-section";

// Parity with Vite PortfolioSection.tsx — 6 images, span grid, hover overlay label.
const items = [
  { src: "/images/portfolio-fashion.jpg", label: "Fashion", span: "row-span-2" },
  { src: "/images/portfolio-watch.jpg", label: "Watches", span: "" },
  { src: "/images/portfolio-jewellery.jpg", label: "Jewellery", span: "" },
  { src: "/images/portfolio-product.jpg", label: "Product", span: "col-span-2" },
  { src: "/images/portfolio-ecommerce.jpg", label: "eCommerce", span: "" },
  { src: "/images/portfolio-stilllife.jpg", label: "Still Life", span: "" },
];

export function PortfolioSection() {
  return (
    <section id="portfolio" className="py-24 lg:py-32" style={{ background: "var(--mk-bg)" }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <AnimatedSection className="mb-20 text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]" style={{ color: "var(--mk-text-muted)" }}>
            Selected Work
          </p>
          <h2 className="text-4xl font-light md:text-5xl">Portfolio</h2>
        </AnimatedSection>

        <div className="grid grid-cols-2 gap-1 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.label} className={`group relative min-h-[250px] cursor-pointer overflow-hidden ${item.span}`}>
              <Image
                src={item.src}
                alt={item.label}
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-end bg-black/0 p-6 transition-colors duration-500 group-hover:bg-black/30">
                <span className="translate-y-2 text-sm font-medium uppercase tracking-wide text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  {item.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
