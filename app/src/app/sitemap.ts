import type { MetadataRoute } from "next";
import { SERVICES } from "@/components/marketing/services";
import { canonicalUrl } from "@/lib/site";

// IPI-902 · CF-MKT-002 — application-owned sitemap.xml for the public marketing
// routes. Derived from the SERVICES nav registry (single source of truth, same
// source marketing-routes.test.ts uses) so route additions stay in sync.
// /login is intentionally excluded — it is noindex (see login/page.tsx).
export default function sitemap(): MetadataRoute.Sitemap {
  const home: MetadataRoute.Sitemap[number] = {
    url: canonicalUrl("/"),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1,
  };

  const services: MetadataRoute.Sitemap[number][] = SERVICES.map(({ href }) => ({
    url: canonicalUrl(href),
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [home, ...services];
}
