import Link from "next/link";

import styles from "./command-center.module.css";

type Props = {
  message: string;
};

export function CommandCenterErrorBanner({ message }: Props) {
  return (
    <div className={styles.errorBanner} role="alert">
      <span>{message}</span>
      <Link href="/app" className={styles.errorRetry}>
        Retry
      </Link>
    </div>
  );
}
