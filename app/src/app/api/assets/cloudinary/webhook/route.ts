// IPI-257 074c — Cloudinary webhook: verify signature, persist assets + cloudinary_assets
import { NextResponse, after } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { createSupabaseAdminClient } from "@/app/api/_lib/supabase-admin";

export const dynamic = "force-dynamic";

// Spec: SDK default valid_for is 7200s (2h); IPI-257 §3 tightens the replay window to 300s.
const REPLAY_WINDOW_SECONDS = 300;
const BRAND_FOLDER_RE = /ipix\/brands\/([0-9a-f-]{36})(?:\/|$)/i;
const CAMPAIGN_FOLDER_RE = /ipix\/campaigns\/([0-9a-f-]{36})(?:\/|$)/i;
const SHOOT_FOLDER_RE = /ipix\/shoots\/([0-9a-f-]{36})(?:\/|$)/i;
const ASSETS_BRAND_FK = "assets_brand_id_fkey";

type CloudinaryNotification = {
  notification_type?: string;
  public_id?: string;
  /** Prior public_id on rename notifications — correlates legacy mirrors lacking cloudinary_asset_id. */
  from_public_id?: string;
  /** New public_id on official `notification_type: "rename"` payloads (Cloudinary docs). */
  to_public_id?: string;
  secure_url?: string;
  resource_type?: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
  duration?: number;
  version?: number;
  /** Cloudinary immutable provider asset id (hex). Not the local assets.id FK. */
  asset_id?: string;
  folder?: string;
  asset_folder?: string;
  /** API key id used to sign the notification (may differ from CLOUDINARY_API_KEY). */
  signature_key?: string;
  /** Delete notifications often omit top-level public_id and use resources[]. */
  resources?: Array<{ public_id?: string; asset_id?: string }>;
};

/** Shared mapper for genuine + synthetic webhook paths (IPI-641). */
export function mapProviderIdentity(payload: CloudinaryNotification): {
  cloudinary_asset_id?: string;
  version?: number;
} {
  const out: { cloudinary_asset_id?: string; version?: number } = {};
  if (typeof payload.asset_id === "string" && payload.asset_id.length > 0) {
    out.cloudinary_asset_id = payload.asset_id;
  } else {
    console.warn("[cloudinary/webhook] notification missing Cloudinary asset_id (nullable ok)");
  }
  if (payload.version != null) out.version = payload.version;
  return out;
}

function synthesizeAuthenticatedUrl(publicId: string, resourceType: string): string | undefined {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  if (!cloud) return undefined;
  return `https://res.cloudinary.com/${cloud}/${resourceType}/authenticated/${publicId}`;
}

/**
 * Official rename notifications use `to_public_id` / `from_public_id` and often omit
 * `public_id` + `secure_url`. Normalize so handleUpload can reuse the same path.
 */
export function normalizeCloudinaryNotification(
  payload: CloudinaryNotification,
): CloudinaryNotification {
  if (payload.notification_type !== "rename") return payload;
  const toPublicId =
    (typeof payload.to_public_id === "string" && payload.to_public_id.length > 0
      ? payload.to_public_id
      : undefined) ??
    (typeof payload.public_id === "string" && payload.public_id.length > 0
      ? payload.public_id
      : undefined);
  if (!toPublicId) return payload;

  const resourceType = payload.resource_type ?? "image";
  // iPix uploads use type=authenticated; rename payloads rarely include secure_url.
  const secureUrl =
    payload.secure_url ?? synthesizeAuthenticatedUrl(toPublicId, resourceType);

  return {
    ...payload,
    public_id: toPublicId,
    resource_type: resourceType,
    secure_url: secureUrl,
  };
}

function resourceTypeToAssetType(resourceType: string): "image" | "video" | "document" {
  if (resourceType === "image") return "image";
  if (resourceType === "video") return "video";
  return "document";
}

// IPI-513: brand-folder and campaign-folder uploads resolve to a real brand_id.
// Shoot-folder uploads (ipix/shoots/{id}/raw) stay unresolved — assets.shoot_id's FK
// targets the legacy public.shoots table, which has no brand_id column at all; the
// schema that does (shoot.shoots) isn't what assets.shoot_id references, and the
// Cloudinary webhook never writes to shoot.shoot_assets either. This is an
// architecture decision, not a missing lookup — tracked in IPI-524
// (SHOOT-ARCH-001) rather than patched here.
async function resolveBrandId(
  db: ReturnType<typeof createSupabaseAdminClient>,
  folder: string,
  publicId: string,
): Promise<{ brandId: string | null; reason: string }> {
  const brandMatch = BRAND_FOLDER_RE.exec(folder) ?? BRAND_FOLDER_RE.exec(publicId);
  if (brandMatch) return { brandId: brandMatch[1], reason: "brand_folder_resolved" };

  const campaignMatch = CAMPAIGN_FOLDER_RE.exec(folder) ?? CAMPAIGN_FOLDER_RE.exec(publicId);
  if (campaignMatch) {
    const { data, error } = await db
      .from("campaigns")
      .select("brand_id")
      .eq("id", campaignMatch[1])
      .maybeSingle();
    if (error) {
      console.error("[cloudinary/webhook] campaign lookup failed:", error.message);
      return { brandId: null, reason: "campaign_lookup_failed" };
    }
    if (!data) return { brandId: null, reason: "campaign_not_found" };
    return { brandId: data.brand_id, reason: "campaign_folder_resolved" };
  }

  if (SHOOT_FOLDER_RE.test(folder) || SHOOT_FOLDER_RE.test(publicId)) {
    return { brandId: null, reason: "shoot_folders_unsupported_see_ipi524" };
  }

  return { brandId: null, reason: "no_ownership_signal" };
}

