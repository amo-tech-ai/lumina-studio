import { describe, it, expect, vi } from "vitest";
import {
  generateTestImage,
  validateUploadResponse,
  pollForWebhookRow,
  interpretDnaState,
  buildSignedDeliveryUrl,
  isTestPublicId,
  cleanup,
  sanitizeError,
  TEST_FOLDER,
  TEST_PUBLIC_ID_PREFIX,
  ASSET_MASONRY_TRANSFORM,
} from "./verify-cloudinary-pipeline.mjs";

// --- helpers ------------------------------------------------------------------

/** Build a fake supabase client whose .from(t).select().eq().maybeSingle()
 *  and .from(t).delete().eq() resolve to configurable payloads. */
function fakeSupabase({ asset = null, cloudinaryAsset = null, deletes = {} } = {}) {
  const calls = { selects: [], deletes: [] };
  return {
    from(table) {
      calls.currentTable = table;
      return {
        select(cols) {
          calls.selects.push({ table, cols });
          return {
            eq(col, val) {
              return {
                maybeSingle: () => {
                  const payload = table === "assets" ? asset : cloudinaryAsset;
                  return Promise.resolve({ data: payload, error: null });
                },
              };
            },
          };
        },
        delete() {
          const delTable = table;
          calls.deletes.push({ table: delTable });
          return {
            eq: () => {
              const delErr = deletes[delTable] ?? null;
              return Promise.resolve({ error: delErr });
            },
          };
        },
      };
    },
    _calls: calls,
  };
}

/** Fake cloudinary with controllable url() and uploader.destroy(). */
function fakeCloudinary({ destroyResult = { result: "ok" }, destroyThrows = false } = {}) {
  const calls = { urls: [], destroys: [] };
  return {
    calls,
    url(publicId, opts) {
      calls.urls.push({ publicId, opts });
      return `https://res.cloudinary.com/fake/image/authenticated/s--sig--/${publicId}`;
    },
    uploader: {
      async destroy(publicId, opts) {
        calls.destroys.push({ publicId, opts });
        if (destroyThrows) throw new Error("destroy failed");
        return destroyResult;
      },
    },
  };
}

/** Deterministic clock + sleep for pollForWebhookRow tests. */
function fakeClock({ start = 1_000_000, step = 100 } = {}) {
  let t = start;
  return {
    now: () => {
      const cur = t;
      t += step;
      return cur;
    },
    sleep: async () => {
      /* no-op — time advances via now() */
    },
  };
}

// --- tests --------------------------------------------------------------------

describe("validateUploadResponse", () => {
  it("accepts a well-formed Cloudinary upload response", () => {
    const r = validateUploadResponse({ public_id: "ipix/cld105-test/x", bytes: 1234 });
    expect(r).toEqual({ ok: true, publicId: "ipix/cld105-test/x", bytes: 1234 });
  });

  it("rejects a response missing public_id", () => {
    const r = validateUploadResponse({ bytes: 1234 });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/public_id/);
  });

  it("rejects a response with non-positive bytes", () => {
    const r = validateUploadResponse({ public_id: "x", bytes: 0 });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/bytes/);
  });

  it("rejects a non-object response", () => {
    expect(validateUploadResponse(null).ok).toBe(false);
    expect(validateUploadResponse("nope").ok).toBe(false);
    expect(validateUploadResponse(undefined).ok).toBe(false);
  });
});

describe("pollForWebhookRow — successful early polling", () => {
  it("returns the row on the first hit without further polling", async () => {
    const asset = { id: "a1", brand_id: "b1", cloudinary_public_id: "pid" };
    const cloudinaryAsset = { id: "c1", status: "ready" };
    const supabase = fakeSupabase({ asset, cloudinaryAsset });
    const clock = fakeClock();
    const result = await pollForWebhookRow({
      supabase,
      publicId: "pid",
      intervalMs: 1000,
      timeoutMs: 30_000,
      now: clock.now,
      sleep: clock.sleep,
    });
    expect(result).toEqual({ asset, cloudinaryAsset });
  });

  it("returns the row even when cloudinary_assets row is missing", async () => {
    const asset = { id: "a1", brand_id: null, cloudinary_public_id: "pid" };
    const supabase = fakeSupabase({ asset, cloudinaryAsset: null });
    const clock = fakeClock();
    const result = await pollForWebhookRow({
      supabase,
      publicId: "pid",
      now: clock.now,
      sleep: clock.sleep,
    });
    expect(result.asset.id).toBe("a1");
    expect(result.cloudinaryAsset).toBeNull();
  });
});

