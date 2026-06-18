import { describe, expect, it, vi, afterEach } from "vitest";

import { isValidBrandUrl } from "@/lib/brand-url";
import {
  analyzeBrandFromUrl,
  commitBrandDraft,
} from "@/services/brandIntelligenceService";
import * as edgeFunctionService from "@/services/edgeFunctionService";

describe("isValidBrandUrl", () => {
  it("accepts http and https URLs", () => {
    expect(isValidBrandUrl("https://maisonelara.com")).toBe(true);
    expect(isValidBrandUrl("http://localhost:3000")).toBe(true);
  });

  it("rejects empty, invalid, and non-http schemes", () => {
    expect(isValidBrandUrl("")).toBe(false);
    expect(isValidBrandUrl("   ")).toBe(false);
    expect(isValidBrandUrl("not-a-url")).toBe(false);
    expect(isValidBrandUrl("ftp://files.example.com")).toBe(false);
  });
});

describe("analyzeBrandFromUrl", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns draft analyze data on success", async () => {
    const payload = {
      action: "analyze" as const,
      draftId: "draft-1",
      status: "pending" as const,
      brandId: null,
      profile: {
        name: "Maison Elara",
        tagline: "Luxury leather",
        category: "Fashion",
        visualIdentity: { colors: ["#111"], mood: "Editorial" },
        targetAudience: "Affluent millennials",
        sourceUrl: "https://maisonelara.com",
        analyzedAt: "2026-06-15T00:00:00.000Z",
      },
      scores: [{ score_type: "visual", score: 82 }],
      urlRetrieval: {},
      logId: "log-1",
      durationMs: 12000,
      geminiMs: 11000,
    };

    const invoke = vi.spyOn(edgeFunctionService, "invokeEdgeFunction").mockResolvedValue({
      ok: true,
      data: payload,
    });

    await expect(analyzeBrandFromUrl({ url: "https://maisonelara.com" })).resolves.toEqual(
      payload,
    );

    expect(invoke).toHaveBeenCalledWith("brand-intelligence", {
      action: "analyze",
      url: "https://maisonelara.com",
    });
  });

  it("throws with edge error message on failure", async () => {
    vi.spyOn(edgeFunctionService, "invokeEdgeFunction").mockResolvedValue({
      ok: false,
      error: { code: "validation_error", message: "A valid http(s) url is required" },
    });

    await expect(analyzeBrandFromUrl({ url: "https://example.com" })).rejects.toThrow(
      "A valid http(s) url is required",
    );
  });
});

describe("commitBrandDraft", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends commit approve action", async () => {
    const payload = {
      action: "commit" as const,
      decision: "approve" as const,
      draftId: "draft-1",
      status: "approved" as const,
      brandId: "brand-1",
      brand: { id: "brand-1", name: "Maison Elara" },
      profile: {
        name: "Maison Elara",
        tagline: "",
        category: "Fashion",
        visualIdentity: { colors: [], mood: "" },
        targetAudience: "",
        sourceUrl: "https://maisonelara.com",
        analyzedAt: "2026-06-15T00:00:00.000Z",
      },
      scores: [{ id: "s1", score_type: "visual", score: 82 }],
      logId: "log-2",
      durationMs: 500,
    };

    const invoke = vi.spyOn(edgeFunctionService, "invokeEdgeFunction").mockResolvedValue({
      ok: true,
      data: payload,
    });

    await expect(
      commitBrandDraft({ draftId: "draft-1", decision: "approve" }),
    ).resolves.toEqual(payload);

    expect(invoke).toHaveBeenCalledWith("brand-intelligence", {
      action: "commit",
      draftId: "draft-1",
      decision: "approve",
    });
  });
});