function isBrandFkViolation(error: { code?: string; message?: string } | null | undefined): boolean {
  if (error?.code !== "23503") return false;
  const msg = error.message ?? "";
  return msg.includes(ASSETS_BRAND_FK) || /brand_id/i.test(msg);
}

async function logNonFatal(
  db: ReturnType<typeof createSupabaseAdminClient>,
  fields: { brandId: string | null; input: Record<string, unknown>; output: Record<string, unknown> },
) {
  try {
    const { error } = await db.from("ai_agent_logs").insert({
      agent_name: "cloudinary-webhook",
      brand_id: fields.brandId,
      input: fields.input,
      output: fields.output,
    });
    if (error) console.error("[cloudinary/webhook] audit log (non-fatal):", error.message);
  } catch (e) {
    console.error("[cloudinary/webhook] audit log (non-fatal):", e);
  }
}

type AssetUpsertResult = {
  assetId: string;
  effectiveBrandId: string | null;
  /** Rename / null→value: sync assets.cloudinary_public_id only after the mirror write succeeds. */
  deferAssetPublicIdSync?: boolean;
  /**
   * Overwrite with same public_id: still push a newly resolved brand_id onto assets
   * without rewriting url/cloudinary_public_id (avoids redundant-write 503s).
   */
  reconcileBrandOnly?: boolean;
};

type MirrorRow = {
  id: string;
  asset_id: string;
  brand_id: string | null;
  version: number | null;
  public_id: string | null;
  secure_url: string | null;
  cloudinary_asset_id: string | null;
};

type MirrorLookup =
  | { kind: "found"; mirror: MirrorRow }
  | { kind: "missing" }
  | { kind: "error" };

type UploadHandleResult = { retryable?: boolean };

// IPI-513: insert and update need different FK-failure behavior. A new row has no
// prior brand_id to protect, so a bad candidate just retries as null. An existing
// row might already carry a valid brand_id from an earlier event — retrying its
// update with null would erase that on every later event with a worse signal
// (e.g. a duplicate notification whose folder didn't parse), so a failed update
// is skipped (not retried) and the existing value is preserved untouched.
async function upsertAssetRecord(
  db: ReturnType<typeof createSupabaseAdminClient>,
  fields: { publicId: string; secureUrl: string; resourceType: string; brandId: string | null },
): Promise<AssetUpsertResult | undefined> {
  const { publicId, secureUrl, resourceType, brandId } = fields;

  const { data: existingAsset, error: findErr } = await db
    .from("assets")
    .select("id, brand_id")
    .eq("cloudinary_public_id", publicId)
    .maybeSingle();
  if (findErr) {
    console.error("[cloudinary/webhook] assets lookup failed:", findErr.message);
    return undefined;
  }

  if (existingAsset?.id) {
    if (!brandId) {
      const { error } = await db.from("assets").update({ url: secureUrl }).eq("id", existingAsset.id);
      if (error) console.error("[cloudinary/webhook] assets update failed:", error.message);
      return { assetId: existingAsset.id, effectiveBrandId: existingAsset.brand_id };
    }

    const { error } = await db
      .from("assets")
      .update({ url: secureUrl, brand_id: brandId })
      .eq("id", existingAsset.id);
    if (!error) return { assetId: existingAsset.id, effectiveBrandId: brandId };

    if (!isBrandFkViolation(error)) {
      console.error("[cloudinary/webhook] assets update failed:", error.message);
      return { assetId: existingAsset.id, effectiveBrandId: existingAsset.brand_id };
    }

    console.error(
      "[cloudinary/webhook] brand_id update rejected (stale/deleted brand), preserving existing value:",
      error.message,
    );
    // Deliberately still returns a result even if this retry itself fails (unlike
    // the insert path, which returns undefined and halts on a failed retry). The
    // two cases aren't symmetric: an insert failure means there's no row at all
    // for anything downstream to attach to, but existingAsset.id/brand_id are
    // already known-valid here regardless of whether this url-only write lands —
    // this update only ever refreshes `url`, which get-assets.ts never reads once
    // cloudinary_public_id is set (it always regenerates a fresh signed URL from
    // the public_id instead), so a failed retry has no observable effect beyond
    // the logged error. Halting here would also drop the DNA-audit trigger and
    // cloudinary_assets sync for an asset that's otherwise perfectly resolvable.
    const { error: retryErr } = await db.from("assets").update({ url: secureUrl }).eq("id", existingAsset.id);
    if (retryErr) console.error("[cloudinary/webhook] assets update (brand-safe retry) failed:", retryErr.message);
    return { assetId: existingAsset.id, effectiveBrandId: existingAsset.brand_id };
  }

  const insertRow = {
    url: secureUrl,
    asset_type: resourceTypeToAssetType(resourceType),
    cloudinary_public_id: publicId,
  };

  const { data: inserted, error: insertErr } = await db
    .from("assets")
    .insert({ ...insertRow, brand_id: brandId })
    .select("id")
    .single();
  if (!insertErr) {
    if (!inserted) return undefined;
    return { assetId: inserted.id, effectiveBrandId: brandId };
  }

  if (!isBrandFkViolation(insertErr)) {
    console.error("[cloudinary/webhook] assets insert failed:", insertErr.message);
    return undefined;
  }

  console.error(
    "[cloudinary/webhook] brand_id insert rejected (stale/deleted brand), retrying with brand_id null:",
    insertErr.message,
  );
  const { data: retried, error: retryErr } = await db
    .from("assets")
    .insert({ ...insertRow, brand_id: null })
    .select("id")
    .single();
  if (retryErr || !retried) {
    console.error("[cloudinary/webhook] assets insert (brand-null retry) failed:", retryErr?.message);
    return undefined;
  }
  return { assetId: retried.id, effectiveBrandId: null };
}

