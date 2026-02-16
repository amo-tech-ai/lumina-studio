import { useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";

type ShootType = "ghost" | "model" | "creative";

const shootTypeLabels: Record<ShootType, string> = {
  ghost: "Ghost Mannequin",
  model: "On-Model",
  creative: "Creative",
};

const packages = [
  {
    name: "Starter Fashion Shoot",
    description: "Best for small collections or lookbooks.",
    prices: { ghost: "£350", model: "£400", creative: "£450" },
    features: [
      "Up to 4 hours studio time",
      "1 photographer",
      "Basic lighting setup",
      "15 edited images",
      "White / neutral backdrop",
    ],
    cta: "Book Starter",
    featured: false,
  },
  {
    name: "Full Collection Shoot",
    description: "Ideal for seasonal campaigns or ecommerce launches.",
    prices: { ghost: "£650", model: "£750", creative: "£850" },
    features: [
      "Full-day studio session",
      "Creative direction",
      "On-model or ghost mannequin",
      "40 edited images",
      "Styling consultation",
      "Background options",
    ],
    cta: "Plan My Shoot",
    featured: true,
  },
  {
    name: "Premium Campaign",
    description: "Designed for brands ready to elevate.",
    prices: { ghost: "£1,000", model: "£1,200", creative: "£1,400" },
    features: [
      "Full-day + art direction",
      "Multi-set environments",
      "Lifestyle & detail shots",
      "Advanced retouching",
      "Social-ready formats",
      "Creative concept board",
    ],
    cta: "Start Campaign",
    featured: false,
  },
];

const addOns = [
  {
    title: "Post-Production Services",
    items: ["Basic Editing", "Advanced Retouching", "Background Replacement", "Cropping for marketplace"],
  },
  {
    title: "Model & Styling Add-Ons",
    items: ["Professional model sourcing", "Hair & makeup", "Stylist support"],
  },
  {
    title: "Studio Enhancements",
    items: ["Custom set builds", "Coloured backdrops", "Prop sourcing"],
  },
];

const FashionPackages = () => {
  const [shootType, setShootType] = useState<ShootType>("model");
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section ref={sectionRef} id="packages" className="py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-6 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-4">Packages</p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-4">
            Fashion Photography Packages.
          </h2>
          <p className="font-sans text-base text-text-secondary leading-relaxed max-w-xl mx-auto">
            Whether you're launching a capsule collection or scaling seasonal campaigns, choose a package designed to deliver results.
          </p>
        </motion.div>

        {/* Shoot Type Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex justify-center mb-16"
        >
          <div className="inline-flex border border-divider rounded-lg p-1 bg-surface-white">
            {(Object.keys(shootTypeLabels) as ShootType[]).map((type) => (
              <button
                key={type}
                onClick={() => setShootType(type)}
                className={`font-sans text-xs font-medium tracking-wide px-5 py-2.5 rounded-md transition-all duration-300 uppercase ${
                  shootType === type
                    ? "bg-foreground text-primary-foreground"
                    : "text-text-caption hover:text-foreground"
                }`}
              >
                {shootTypeLabels[type]}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Package Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10 mb-16">
          {packages.map((pkg, i) => (
            <motion.div
              key={pkg.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
              className={`relative rounded-2xl p-8 lg:p-10 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                pkg.featured
                  ? "bg-foreground text-primary-foreground shadow-2xl order-first md:order-none"
                  : "bg-surface-white border border-divider hover:shadow-lg"
              }`}
            >
              {pkg.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 bg-primary-foreground text-foreground font-sans text-[10px] font-semibold tracking-[0.2em] uppercase px-4 py-1.5 rounded-full">
                    <Sparkles size={10} /> Most Popular
                  </span>
                </div>
              )}

              <h3 className={`font-serif text-2xl font-medium mb-2 ${pkg.featured ? "text-primary-foreground" : "text-foreground"}`}>
                {pkg.name}
              </h3>
              <p className={`font-sans text-sm mb-6 ${pkg.featured ? "text-primary-foreground/70" : "text-text-secondary"}`}>
                {pkg.description}
              </p>

              {/* Price */}
              <div className="mb-8">
                <span className={`font-sans text-xs uppercase tracking-wide ${pkg.featured ? "text-primary-foreground/50" : "text-text-caption"}`}>
                  From
                </span>
                <motion.p
                  key={shootType}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`font-serif text-5xl font-medium mt-1 ${pkg.featured ? "text-primary-foreground" : "text-foreground"}`}
                >
                  {pkg.prices[shootType]}
                </motion.p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-10 flex-1">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <CheckCircle
                      size={14}
                      className={`mt-0.5 shrink-0 ${pkg.featured ? "text-primary-foreground/60" : "text-text-mid"}`}
                    />
                    <span className={`font-sans text-sm ${pkg.featured ? "text-primary-foreground/80" : "text-text-secondary"}`}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href="#contact"
                className={`inline-flex items-center justify-center gap-2 font-sans text-sm font-medium tracking-wide px-8 py-4 transition-all duration-300 uppercase rounded-lg ${
                  pkg.featured
                    ? "bg-primary-foreground text-foreground hover:opacity-90"
                    : "bg-foreground text-primary-foreground hover:opacity-90"
                }`}
              >
                {pkg.cta} <ArrowRight size={14} />
              </a>
            </motion.div>
          ))}
        </div>

        {/* Consultation prompt */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center font-sans text-sm text-text-caption mb-20"
        >
          Not sure which package fits?{" "}
          <a href="#contact" className="text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity">
            Talk to our team →
          </a>
        </motion.p>

        {/* Add-On Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p className="font-sans text-xs font-medium tracking-[0.25em] text-text-caption uppercase mb-8 text-center">
            Additional Services
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {addOns.map((addon) => (
              <div
                key={addon.title}
                className="p-6 lg:p-8 border border-divider rounded-xl bg-surface-white hover:shadow-md transition-shadow duration-300"
              >
                <h4 className="font-serif text-lg font-medium text-foreground mb-4">{addon.title}</h4>
                <ul className="space-y-2">
                  {addon.items.map((item) => (
                    <li key={item} className="font-sans text-sm text-text-secondary flex items-center gap-2">
                      <CheckCircle size={12} className="text-text-mid shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-20"
        >
          <p className="font-sans text-xs tracking-[0.2em] text-text-caption uppercase">
            Trusted by leading fashion brands.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default FashionPackages;
