export const DAM_ROOT = "ipix";

export const ENVIRONMENTS = ["dev", "staging", "prod"] as const;
export type DamEnv = (typeof ENVIRONMENTS)[number];

export const WORK_TYPES = [
  "shoots",
  "campaigns",
  "products",
  "dna-assets",
  "qc-snapshots",
  "qa-fixtures",
] as const;
export type WorkType = (typeof WORK_TYPES)[number];

export const DEFAULT_WORK_TYPE: WorkType = "products";

export const ALLOWED_UPLOAD_FORMATS = "jpg,png,webp,mp4,mov";

export const DELIVERY_TYPE = "authenticated";

export const METADATA_SCHEMA_VERSION = "1";

const RUNTIME_ENV_VARS = ["VERCEL_ENV", "NEXT_PUBLIC_VERCEL_ENV"] as const;

/** Explicit override for runtimes without Vercel env vars (e.g. Cloudflare/OpenNext).
 * Set via wrangler `vars.DAM_ENV` ("staging" | "prod") — see app/wrangler.jsonc. */
const ENV_OVERRIDE_VAR = "DAM_ENV";

export function detectEnv(): DamEnv {
  for (const key of RUNTIME_ENV_VARS) {
    const val = process.env[key];
    if (val === "production") return "prod";
    if (val === "preview" || val === "staging") return "staging";
  }

  const override = process.env[ENV_OVERRIDE_VAR];
  if (override) {
    if ((ENVIRONMENTS as readonly string[]).includes(override)) return override as DamEnv;
    throw new Error(
      `detectEnv(): invalid ${ENV_OVERRIDE_VAR}="${override}" — must be one of ${ENVIRONMENTS.join(", ")}`,
    );
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `detectEnv(): NODE_ENV=production but no VERCEL_ENV/NEXT_PUBLIC_VERCEL_ENV/${ENV_OVERRIDE_VAR} is set — refusing to silently fall back to "dev". Set ${ENV_OVERRIDE_VAR} explicitly for this runtime.`,
    );
  }

  return "dev";
}

export function assetFolderFor(opts: {
  env?: DamEnv;
  orgId: string;
  brandId: string;
  workType?: WorkType;
  workId?: string;
}): string {
  const env = opts.env ?? detectEnv();
  const workType = opts.workType ?? DEFAULT_WORK_TYPE;
  let folder = `${DAM_ROOT}/${env}/${opts.orgId}/${opts.brandId}/${workType}`;
  if (opts.workId) folder += `/${opts.workId}`;
  return folder;
}

export function damContext(opts: {
  env?: DamEnv;
  orgId: string;
  brandId: string;
  workType?: WorkType;
  workId?: string;
  shootId?: string;
  campaignId?: string;
}): Record<string, string> {
  const env = opts.env ?? detectEnv();
  const workType = opts.workType ?? DEFAULT_WORK_TYPE;
  const ctx: Record<string, string> = {
    env,
    org_id: opts.orgId,
    brand_id: opts.brandId,
    work_type: workType,
  };
  if (opts.workId) ctx.work_id = opts.workId;
  if (opts.shootId) ctx.shoot_id = opts.shootId;
  if (opts.campaignId) ctx.campaign_id = opts.campaignId;
  return ctx;
}

export function isDamWorkType(value: unknown): value is WorkType {
  return typeof value === "string" && (WORK_TYPES as readonly string[]).includes(value);
}

/** Shoots/campaigns nest under `…/{workType}/{workId}` — pair must be complete. */
export const WORK_TYPES_REQUIRING_WORK_ID: ReadonlySet<WorkType> = new Set([
  "shoots",
  "campaigns",
]);

/** Returns a 400 message when workType/workId pairing is inconsistent, else null. */
export function workTypeWorkIdPairError(
  workType: WorkType | undefined,
  workId: string | undefined,
): string | null {
  if (workType && WORK_TYPES_REQUIRING_WORK_ID.has(workType) && !workId) {
    return `workId is required for workType "${workType}"`;
  }
  if (!workType && workId) {
    return "workId is not allowed without a workType";
  }
  if (workType && !WORK_TYPES_REQUIRING_WORK_ID.has(workType) && workId) {
    return `workId is not allowed for workType "${workType}"`;
  }
  return null;
}

function escapeContextValue(value: string): string {
  return value.replace(/[\\|=]/g, "_");
}

export function damContextString(opts: {
  env?: DamEnv;
  orgId: string;
  brandId: string;
  workType?: WorkType;
  workId?: string;
  shootId?: string;
  campaignId?: string;
}): string {
  return Object.entries(damContext(opts))
    .map(([k, v]) => `${k}=${escapeContextValue(v)}`)
    .join("|");
}

export function damTags(opts: {
  env?: DamEnv;
  workType?: WorkType;
  status?: string;
}): string[] {
  const env = opts.env ?? detectEnv();
  const tags: string[] = [`env:${env}`];
  if (opts.workType) tags.push(`work_type:${opts.workType}`);
  if (opts.status) tags.push(`status:${opts.status}`);
  return tags;
}

export {
  CLOUDINARY_PRESETS,
  CLOUDINARY_EAGER_PRESETS,
  CLOUDINARY_UPLOAD_PRESET,
  CLOUDINARY_METADATA_SCHEMA_VERSION,
  cropTransformString,
  presetTransformString,
} from "@/lib/cloudinary/url";

export type { CloudinaryPresetName, CropTransform } from "@/lib/cloudinary/url";