type CloudinaryMirrorRow = {
  asset_id: string;
  public_id: string;
  secure_url: string;
  resource_type: string;
  width: number | null;
  height: number | null;
  folder: string | null;
  brand_id: string | null;
  format: string | null;
  bytes: number | null;
  duration: number | null;
  status: string;
  cloudinary_asset_id?: string;
  version?: number;
};

const MIRROR_SELECT = "id, asset_id, brand_id, version, public_id, secure_url, cloudinary_asset_id";

function toMirrorLookup(
  data: {
    id?: string;
    asset_id?: string;
    brand_id?: string | null;
    version?: number | null;
    public_id?: string | null;
    secure_url?: string | null;
    cloudinary_asset_id?: string | null;
  } | null,
): MirrorLookup {
  if (!data?.id || !data.asset_id) return { kind: "missing" };
  return {
    kind: "found",
    mirror: {
      id: data.id,
      asset_id: data.asset_id,
      brand_id: data.brand_id ?? null,
      version: data.version ?? null,
      public_id: data.public_id ?? null,
      secure_url: data.secure_url ?? null,
      cloudinary_asset_id: data.cloudinary_asset_id ?? null,
    },
  };
}

/**
 * Free a public_id held by a different provider identity so a reused Cloudinary
 * public_id can attach to a new mirror without overwriting immutable identity.
 */
async function relocateMirrorPublicId(
  db: ReturnType<typeof createSupabaseAdminClient>,
  mirror: MirrorRow,
  publicId: string,
): Promise<boolean> {
  const relocated = `${publicId}__superseded_${mirror.id.replace(/-/g, "").slice(0, 12)}`;
  const { error: mirrorErr } = await db
    .from("cloudinary_assets")
    .update({ public_id: relocated, status: "archived" })
    .eq("id", mirror.id);
  if (mirrorErr) {
    console.error(
      "[cloudinary/webhook] failed to relocate public_id for provider-id mismatch:",
      mirrorErr.message,
    );
    return false;
  }
  // Detach the old assets row from the reused public_id (non-unique index — keep row).
  const { error: assetErr } = await db
    .from("assets")
    .update({ cloudinary_public_id: relocated })
    .eq("id", mirror.asset_id);
  if (assetErr) {
    console.error(
      "[cloudinary/webhook] failed to detach assets.cloudinary_public_id after relocate:",
      assetErr.message,
    );
    return false;
  }
  return true;
}

async function findMirrorByProviderId(
  db: ReturnType<typeof createSupabaseAdminClient>,
  cloudinaryAssetId: string,
): Promise<MirrorLookup> {
  const { data, error } = await db
    .from("cloudinary_assets")
    .select(MIRROR_SELECT)
    .eq("cloudinary_asset_id", cloudinaryAssetId)
    .maybeSingle();
  if (error) {
    console.error("[cloudinary/webhook] cloudinary_assets lookup by provider id failed:", error.message);
    return { kind: "error" };
  }
  return toMirrorLookup(data);
}

