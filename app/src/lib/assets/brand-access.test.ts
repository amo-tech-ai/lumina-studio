import { describe, expect, it } from "vitest";

import {
  parseBrandIdFromCloudinaryContext,
} from "./brand-access";

describe("parseBrandIdFromCloudinaryContext", () => {
  it("extracts brand_id from object context", () => {
    const brandId = "11111111-1111-1111-1111-111111111111";
    expect(parseBrandIdFromCloudinaryContext({ brand_id: brandId })).toBe(brandId);
  });

  it("extracts brand_id from pipe-delimited context", () => {
    const brandId = "11111111-1111-1111-1111-111111111111";
    expect(parseBrandIdFromCloudinaryContext(`brand_id=${brandId}|shoot_id=22222222-2222-2222-2222-222222222222`)).toBe(
      brandId,
    );
  });

  it("rejects invalid uuids", () => {
    expect(parseBrandIdFromCloudinaryContext("brand_id=not-a-uuid")).toBeUndefined();
  });
});
