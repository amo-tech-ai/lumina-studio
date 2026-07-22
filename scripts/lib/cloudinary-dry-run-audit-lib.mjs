/**
 * Pure audit logic for scripts/cloudinary-dry-run-audit.mjs — no Cloudinary
 * SDK calls, so it's importable and testable without network/credentials.
 *
 * Taxonomy constants below mirror app/src/lib/cloudinary/taxonomy.ts. Kept in
 * sync by app/src/lib/cloudinary/dry-run-audit-parity.test.ts, which imports
 * both and asserts equality.
 */

export const DAM_ROOT = "ipix";
export const ENVIRONMENTS = ["dev", "staging", "prod"];
export const WORK_TYPES = [
  "shoots",
  "campaigns",
  "products",
  "dna-assets",
  "qc-snapshots",
  "qa-fixtures",
];
export const DELIVERY_TYPE = "authenticated";
export const METADATA_SCHEMA_VERSION = "1";

// Mirrors WORK_TYPES_REQUIRING_WORK_ID in app/src/app/api/assets/upload-sign/route.ts
export const WORK_TYPES_REQUIRING_WORK_ID = ["shoots", "campaigns"];

// Only these context keys are universally required on every new-format asset.
export const UNIVERSAL_CONTEXT_KEYS = ["env", "org_id", "brand_id", "work_type"];
// These are conditional — never required unconditionally.
export const CONDITIONAL_CONTEXT_KEYS = ["work_id", "shoot_id", "campaign_id"];

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseContextFields(ctx) {
  const fields = {};
  if (typeof ctx === "string") {
    ctx.split("|").forEach((pair) => {
      const eq = pair.indexOf("=");
      if (eq > 0) fields[pair.slice(0, eq)] = pair.slice(eq + 1);
    });
  } else if (ctx && typeof ctx === "object") {
    Object.assign(fields, ctx);
  }
  return fields;
}

/** Classifies a folder as "missing", "legacy", or "new".
 * - missing: empty folder
 * - legacy: outside ipix/, OR known pre-taxonomy ipix shapes (brands/campaigns/shoots/cld105-test)
 * - new: other ipix/ paths — folderPatternScore decides compliant vs malformed
 * Unknown ipix/ shapes are "new" (not silent legacy) so the pattern scorer can fail them. */
export function classifyFolder(folder) {
  if (!folder) return "missing";
  if (!folder.startsWith(DAM_ROOT + "/")) return "legacy";

  // Known legacy under ipix/ (pre IPI-60 env/org taxonomy).
  if (
    folder === `${DAM_ROOT}/cld105-test` ||
    folder.startsWith(`${DAM_ROOT}/cld105-test/`) ||
    folder.startsWith(`${DAM_ROOT}/brands/`) ||
    folder.startsWith(`${DAM_ROOT}/campaigns/`) ||
    folder.startsWith(`${DAM_ROOT}/shoots/`)
  ) {
    return "legacy";
  }

  return "new";
}

export function requiredContextKeysFor(workType) {
  const keys = [...UNIVERSAL_CONTEXT_KEYS];
  if (WORK_TYPES_REQUIRING_WORK_ID.includes(workType)) keys.push("work_id");
  return keys;
}

/** Expected: ipix/{env}/{orgId}/{brandId}/{workType}[/{workId}] */
export function folderPatternScore(folder) {
  if (!folder || !folder.startsWith(DAM_ROOT + "/")) {
    return { valid: false, reason: "not under ipix/" };
  }
  const parts = folder.split("/");
  if (parts.length < 5) {
    return { valid: false, reason: `too few segments (expected >=5, got ${parts.length})` };
  }
  if (parts.length > 6) {
    return { valid: false, reason: `too many segments (expected <=6, got ${parts.length})` };
  }
  if (!ENVIRONMENTS.includes(parts[1])) {
    return { valid: false, reason: `invalid env segment "${parts[1]}"` };
  }
  if (!UUID_RE.test(parts[2])) {
    return { valid: false, reason: `org_id "${parts[2]}" is not a UUID` };
  }
  if (!UUID_RE.test(parts[3])) {
    return { valid: false, reason: `brand_id "${parts[3]}" is not a UUID` };
  }
  if (!WORK_TYPES.includes(parts[4])) {
    return { valid: false, reason: `unknown work_type "${parts[4]}"` };
  }
  const workId = parts[5] ?? null;
  if (workId !== null && !UUID_RE.test(workId)) {
    return { valid: false, reason: `work_id "${workId}" is not a UUID` };
  }
  return { valid: true, env: parts[1], orgId: parts[2], brandId: parts[3], workType: parts[4], workId };
}

/** Audits one Cloudinary asset. Returns { classification, issues }.
 * classification: "missing" | "legacy" | "compliant" | "malformed" */
export function auditAsset(asset) {
  const folder = asset.folder ?? asset.asset_folder ?? "";
  const foldClass = classifyFolder(folder);

  if (foldClass !== "new") {
    return { classification: foldClass, issues: [] };
  }

  const type = asset.type;
  const ctx = parseContextFields(asset.context?.custom ?? asset.context);
  const metadata = asset.metadata ?? {};
  const issues = [];

  if (type !== DELIVERY_TYPE) {
    issues.push(`type is "${type}", expected "${DELIVERY_TYPE}"`);
  }

  const score = folderPatternScore(folder);
  if (!score.valid) {
    issues.push(`folder "${folder}": ${score.reason}`);
  } else {
    for (const key of requiredContextKeysFor(ctx.work_type)) {
      if (!(key in ctx)) issues.push(`missing required context key "${key}"`);
    }
    if (ctx.env && ctx.env !== score.env) {
      issues.push(`context.env="${ctx.env}" does not match folder env "${score.env}"`);
    }
    if (ctx.org_id && ctx.org_id !== score.orgId) {
      issues.push(`context.org_id="${ctx.org_id}" does not match folder org_id "${score.orgId}"`);
    }
    if (ctx.brand_id && ctx.brand_id !== score.brandId) {
      issues.push(`context.brand_id="${ctx.brand_id}" does not match folder brand_id "${score.brandId}"`);
    }
    if (ctx.work_type && ctx.work_type !== score.workType) {
      issues.push(`context.work_type="${ctx.work_type}" does not match folder work_type "${score.workType}"`);
    }
    if (ctx.work_id && score.workId && ctx.work_id !== score.workId) {
      issues.push(`context.work_id="${ctx.work_id}" does not match folder work_id "${score.workId}"`);
    }
  }

  const schemaVer = metadata.ipix_schema_version;
  if (schemaVer && schemaVer !== METADATA_SCHEMA_VERSION) {
    issues.push(`ipix_schema_version is "${schemaVer}", expected "${METADATA_SCHEMA_VERSION}"`);
  }

  return { classification: issues.length > 0 ? "malformed" : "compliant", issues };
}

const MAX_ASSETS_SAFETY_CAP = 50_000;

/** Validates the MAX_ASSETS env var. Throws on invalid/zero/negative/unsafe values. */
export function validateMaxAssets(raw) {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`MAX_ASSETS must be a positive integer, got "${raw}"`);
  }
  if (n > MAX_ASSETS_SAFETY_CAP) {
    throw new Error(`MAX_ASSETS=${n} exceeds safety cap of ${MAX_ASSETS_SAFETY_CAP}`);
  }
  return n;
}

/** Cloudinary page size for the next search call — never exceeds the
 * remaining budget, and never exceeds Cloudinary's own per-page cap. */
export function nextPageSize(remaining, perPageCap = 500) {
  return Math.max(0, Math.min(perPageCap, remaining));
}