/** Recover legacy mirrors that predate cloudinary_asset_id via rename from_public_id. */
async function findMirrorByPublicId(
  db: ReturnType<typeof createSupabaseAdminClient>,
  publicId: string,
): Promise<MirrorLookup> {
  const { data, error } = await db
    .from("cloudinary_assets")
    .select(MIRROR_SELECT)
    .eq("public_id", publicId)
    .maybeSingle();
  if (error) {
    console.error("[cloudinary/webhook] cloudinary_assets lookup by public_id failed:", error.message);
    return { kind: "error" };
  }
  return toMirrorLookup(data);
}

type MirrorWriteResult =
  | { ok: false }
  | {
      ok: true;
      assetId: string;
      skippedStale?: boolean;
      /** When stale-skipped, mirror already holds the newer identity — use for assets reconcile. */
      mirrorPublicId?: string | null;
      mirrorSecureUrl?: string | null;
    };

/**
 * Prefer provider identity on rename; fall back to public_id upsert for first sighting.
 * When a prior lookup was "missing", re-check before insert so a concurrent writer that
 * created the mirror cannot have its asset_id FK stolen by this request's new assets row.
 */
async function upsertCloudinaryAssetRecord(
  db: ReturnType<typeof createSupabaseAdminClient>,
  assetId: string,
  fields: {
    publicId: string;
    secureUrl: string;
    resourceType: string;
    folder: string | null;
    brandId: string | null;
    payload: CloudinaryNotification;
    /** Result of the single handleUpload lookup (avoids a second blind lookup on rename). */
    priorLookup: MirrorLookup;
  },
): Promise<MirrorWriteResult> {
  const { publicId, secureUrl, resourceType, folder, brandId, payload, priorLookup } = fields;
  const identity = mapProviderIdentity(payload);
  const row: CloudinaryMirrorRow = {
    asset_id: assetId,
    public_id: publicId,
    secure_url: secureUrl,
    resource_type: resourceType,
    width: payload.width ?? null,
    height: payload.height ?? null,
    folder: folder ?? null,
    brand_id: brandId,
    format: payload.format ?? null,
    bytes: payload.bytes ?? null,
    duration: payload.duration ?? null,
    status: "ready",
  };
  if (identity.cloudinary_asset_id) row.cloudinary_asset_id = identity.cloudinary_asset_id;
  if (identity.version != null) row.version = identity.version;

  // Prefer prior found (provider id or from_public_id). Re-check by provider id only on first sighting.
  const existing: MirrorLookup =
    priorLookup.kind === "found"
      ? priorLookup
      : identity.cloudinary_asset_id
        ? await findMirrorByProviderId(db, identity.cloudinary_asset_id)
        : { kind: "missing" };

  if (existing.kind === "error") return { ok: false };
  if (existing.kind === "found") {
    const storedVersion = existing.mirror.version;
    const incomingVersion = identity.version;
    const storedPublicId = existing.mirror.public_id;
    const publicIdDiffers = storedPublicId != null && storedPublicId !== publicId;
    const explicitRename = Boolean(
      payload.from_public_id && storedPublicId && payload.from_public_id === storedPublicId,
    );
    const isNewerVersion =
      incomingVersion != null && (storedVersion == null || incomingVersion > storedVersion);
    const isOlderVersion =
      incomingVersion != null && storedVersion != null && incomingVersion < storedVersion;
    // Reject public_id regression unless this is an explicit rename or a strictly newer version.
    // Equal/missing/partial versions alone must not rewrite public_id back to a stale path.
    const stalePublicIdRegression =
      publicIdDiffers && !explicitRename && !isNewerVersion;

    if (isOlderVersion || stalePublicIdRegression) {
      console.warn(
        "[cloudinary/webhook] ignoring stale notification",
        JSON.stringify({
          incomingVersion,
          storedVersion,
          publicId,
          storedPublicId,
          explicitRename,
          reason: isOlderVersion ? "older_version" : "public_id_regression",
        }),
      );
      return {
        ok: true,
        assetId: existing.mirror.asset_id,
        skippedStale: true,
        mirrorPublicId: existing.mirror.public_id,
        mirrorSecureUrl: existing.mirror.secure_url,
      };
    }

    // Never reassign the mirror FK — concurrent inserts must keep the canonical asset_id.
    row.asset_id = existing.mirror.asset_id;
    // Prefer candidate brand, but fall back to the mirror's existing brand on FK failure.
    row.brand_id = brandId ?? existing.mirror.brand_id;

    let { error } = await db.from("cloudinary_assets").update(row).eq("id", existing.mirror.id);
    if (error && brandId && isBrandFkViolation(error)) {
      console.error(
        "[cloudinary/webhook] brand_id rejected on mirror rename, preserving existing brand:",
        error.message,
      );
      row.brand_id = existing.mirror.brand_id;
      ({ error } = await db.from("cloudinary_assets").update(row).eq("id", existing.mirror.id));
    }
    if (error) {
      console.error("[cloudinary/webhook] cloudinary_assets update by provider id failed:", error.message);
      return { ok: false };
    }
    return { ok: true, assetId: existing.mirror.asset_id };
  }

  // First sighting by provider id: never merge into a public_id row that already has a
  // different immutable cloudinary_asset_id (delete/rename reuse).
  const byPublicId = await findMirrorByPublicId(db, publicId);
  if (byPublicId.kind === "error") return { ok: false };
  if (byPublicId.kind === "found") {
    const heldProviderId = byPublicId.mirror.cloudinary_asset_id;
    const incomingProviderId = identity.cloudinary_asset_id;
    if (heldProviderId && incomingProviderId && heldProviderId !== incomingProviderId) {
      const relocated = await relocateMirrorPublicId(db, byPublicId.mirror, publicId);
      if (!relocated) return { ok: false };
    } else {
      // Same provider, legacy null identity, or no incoming id — update that row in place.
      row.asset_id = byPublicId.mirror.asset_id;
      row.brand_id = brandId ?? byPublicId.mirror.brand_id;
      let { error } = await db.from("cloudinary_assets").update(row).eq("id", byPublicId.mirror.id);
      if (error && brandId && isBrandFkViolation(error)) {
        row.brand_id = byPublicId.mirror.brand_id;
        ({ error } = await db.from("cloudinary_assets").update(row).eq("id", byPublicId.mirror.id));
      }
      if (error) {
        console.error("[cloudinary/webhook] cloudinary_assets update by public_id failed:", error.message);
        return { ok: false };
      }
      return { ok: true, assetId: byPublicId.mirror.asset_id };
    }
  }

  const { error } = await db.from("cloudinary_assets").upsert(row, { onConflict: "public_id" });
  if (error) {
    console.error("[cloudinary/webhook] cloudinary_assets upsert failed:", error.message);
    return { ok: false };
  }
  return { ok: true, assetId };
}