describe("pollForWebhookRow — 30-second timeout", () => {
  it("returns null after the timeout elapses with no row", async () => {
    const supabase = fakeSupabase({ asset: null });
    let elapsed = 0;
    const start = 1_000_000;
    let t = start;
    const now = () => {
      const cur = t;
      // Advance 5s per now() call so 6 calls (~30s) exhausts the timeout.
      t += 5_000;
      elapsed = cur - start;
      return cur;
    };
    const result = await pollForWebhookRow({
      supabase,
      publicId: "pid",
      intervalMs: 1,
      timeoutMs: 30_000,
      now,
      sleep: async () => {},
    });
    expect(result).toBeNull();
    expect(elapsed).toBeLessThan(60_000);
  });
});

describe("pollForWebhookRow — missing webhook row surfaces as null, not throw", () => {
  it("returns null (not throws) when the webhook never writes", async () => {
    const supabase = fakeSupabase({ asset: null });
    const clock = fakeClock({ step: 15_000 }); // 2 ticks exceeds 30s
    const r = await pollForWebhookRow({
      supabase,
      publicId: "pid",
      timeoutMs: 30_000,
      now: clock.now,
      sleep: clock.sleep,
    });
    expect(r).toBeNull();
  });

  it("propagates supabase errors instead of swallowing them", async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({ data: null, error: { message: "RLS blocked", code: "42501" } }),
          }),
        }),
      }),
    };
    await expect(
      pollForWebhookRow({ supabase, publicId: "pid", now: () => 0, sleep: async () => {} }),
    ).rejects.toThrow(/RLS blocked/);
  });
});

describe("interpretDnaState", () => {
  it("marks a numeric dna_score as populated", () => {
    const r = interpretDnaState({ dna_status: "complete", dna_score: 0.82 });
    expect(r.status).toBe("populated");
    expect(r.score).toBe(0.82);
  });

  it("marks complete/done/approved/scored statuses as populated even with null score", () => {
    for (const s of ["complete", "done", "approved", "scored"]) {
      expect(interpretDnaState({ dna_status: s, dna_score: null }).status).toBe("populated");
    }
  });

  it("marks pending/processing/queued/running as pending", () => {
    for (const s of ["pending", "processing", "queued", "running"]) {
      const r = interpretDnaState({ dna_status: s, dna_score: null });
      expect(r.status).toBe("pending");
      expect(r.detail).toMatch(new RegExp(`dna_status=${s}`));
    }
  });

  it("flags a hard null DNA write as absent", () => {
    const r = interpretDnaState({ dna_status: null, dna_score: null });
    expect(r.status).toBe("absent");
  });

  it("treats a missing asset row as absent", () => {
    expect(interpretDnaState(null).status).toBe("absent");
  });
});

describe("buildSignedDeliveryUrl", () => {
  it("calls cloudinary.url with authenticated + sign_url + the asset-masonry transform", () => {
    const cld = fakeCloudinary();
    const url = buildSignedDeliveryUrl(cld, "pid");
    expect(url).toMatch(/res.cloudinary.com\/fake/);
    expect(cld.calls.urls).toHaveLength(1);
    const { opts } = cld.calls.urls[0];
    expect(opts.type).toBe("authenticated");
    expect(opts.sign_url).toBe(true);
    expect(opts.secure).toBe(true);
    expect(opts.raw_transformation).toBe(ASSET_MASONRY_TRANSFORM);
  });
});

describe("isTestPublicId — test-prefix deletion guard", () => {
  it("accepts public_ids under the test folder", () => {
    expect(isTestPublicId("ipix/cld105-test/cld105-123-x")).toBe(true);
    expect(isTestPublicId(`${TEST_PUBLIC_ID_PREFIX}abc`)).toBe(true);
  });

  it("rejects production public_ids", () => {
    expect(isTestPublicId("ipix/brands/abc/p")).toBe(false);
    expect(isTestPublicId("some/other/path")).toBe(false);
    expect(isTestPublicId("")).toBe(false);
    expect(isTestPublicId(null)).toBe(false);
    expect(isTestPublicId(undefined)).toBe(false);
  });

  it("honours a custom prefix when provided", () => {
    expect(isTestPublicId("custom/x", "custom/")).toBe(true);
    expect(isTestPublicId("custom/x", "other/")).toBe(false);
  });
});

