import type { MetadataRoute } from "next";
import { canonicalUrl } from "@/lib/site";

// IPI-902 · CF-MKT-002 — application-owned robots.txt. Served by the Next.js
// app (Workers route), replacing Cloudflare's default robots.txt on the
// deployed Worker. The operator hub lives under /app and must stay private.
// The sitemap reference is pinned to the immutable production origin via
// canonicalUrl — per-environment SITE_URL can never leak into it.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app/", "/auth/", "/api/"],
    },
    sitemap: canonicalUrl("/sitemap.xml"),
  };
}
