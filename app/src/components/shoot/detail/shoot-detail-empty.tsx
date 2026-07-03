import styles from "../shoot-detail.module.css";

export function ShootDetailEmpty({ message }: { message: string }) {
  return <p className={styles.emptyState}>{message}</p>;
}
