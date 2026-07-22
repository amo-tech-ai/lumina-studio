import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  auditAsset,
  classifyFolder,
  folderPatternScore,
  nextPageSize,
  parseContextFields,
  requiredContextKeysFor,
  validateMaxAssets,
} from "./cloudinary-dry-run-audit-lib.mjs";

const ORG_ID = "22222222-2222-2222-2222-222222222222";
const BRAND_ID = "11111111-1111-1111-1111-111111111111";
const WORK_ID = "33333333-3333-3333-3333-333333333333";

describe("classifyFolder", () => {
  it("classifies missing folder", () => {
    assert.equal(classifyFolder(""), "missing");
    assert.equal(classifyFolder(undefined), "missing");
  });

  it("classifies pre-taxonomy folder outside ipix/ as legacy", () => {
    assert.equal(classifyFolder(`ipix-old/brands/${BRAND_ID}/products`), "legacy");
    assert.equal(classifyFolder("legacy/foo"), "legacy");
  });

  it("classifies known legacy ipix/ shapes as legacy (not malformed)", () => {
    assert.equal(classifyFolder(`ipix/brands/${BRAND_ID}/products`), "legacy");
    assert.equal(classifyFolder(`ipix/campaigns/${WORK_ID}`), "legacy");
    assert.equal(classifyFolder(`ipix/shoots/${WORK_ID}/raw`), "legacy");
    assert.equal(classifyFolder("ipix/cld105-test"), "legacy");
    assert.equal(classifyFolder("ipix/cld105-test/run-1"), "legacy");
  });

  it("classifies valid taxonomy folder as new", () => {
    assert.equal(classifyFolder(`ipix/dev/${ORG_ID}/${BRAND_ID}/products`), "new");
  });

  it("classifies unknown ipix/ paths as new so pattern score can fail them", () => {
    assert.equal(classifyFolder("ipix/weird/stuff"), "new");
    assert.equal(classifyFolder("ipix/brands-typo/x"), "new");
  });
});

describe("requiredContextKeysFor", () => {
  it("requires only universal keys for products", () => {
    assert.deepEqual(requiredContextKeysFor("products"), ["env", "org_id", "brand_id", "work_type"]);
  });

  it("requires work_id for shoots and campaigns", () => {
    assert.deepEqual(requiredContextKeysFor("shoots"), ["env", "org_id", "brand_id", "work_type", "work_id"]);
    assert.deepEqual(requiredContextKeysFor("campaigns"), ["env", "org_id", "brand_id", "work_type", "work_id"]);
  });

  it("never requires shoot_id or campaign_id", () => {
    for (const wt of ["shoots", "campaigns", "products", "dna-assets"]) {
      assert.ok(!requiredContextKeysFor(wt).includes("shoot_id"));
      assert.ok(!requiredContextKeysFor(wt).includes("campaign_id"));
    }
  });
});

describe("folderPatternScore", () => {
  it("accepts a well-formed folder without workId", () => {
    const score = folderPatternScore(`ipix/dev/${ORG_ID}/${BRAND_ID}/products`);
    assert.equal(score.valid, true);
    assert.equal(score.workId, null);
  });

  it("accepts a well-formed folder with workId", () => {
    const score = folderPatternScore(`ipix/prod/${ORG_ID}/${BRAND_ID}/shoots/${WORK_ID}`);
    assert.equal(score.valid, true);
    assert.equal(score.workId, WORK_ID);
  });

  it("rejects non-UUID org_id", () => {
    const score = folderPatternScore(`ipix/dev/not-a-uuid/${BRAND_ID}/products`);
    assert.equal(score.valid, false);
    assert.match(score.reason, /org_id/);
  });

  it("rejects non-UUID work_id", () => {
    const score = folderPatternScore(`ipix/dev/${ORG_ID}/${BRAND_ID}/shoots/not-a-uuid`);
    assert.equal(score.valid, false);
    assert.match(score.reason, /work_id/);
  });

  it("rejects unknown work_type", () => {
    const score = folderPatternScore(`ipix/dev/${ORG_ID}/${BRAND_ID}/bogus-type`);
    assert.equal(score.valid, false);
    assert.match(score.reason, /work_type/);
  });

  it("rejects too many segments", () => {
    const score = folderPatternScore(`ipix/dev/${ORG_ID}/${BRAND_ID}/shoots/${WORK_ID}/extra`);
    assert.equal(score.valid, false);
    assert.match(score.reason, /too many segments/);
  });
});

describe("parseContextFields", () => {
  it("parses pipe-delimited string context", () => {
    assert.deepEqual(parseContextFields(`env=dev|org_id=${ORG_ID}`), { env: "dev", org_id: ORG_ID });
  });

  it("passes through object context", () => {
    assert.deepEqual(parseContextFields({ env: "dev" }), { env: "dev" });
  });

  it("returns {} for null/undefined", () => {
    assert.deepEqual(parseContextFields(null), {});
    assert.deepEqual(parseContextFields(undefined), {});
  });
});

