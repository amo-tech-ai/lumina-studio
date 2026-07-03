/** Postgres NO_DATA_FOUND from RAISE EXCEPTION maps to Supabase RPC code P0002. */
export function isRpcNotFoundError(error: { code?: string | null } | null | undefined): boolean {
  return error?.code === "P0002";
}
