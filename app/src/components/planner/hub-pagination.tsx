// IPI-526 — v1 pagination contract (correction #2): no real "Previous"
// control (would require decoding the opaque cursor, which is forbidden).
// A page past the first shows "Start over" (clears cursor, back to page 1);
// "Next page" advances using the returned cursor. Full server-rendered
// navigation replaces the page — there is no client-side append, so this is
// "Next page" wording, not "Load more".

import Link from "next/link";

import { buildHubUrl, type HubFilters } from "./hub-params";
import styles from "./hub-workspace.module.css";

type Props = { filters: HubFilters; nextCursor: string | null };

export function HubPagination({ filters, nextCursor }: Props) {
  const isPastFirstPage = Boolean(filters.cursor);
  if (!isPastFirstPage && !nextCursor) return null;

  return (
    <div className={styles.pagination} data-testid="hub-pagination">
      {isPastFirstPage ? (
        <Link href={buildHubUrl({ ...filters, cursor: undefined })} className={styles.paginationBtnSecondary}>
          Start over
        </Link>
      ) : null}
      {nextCursor ? (
        <Link href={buildHubUrl({ ...filters, cursor: nextCursor })} className={styles.paginationBtnPrimary}>
          Next page
        </Link>
      ) : null}
    </div>
  );
}
