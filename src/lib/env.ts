import { z } from "zod";

const clientEnvSchema = z.object({
  VITE_SUPABASE_URL: z
    .string()
    .min(1, "VITE_SUPABASE_URL is required")
    .url("VITE_SUPABASE_URL must be a valid URL"),
  VITE_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "VITE_SUPABASE_PUBLISHABLE_KEY is required"),
  VITE_SUPABASE_PROJECT_ID: z.string().optional(),
  VITE_GOOGLE_CLIENT_ID: z.string().optional(),
  VITE_CLOUDINARY_CLOUD_NAME: z.string().optional(),
  VITE_CLOUDINARY_UPLOAD_PRESET: z.string().optional(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

function formatEnvError(error: z.ZodError): string {
  const details = error.issues
    .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  return [
    "Invalid client environment configuration.",
    details,
    "",
    "Fix: copy .env.example → .env.local and set Supabase values, or run:",
    "  infisical run -- npm run dev",
  ].join("\n");
}

function parseClientEnv(): ClientEnv {
  const result = clientEnvSchema.safeParse(import.meta.env);

  if (!result.success) {
    throw new Error(formatEnvError(result.error));
  }

  return result.data;
}

/** Validated Vite client env — throws at import time if required keys are missing. */
export const env = parseClientEnv();
