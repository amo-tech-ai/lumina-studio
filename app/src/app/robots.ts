import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// IPI-902 · CF-MKT-002 — application-owned robots.txt. Served by the Next.js
// app (Workers route), replacing Cloudflare's default robots.txt on the
// deployed Worker. The operator hub lives under /app and must stay private.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app/", "/auth/", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
