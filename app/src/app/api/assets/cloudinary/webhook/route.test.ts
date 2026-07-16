import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const BRAND_ID = "11111111-1111-1111-1111-111111111111";
const VALID_TIMESTAMP = () => Math.floor(Date.now() / 1000);

const mockConfig = vi.fn();
const mockVerify = vi.fn();

vi.mock("cloudinary", () => ({
  v2: {
    config: (...args: unknown[]) => mockConfig(...args),
    utils: {
      verifyNotificationSignature: (...args: unknown[]) => mockVerify(...args),
    },
  },
}));

// after() requires a real Next.js request scope, which direct POST() invocation
// in tests doesn't provide — run the callback inline instead.
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return { ...actual, after: (fn: () => unknown) => fn() };
});

const assetsSelectMaybeSingle = vi.fn();
const assetsInsertSingle = vi.fn();
const assetsUpdateEq = vi.fn();
const assetsDeleteEq = vi.fn();
const cloudinaryAssetsUpsert = vi.fn();
const cloudinaryAssetsSelectMaybeSingle = vi.fn();
const cloudinaryAssetsUpdateIs = vi.fn();
const cloudinaryAssetsUpdateEq = vi.fn();
/** `.eq()` is awaitable and chainable with `.is()` (legacy delete null-identity path). */
function mockUpdateEqResult(result: { data: null; error: unknown }) {
  cloudinaryAssetsUpdateEq.mockImplementation(() => {
    const pending = Promise.resolve(result);
    return Object.assign(pending, {
      is: (...args: unknown[]) => cloudinaryAssetsUpdateIs(...args),
    });
  });
}
const cloudinaryAssetsUpdate = vi.fn(() => ({ eq: cloudinaryAssetsUpdateEq }));
const aiAgentLogsInsert = vi.fn();
const campaignsSelectMaybeSingle = vi.fn();

const mockFrom = vi.fn((table: string) => {
  if (table === "assets") {
    return {
      select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: assetsSelectMaybeSingle })) })),
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: assetsInsertSingle })) })),
      update: vi.fn(() => ({ eq: assetsUpdateEq })),
      delete: vi.fn(() => ({ eq: assetsDeleteEq })),
    };
  }
  if (table === "cloudinary_assets") {
    return {
      select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: cloudinaryAssetsSelectMaybeSingle })) })),
      upsert: cloudinaryAssetsUpsert,
      update: cloudinaryAssetsUpdate,
    };
  }
  if (table === "ai_agent_logs") {
    return { insert: aiAgentLogsInsert };
  }
  if (table === "campaigns") {
    return {
      select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: campaignsSelectMaybeSingle })) })),
    };
  }
  throw new Error(`unexpected table: ${table}`);
});

const FK_VIOLATION = {
  code: "23503",
  message:
    'insert or update on table "assets" violates foreign key constraint "assets_brand_id_fkey"',
};

const mockCreateSupabaseAdminClient = vi.fn(() => ({ from: mockFrom }));

vi.mock("@/app/api/_lib/supabase-admin", () => ({
  createSupabaseAdminClient: () => mockCreateSupabaseAdminClient(),
}));

function makeRequest(body: unknown, headers?: Record<string, string | null>): Request {
  const h = new Headers({
    "content-type": "application/json",
    "x-cld-timestamp": String(VALID_TIMESTAMP()),
    "x-cld-signature": "sig",
  });
  if (headers) {
    for (const [k, v] of Object.entries(headers)) {
      if (v === null) h.delete(k);
      else h.set(k, v);
    }
  }
  return new Request("http://localhost/api/assets/cloudinary/webhook", {
    method: "POST",
    headers: h,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const mockFetch = vi.fn();

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("CLOUDINARY_CLOUD_NAME", "dzqy2ixl0");
  vi.stubEnv("CLOUDINARY_API_KEY", "test-api-key");
  vi.stubEnv("CLOUDINARY_API_SECRET", "test-api-secret");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
  mockVerify.mockReturnValue(true);
  assetsSelectMaybeSingle.mockResolvedValue({ data: null, error: null });
  assetsInsertSingle.mockResolvedValue({ data: { id: "asset-1" }, error: null });
  assetsUpdateEq.mockResolvedValue({ data: null, error: null });
  assetsDeleteEq.mockResolvedValue({ data: null, error: null });
  cloudinaryAssetsUpsert.mockResolvedValue({ data: null, error: null });
  cloudinaryAssetsSelectMaybeSingle.mockResolvedValue({ data: null, error: null });
  cloudinaryAssetsUpdate.mockClear();
  cloudinaryAssetsUpdate.mockImplementation(() => ({ eq: cloudinaryAssetsUpdateEq }));
  cloudinaryAssetsUpdateIs.mockResolvedValue({ data: null, error: null });
  mockUpdateEqResult({ data: null, error: null });
  aiAgentLogsInsert.mockResolvedValue({ data: null, error: null });
  campaignsSelectMaybeSingle.mockResolvedValue({ data: null, error: null });
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve("") });
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  vi.resetModules();
});

