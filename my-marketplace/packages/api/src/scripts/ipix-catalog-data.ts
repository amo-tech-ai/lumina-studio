export type IpixCatalogItem = {
  title: string;
  handle: string;
  description: string;
  sku: string;
  priceUsd: number;
  priceEur: number;
};

export const IPIX_SELLER_NAME = "ipix";
export const IPIX_SELLER_HANDLE = "ipix";
export const IPIX_SELLER_EMAIL = "seller@ipix.local";

/** 10 fashion SKUs — stable handles for idempotent seeding. */
export const IPIX_CATALOG: IpixCatalogItem[] = [
  {
    title: "White Linen Shirt",
    handle: "ipix-white-linen-shirt",
    description: "Breathable white linen shirt — editorial summer staple.",
    sku: "IPIX-LINEN-WHT",
    priceUsd: 48,
    priceEur: 42,
  },
  {
    title: "Black Resort Shirt",
    handle: "ipix-black-resort-shirt",
    description: "Relaxed black resort shirt with a clean drape.",
    sku: "IPIX-RESORT-BLK",
    priceUsd: 52,
    priceEur: 46,
  },
  {
    title: "Provenza Dinner Dress",
    handle: "ipix-provenza-dinner-dress",
    description: "Elegant midi dress for evening occasions.",
    sku: "IPIX-DRESS-PROV",
    priceUsd: 89,
    priceEur: 78,
  },
  {
    title: "Rooftop Nightlife Jacket",
    handle: "ipix-rooftop-nightlife-jacket",
    description: "Lightweight jacket for layered evening looks.",
    sku: "IPIX-JKT-ROOF",
    priceUsd: 95,
    priceEur: 84,
  },
  {
    title: "Local Designer Sunglasses",
    handle: "ipix-designer-sunglasses",
    description: "UV400 acetate frames with a modern silhouette.",
    sku: "IPIX-SUN-LOC",
    priceUsd: 65,
    priceEur: 58,
  },
  {
    title: "Fashion Week Bracelet",
    handle: "ipix-fashion-week-bracelet",
    description: "Brass cuff inspired by runway street style.",
    sku: "IPIX-BRACE-FW",
    priceUsd: 32,
    priceEur: 28,
  },
  {
    title: "Laureles Casual Shirt",
    handle: "ipix-laureles-casual-shirt",
    description: "Soft cotton casual shirt for everyday wear.",
    sku: "IPIX-SHIRT-LAU",
    priceUsd: 44,
    priceEur: 39,
  },
  {
    title: "El Poblado Evening Dress",
    handle: "ipix-el-poblado-evening-dress",
    description: "Statement dress with a refined evening cut.",
    sku: "IPIX-DRESS-POB",
    priceUsd: 98,
    priceEur: 86,
  },
  {
    title: "Minimal Black Tee",
    handle: "ipix-minimal-black-tee",
    description: "Premium cotton tee — minimal black, unisex fit.",
    sku: "IPIX-TEE-BLK",
    priceUsd: 26,
    priceEur: 23,
  },
  {
    title: "Tropical Print Shirt",
    handle: "ipix-tropical-print-shirt",
    description: "Bold tropical print shirt for warm-weather styling.",
    sku: "IPIX-SHIRT-TRO",
    priceUsd: 46,
    priceEur: 40,
  },
];