/** After mirror rename succeeds, point assets at the new public_id (never before). */
async function syncAssetPublicIdAfterMirror(
  db: ReturnType<typeof createSupabaseAdminClient>,
  fields: {
    assetId: string;
    publicId: string;
    secureUrl: string;
    brandId: string | null;
  },
): Promise<boolean> {
  const { assetId, publicId, secureUrl, brandId } = fields;
  const patch: { url: string; cloudinary_public_id: string; brand_id?: string } = {
    url: secureUrl,
    cloudinary_public_id: publicId,
  };
  if (brandId) patch.brand_id = brandId;

  const { error } = await db.from("assets").update(patch).eq("id", assetId);
  if (!error) return true;

  if (brandId && isBrandFkViolation(error)) {
    console.error(
      "[cloudinary/webhook] brand_id update rejected on rename, preserving existing brand:",
      error.message,
    );
    const { error: retryErr } = await db
      .from("assets")
      .update({ url: secureUrl, cloudinary_public_id: publicId })
      .eq("id", assetId);
    if (retryErr) {
      console.error("[cloudinary/webhook] assets rename update failed:", retryErr.message);
      return false;
    }
    return true;
  }

  console.error("[cloudinary/webhook] assets rename update failed:", error.message);
  return false;
}

/** Brand-only assets patch — used on overwrite when public_id/url must not be rewritten. */
async function syncAssetBrandAfterMirror(
  db: ReturnType<typeof createSupabaseAdminClient>,
  assetId: string,
  brandId: string,
): Promise<boolean> {
  const { error } = await db.from("assets").update({ brand_id: brandId }).eq("id", assetId);
  if (!error) return true;
  if (isBrandFkViolation(error)) {
    console.error(
      "[cloudinary/webhook] brand_id update rejected on overwrite, preserving existing brand:",
      error.message,
    );
    // Mirror already holds the candidate or prior brand; do not 503 the webhook for FK noise.
    return true;
  }
  console.error("[cloudinary/webhook] assets brand reconcile failed:", error.message);
  return false;
}

/**
 * When provider asset_id is known, reuse the existing assets row across public_id rename.
 * Defer assets.cloudinary_public_id write only when public_id actually changes — overwrite
 * with the same public_id must not 503 on a redundant assets sync after a successful mirror write.
 * (Library delivery uses signed URLs from public_id; assets.url is not required on overwrite.)
 * Null stored public_id still counts as a change (legacy / incomplete mirrors).
 */
