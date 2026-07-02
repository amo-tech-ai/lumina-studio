import Image from "next/image";

import { formatCrawlProgressLabel } from "@/lib/brand-hub/format-crawl-progress";

import styles from "./brand-detail.module.css";

type Props = {
  host: string | null;
  brandName: string;
  thumbUrls: string[];
  crawlPages?: { pages_crawled: number | null; pages_found: number | null } | null;
};

export function BrandDetailAnalysingCard({
  host,
  brandName,
  thumbUrls,
  crawlPages,
}: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.cardEyebrow}>
        <span className={styles.cardEyebrowLabel}>Brand Intelligence</span>
      </div>
      <p className={styles.cardBody} style={{ color: "var(--color-text-primary)" }}>
        Crawling {host ?? brandName} — extracting brand voice, palette, and imagery…
      </p>
      <div className={styles.analysingThumbs}>
        {thumbUrls.map((src) => (
          <div key={src} className={styles.analysingThumb}>
            <Image src={src} alt="" fill sizes="54px" className={styles.assetImage} />
          </div>
        ))}
      </div>
      {crawlPages?.pages_crawled != null ? (
        <p className={styles.cardBody} style={{ marginTop: "0.625rem" }}>
          {formatCrawlProgressLabel(crawlPages.pages_crawled, crawlPages.pages_found)}
        </p>
      ) : null}
    </div>
  );
}
