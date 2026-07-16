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
  secure_url?: string;
  resource_type?: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
  duration?: number;
  version?: number;
  folder?: string;
  asset_folder?: string;
  /** API key id used to sign the notification (may differ from CLOUDINARY_API_KEY). */
  signature_key?: string;
  /** Delete notifications often omit top-level public_id and use resources[]. */
  resources?: Array<{ public_id?: string }>;
};

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
  return error?.code === "23503" && !!error.message?.includes(ASSETS_BRAND_FK);
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

type AssetUpsertResult = { assetId: string; effectiveBrandId: string | null };

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
  },
): Promise<boolean> {
  const { publicId, secureUrl, resourceType, folder, brandId, payload } = fields;
  const { error } = await db.from("cloudinary_assets").upsert(
    {
      asset_id: assetId,
      public_id: publicId,
      secure_url: secureUrl,
      resource_type: resourceType,
      width: payload.width ?? null,
      height: payload.height ?? null,
      folder: folder ?? null,
      brand_id: brandId,
      version: payload.version ?? null,
      format: payload.format ?? null,
      bytes: payload.bytes ?? null,
      duration: payload.duration ?? null,
      status: "ready",
    },
    { onConflict: "public_id" },
  );
  if (error) {
    console.error("[cloudinary/webhook] cloudinary_assets upsert failed:", error.message);
    return false;
  }
  return true;
}

async function handleUpload(db: ReturnType<typeof createSupabaseAdminClient>, payload: CloudinaryNotification) {
  const { public_id: publicId, secure_url: secureUrl, resource_type: resourceType } = payload;
  if (!publicId || !secureUrl || !resourceType) {
    console.error("[cloudinary/webhook] upload notification missing required fields", payload);
    return;
  }

  const folder = payload.folder ?? payload.asset_folder ?? publicId;
  const { brandId, reason } = await resolveBrandId(db, folder, publicId);

  const upserted = await upsertAssetRecord(db, { publicId, secureUrl, resourceType, brandId });
  if (!upserted) return;
  const { assetId, effectiveBrandId } = upserted;

  const persisted = await upsertCloudinaryAssetRecord(db, assetId, {
    publicId,
    secureUrl,
    resourceType,
    folder,
    brandId: effectiveBrandId,
    payload,
  });
  if (!persisted) return;

  await logNonFatal(db, {
    brandId: effectiveBrandId,
    input: { notification_type: payload.notification_type, public_id: publicId, resolution_reason: reason },
    output: { asset_id: assetId },
  });

  if (resourceTypeToAssetType(resourceType) === "image") {
    triggerDnaAudit(assetId);
  }
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

async function handleDelete(db: ReturnType<typeof createSupabaseAdminClient>, payload: CloudinaryNotification) {
  // Minimal scoped delete: archive mirror rows. Full reconciliation is IPI-638.
  const publicIds = deletePublicIds(payload);
  if (publicIds.length === 0) return;
  for (const publicId of publicIds) {
    const { error } = await db.from("cloudinary_assets").update({ status: "archived" }).eq("public_id", publicId);
    if (error) console.error("[cloudinary/webhook] delete->archive failed:", error.message);
  }
}

type SignatureVerification = { ok: true; rawBody: string } | { ok: false; response: NextResponse };

async function verifyWebhookSignature(request: Request): Promise<SignatureVerification> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  // Notifications may be signed by the oldest/dedicated key (payload.signature_key),
  // which can differ from CLOUDINARY_API_KEY used for Upload/Admin API calls.
  const apiSecret =
    process.env.CLOUDINARY_NOTIFICATION_API_SECRET?.trim() || process.env.CLOUDINARY_API_SECRET;
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
    if (notificationType === "upload" || notificationType === "eager") {
      await handleUpload(db, payload);
    } else if (notificationType === "delete") {
      await handleDelete(db, payload);
    } else {
      // Unsupported/unknown event (moderation, analysis, etc.) — ack, no write.
      return NextResponse.json({ ok: true, ignored: notificationType ?? "unknown" });
    }
  } catch (e) {
    // Valid signature but processing error: log and still 2xx to avoid Cloudinary
    // retry storms (spec §3) — never partial-write, but also never block the ack.
    console.error("[cloudinary/webhook] processing error (non-fatal):", e);
  }

  return NextResponse.json({ ok: true });
}
