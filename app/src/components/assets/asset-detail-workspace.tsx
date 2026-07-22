"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ExternalLink, FileText, Video } from "lucide-react";

import { ErrorState } from "@/components/ui/error-state";
import { StatusChip } from "@/components/ui/status-chip";
import type { AssetDetail } from "@/lib/assets/get-assets";
import { assetDnaStatusDotToken, assetDnaStatusLabel } from "@/lib/assets/status-tokens";
import { isAuthenticatedDeliveryUrl } from "@/lib/cloudinary/url";

import styles from "./asset-detail-workspace.module.css";

type Props = {
  data: AssetDetail | null;
  fetchError: string | null;
};

const TYPE_LABEL: Record<AssetDetail["asset_type"], string> = {
  image: "Image",
  video: "Video",
  document: "Document",
};

function formatBytes(bytes: number | null | undefined): string | null {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDims(width: number | null | undefined, height: number | null | undefined): string | null {
  if (width == null || height == null) return null;
  return `${width} × ${height}`;
}

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function PreviewFallback({ assetType }: { assetType: AssetDetail["asset_type"] }) {
  return (
    <div className={styles.iconFallback} aria-hidden>
      {assetType === "video" ? <Video size={40} /> : <FileText size={40} />}
    </div>
  );
}

/** Slim asset detail — IPI-436. Reads mirrored Supabase fields only. */
export function AssetDetailWorkspace({ data, fetchError }: Props) {
  const router = useRouter();
  const [copyFlash, setCopyFlash] = useState<string | null>(null);
  // Same pattern as AssetCard (IPI-757): when Cloudinary 404s but the row remains,
  // swap to the icon fallback and hide delivery actions that would also 404.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  async function onCopy(label: string, value: string) {
    const ok = await copyText(value);
    setCopyFlash(ok ? `${label} copied` : `Couldn’t copy ${label}`);
    window.setTimeout(() => setCopyFlash(null), 1800);
  }

  if (fetchError || !data) {
    return (
      <div className={styles.workspace}>
        <header className={styles.header}>
          <Link href="/app/assets" className={styles.backLink}>
            <ArrowLeft size={16} aria-hidden />
            Assets
          </Link>
        </header>
        <div className={styles.body}>
          <ErrorState
            title="Couldn't load asset"
            message={fetchError ?? "This asset doesn’t exist or you don’t have access."}
            onRetry={() => router.refresh()}
          />
        </div>
      </div>
    );
  }

  const mirror = data.mirror;
  const publicId = mirror?.public_id?.trim() || data.cloudinary_public_id?.trim() || null;
  const width = mirror?.width ?? data.width;
  const height = mirror?.height ?? data.height;
  const bytes = mirror?.bytes ?? data.file_size;
  const format = mirror?.format ?? data.mime_type;
  const dnaLabel = assetDnaStatusLabel(data.dna_status);
  const dnaDot = assetDnaStatusDotToken(data.dna_status);
  const dims = formatDims(width, height);
  const sizeLabel = formatBytes(bytes);
  const tags = (data.tags ?? []).filter(Boolean);

  const displayUrl =
    typeof data.displayUrl === "string" && data.displayUrl.length > 0 ? data.displayUrl : null;
  const downloadUrl =
    typeof data.downloadUrl === "string" && data.downloadUrl.length > 0 ? data.downloadUrl : null;
  const previewFailed = displayUrl !== null && failedUrl === displayUrl;
  const showImagePreview = data.asset_type === "image" && displayUrl && !previewFailed;
  // Hide delivery actions when preview media is gone (stale Cloudinary delete).
  const mediaActionsOk = !previewFailed;

  const identityRows: Array<{ label: string; value: string }> = [];
  if (publicId) identityRows.push({ label: "public_id", value: publicId });
  if (mirror?.cloudinary_asset_id) {
    identityRows.push({ label: "cloudinary_asset_id", value: mirror.cloudinary_asset_id });
  }
  if (mirror?.version != null) {
    identityRows.push({ label: "version", value: String(mirror.version) });
  }

  const metadataRows: Array<{ label: string; value: string }> = [];
  if (data.brand?.name) metadataRows.push({ label: "Brand", value: data.brand.name });
  metadataRows.push({ label: "Type", value: TYPE_LABEL[data.asset_type] });
  if (mirror?.delivery_type) {
    metadataRows.push({ label: "Delivery", value: mirror.delivery_type });
  }
  if (dims) metadataRows.push({ label: "Dimensions", value: dims });
  if (sizeLabel) metadataRows.push({ label: "Size", value: sizeLabel });
  if (format) metadataRows.push({ label: "Format", value: format });
  if (mirror?.resource_type) metadataRows.push({ label: "Resource", value: mirror.resource_type });
  if (mirror?.folder) metadataRows.push({ label: "Folder", value: mirror.folder });
  if (data.status) metadataRows.push({ label: "Status", value: data.status });
  if (data.dna_score != null) metadataRows.push({ label: "DNA score", value: `${data.dna_score}%` });

  return (
    <div className={styles.workspace} data-testid="asset-detail">
      <header className={styles.header}>
        <div>
          <Link href="/app/assets" className={styles.backLink}>
            <ArrowLeft size={16} aria-hidden />
            Assets
          </Link>
          <h1 className={styles.title}>{publicId ?? TYPE_LABEL[data.asset_type]}</h1>
          <p className={styles.subtitle}>
            {data.brand?.name ? `${data.brand.name} · ` : null}
            {TYPE_LABEL[data.asset_type]}
            {mirror?.delivery_type ? ` · ${mirror.delivery_type}` : null}
          </p>
        </div>
        {dnaLabel && dnaDot ? <StatusChip dot={dnaDot} label={dnaLabel} /> : null}
      </header>

      <div className={styles.body}>
        <section className={styles.preview} aria-label="Preview">
          {data.asset_type === "video" || data.asset_type === "document" ? (
            <PreviewFallback assetType={data.asset_type} />
          ) : showImagePreview ? (
            isAuthenticatedDeliveryUrl(displayUrl) ? (
              <img
                src={displayUrl}
                alt=""
                className={styles.previewImageDirect}
                data-testid="asset-detail-preview"
                onError={() => setFailedUrl(displayUrl)}
              />
            ) : (
              <Image
                src={displayUrl}
                alt=""
                width={width ?? 1600}
                height={height ?? 1200}
                className={styles.previewImage}
                sizes="(max-width: 880px) 100vw, 60vw"
                data-testid="asset-detail-preview"
                onError={() => setFailedUrl(displayUrl)}
              />
            )
          ) : (
            <PreviewFallback assetType={data.asset_type} />
          )}
        </section>

        <div className={styles.panels}>
          {identityRows.length > 0 ? (
            <section className={styles.section} aria-labelledby="asset-identity-heading">
              <h2 id="asset-identity-heading" className={styles.sectionTitle}>
                Identity
              </h2>
              <dl className={styles.dl}>
                {identityRows.map((row) => (
                  <div key={row.label} className={styles.dlRow}>
                    <dt>{row.label}</dt>
                    <dd>
                      <code className={styles.code}>{row.value}</code>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          <section className={styles.section} aria-labelledby="asset-metadata-heading">
            <h2 id="asset-metadata-heading" className={styles.sectionTitle}>
              Metadata
            </h2>
            {metadataRows.length === 0 ? (
              <p className={styles.emptyHint}>No mirrored metadata on this row yet.</p>
            ) : (
              <dl className={styles.dl}>
                {metadataRows.map((row) => (
                  <div key={row.label} className={styles.dlRow}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          <section className={styles.section} aria-labelledby="asset-tags-heading">
            <h2 id="asset-tags-heading" className={styles.sectionTitle}>
              Tags
            </h2>
            {tags.length === 0 ? (
              <p className={styles.emptyHint}>No tags.</p>
            ) : (
              <ul className={styles.tagList}>
                {tags.map((tag) => (
                  <li key={tag} className={styles.tag}>
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.section} aria-labelledby="asset-where-heading">
            <h2 id="asset-where-heading" className={styles.sectionTitle}>
              Where Used
            </h2>
            {data.whereUsed.length === 0 ? (
              <p className={styles.emptyHint}>Not linked to a shoot, event, or product yet.</p>
            ) : (
              <ul className={styles.linkList}>
                {data.whereUsed.map((item) => (
                  <li key={`${item.kind}:${item.id}`}>
                    {item.href ? (
                      <Link href={item.href} className={styles.whereLink}>
                        {item.label}
                      </Link>
                    ) : (
                      <span className={styles.wherePlain}>{item.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.section} aria-labelledby="asset-actions-heading">
            <h2 id="asset-actions-heading" className={styles.sectionTitle}>
              Actions
            </h2>
            <div className={styles.actions}>
              {mediaActionsOk && downloadUrl ? (
                <a className={styles.actionBtn} href={downloadUrl} target="_blank" rel="noreferrer">
                  Download
                </a>
              ) : null}
              {mediaActionsOk && displayUrl ? (
                <button
                  type="button"
                  className={styles.actionBtnSecondary}
                  onClick={() => onCopy("Delivery URL", displayUrl)}
                >
                  Copy delivery URL
                </button>
              ) : null}
              {publicId ? (
                <button
                  type="button"
                  className={styles.actionBtnSecondary}
                  onClick={() => onCopy("public_id", publicId)}
                >
                  Copy public_id
                </button>
              ) : null}
              {data.consoleUrl ? (
                <a
                  className={styles.actionBtnSecondary}
                  href={data.consoleUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Cloudinary Console
                  <ExternalLink size={14} aria-hidden />
                </a>
              ) : null}
            </div>
            {copyFlash ? (
              <p className={styles.copyFlash} role="status">
                {copyFlash}
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