async function resolveAssetForUpload(
  db: ReturnType<typeof createSupabaseAdminClient>,
  fields: {
    publicId: string;
    secureUrl: string;
    resourceType: string;
    brandId: string | null;
    priorLookup: MirrorLookup;
  },
): Promise<AssetUpsertResult | undefined> {
  const { publicId, secureUrl, resourceType, brandId, priorLookup } = fields;

  if (priorLookup.kind === "error") return undefined;
  if (priorLookup.kind === "found") {
    const storedPublicId = priorLookup.mirror.public_id;
    // Direct inequality: null → value must sync assets (legacy mirrors).
    const publicIdChanged = storedPublicId !== publicId;
    // Always attempt brand push on same-public_id overwrites when a candidate exists —
    // assets.brand_id may still be null after an earlier FK failure even if the mirror already has it.
    const reconcileBrandOnly = !publicIdChanged && brandId != null;
    return {
      assetId: priorLookup.mirror.asset_id,
      effectiveBrandId: brandId ?? priorLookup.mirror.brand_id,
      deferAssetPublicIdSync: publicIdChanged,
      reconcileBrandOnly,
    };
  }

  return upsertAssetRecord(db, { publicId, secureUrl, resourceType, brandId });
}

async function handleUpload(
  db: ReturnType<typeof createSupabaseAdminClient>,
  payload: CloudinaryNotification,
): Promise<UploadHandleResult> {
  const publicId = payload.public_id;
  const resourceType = payload.resource_type;
  let secureUrl = payload.secure_url;
  const isRename = payload.notification_type === "rename";

  if (!publicId || !resourceType) {
    console.error("[cloudinary/webhook] upload notification missing required fields", payload);
    return {};
  }
  // Upload/eager always include secure_url. Rename may omit it — resolve after mirror lookup.
  if (!secureUrl && !isRename) {
    console.error("[cloudinary/webhook] upload notification missing required fields", payload);
    return {};
  }

  const folder = payload.folder ?? payload.asset_folder ?? publicId;
  const { brandId, reason } = await resolveBrandId(db, folder, publicId);
  const identity = mapProviderIdentity(payload);

  let priorLookup: MirrorLookup = identity.cloudinary_asset_id
    ? await findMirrorByProviderId(db, identity.cloudinary_asset_id)
    : { kind: "missing" };
  if (priorLookup.kind === "error") return { retryable: true };

  // Legacy mirrors (null cloudinary_asset_id) can still be recovered on rename via from_public_id,
  // even when the notification omits provider asset_id.
  if (
    priorLookup.kind === "missing" &&
    typeof payload.from_public_id === "string" &&
    payload.from_public_id.length > 0
  ) {
    const byFrom = await findMirrorByPublicId(db, payload.from_public_id);
    if (byFrom.kind === "error") return { retryable: true };
    if (byFrom.kind === "found") priorLookup = byFrom;
  }

  // Before inserting a new assets row: if this public_id is held by a different provider
  // identity, relocate it so upsertAssetRecord cannot reuse the wrong local asset.
  if (priorLookup.kind === "missing" && identity.cloudinary_asset_id) {
    const byPublicId = await findMirrorByPublicId(db, publicId);
    if (byPublicId.kind === "error") return { retryable: true };
    if (byPublicId.kind === "found") {
      const held = byPublicId.mirror.cloudinary_asset_id;
      if (held && held !== identity.cloudinary_asset_id) {
        const relocated = await relocateMirrorPublicId(db, byPublicId.mirror, publicId);
        if (!relocated) return { retryable: true };
      } else if (!held || held === identity.cloudinary_asset_id) {
        // Legacy null id or same id found only by public_id — treat as prior mirror.
        priorLookup = byPublicId;
      }
    }
  }

  // Rename may omit secure_url — always synthesize for the *new* public_id.
  // Never reuse prior mirror.secure_url (points at the old path after rename).
  if (!secureUrl) {
    secureUrl = synthesizeAuthenticatedUrl(publicId, resourceType);
  }
  if (!secureUrl) {
    console.error(
      "[cloudinary/webhook] rename/upload missing secure_url and CLOUDINARY_CLOUD_NAME is empty after trim",
      { publicId, notification_type: payload.notification_type },
    );
    // Misconfig or incomplete rename — retry if env is fixed; do not silently ack.
    return { retryable: true };
  }

  const upserted = await resolveAssetForUpload(db, {
    publicId,
    secureUrl,
    resourceType,
    brandId,
    priorLookup,
  });
  if (!upserted) return {};
  const { assetId, effectiveBrandId, deferAssetPublicIdSync, reconcileBrandOnly } = upserted;

  // Mirror first on rename so a failed public_id write cannot leave assets ahead of cloudinary_assets.
  const persisted = await upsertCloudinaryAssetRecord(db, assetId, {
    publicId,
    secureUrl,
    resourceType,
    folder,
    brandId: effectiveBrandId,
    payload,
    priorLookup,
  });
  if (!persisted.ok) return { retryable: true };
  if (persisted.skippedStale) {
    // Stale payload must not rewrite mirror, but a prior 503 may have left assets lagging the mirror.
    if (persisted.mirrorPublicId) {
      const reconciled = await syncAssetPublicIdAfterMirror(db, {
        assetId: persisted.assetId,
        publicId: persisted.mirrorPublicId,
        secureUrl: persisted.mirrorSecureUrl || secureUrl,
        brandId: null,
      });
      if (!reconciled) return { retryable: true };
    }
    return {};
  }

  const canonicalAssetId = persisted.assetId;
  // Sync public_id onto the canonical assets row (rename, or race where we keep the prior mirror FK).
  if (deferAssetPublicIdSync || canonicalAssetId !== assetId) {
    const synced = await syncAssetPublicIdAfterMirror(db, {
      assetId: canonicalAssetId,
      publicId,
      secureUrl,
      // Same brand the mirror just persisted (folder candidate or inherited).
      brandId: effectiveBrandId,
    });
    // Mirror already has the new public_id — ask Cloudinary to retry so assets can catch up.
    if (!synced) return { retryable: true };
  } else if (reconcileBrandOnly && brandId) {
    // Same public_id overwrite: skip url/public_id rewrite, but do not drop brand backfill.
    const branded = await syncAssetBrandAfterMirror(db, canonicalAssetId, brandId);
    if (!branded) return { retryable: true };
  }

  // Concurrent race: we inserted a provisional assets row, then discovered the canonical
  // mirror. Delete the orphan so the library does not show a duplicate without a mirror.
  if (canonicalAssetId !== assetId) {
    const { error: orphanErr } = await db.from("assets").delete().eq("id", assetId);
    if (orphanErr) {
      console.error(
        "[cloudinary/webhook] failed to delete provisional assets row after canonical race:",
        orphanErr.message,
      );
      return { retryable: true };
    }
  }

  await logNonFatal(db, {
    brandId: effectiveBrandId,
    input: {
      notification_type: payload.notification_type,
      public_id: publicId,
      resolution_reason: reason,
      cloudinary_asset_id: identity.cloudinary_asset_id ?? null,
    },
    output: { asset_id: canonicalAssetId },
  });

  // Renames do not change bytes — skip DNA re-score.
  if (
    payload.notification_type !== "rename" &&
    resourceTypeToAssetType(resourceType) === "image"
  ) {
    triggerDnaAudit(canonicalAssetId);
  }
  return {};
}

