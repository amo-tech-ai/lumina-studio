import { z } from "zod";

export const SERVICE_SLUGS = [
  "fashion-photography",
  "ecommerce-photography",
  "clothing",
  "amazon",
  "jewellery",
  "instagram",
  "video",
  "shopify",
  "location",
  "general",
] as const;

export type ServiceSlug = (typeof SERVICE_SLUGS)[number];

export const LeadReadiness = z.enum([
  "browsing",
  "interested",
  "qualified",
  "ready_to_submit",
]);
export type LeadReadiness = z.infer<typeof LeadReadiness>;

export const MarketingLeadState = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  company: z.string().optional(),
  service_interest: z.enum(SERVICE_SLUGS).optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  website: z.string().optional(),
  project_summary: z.string().optional(),
  readiness: LeadReadiness.default("browsing"),
});

export type MarketingLeadState = z.infer<typeof MarketingLeadState>;

// Payload shape forwarded to capture-lead (WEB-015.4). Only populated when
// readiness === "ready_to_submit".
export const LeadPayload = MarketingLeadState.required({
  name: true,
  email: true,
  service_interest: true,
}).omit({ readiness: true });
export type LeadPayload = z.infer<typeof LeadPayload>;
