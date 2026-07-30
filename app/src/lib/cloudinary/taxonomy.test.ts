import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ALLOWED_UPLOAD_FORMATS,
  DEFAULT_WORK_TYPE,
  DELIVERY_TYPE,
  METADATA_SCHEMA_VERSION,
  WORK_TYPES,
  assetFolderFor,
  damContext,
  damContextString,
  damTags,
  detectEnv,
  isDamWorkType,
  workTypeWorkIdPairError,
} from "./taxonomy";

const BRAND_ID = "11111111-1111-1111-1111-111111111111";
const ORG_ID = "22222222-2222-2222-2222-222222222222";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("detectEnv", () => {
  it("returns 'prod' when VERCEL_ENV is 'production'", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(detectEnv()).toBe("prod");
  });

  it("returns 'staging' for preview env", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(detectEnv()).toBe("staging");
  });

  it("returns 'staging' from NEXT_PUBLIC_VERCEL_ENV when VERCEL_ENV is unset", () => {
    vi.stubEnv("VERCEL_ENV", "" as any);
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "staging");
    expect(detectEnv()).toBe("staging");
  });

  it("returns 'dev' when neither env var is set", () => {
    vi.stubEnv("VERCEL_ENV", "" as any);
    expect(detectEnv()).toBe("dev");
  });

  it("returns 'dev' in local development (NODE_ENV=development, no vars)", () => {
    vi.stubEnv("VERCEL_ENV", "" as any);
    vi.stubEnv("NODE_ENV", "development");
    expect(detectEnv()).toBe("dev");
  });

  it("returns 'prod' on Cloudflare/OpenNext via explicit DAM_ENV override", () => {
    vi.stubEnv("VERCEL_ENV", "" as any);
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DAM_ENV", "prod");
    expect(detectEnv()).toBe("prod");
  });

  it("returns 'staging' on Cloudflare/OpenNext preview via explicit DAM_ENV override", () => {
    vi.stubEnv("VERCEL_ENV", "" as any);
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DAM_ENV", "staging");
    expect(detectEnv()).toBe("staging");
  });

  it("throws on invalid DAM_ENV value", () => {
    vi.stubEnv("VERCEL_ENV", "" as any);
    vi.stubEnv("DAM_ENV", "bogus");
    expect(() => detectEnv()).toThrow(/invalid DAM_ENV/);
  });

  it("fails closed (throws) when NODE_ENV=production but no DAM_ENV/VERCEL_ENV is set", () => {
    vi.stubEnv("VERCEL_ENV", "" as any);
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "" as any);
    vi.stubEnv("DAM_ENV", "" as any);
    vi.stubEnv("NODE_ENV", "production");
    expect(() => detectEnv()).toThrow(/refusing to silently fall back/);
  });
});

describe("assetFolderFor", () => {
  it("builds folder with env, org, brand, default work type", () => {
    const folder = assetFolderFor({ env: "dev", orgId: ORG_ID, brandId: BRAND_ID });
    expect(folder).toBe(`ipix/dev/${ORG_ID}/${BRAND_ID}/products`);
  });

  it("includes workType and workId when provided", () => {
    const folder = assetFolderFor({
      env: "prod",
      orgId: ORG_ID,
      brandId: BRAND_ID,
      workType: "shoots",
      workId: "33333333-3333-3333-3333-333333333333",
    });
    expect(folder).toBe(
      `ipix/prod/${ORG_ID}/${BRAND_ID}/shoots/33333333-3333-3333-3333-333333333333`,
    );
  });

  it("includes workId without trailing slash when workType is missing but workId supplied", () => {
    const folder = assetFolderFor({
      env: "dev",
      orgId: ORG_ID,
      brandId: BRAND_ID,
      workId: "id-only",
    });
    expect(folder).toBe(`ipix/dev/${ORG_ID}/${BRAND_ID}/products/id-only`);
  });
});

describe("damContext", () => {
  it("builds context with all fields", () => {
    const ctx = damContext({ env: "prod", orgId: ORG_ID, brandId: BRAND_ID });
    expect(ctx).toEqual({
      env: "prod",
      org_id: ORG_ID,
      brand_id: BRAND_ID,
      work_type: DEFAULT_WORK_TYPE,
    });
  });

  it("includes optional shootId and campaignId", () => {
    const ctx = damContext({
      env: "dev",
      orgId: ORG_ID,
      brandId: BRAND_ID,
      shootId: "s-001",
      campaignId: "c-001",
    });
    expect(ctx.shoot_id).toBe("s-001");
    expect(ctx.campaign_id).toBe("c-001");
  });
});

describe("damContextString", () => {
  it("encodes flat context as pipe-delimited string", () => {
    const str = damContextString({ env: "dev", orgId: ORG_ID, brandId: BRAND_ID });
    expect(str).toBe(`env=dev|org_id=${ORG_ID}|brand_id=${BRAND_ID}|work_type=products`);
  });

  it("skips undefined values", () => {
    const str = damContextString({
      env: "dev",
      orgId: ORG_ID,
      brandId: BRAND_ID,
      shootId: undefined,
    });
    expect(str).not.toContain("shoot_id=");
  });

  it("includes optional fields when present", () => {
    const str = damContextString({
      env: "dev",
      orgId: ORG_ID,
      brandId: BRAND_ID,
      shootId: "s-001",
      campaignId: "c-001",
    });
    expect(str).toContain("shoot_id=s-001");
    expect(str).toContain("campaign_id=c-001");
  });
});

