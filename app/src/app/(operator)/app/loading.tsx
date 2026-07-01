import { CommandCenterSkeleton } from "@/components/command-center/command-center-skeleton";
import styles from "@/components/command-center/command-center.module.css";

export default function CommandCenterLoading() {
  return (
    <div className={styles.commandCenter}>
      <CommandCenterSkeleton />
    </div>
  );
}