async function importRoute() {
  return import("./route");
}

const PROVIDER_ASSET_ID = "3515c6000a548515f1134043f9785c2f";

const UPLOAD_PAYLOAD = {
  notification_type: "upload",
  public_id: `ipix/brands/${BRAND_ID}/products/abc123`,
  secure_url: "https://res.cloudinary.com/dzqy2ixl0/image/upload/v1/abc123.jpg",
  resource_type: "image",
  format: "jpg",
  bytes: 1024,
  width: 800,
  height: 600,
  version: 1,
  asset_id: PROVIDER_ASSET_ID,
};

describe("POST /api/assets/cloudinary/webhook", () => {
  it("returns 500 when Cloudinary env vars are missing", async () => {
    vi.stubEnv("CLOUDINARY_API_SECRET", "");
    const { POST } = await importRoute();
    const res = await POST(makeRequest(UPLOAD_PAYLOAD));
    expect(res.status).toBe(500);
  });

  it("returns 401 when signature headers are missing", async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest(UPLOAD_PAYLOAD, { "x-cld-signature": null }));
    expect(res.status).toBe(401);
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it("returns 401 when the timestamp is outside the replay window", async () => {
    const { POST } = await importRoute();
    const staleTimestamp = String(VALID_TIMESTAMP() - 301);
    const res = await POST(makeRequest(UPLOAD_PAYLOAD, { "x-cld-timestamp": staleTimestamp }));
    expect(res.status).toBe(401);
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it("returns 401 and writes nothing when the signature is invalid", async () => {
    mockVerify.mockReturnValue(false);
    const { POST } = await importRoute();
    const res = await POST(makeRequest(UPLOAD_PAYLOAD));
    expect(res.status).toBe(401);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("configures the SDK with explicit credentials before verifying", async () => {
    const { POST } = await importRoute();
    await POST(makeRequest(UPLOAD_PAYLOAD));
    expect(mockConfig).toHaveBeenCalledWith({
      cloud_name: "dzqy2ixl0",
      api_key: "test-api-key",
      api_secret: "test-api-secret",
    });
  });

  it("returns 400 for invalid JSON body", async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest("not-json"));
    expect(res.status).toBe(400);
  });

  it("acks unknown notification types with 200 and no writes", async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest({ ...UPLOAD_PAYLOAD, notification_type: "moderation" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, ignored: "moderation" });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("creates a new assets row and upserts cloudinary_assets for a fresh upload, resolving brand_id from the folder", async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest(UPLOAD_PAYLOAD));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    expect(assetsInsertSingle).toHaveBeenCalled();
    expect(cloudinaryAssetsUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        asset_id: "asset-1",
        public_id: UPLOAD_PAYLOAD.public_id,
        brand_id: BRAND_ID,
        status: "ready",
        cloudinary_asset_id: PROVIDER_ASSET_ID,
        version: 1,
      }),
      { onConflict: "public_id" },
    );
    expect(aiAgentLogsInsert).toHaveBeenCalledWith(
      expect.objectContaining({ agent_name: "cloudinary-webhook", brand_id: BRAND_ID }),
    );
  });

  it("IPI-641: persists cloudinary_asset_id + version from notification asset_id (not local FK)", async () => {
    const { POST } = await importRoute();
    await POST(makeRequest(UPLOAD_PAYLOAD));
    const [row] = cloudinaryAssetsUpsert.mock.calls[0];
    expect(row.cloudinary_asset_id).toBe(PROVIDER_ASSET_ID);
    expect(row.asset_id).toBe("asset-1");
    expect(row.cloudinary_asset_id).not.toBe(row.asset_id);
    expect(row.version).toBe(1);
  });

  it("IPI-641: missing provider asset_id still upserts (nullable) without wiping identity keys", async () => {
    const { asset_id: _omit, ...withoutProviderId } = UPLOAD_PAYLOAD;
    const { POST } = await importRoute();
    const res = await POST(makeRequest(withoutProviderId));
    expect(res.status).toBe(200);
    const [row] = cloudinaryAssetsUpsert.mock.calls[0];
    expect(row).not.toHaveProperty("cloudinary_asset_id");
    expect(row.version).toBe(1);
  });

  it("IPI-641 overwrite: same public_id keeps cloudinary_asset_id and advances version", async () => {
    const { POST } = await importRoute();
    await POST(makeRequest(UPLOAD_PAYLOAD));
    await POST(makeRequest({ ...UPLOAD_PAYLOAD, version: 99, bytes: 2048 }));
    const second = cloudinaryAssetsUpsert.mock.calls[1][0];
    expect(second.public_id).toBe(UPLOAD_PAYLOAD.public_id);
    expect(second.cloudinary_asset_id).toBe(PROVIDER_ASSET_ID);
    expect(second.version).toBe(99);
  });

  it("IPI-641 rename identity: mapper keeps provider id when public_id changes (unit)", async () => {
    const { mapProviderIdentity } = await importRoute();
    const renamed = mapProviderIdentity({
      ...UPLOAD_PAYLOAD,
      public_id: `ipix/brands/${BRAND_ID}/products/renamed`,
      version: 2,
    });
    expect(renamed.cloudinary_asset_id).toBe(PROVIDER_ASSET_ID);
    expect(renamed.version).toBe(2);
  });

  it("IPI-641 mapper: version 0 is preserved; empty asset_id is omitted (not a wipe)", async () => {
    const { mapProviderIdentity } = await importRoute();
    expect(mapProviderIdentity({ version: 0 }).version).toBe(0);
    expect(mapProviderIdentity({ asset_id: "", version: 1 })).not.toHaveProperty("cloudinary_asset_id");
    expect(mapProviderIdentity({ asset_id: "", version: 1 }).version).toBe(1);
  });

  it("IPI-641 rename: same cloudinary_asset_id updates existing mirror instead of public_id insert", async () => {
    const NEW_PUBLIC_ID = `ipix/brands/${BRAND_ID}/products/renamed`;
    cloudinaryAssetsSelectMaybeSingle.mockResolvedValue({
      data: { id: "mirror-1", asset_id: "asset-existing", brand_id: BRAND_ID, version: 1 },
      error: null,
    });

    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({
        ...UPLOAD_PAYLOAD,
        public_id: NEW_PUBLIC_ID,
        version: 7,
      }),
    );
    expect(res.status).toBe(200);
    expect(assetsInsertSingle).not.toHaveBeenCalled();
    expect(cloudinaryAssetsUpsert).not.toHaveBeenCalled();
    expect(cloudinaryAssetsUpdateEq).toHaveBeenCalledWith("id", "mirror-1");
    expect(assetsUpdateEq).toHaveBeenCalledWith("id", "asset-existing");
    // Mirror must land before assets.public_id so a failed mirror write cannot desync.
    expect(cloudinaryAssetsUpdateEq.mock.invocationCallOrder[0]).toBeLessThan(
      assetsUpdateEq.mock.invocationCallOrder[0],
    );
  });

  it("IPI-641 rename: archived mirror with same provider id is updated (not blocked by unique index)", async () => {
    cloudinaryAssetsSelectMaybeSingle.mockResolvedValue({
      data: { id: "mirror-archived", asset_id: "asset-existing", brand_id: BRAND_ID, version: 1 },
      error: null,
    });
    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({
        ...UPLOAD_PAYLOAD,
        public_id: `ipix/brands/${BRAND_ID}/products/after-rename`,
        version: 3,
      }),
    );
    expect(res.status).toBe(200);
    expect(cloudinaryAssetsUpsert).not.toHaveBeenCalled();
    expect(cloudinaryAssetsUpdateEq).toHaveBeenCalledWith("id", "mirror-archived");
  });

  it("IPI-641 rename: failed mirror update does not rewrite assets.cloudinary_public_id", async () => {
    cloudinaryAssetsSelectMaybeSingle.mockResolvedValue({
      data: { id: "mirror-1", asset_id: "asset-existing", brand_id: BRAND_ID, version: 1 },
      error: null,
    });
    mockUpdateEqResult({ data: null, error: { message: "public_id unique" } });
    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({
        ...UPLOAD_PAYLOAD,
        public_id: `ipix/brands/${BRAND_ID}/products/renamed-conflict`,
      }),
    );
    expect(res.status).toBe(503);
    expect(cloudinaryAssetsUpdateEq).toHaveBeenCalled();
    expect(assetsUpdateEq).not.toHaveBeenCalled();
    expect(assetsInsertSingle).not.toHaveBeenCalled();
  });

  it("IPI-641 rename: assets sync failure after mirror write returns 503 for retry", async () => {
    cloudinaryAssetsSelectMaybeSingle.mockResolvedValue({
      data: { id: "mirror-1", asset_id: "asset-existing", brand_id: BRAND_ID, version: 1 },
      error: null,
    });
    assetsUpdateEq.mockResolvedValue({ data: null, error: { message: "assets write failed" } });
    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({
        ...UPLOAD_PAYLOAD,
        public_id: `ipix/brands/${BRAND_ID}/products/renamed`,
        version: 2,
      }),
    );
    expect(res.status).toBe(503);
    expect(cloudinaryAssetsUpdateEq).toHaveBeenCalledWith("id", "mirror-1");
    expect(assetsUpdateEq).toHaveBeenCalled();
  });

  it("IPI-641: ignores stale notification version and does not revert public_id", async () => {
    cloudinaryAssetsSelectMaybeSingle.mockResolvedValue({
      data: {
        id: "mirror-1",
        asset_id: "asset-existing",
        brand_id: BRAND_ID,
        version: 5,
        public_id: `ipix/brands/${BRAND_ID}/products/current`,
        secure_url: "https://res.cloudinary.com/x/current.jpg",
      },
      error: null,
    });
    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({
        ...UPLOAD_PAYLOAD,
        public_id: `ipix/brands/${BRAND_ID}/products/stale-old-name`,
        version: 2,
      }),
    );
    expect(res.status).toBe(200);
    expect(cloudinaryAssetsUpdate).not.toHaveBeenCalled();
    // Reconcile assets to the mirror's current public_id (not the stale payload).
    expect(assetsUpdateEq).toHaveBeenCalledWith("id", "asset-existing");
  });

  it("IPI-641: equal version with different public_id (no from_public_id) does not regress", async () => {
    cloudinaryAssetsSelectMaybeSingle.mockResolvedValue({
      data: {
        id: "mirror-1",
        asset_id: "asset-existing",
        brand_id: BRAND_ID,
        version: 5,
        public_id: `ipix/brands/${BRAND_ID}/products/current`,
        secure_url: "https://res.cloudinary.com/x/current.jpg",
      },
      error: null,
    });
    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({
        ...UPLOAD_PAYLOAD,
        public_id: `ipix/brands/${BRAND_ID}/products/stale-old-name`,
        version: 5,
      }),
    );
    expect(res.status).toBe(200);
    expect(cloudinaryAssetsUpdate).not.toHaveBeenCalled();
  });

  it("IPI-641: omitted version with different public_id does not regress", async () => {
    cloudinaryAssetsSelectMaybeSingle.mockResolvedValue({
      data: {
        id: "mirror-1",
        asset_id: "asset-existing",
        brand_id: BRAND_ID,
        version: 5,
        public_id: `ipix/brands/${BRAND_ID}/products/current`,
        secure_url: "https://res.cloudinary.com/x/current.jpg",
      },
      error: null,
    });
    const { POST } = await importRoute();
    const { version: _v, ...withoutVersion } = UPLOAD_PAYLOAD;
    const res = await POST(
      makeRequest({
        ...withoutVersion,
        public_id: `ipix/brands/${BRAND_ID}/products/stale-old-name`,
      }),
    );
    expect(res.status).toBe(200);
    expect(cloudinaryAssetsUpdate).not.toHaveBeenCalled();
  });

  it("IPI-641: equal version rename allowed when from_public_id matches stored", async () => {
    const current = `ipix/brands/${BRAND_ID}/products/current`;
    const renamed = `ipix/brands/${BRAND_ID}/products/renamed`;
    cloudinaryAssetsSelectMaybeSingle.mockResolvedValue({
      data: {
        id: "mirror-1",
        asset_id: "asset-existing",
        brand_id: BRAND_ID,
        version: 5,
        public_id: current,
        secure_url: "https://res.cloudinary.com/x/current.jpg",
      },
      error: null,
    });
    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({
        ...UPLOAD_PAYLOAD,
        public_id: renamed,
        from_public_id: current,
        version: 5,
      }),
    );
    expect(res.status).toBe(200);
    expect(cloudinaryAssetsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ public_id: renamed, version: 5 }),
    );
  });

  it("IPI-641: from_public_id recovers legacy mirror even without provider asset_id", async () => {
    cloudinaryAssetsSelectMaybeSingle.mockResolvedValue({
      data: {
        id: "mirror-legacy",
        asset_id: "asset-legacy",
        brand_id: BRAND_ID,
        version: 1,
        public_id: `ipix/brands/${BRAND_ID}/products/legacy`,
        secure_url: "https://res.cloudinary.com/x/legacy.jpg",
      },
      error: null,
    });
    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({
        notification_type: "upload",
        public_id: `ipix/brands/${BRAND_ID}/products/renamed`,
        from_public_id: `ipix/brands/${BRAND_ID}/products/legacy`,
        secure_url: "https://res.cloudinary.com/x/renamed.jpg",
        resource_type: "image",
        version: 2,
        // no asset_id — rename notification shape
      }),
    );
    expect(res.status).toBe(200);
    expect(assetsInsertSingle).not.toHaveBeenCalled();
    expect(cloudinaryAssetsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        asset_id: "asset-legacy",
        public_id: `ipix/brands/${BRAND_ID}/products/renamed`,
      }),
    );
  });

  it("IPI-641: provider-id lookup error does not fall through to insert a duplicate pair", async () => {
    cloudinaryAssetsSelectMaybeSingle.mockResolvedValue({
      data: null,
      error: { message: "connection reset" },
    });
    const { POST } = await importRoute();
    const res = await POST(makeRequest(UPLOAD_PAYLOAD));
    expect(res.status).toBe(503);
    expect(assetsInsertSingle).not.toHaveBeenCalled();
    expect(cloudinaryAssetsUpsert).not.toHaveBeenCalled();
  });

  it("IPI-641: from_public_id recovers legacy mirror missing cloudinary_asset_id", async () => {
    cloudinaryAssetsSelectMaybeSingle
      .mockResolvedValueOnce({ data: null, error: null }) // by provider id
      .mockResolvedValueOnce({
        data: { id: "mirror-legacy", asset_id: "asset-legacy", brand_id: BRAND_ID, version: 1 },
        error: null,
      }); // by from_public_id
    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({
        ...UPLOAD_PAYLOAD,
        public_id: `ipix/brands/${BRAND_ID}/products/renamed`,
        from_public_id: `ipix/brands/${BRAND_ID}/products/legacy`,
        version: 2,
      }),
    );
    expect(res.status).toBe(200);
    expect(assetsInsertSingle).not.toHaveBeenCalled();
    expect(cloudinaryAssetsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        asset_id: "asset-legacy",
        public_id: `ipix/brands/${BRAND_ID}/products/renamed`,
        cloudinary_asset_id: PROVIDER_ASSET_ID,
      }),
    );
  });

  it("IPI-641: concurrent mirror created after miss keeps canonical asset_id and deletes provisional orphan", async () => {
    // 1) provider lookup miss  2) public_id reuse check miss  3) re-check finds peer mirror
    cloudinaryAssetsSelectMaybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: {
          id: "mirror-1",
          asset_id: "asset-canonical",
          brand_id: BRAND_ID,
          version: 1,
          cloudinary_asset_id: PROVIDER_ASSET_ID,
        },
        error: null,
      });
    assetsInsertSingle.mockResolvedValue({ data: { id: "asset-orphan" }, error: null });

    const { POST } = await importRoute();
    const res = await POST(makeRequest(UPLOAD_PAYLOAD));
    expect(res.status).toBe(200);
    expect(assetsInsertSingle).toHaveBeenCalled();
    expect(cloudinaryAssetsUpsert).not.toHaveBeenCalled();
    expect(cloudinaryAssetsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ asset_id: "asset-canonical", public_id: UPLOAD_PAYLOAD.public_id }),
    );
    expect(assetsUpdateEq).toHaveBeenCalledWith("id", "asset-canonical");
    expect(assetsDeleteEq).toHaveBeenCalledWith("id", "asset-orphan");
  });

  it("IPI-641: notification_type rename routes through upload handler (to_public_id)", async () => {
    const FROM = `ipix/brands/${BRAND_ID}/products/old-name`;
    const TO = `ipix/brands/${BRAND_ID}/products/new-name`;
    cloudinaryAssetsSelectMaybeSingle.mockResolvedValue({
      data: {
        id: "mirror-1",
        asset_id: "asset-existing",
        brand_id: BRAND_ID,
        version: 1,
        public_id: FROM,
        secure_url: "https://res.cloudinary.com/x/old.jpg",
        cloudinary_asset_id: PROVIDER_ASSET_ID,
      },
      error: null,
    });

    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({
        notification_type: "rename",
        asset_id: PROVIDER_ASSET_ID,
        resource_type: "image",
        from_public_id: FROM,
        to_public_id: TO,
        // official rename payload omits public_id + secure_url
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(cloudinaryAssetsUpsert).not.toHaveBeenCalled();
    expect(cloudinaryAssetsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        public_id: TO,
        cloudinary_asset_id: PROVIDER_ASSET_ID,
        asset_id: "asset-existing",
      }),
    );
    expect(assetsUpdateEq).toHaveBeenCalledWith("id", "asset-existing");
    expect(mockFetch).not.toHaveBeenCalled(); // no DNA on rename
  });

  it("IPI-641: public_id reused by a different provider id relocates old mirror (no identity steal)", async () => {
    const OTHER_PROVIDER = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    // 1) provider lookup for NEW id → miss
    // 2) public_id reuse check → old mirror with different provider id
    // 3) upsert re-check by provider → miss
    // 4) upsert public_id lookup → miss (relocated) → insert
    cloudinaryAssetsSelectMaybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: {
          id: "mirror-old",
          asset_id: "asset-old",
          brand_id: BRAND_ID,
          version: 3,
          public_id: UPLOAD_PAYLOAD.public_id,
          cloudinary_asset_id: OTHER_PROVIDER,
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    const { POST } = await importRoute();
    const res = await POST(makeRequest(UPLOAD_PAYLOAD));
    expect(res.status).toBe(200);
    expect(cloudinaryAssetsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "archived",
        public_id: expect.stringMatching(
          new RegExp(`^${UPLOAD_PAYLOAD.public_id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}__superseded_`),
        ),
      }),
    );
    expect(assetsUpdateEq).toHaveBeenCalledWith("id", "asset-old");
    expect(cloudinaryAssetsUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        cloudinary_asset_id: PROVIDER_ASSET_ID,
        public_id: UPLOAD_PAYLOAD.public_id,
        asset_id: "asset-1",
      }),
      { onConflict: "public_id" },
    );
  });

  it("normalizeCloudinaryNotification maps to_public_id for rename events", async () => {
    const { normalizeCloudinaryNotification } = await importRoute();
    const normalized = normalizeCloudinaryNotification({
      notification_type: "rename",
      to_public_id: "folder/new",
      from_public_id: "folder/old",
      asset_id: PROVIDER_ASSET_ID,
      resource_type: "image",
    });
    expect(normalized.public_id).toBe("folder/new");
    expect(normalized.from_public_id).toBe("folder/old");
    expect(normalized.secure_url).toContain("/image/authenticated/folder/new");
  });

  it("IPI-641 delete: archives by provider id and legacy null-identity public_id only", async () => {
    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({
        notification_type: "delete",
        asset_id: PROVIDER_ASSET_ID,
        public_id: UPLOAD_PAYLOAD.public_id,
      }),
    );
    expect(res.status).toBe(200);
    expect(cloudinaryAssetsUpdateEq).toHaveBeenCalledWith("cloudinary_asset_id", PROVIDER_ASSET_ID);
    expect(cloudinaryAssetsUpdateEq).toHaveBeenCalledWith("public_id", UPLOAD_PAYLOAD.public_id);
    expect(cloudinaryAssetsUpdateIs).toHaveBeenCalledWith("cloudinary_asset_id", null);
  });

  it("updates the existing assets row instead of inserting when cloudinary_public_id is already linked", async () => {
    assetsSelectMaybeSingle.mockResolvedValue({ data: { id: "asset-existing", brand_id: null }, error: null });
    const { POST } = await importRoute();
    const res = await POST(makeRequest(UPLOAD_PAYLOAD));
    expect(res.status).toBe(200);
    expect(assetsInsertSingle).not.toHaveBeenCalled();
    expect(assetsUpdateEq).toHaveBeenCalledWith("id", "asset-existing");
    expect(cloudinaryAssetsUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ asset_id: "asset-existing" }),
      { onConflict: "public_id" },
    );
  });

  it("leaves brand_id null when the public_id folder doesn't match a known brand pattern", async () => {
    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({ ...UPLOAD_PAYLOAD, public_id: "ipix/shoots/22222222-2222-2222-2222-222222222222/raw/abc" }),
    );
    expect(res.status).toBe(200);
    expect(cloudinaryAssetsUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ brand_id: null }),
      { onConflict: "public_id" },
    );
  });

  it("marks the cloudinary_assets row archived on a delete notification", async () => {
    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({ notification_type: "delete", public_id: UPLOAD_PAYLOAD.public_id }),
    );
    expect(res.status).toBe(200);
    expect(cloudinaryAssetsUpdateEq).toHaveBeenCalledWith("public_id", UPLOAD_PAYLOAD.public_id);
  });

  it("archives from resources[].public_id when top-level public_id is absent (live delete shape)", async () => {
    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({
        notification_type: "delete",
        resources: [{ public_id: UPLOAD_PAYLOAD.public_id }],
      }),
    );
    expect(res.status).toBe(200);
    expect(cloudinaryAssetsUpdateEq).toHaveBeenCalledWith("public_id", UPLOAD_PAYLOAD.public_id);
  });

  it("prefers CLOUDINARY_NOTIFICATION_API_SECRET for signature verification when set", async () => {
    vi.stubEnv("CLOUDINARY_NOTIFICATION_API_SECRET", "notification-only-secret");
    const { POST } = await importRoute();
    await POST(makeRequest(UPLOAD_PAYLOAD));
    expect(mockConfig).toHaveBeenCalledWith({
      cloud_name: "dzqy2ixl0",
      api_key: "test-api-key",
      api_secret: "notification-only-secret",
    });
  });

  it("returns 503 when the mirror upsert fails so Cloudinary can retry", async () => {
    cloudinaryAssetsUpsert.mockResolvedValue({ data: null, error: { message: "boom" } });
    const { POST } = await importRoute();
    const res = await POST(makeRequest(UPLOAD_PAYLOAD));
    expect(res.status).toBe(503);
  });

  it("triggers audit-asset-dna for an image upload", async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest(UPLOAD_PAYLOAD));
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://test.supabase.co/functions/v1/audit-asset-dna",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-service-role-key",
        }),
        body: JSON.stringify({ assetId: "asset-1" }),
      }),
    );
  });

  it("does not trigger audit-asset-dna for a non-image (video) upload", async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest({ ...UPLOAD_PAYLOAD, resource_type: "video" }));
    expect(res.status).toBe(200);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("still acks 2xx when the DNA audit trigger fetch fails (non-fatal)", async () => {
    mockFetch.mockRejectedValue(new Error("network error"));
    const { POST } = await importRoute();
    const res = await POST(makeRequest(UPLOAD_PAYLOAD));
    expect(res.status).toBe(200);
  });

  describe("IPI-513 — campaign resolution and FK-safe brand_id handling", () => {
    const CAMPAIGN_ID = "33333333-3333-3333-3333-333333333333";
    const CAMPAIGN_BRAND_ID = "44444444-4444-4444-4444-444444444444";
    const CAMPAIGN_PAYLOAD = {
      ...UPLOAD_PAYLOAD,
      public_id: `ipix/campaigns/${CAMPAIGN_ID}/abc123`,
    };

    it("resolves brand_id from campaigns.brand_id for a campaign-folder upload", async () => {
      campaignsSelectMaybeSingle.mockResolvedValue({ data: { brand_id: CAMPAIGN_BRAND_ID }, error: null });
      const { POST } = await importRoute();
      const res = await POST(makeRequest(CAMPAIGN_PAYLOAD));
      expect(res.status).toBe(200);
      expect(assetsInsertSingle).toHaveBeenCalled();
      expect(cloudinaryAssetsUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ brand_id: CAMPAIGN_BRAND_ID }),
        { onConflict: "public_id" },
      );
    });

    it("leaves brand_id null when the campaign folder doesn't match a known campaign", async () => {
      campaignsSelectMaybeSingle.mockResolvedValue({ data: null, error: null });
      const { POST } = await importRoute();
      const res = await POST(makeRequest(CAMPAIGN_PAYLOAD));
      expect(res.status).toBe(200);
      expect(cloudinaryAssetsUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ brand_id: null }),
        { onConflict: "public_id" },
      );
    });

    it("logs shoot-folder uploads as unresolved (out of scope, tracked in IPI-524), not silently", async () => {
      const { POST } = await importRoute();
      const res = await POST(
        makeRequest({ ...UPLOAD_PAYLOAD, public_id: "ipix/shoots/22222222-2222-2222-2222-222222222222/raw/abc" }),
      );
      expect(res.status).toBe(200);
      expect(cloudinaryAssetsUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ brand_id: null }),
        { onConflict: "public_id" },
      );
      expect(aiAgentLogsInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          brand_id: null,
          input: expect.objectContaining({ resolution_reason: "shoot_folders_unsupported_see_ipi524" }),
        }),
      );
    });

    it("new asset: retries the insert with brand_id null when the candidate brand fails its FK check, and propagates null to cloudinary_assets", async () => {
      assetsInsertSingle
        .mockResolvedValueOnce({ data: null, error: FK_VIOLATION })
        .mockResolvedValueOnce({ data: { id: "asset-retried" }, error: null });
      const { POST } = await importRoute();
      const res = await POST(makeRequest(UPLOAD_PAYLOAD));
      expect(res.status).toBe(200);
      expect(assetsInsertSingle).toHaveBeenCalledTimes(2);
      expect(cloudinaryAssetsUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ asset_id: "asset-retried", brand_id: null }),
        { onConflict: "public_id" },
      );
      expect(aiAgentLogsInsert).toHaveBeenCalledWith(expect.objectContaining({ brand_id: null }));
    });

    it("existing asset with a valid brand: does NOT null it out when a later event's candidate brand fails its FK check — preserves the existing value", async () => {
      const EXISTING_GOOD_BRAND = "55555555-5555-5555-5555-555555555555";
      assetsSelectMaybeSingle.mockResolvedValue({
        data: { id: "asset-existing", brand_id: EXISTING_GOOD_BRAND },
        error: null,
      });
      assetsUpdateEq
        .mockResolvedValueOnce({ data: null, error: FK_VIOLATION })
        .mockResolvedValueOnce({ data: null, error: null });
      const { POST } = await importRoute();
      const res = await POST(makeRequest(UPLOAD_PAYLOAD));
      expect(res.status).toBe(200);
      expect(assetsUpdateEq).toHaveBeenCalledTimes(2);
      expect(cloudinaryAssetsUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ asset_id: "asset-existing", brand_id: EXISTING_GOOD_BRAND }),
        { onConflict: "public_id" },
      );
    });

    it("a non-brand FK error (or any other update failure) does not retry and preserves the existing brand_id", async () => {
      const EXISTING_GOOD_BRAND = "66666666-6666-6666-6666-666666666666";
      assetsSelectMaybeSingle.mockResolvedValue({
        data: { id: "asset-existing", brand_id: EXISTING_GOOD_BRAND },
        error: null,
      });
      assetsUpdateEq.mockResolvedValueOnce({
        data: null,
        error: { code: "23503", message: 'violates foreign key constraint "assets_shoot_id_fkey"' },
      });
      const { POST } = await importRoute();
      const res = await POST(makeRequest(UPLOAD_PAYLOAD));
      expect(res.status).toBe(200);
      expect(assetsUpdateEq).toHaveBeenCalledTimes(1);
      expect(cloudinaryAssetsUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ brand_id: EXISTING_GOOD_BRAND }),
        { onConflict: "public_id" },
      );
    });

    it("upload then eager for the same asset: the second call finds the existing row and updates rather than inserting again", async () => {
      const { POST } = await importRoute();

      assetsSelectMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
      const uploadRes = await POST(makeRequest(UPLOAD_PAYLOAD));
      expect(uploadRes.status).toBe(200);
      expect(assetsInsertSingle).toHaveBeenCalledTimes(1);

      assetsSelectMaybeSingle.mockResolvedValueOnce({
        data: { id: "asset-1", brand_id: BRAND_ID },
        error: null,
      });
      const eagerRes = await POST(makeRequest({ ...UPLOAD_PAYLOAD, notification_type: "eager" }));
      expect(eagerRes.status).toBe(200);
      expect(assetsInsertSingle).toHaveBeenCalledTimes(1);
      expect(assetsUpdateEq).toHaveBeenCalledWith("id", "asset-1");
    });
  });
});