describe("damTags", () => {
  it("returns tags array with env prefix", () => {
    const tags = damTags({ env: "dev", workType: "shoots" });
    expect(tags).toEqual(["env:dev", "work_type:shoots"]);
  });

  it("defaults workType to products when omitted", () => {
    const tags = damTags({ env: "prod" });
    expect(tags).toEqual(["env:prod"]);
    expect(tags).not.toContain("work_type:");
  });

  it("includes status tag when provided", () => {
    const tags = damTags({ env: "dev", status: "active" });
    expect(tags).toContain("status:active");
  });
});

describe("constants", () => {
  it("allows jpg, png, webp, mp4, mov", () => {
    expect(ALLOWED_UPLOAD_FORMATS).toBe("jpg,png,webp,mp4,mov");
  });

  it("DELIVERY_TYPE is 'authenticated'", () => {
    expect(DELIVERY_TYPE).toBe("authenticated");
  });

  it("METADATA_SCHEMA_VERSION is '1'", () => {
    expect(METADATA_SCHEMA_VERSION).toBe("1");
  });
});

describe("isDamWorkType", () => {
  it("accepts every supported workType", () => {
    for (const wt of WORK_TYPES) {
      expect(isDamWorkType(wt)).toBe(true);
    }
  });

  it("rejects unknown workType", () => {
    expect(isDamWorkType("unknown")).toBe(false);
    expect(isDamWorkType("shoot")).toBe(false);
  });

  it("rejects '../../etc' path-like workType", () => {
    expect(isDamWorkType("../../etc")).toBe(false);
  });

  it("rejects empty workType", () => {
    expect(isDamWorkType("")).toBe(false);
  });

  it("rejects non-string workType", () => {
    expect(isDamWorkType(undefined)).toBe(false);
    expect(isDamWorkType(null)).toBe(false);
    expect(isDamWorkType(42)).toBe(false);
    expect(isDamWorkType({})).toBe(false);
    expect(isDamWorkType(["shoots"])).toBe(false);
  });

  it("narrows the type for valid values", () => {
    const value: unknown = "shoots";
    if (isDamWorkType(value)) {
      const _typed: import("./taxonomy").WorkType = value;
      expect(_typed).toBe("shoots");
    }
  });
});

describe("workTypeWorkIdPairError", () => {
  const WORK_ID = "33333333-3333-3333-3333-333333333333";

  it("requires workId for shoots and campaigns", () => {
    expect(workTypeWorkIdPairError("shoots", undefined)).toContain("workId is required");
    expect(workTypeWorkIdPairError("campaigns", undefined)).toContain("workId is required");
  });

  it("rejects workId without workType", () => {
    expect(workTypeWorkIdPairError(undefined, WORK_ID)).toContain(
      "workId is not allowed without a workType",
    );
  });

  it("rejects workId for types that nest without an id segment", () => {
    expect(workTypeWorkIdPairError("products", WORK_ID)).toContain("workId is not allowed");
    expect(workTypeWorkIdPairError("dna-assets", WORK_ID)).toContain("workId is not allowed");
  });

  it("allows valid pairs and omitted pair", () => {
    expect(workTypeWorkIdPairError(undefined, undefined)).toBeNull();
    expect(workTypeWorkIdPairError("products", undefined)).toBeNull();
    expect(workTypeWorkIdPairError("shoots", WORK_ID)).toBeNull();
  });
});

describe("damContextString escaping", () => {
  it("escapes pipe characters in values", () => {
    const str = damContextString({
      env: "dev",
      orgId: "evil|injected",
      brandId: BRAND_ID,
    });
    expect(str).not.toContain("|injected");
    expect(str).toContain("evil_injected");
  });

  it("escapes equals characters in values", () => {
    const str = damContextString({
      env: "dev",
      orgId: "evil=injected",
      brandId: BRAND_ID,
    });
    expect(str).not.toContain("=injected");
    expect(str).toContain("evil_injected");
  });

  it("escapes backslash characters in values", () => {
    const str = damContextString({
      env: "dev",
      orgId: "evil\\injected",
      brandId: BRAND_ID,
    });
    expect(str).toContain("evil_injected");
    expect(str).not.toContain("evil\\injected");
  });

  it("preserves valid UUID values unchanged", () => {
    const str = damContextString({
      env: "dev",
      orgId: ORG_ID,
      brandId: BRAND_ID,
      workId: "33333333-3333-3333-3333-333333333333",
    });
    expect(str).toContain(`org_id=${ORG_ID}`);
    expect(str).toContain(`brand_id=${BRAND_ID}`);
    expect(str).toContain("work_id=33333333-3333-3333-3333-333333333333");
  });
});
