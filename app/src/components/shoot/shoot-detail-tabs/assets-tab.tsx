import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Image as ImageIcon, Video } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { isDeliverableCover } from "@/lib/cloudinary/url";
import type { ShootDetailAsset } from "@/lib/shoot/get-shoot-detail";
import { isVideoFormat } from "../shoot-detail-format";
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
          const isVideo = isVideoFormat(a.format);
          return (
            <div key={a.id} className={styles.masonryItem} style={{ aspectRatio: ratio }}>
              {isVideo ? (
                // Neutral video placeholder — resource_type isn't in the RPC payload
                // yet (would need a migration), so `format` is a best-effort signal
                // to avoid handing a video URL to next/image.
                <div
                  style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                  aria-hidden
                >
                  <Video size={22} color="var(--color-text-muted)" />
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
