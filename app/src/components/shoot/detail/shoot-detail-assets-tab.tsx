import Link from "next/link";
import type { ShootDetailAsset } from "@/lib/shoot/get-shoot-detail";
import styles from "../shoot-detail.module.css";
import { ShootDetailEmpty } from "./shoot-detail-empty";

type Props = {
  shootId: string;
  assets: ShootDetailAsset[];
};

export function ShootDetailAssetsTab({ shootId, assets }: Props) {
  if (assets.length === 0) {
    return (
      <ShootDetailEmpty message="No assets linked to this shoot yet. Upload during production or link from the asset library." />
    );
  }

  return (
    <div>
      <div className={styles.assetsHeader}>
        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
          Captured assets{" "}
          <span className={styles.sectionTitleMuted}>· {assets.length}</span>
        </h3>
        <Link
          href={`/app/assets?shoot=${shootId}`}
          className={styles.assetsLink}
        >
          View in Assets
        </Link>
      </div>
      <div className={styles.assetGrid}>
        {assets.map((asset) => (
          <div key={asset.id} className={styles.assetCard}>
            <div
              className={styles.assetImg}
              role="img"
              aria-label={asset.format ?? "Shoot asset"}
              style={{
                aspectRatio:
                  asset.width && asset.height
                    ? `${asset.width}/${asset.height}`
                    : "3/4",
                maxHeight: "220px",
                backgroundImage: `url(${asset.url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className={styles.assetMeta}>
              {asset.format ?? "image"}
              {asset.dna_score != null ? ` · DNA ${asset.dna_score}` : ""}
              {asset.status ? ` · ${asset.status.replace(/_/g, " ")}` : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
