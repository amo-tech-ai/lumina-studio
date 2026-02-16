import { Camera, Gem, ShoppingBag, Shirt, Video, Palette, Sparkles, Building } from "lucide-react";

const services = [
  { icon: Camera, title: "Product Photography", desc: "Clean, consistent imagery that converts browsers into buyers." },
  { icon: Shirt, title: "Fashion Photography", desc: "On-model and editorial shoots that elevate your brand story." },
  { icon: ShoppingBag, title: "eCommerce Photography", desc: "High-volume, marketplace-ready assets for Amazon, Shopify, and beyond." },
  { icon: Gem, title: "Jewellery Photography", desc: "Precision macro shots that capture every facet and detail." },
  { icon: Palette, title: "Creative Still Life", desc: "Bold, artistic compositions that stop the scroll." },
  { icon: Video, title: "Video Production", desc: "Brand films, product videos, and social content with cinematic quality." },
  { icon: Sparkles, title: "AI Content Planning", desc: "Let AI analyze your brand and generate platform-specific shot lists." },
  { icon: Building, title: "Studio Hire", desc: "Book our fully-equipped studio for your own productions." },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-24 lg:py-32 bg-surface-white">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-20">
          <p className="font-sans text-sm font-medium tracking-[0.2em] text-text-caption uppercase mb-4">
            Our Services
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">
            Everything Your Brand Needs
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-divider">
          {services.map((service) => (
            <div
              key={service.title}
              className="bg-surface-white p-8 lg:p-10 group hover:bg-background transition-colors duration-500 cursor-pointer"
            >
              <service.icon
                size={28}
                strokeWidth={1.2}
                className="text-text-mid mb-6 group-hover:text-foreground transition-colors duration-300"
              />
              <h3 className="font-serif text-xl font-medium text-foreground mb-3">
                {service.title}
              </h3>
              <p className="font-sans text-sm text-text-secondary leading-relaxed">
                {service.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
