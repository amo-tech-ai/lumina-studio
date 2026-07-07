import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, File, Image as ImageIcon, Video } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { isDeliverableCover } from "@/lib/cloudinary/url";
import type { ShootDetailAsset } from "@/lib/shoot/get-shoot-detail";
import styles from "../shoot-detail.module.css";

type Props = {
  assets: ShootDetailAsset[];
};

export function AssetsTab({ assets }: Props) {
  if (assets.length === 0) {
    return (
      <EmptyState
        heading="No captured assets yet"
        body="Assets uploaded during this shoot will appear here."
        icon={<ImageIcon />}
      />
    );
  }

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>
          Captured assets <span className={`${styles.mono} ${styles.sectionTitleCount}`}>· {assets.length}</span>
        </h3>
        <Link href="/app/assets" className={styles.secondaryBtn}>
          View in Assets
          <ArrowUpRight size={14} aria-hidden />
        </Link>
      </div>
      <div className={styles.masonry}>
        {assets.map((a) => {
          const ratio = a.width && a.height ? a.width / a.height : 1;
          const isVideo = a.resource_type === "video";
          // Cloudinary's resource_type is "image" | "video" | "raw" (PDFs, zips,
          // etc. get uploaded as "raw") — only render an <img>/<Image> for actual
          // images, not whatever a raw file's URL happens to return.
          const isRaw = a.resource_type === "raw";
          return (
            <div key={a.id} className={styles.masonryItem} style={{ aspectRatio: ratio }}>
              {isVideo ? (
                // Neutral video placeholder — next/image can't render a video URL as an <img>.
                <div
                  style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                  aria-hidden
                >
                  <Video size={22} color="var(--color-text-muted)" />
                </div>
              ) : isRaw ? (
                <div
                  style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                  aria-hidden
                >
                  <File size={22} color="var(--color-text-muted)" />
                </div>
              ) : isDeliverableCover(a.url) ? (
                <Image src={a.url} alt="" fill sizes="25vw" className={styles.heroImage} />
              ) : (
                // next/image throws on a host outside remotePatterns — real asset
                // URLs are Cloudinary-only in practice, but render honestly if not.
                <img src={a.url} alt="" className={styles.fillImgFallback} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