// 074d — fire the DNA audit after linking; runs post-response via after() so the
// webhook still acks within spec §3's ~3s window even though Gemini can take ~30s.
function triggerDnaAudit(assetId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[cloudinary/webhook] DNA audit trigger skipped: Supabase env vars missing");
    return;
  }

  after(async () => {
    // 35s: a hair past the edge function's own 30s Gemini timeout, so it always
    // resolves the response before we'd abort the request out from under it.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35_000);
    try {
      const url = new URL("/functions/v1/audit-asset-dna", supabaseUrl).toString();
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ assetId }),
        signal: controller.signal,
      });
      if (!res.ok) {
        console.error("[cloudinary/webhook] DNA audit trigger failed:", res.status, await res.text());
      }
    } catch (e) {
      console.error("[cloudinary/webhook] DNA audit trigger failed (non-fatal):", e);
    } finally {
      clearTimeout(timeoutId);
    }
  });
}

function deletePublicIds(payload: CloudinaryNotification): string[] {
  const ids = new Set<string>();
  if (payload.public_id) ids.add(payload.public_id);
  for (const resource of payload.resources ?? []) {
    if (resource.public_id) ids.add(resource.public_id);
  }
  return [...ids];
}

function deleteProviderAssetIds(payload: CloudinaryNotification): string[] {
  const ids = new Set<string>();
  if (typeof payload.asset_id === "string" && payload.asset_id.length > 0) ids.add(payload.asset_id);
  for (const resource of payload.resources ?? []) {
    if (typeof resource.asset_id === "string" && resource.asset_id.length > 0) {
      ids.add(resource.asset_id);
    }
  }
  return [...ids];
}

async function handleDelete(db: ReturnType<typeof createSupabaseAdminClient>, payload: CloudinaryNotification) {
  // Minimal scoped delete: archive mirror rows. Full reconciliation is IPI-638.
  // Prefer provider id when present so rename→delete still hits the same row.
  // When provider id is authoritative, do NOT also archive by public_id — that id may
  // already belong to a different asset after rename/reuse.
  const providerIds = deleteProviderAssetIds(payload);
  const publicIds = deletePublicIds(payload);
  if (providerIds.length === 0 && publicIds.length === 0) return;

  if (providerIds.length > 0) {
    for (const providerId of providerIds) {
      const { error } = await db
        .from("cloudinary_assets")
        .update({ status: "archived" })
        .eq("cloudinary_asset_id", providerId);
      if (error) console.error("[cloudinary/webhook] delete->archive by provider id failed:", error.message);
    }
    // Also archive legacy mirrors (null cloudinary_asset_id) that still match this public_id.
    // Scoped to null identity so a reused public_id on a different asset is not archived.
    for (const publicId of publicIds) {
      const { error } = await db
        .from("cloudinary_assets")
        .update({ status: "archived" })
        .eq("public_id", publicId)
        .is("cloudinary_asset_id", null);
      if (error) {
        console.error("[cloudinary/webhook] delete->archive legacy null-identity failed:", error.message);
      }
    }
    return;
  }

  for (const publicId of publicIds) {
    const { error } = await db.from("cloudinary_assets").update({ status: "archived" }).eq("public_id", publicId);
    if (error) console.error("[cloudinary/webhook] delete->archive failed:", error.message);
  }
}

