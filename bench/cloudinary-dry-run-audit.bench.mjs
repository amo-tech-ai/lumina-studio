import { bench, describe } from "vitest";
import {
  auditAsset,
  classifyFolder,
  folderPatternScore,
  parseContextFields,
} from "../scripts/lib/cloudinary-dry-run-audit-lib.mjs";

const ORG = "11111111-1111-4111-8111-111111111111";
const BRAND = "22222222-2222-4222-8222-222222222222";
const WORK = "33333333-3333-4333-8333-333333333333";

// A representative page of Cloudinary assets covering the classification paths
// the auditor walks in production: compliant, malformed, legacy, and missing.
function makeAssets(count) {
  const assets = [];
  for (let i = 0; i < count; i++) {
    const mod = i % 4;
    if (mod === 0) {
      // compliant shoot asset
      assets.push({
        folder: `ipix/prod/${ORG}/${BRAND}/shoots/${WORK}`,
        type: "authenticated",
        context: {
          custom: {
            env: "prod",
            org_id: ORG,
            brand_id: BRAND,
            work_type: "shoots",
            work_id: WORK,
          },
        },
        metadata: { ipix_schema_version: "1" },
      });
    } else if (mod === 1) {
      // malformed: wrong type, mismatched env, missing work_id
      assets.push({
        folder: `ipix/staging/${ORG}/${BRAND}/campaigns`,
        type: "upload",
        context: { custom: { env: "prod", org_id: ORG, brand_id: BRAND } },
        metadata: { ipix_schema_version: "2" },
      });
    } else if (mod === 2) {
      // legacy pre-taxonomy path
      assets.push({
        asset_folder: `ipix/brands/acme/campaign-${i}`,
        type: "upload",
      });
    } else {
      // missing folder
      assets.push({ folder: "", type: "authenticated" });
    }
  }
  return assets;
}

const smallPage = makeAssets(50);
const largePage = makeAssets(2000);

const contextString =
  `env=prod|org_id=${ORG}|brand_id=${BRAND}|work_type=shoots|work_id=${WORK}`;

const folders = [
  `ipix/prod/${ORG}/${BRAND}/shoots/${WORK}`,
  `ipix/brands/acme/x`,
  "outside/ipix/tree",
  "",
];

describe("cloudinary dry-run audit", () => {
  bench("auditAsset over 50-asset page", () => {
    for (const asset of smallPage) auditAsset(asset);
  });

  bench("auditAsset over 2000-asset page", () => {
    for (const asset of largePage) auditAsset(asset);
  });

  bench("parseContextFields (pipe-delimited string)", () => {
    parseContextFields(contextString);
  });

  bench("folderPatternScore + classifyFolder mix", () => {
    for (const folder of folders) {
      classifyFolder(folder);
      folderPatternScore(folder);
    }
  });
});