describe("cleanup — deletion guard", () => {
  it("refuses to delete a production public_id", async () => {
    const cld = fakeCloudinary();
    const supabase = fakeSupabase();
    const summary = await cleanup({
      cloudinary: cld,
      supabase,
      publicId: "ipix/brands/real-asset/p",
      assetId: "a1",
    });
    expect(summary.cloudinary).toMatch(/refused/);
    expect(cld.calls.destroys).toHaveLength(0);
  });

  it("destroys the Cloudinary asset + deletes both DB rows for a test public_id", async () => {
    const cld = fakeCloudinary();
    const supabase = fakeSupabase();
    const summary = await cleanup({
      cloudinary: cld,
      supabase,
      publicId: "ipix/cld105-test/cld105-1",
      assetId: "a1",
    });
    expect(cld.calls.destroys).toHaveLength(1);
    expect(cld.calls.destroys[0].opts).toMatchObject({
      resource_type: "image",
      type: "authenticated",
      invalidate: true,
    });
    expect(summary.cloudinary).toBe("ok");
    expect(summary.cloudinaryAssets).toBe("ok");
    expect(summary.assets).toBe("ok");
  });

  it("records an error string instead of throwing when destroy fails", async () => {
    const cld = fakeCloudinary({ destroyThrows: true });
    const supabase = fakeSupabase();
    const summary = await cleanup({
      cloudinary: cld,
      supabase,
      publicId: "ipix/cld105-test/cld105-1",
    });
    expect(summary.cloudinary).toMatch(/^error:/);
  });

  it("is safe to call with no publicId (no-op)", async () => {
    const cld = fakeCloudinary();
    const supabase = fakeSupabase();
    const summary = await cleanup({ cloudinary: cld, supabase, publicId: undefined });
    expect(summary.cloudinary).toBe("skipped");
    expect(cld.calls.destroys).toHaveLength(0);
  });
});

describe("cleanup — on success vs failure", () => {
  it("runs the same destroy+delete path whether called from success or failure path", async () => {
    // The cleanup function is identical regardless of how we got here; this
    // test just locks that contract: same inputs → same DB/Cloudinary calls.
    for (const ctx of [{ fromSuccess: true }, { fromSuccess: false }]) {
      const cld = fakeCloudinary();
      const supabase = fakeSupabase();
      await cleanup({
        cloudinary: cld,
        supabase,
        publicId: "ipix/cld105-test/cld105-1",
        assetId: "a1",
      });
      expect(cld.calls.destroys).toHaveLength(1);
      expect(supabase._calls.deletes.map((d) => d.table).sort()).toEqual([
        "assets",
        "cloudinary_assets",
      ]);
    }
  });
});

describe("sanitizeError", () => {
  it("strips api_secret values", () => {
    const out = sanitizeError(new Error("api_secret=abc123 something broke"));
    expect(out).not.toContain("abc123");
    expect(out).toMatch(/api_secret=<redacted>/);
  });

  it("strips service-role tokens", () => {
    const out = sanitizeError(new Error("token=eyJhbGci rejected"));
    expect(out).not.toContain("eyJhbGci");
  });

  it("truncates very long messages", () => {
    const long = "x".repeat(1000);
    expect(sanitizeError(new Error(long)).length).toBeLessThanOrEqual(300);
  });

  it("handles non-Error inputs without throwing", () => {
    expect(typeof sanitizeError("just a string")).toBe("string");
    expect(typeof sanitizeError(undefined)).toBe("string");
  });
});

describe("generateTestImage", () => {
  it("produces a valid PNG buffer (PNG signature + IHDR)", () => {
    const buf = generateTestImage("run-1");
    // PNG 8-byte signature.
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50);
    expect(buf[2]).toBe(0x4e);
    expect(buf[3]).toBe(0x47);
    // IHDR chunk type at bytes 12-16.
    expect(buf.toString("ascii", 12, 16)).toBe("IHDR");
  });

  it("produces different bytes for different run IDs (no CDN cache collision)", () => {
    const a = generateTestImage("run-a");
    const b = generateTestImage("run-b");
    expect(a.equals(b)).toBe(false);
  });

  it("is small (< 2KB) for fast upload", () => {
    expect(generateTestImage("x").length).toBeLessThan(2048);
  });
});
