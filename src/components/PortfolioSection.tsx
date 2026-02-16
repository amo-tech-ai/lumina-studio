import portfolioFashion from "@/assets/portfolio-fashion.jpg";
import portfolioWatch from "@/assets/portfolio-watch.jpg";
import portfolioJewellery from "@/assets/portfolio-jewellery.jpg";
import portfolioProduct from "@/assets/portfolio-product.jpg";
import portfolioEcommerce from "@/assets/portfolio-ecommerce.jpg";
import portfolioStilllife from "@/assets/portfolio-stilllife.jpg";

const items = [
  { src: portfolioFashion, label: "Fashion", span: "row-span-2" },
  { src: portfolioWatch, label: "Watches", span: "" },
  { src: portfolioJewellery, label: "Jewellery", span: "" },
  { src: portfolioProduct, label: "Product", span: "col-span-2" },
  { src: portfolioEcommerce, label: "eCommerce", span: "" },
  { src: portfolioStilllife, label: "Still Life", span: "" },
];

const PortfolioSection = () => {
  return (
    <section id="portfolio" className="py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-20">
          <p className="font-sans text-sm font-medium tracking-[0.2em] text-text-caption uppercase mb-4">
            Selected Work
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">
            Portfolio
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1">
          {items.map((item) => (
            <div
              key={item.label}
              className={`relative group overflow-hidden cursor-pointer ${item.span}`}
            >
              <img
                src={item.src}
                alt={item.label}
                className="w-full h-full min-h-[250px] object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-500 flex items-end p-6">
                <span className="font-sans text-sm font-medium tracking-wide text-primary-foreground uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-2 group-hover:translate-y-0">
                  {item.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PortfolioSection;