describe("auditAsset", () => {
  function compliantAsset(overrides = {}) {
    return {
      public_id: "p1",
      folder: `ipix/dev/${ORG_ID}/${BRAND_ID}/products`,
      type: "authenticated",
      context: { env: "dev", org_id: ORG_ID, brand_id: BRAND_ID, work_type: "products" },
      ...overrides,
    };
  }

  it("passes a compliant products asset with no work_id", () => {
    const result = auditAsset(compliantAsset());
    assert.equal(result.classification, "compliant");
    assert.deepEqual(result.issues, []);
  });

  it("does not require shoot_id/campaign_id on unrelated assets", () => {
    const result = auditAsset(compliantAsset());
    assert.ok(!result.issues.some((i) => i.includes("shoot_id")));
    assert.ok(!result.issues.some((i) => i.includes("campaign_id")));
  });

  it("flags a shoots asset missing work_id in context and folder", () => {
    const result = auditAsset(
      compliantAsset({
        folder: `ipix/dev/${ORG_ID}/${BRAND_ID}/shoots`,
        context: { env: "dev", org_id: ORG_ID, brand_id: BRAND_ID, work_type: "shoots" },
      }),
    );
    assert.equal(result.classification, "malformed");
    assert.ok(result.issues.some((i) => i.includes('missing required context key "work_id"')));
  });

  it("passes a shoots asset that has work_id", () => {
    const result = auditAsset(
      compliantAsset({
        folder: `ipix/dev/${ORG_ID}/${BRAND_ID}/shoots/${WORK_ID}`,
        context: {
          env: "dev",
          org_id: ORG_ID,
          brand_id: BRAND_ID,
          work_type: "shoots",
          work_id: WORK_ID,
        },
      }),
    );
    assert.equal(result.classification, "compliant");
  });

  it("classifies a folderless asset as missing, not malformed", () => {
    const result = auditAsset(compliantAsset({ folder: "" }));
    assert.equal(result.classification, "missing");
    assert.deepEqual(result.issues, []);
  });

  it("classifies a pre-taxonomy folder as legacy, not malformed", () => {
    const result = auditAsset(compliantAsset({ folder: `ipix-old/brands/${BRAND_ID}/products` }));
    assert.equal(result.classification, "legacy");
    assert.deepEqual(result.issues, []);
  });

  it("classifies legacy ipix/brands folders as legacy, not malformed", () => {
    const result = auditAsset(compliantAsset({ folder: `ipix/brands/${BRAND_ID}/products` }));
    assert.equal(result.classification, "legacy");
    assert.deepEqual(result.issues, []);
  });

  it("flags unknown ipix/ paths as malformed (not silent legacy)", () => {
    const result = auditAsset(compliantAsset({ folder: "ipix/weird/stuff" }));
    assert.equal(result.classification, "malformed");
    assert.ok(result.issues.some((i) => i.includes("folder")));
  });

  it("flags wrong delivery type", () => {
    const result = auditAsset(compliantAsset({ type: "upload" }));
    assert.equal(result.classification, "malformed");
    assert.ok(result.issues.some((i) => i.includes("type is")));
  });

  it("flags context/folder org_id mismatch", () => {
    const otherOrg = "44444444-4444-4444-4444-444444444444";
    const result = auditAsset(
      compliantAsset({ context: { env: "dev", org_id: otherOrg, brand_id: BRAND_ID, work_type: "products" } }),
    );
    assert.equal(result.classification, "malformed");
    assert.ok(result.issues.some((i) => i.includes("org_id")));
  });
});

describe("validateMaxAssets", () => {
  it("accepts a normal positive integer", () => {
    assert.equal(validateMaxAssets("500"), 500);
  });

  it("rejects non-numeric input", () => {
    assert.throws(() => validateMaxAssets("abc"), /positive integer/);
  });

  it("rejects zero", () => {
    assert.throws(() => validateMaxAssets("0"), /positive integer/);
  });

  it("rejects negative values", () => {
    assert.throws(() => validateMaxAssets("-5"), /positive integer/);
  });

  it("rejects unsafe values above the cap", () => {
    assert.throws(() => validateMaxAssets("1000000"), /safety cap/);
  });
});

describe("nextPageSize", () => {
  it("caps to the per-page cap when remaining is large", () => {
    assert.equal(nextPageSize(10_000, 500), 500);
  });

  it("caps to the remaining budget when smaller than the per-page cap", () => {
    assert.equal(nextPageSize(10, 500), 10);
  });

  it("never returns a negative size", () => {
    assert.equal(nextPageSize(-5, 500), 0);
  });
});
