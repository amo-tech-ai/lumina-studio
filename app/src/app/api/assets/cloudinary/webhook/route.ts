// IPI-257 074c — Cloudinary webhook: verify signature, persist assets + cloudinary_assets
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { createSupabaseAdminClient } from "@/app/api/_lib/supabase-admin";

export const dynamic = "force-dynamic";

// Spec: SDK default valid_for is 7200s (2h); IPI-257 §3 tightens the replay window to 300s.
const REPLAY_WINDOW_SECONDS = 300;
const BRAND_FOLDER_RE = /ipix\/brands\/([0-9a-f-]{36})(?:\/|$)/i;

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
};

function resourceTypeToAssetType(resourceType: string): "image" | "video" | "document" {
  if (resourceType === "image") return "image";
  if (resourceType === "video") return "video";
  return "document";
}

// ponytail: shoot/campaign folder uploads (ipix/shoots/{id}/raw, ipix/campaigns/{id})
// don't resolve brand_id yet — assets.shoot_id's FK targets the legacy public.shoots
// table, not shoot.shoots, and the two aren't confirmed to share IDs; campaigns has no
// backing table at all. brand_id stays null (nullable column) for those uploads until
// that's confirmed — add a shoot.shoots lookup then.
function brandIdFromFolder(folderOrPublicId: string): string | null {
  return BRAND_FOLDER_RE.exec(folderOrPublicId)?.[1] ?? null;
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

async function upsertAssetRecord(
  db: ReturnType<typeof createSupabaseAdminClient>,
  fields: { publicId: string; secureUrl: string; resourceType: string; brandId: string | null },
): Promise<string | undefined> {
  const { publicId, secureUrl, resourceType, brandId } = fields;

  const { data: existingAsset, error: findErr } = await db
    .from("assets")
    .select("id")
    .eq("cloudinary_public_id", publicId)
    .maybeSingle();
  if (findErr) {
    console.error("[cloudinary/webhook] assets lookup failed:", findErr.message);
    return undefined;
  }

  if (existingAsset?.id) {
    const update: Record<string, unknown> = { url: secureUrl };
    if (brandId) update.brand_id = brandId;
    const { error: updateErr } = await db.from("assets").update(update).eq("id", existingAsset.id);
    if (updateErr) console.error("[cloudinary/webhook] assets update failed:", updateErr.message);
    return existingAsset.id;
  }

  const { data: inserted, error: insertErr } = await db
    .from("assets")
    .insert({
      url: secureUrl,
      asset_type: resourceTypeToAssetType(resourceType),
      cloudinary_public_id: publicId,
      brand_id: brandId,
    })
    .select("id")
    .single();
  if (insertErr || !inserted) {
    console.error("[cloudinary/webhook] assets insert failed:", insertErr?.message);
    return undefined;
  }
  return inserted.id;
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
  const brandId = brandIdFromFolder(folder) ?? brandIdFromFolder(publicId);

  const assetId = await upsertAssetRecord(db, { publicId, secureUrl, resourceType, brandId });
  if (!assetId) return;

  const persisted = await upsertCloudinaryAssetRecord(db, assetId, {
    publicId,
    secureUrl,
    resourceType,
    folder,
    brandId,
    payload,
  });
  if (!persisted) return;

  await logNonFatal(db, {
    brandId,
    input: { notification_type: payload.notification_type, public_id: publicId },
    output: { asset_id: assetId },
  });
}

async function handleDelete(db: ReturnType<typeof createSupabaseAdminClient>, payload: CloudinaryNotification) {
  const publicId = payload.public_id;
  if (!publicId) return;
  const { error } = await db.from("cloudinary_assets").update({ status: "archived" }).eq("public_id", publicId);
  if (error) console.error("[cloudinary/webhook] delete->archive failed:", error.message);
}

type SignatureVerification = { ok: true; rawBody: string } | { ok: false; response: NextResponse };

async function verifyWebhookSignature(request: Request): Promise<SignatureVerification> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
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