type SignatureVerification = { ok: true; rawBody: string } | { ok: false; response: NextResponse };

async function verifyWebhookSignature(request: Request): Promise<SignatureVerification> {
  // Trim so whitespace-only values fail closed (same as empty) — avoids rename URL
  // synthesis seeing "" after trim while signature setup treated the raw value as set.
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  // Notifications may be signed by the oldest/dedicated key (payload.signature_key),
  // which can differ from CLOUDINARY_API_KEY used for Upload/Admin API calls.
  const apiSecret =
    process.env.CLOUDINARY_NOTIFICATION_API_SECRET?.trim() ||
    process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    console.error("[cloudinary/webhook] Cloudinary env vars missing");
    return { ok: false, response: NextResponse.json({ error: "Internal error" }, { status: 500 }) };
  }

  const timestampHeader = request.headers.get("x-cld-timestamp");
  const signatureHeader = request.headers.get("x-cld-signature");
  const rawBody = await request.text();

  if (!timestampHeader || !signatureHeader) {
    return { ok: false, response: NextResponse.json({ error: "Missing signature headers" }, { status: 401 }) };
  }

  const timestamp = Number(timestampHeader);
  if (!Number.isFinite(timestamp) || Date.now() / 1000 - timestamp > REPLAY_WINDOW_SECONDS) {
    return { ok: false, response: NextResponse.json({ error: "Signature expired" }, { status: 401 }) };
  }

  // verifyNotificationSignature reads api_secret from global config, not a param —
  // must configure explicitly since we don't rely on CLOUDINARY_URL auto-parsing.
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  const isValid = cloudinary.utils.verifyNotificationSignature(
    rawBody,
    timestamp,
    signatureHeader,
    REPLAY_WINDOW_SECONDS,
  );
  if (!isValid) {
    let signatureKey: string | undefined;
    try {
      signatureKey = (JSON.parse(rawBody) as CloudinaryNotification).signature_key;
    } catch {
      // ignore — body may be non-JSON; still reject
    }
    console.error(
      "[cloudinary/webhook] Invalid signature",
      JSON.stringify({
        signatureKey: signatureKey ?? null,
        configuredApiKey: apiKey,
        usingNotificationSecret: Boolean(process.env.CLOUDINARY_NOTIFICATION_API_SECRET?.trim()),
        hint:
          signatureKey && signatureKey !== apiKey
            ? "payload.signature_key differs from CLOUDINARY_API_KEY — set Console dedicated webhook key or CLOUDINARY_NOTIFICATION_API_SECRET"
            : "check CLOUDINARY_API_SECRET / CLOUDINARY_NOTIFICATION_API_SECRET",
      }),
    );
    return { ok: false, response: NextResponse.json({ error: "Invalid signature" }, { status: 401 }) };
  }

  return { ok: true, rawBody };
}

export async function POST(request: Request) {
  const verification = await verifyWebhookSignature(request);
  if (!verification.ok) return verification.response;

  let payload: CloudinaryNotification;
  try {
    payload = JSON.parse(verification.rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const db = createSupabaseAdminClient();
  const notificationType = payload.notification_type;

  try {
    if (
      notificationType === "upload" ||
      notificationType === "eager" ||
      notificationType === "rename"
    ) {
      // Rename payloads use to_public_id/from_public_id — normalize before shared handler.
      const normalized = normalizeCloudinaryNotification(payload);
      const result = await handleUpload(db, normalized);
      // Partial rename (mirror ahead of assets) must be retried — not silently acked.
      if (result.retryable) {
        return NextResponse.json({ error: "Transient processing failure" }, { status: 503 });
      }
    } else if (notificationType === "delete") {
      await handleDelete(db, payload);
    } else {
      // Unsupported/unknown event (moderation, analysis, etc.) — ack, no write.
      return NextResponse.json({ ok: true, ignored: notificationType ?? "unknown" });
    }
  } catch (e) {
    // Valid signature but unexpected throw: log and still 2xx to avoid Cloudinary
    // retry storms (spec §3) for non-partial failures.
    console.error("[cloudinary/webhook] processing error (non-fatal):", e);
  }

  return NextResponse.json({ ok: true });
}
