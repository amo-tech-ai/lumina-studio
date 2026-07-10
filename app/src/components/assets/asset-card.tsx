import Image from "next/image";
import { FileText, Video } from "lucide-react";

import { StatusChip } from "@/components/ui/status-chip";
import { isDeliverableCover, withCloudinaryPreset } from "@/lib/cloudinary/url";
import { assetDnaStatusDotToken, assetDnaStatusLabel } from "@/lib/assets/status-tokens";
import type { AssetRow } from "@/lib/assets/get-assets";

import styles from "./assets-workspace.module.css";

const ASSET_TYPE_LABEL: Record<AssetRow["asset_type"], string> = {
  image: "Image",
  video: "Video",
  document: "Document",
};

function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** Masonry tile for one `assets` row — no name/title column exists on the
 *  table (see get-assets.ts), so this never fabricates one: only the real
 *  type, date, and (when present) DNA status/score are shown. */
export function AssetCard({ asset }: { asset: AssetRow }) {
  const imgSrc = asset.thumbnail_url ?? asset.url;
  const ratio = asset.width && asset.height ? asset.width / asset.height : 1;
  const dnaLabel = assetDnaStatusLabel(asset.dna_status);
  const dnaDot = assetDnaStatusDotToken(asset.dna_status);

  return (
    <div className={styles.card} data-testid="asset-card">
      <div className={styles.thumbWrap} style={{ aspectRatio: ratio }}>
        {asset.asset_type === "video" ? (
          <div className={styles.iconFallback} aria-hidden>
            <Video size={22} />
          </div>
        ) : asset.asset_type === "document" ? (
          <div className={styles.iconFallback} aria-hidden>
            <FileText size={22} />
          </div>
        ) : isDeliverableCover(imgSrc) ? (
          <Image
            src={withCloudinaryPreset(imgSrc, "asset-masonry")}
            alt=""
            fill
            sizes="25vw"
            className={styles.thumbImage}
          />
        ) : (
          <div className={styles.iconFallback} aria-hidden>
            <FileText size={22} />
          </div>
        )}
        {dnaLabel && dnaDot ? (
          <span className={styles.dnaBadge}>
            <StatusChip dot={dnaDot} label={dnaLabel} onImage />
          </span>
        ) : null}
      </div>
      <div className={styles.cardFooter}>
        <span className={styles.cardType}>{ASSET_TYPE_LABEL[asset.asset_type]}</span>
        {asset.dna_score != null ? (
          <span className={styles.cardScore}>{asset.dna_score}%</span>
        ) : null}
        <span className={styles.cardDate}>{formatShortDate(asset.created_at)}</span>
      </div>
    </div>
  );
}
