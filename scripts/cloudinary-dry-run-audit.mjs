#!/usr/bin/env node

/**
 * Cloudinary DAM Taxonomy — Dry-Run Audit
 *
 * Compares real Cloudinary assets against the taxonomy contract
 * defined in app/src/lib/cloudinary/taxonomy.ts (pure-logic mirror in
 * scripts/lib/cloudinary-dry-run-audit-lib.mjs, kept in sync by
 * app/src/lib/cloudinary/dry-run-audit-parity.test.ts).
 *
 * Usage:
 *   node scripts/cloudinary-dry-run-audit.mjs
 *   node scripts/cloudinary-dry-run-audit.mjs --legacy   # also list each legacy asset
 *
 * Env:
 *   MAX_ASSETS  — positive integer, max assets to scan (default 500)
 *   AUDIT_MODE  — "strict" (default, exit 1 on malformed assets) or "warn"
 *                 (report only, always exit 0)
 *
 * Auth:
 *   Requires CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY
 *   + CLOUDINARY_API_SECRET in the environment.
 *
 * Output:
 *   Prints a report to stdout. Known legacy folders (FashionOS, pre-taxonomy
 *   ipix/brands|campaigns|shoots|cld105-test) are classified as legacy — never
 *   as malformed. Strict mode fails only on malformed new-format assets.
 *   Pass --legacy to print each legacy public_id; without it, only the count.
 */

import { auditAsset, nextPageSize, validateMaxAssets } from "./lib/cloudinary-dry-run-audit-lib.mjs";

const { v2: cloudinary } = await import("cloudinary");

const STRICT = (process.env.AUDIT_MODE ?? "strict").toLowerCase() !== "warn";
const LIST_LEGACY = process.argv.includes("--legacy");

let MAX_ASSETS;
try {
  MAX_ASSETS = validateMaxAssets(process.env.MAX_ASSETS ?? "500");
} catch (err) {
  console.error(`❌ ${err.message}`);
  process.exit(1);
}

let cursor = null;
let total = 0;
let hasMore = true;

let compliant = 0;
let legacy = 0;
let malformed = 0;
const malformedItems = [];
const legacyItems = [];

while (hasMore && total < MAX_ASSETS) {
  const pageSize = nextPageSize(MAX_ASSETS - total);
  if (pageSize <= 0) break;

  const result = await cloudinary.search
    .expression("resource_type:image OR resource_type:video OR resource_type:raw")
    .max_results(pageSize)
    .next_cursor(cursor)
    .with_field(["context", "tags", "metadata"])
    .sort_by("created_at", "desc")
    .execute();

  const assets = result.resources;
  cursor = result.next_cursor;
  hasMore = !!cursor;

  for (const asset of assets) {
    if (total >= MAX_ASSETS) break;
    total++;

    const folder = asset.folder ?? asset.asset_folder ?? "";
    const { classification, issues } = auditAsset(asset);

    if (classification === "compliant") {
      compliant++;
    } else if (classification === "malformed") {
      malformed++;
      malformedItems.push({ public_id: asset.public_id, folder, issues });
    } else {
      // missing + legacy — informational only; never fail strict mode
      legacy++;
      legacyItems.push({ public_id: asset.public_id, folder: folder || "(none)" });
    }
  }
}

// ── Report ──
console.log(`\nCloudinary DAM Taxonomy Dry-Run Audit`);
console.log(`======================================`);
console.log(`Mode                  : ${STRICT ? "strict" : "warn"}`);
console.log(`Total assets scanned  : ${total}`);
console.log(`Compliant             : ${compliant}`);
console.log(`Legacy (pre-taxonomy) : ${legacy}`);
console.log(`Malformed (new-format): ${malformed}`);
console.log(`======================================\n`);

if (legacy > 0) {
  if (LIST_LEGACY) {
    console.log("Legacy assets (informational — not taxonomy failures):\n");
    for (const item of legacyItems) {
      console.log(`  ${item.public_id}  (folder: ${item.folder})`);
    }
    console.log("");
  } else {
    console.log(
      `Legacy assets: ${legacy} (informational — pass --legacy to list; never fail the audit)\n`,
    );
  }
}

if (malformed > 0) {
  console.log("Malformed new-format assets:\n");
  for (const item of malformedItems) {
    console.log(`  ${item.public_id}  (folder: ${item.folder})`);
    for (const issue of item.issues) {
      console.log(`    ❌ ${issue}`);
    }
    console.log("");
  }

  if (STRICT) {
    console.log(`❌ ${malformed} malformed asset(s) found (strict mode).`);
    process.exit(1);
  }
  console.log(`⚠️  ${malformed} malformed asset(s) found (warn mode — not failing).`);
  process.exit(0);
}

console.log("✅ All new-format assets comply with the taxonomy contract.");
process.exit(0);
