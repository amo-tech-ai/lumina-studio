/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Required — Supabase project URL (public, RLS-scoped). */
  readonly VITE_SUPABASE_URL: string;
  /** Required — Supabase publishable/anon key (never service role). */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  /** Optional — project ref for tooling links. */
  readonly VITE_SUPABASE_PROJECT_ID?: string;
  /** Optional — OAuth client id (public). */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** Optional — Cloudinary cloud name (public). */
  readonly VITE_CLOUDINARY_CLOUD_NAME?: string;
  /** Optional — unsigned upload preset (public). */
  readonly VITE_CLOUDINARY_UPLOAD_PRESET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
