import { handleAuditAssetDnaRequest } from "./handler.ts";

console.info("audit-asset-dna function started");

Deno.serve(handleAuditAssetDnaRequest);
