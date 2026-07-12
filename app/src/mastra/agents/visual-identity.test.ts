import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Writable } from "node:stream";

vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
vi.stubEnv("GEMINI_API_KEY", "test-gemini-key");

type UploadStreamCallback = (error: unknown, result: { secure_url?: string } | undefined) => void;
const mockUploadStream = vi.fn<(options: unknown, callback: UploadStreamCallback) => Writable>();

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: { upload_stream: (...args: Parameters<typeof mockUploadStream>) => mockUploadStream(...args) },
  },
}));

const MOCK_VISUAL = {
  primaryColors: ["#E87C4D"],
  secondaryColors: ["#F3B93C"],
  typographyStyle: "serif",
  logoDescription: "Minimal wordmark",
  layoutStyle: "editorial",
  imageAesthetic: "lifestyle",
  brandMood: "luxury",
  designPatterns: ["clean lines"],
  colorTemperature: "warm",
  visualPersonality: "Premium fashion brand.",
};

vi.mock("ai", () => ({
  generateObject: vi.fn().mockResolvedValue({ object: MOCK_VISUAL }),
}));

const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });
const mockMaybeSingle = vi.fn().mockResolvedValue({
  data: { ai_profile: { tagline: "Existing", _lifecycle: "scores_complete" }, org_id: "org-uuid-001" },
});
const mockSelectEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
const mockSelect = vi.fn().mockReturnValue({ eq: mockSelectEq });
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect, update: mockUpdate });

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

const BRAND_ID = "00000000-0000-0000-0000-000000000001";

function restoreBaseEnvStubs(): void {
  vi.unstubAllEnvs();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
  vi.stubEnv("GEMINI_API_KEY", "test-gemini-key");
}

describe("visual-identity agent", () => {
  afterEach(restoreBaseEnvStubs);

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubEnv("FIRECRAWL_API_KEY", "");
    // Re-wire mocks after clearAllMocks
    mockUpdateEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockUpdateEq });
    mockMaybeSingle.mockResolvedValue({ data: { ai_profile: { tagline: "Existing", _lifecycle: "scores_complete" }, org_id: "org-uuid-001" } });
    mockSelectEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockSelect.mockReturnValue({ eq: mockSelectEq });
    mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });
    const { generateObject } = await import("ai");
    vi.mocked(generateObject).mockResolvedValue({ object: MOCK_VISUAL } as Awaited<ReturnType<typeof generateObject>>);
  });

  it(
    "exports visualIdentityAgent with correct id",
    async () => {
      // Cold-imports the full agent module (~600ms measured idle) — scoped
      // timeout rather than a global bump; this file flaked under load.
      const { visualIdentityAgent } = await import("./visual-identity");
      expect(visualIdentityAgent).toBeDefined();
      expect((visualIdentityAgent as { id: string }).id).toBe("visual-identity");
    },
    15_000,
  );

  it("uses text-only prompt when no FIRECRAWL_API_KEY (no screenshot)", async () => {
    const { generateObject } = await import("ai");
    const { extractVisualIdentityTool } = await import("./visual-identity");
    await extractVisualIdentityTool.execute!({ brandId: BRAND_ID, homepageUrl: "https://example.com" }, {} as never);
    expect(generateObject).toHaveBeenCalled();
    const call = vi.mocked(generateObject).mock.calls[0]![0];
    const content = (call.messages as { role: string; content: unknown }[])?.[0]?.content;
    expect(typeof content).toBe("string");
  });

  it("merges visualIdentity into existing ai_profile without overwriting other fields", async () => {
    const { extractVisualIdentityTool } = await import("./visual-identity");
    await extractVisualIdentityTool.execute!({ brandId: BRAND_ID, homepageUrl: "https://example.com" }, {} as never);
    expect(mockUpdate).toHaveBeenCalled();
    const updatedProfile = mockUpdate.mock.calls[0]?.[0]?.ai_profile as Record<string, unknown>;
    expect(updatedProfile.tagline).toBe("Existing");
    expect(updatedProfile._lifecycle).toBe("scores_complete");
    expect(updatedProfile.visualIdentity).toMatchObject(MOCK_VISUAL);
  });

  it("returns merged: true on success", async () => {
    const { extractVisualIdentityTool } = await import("./visual-identity");
    const result = await extractVisualIdentityTool.execute!({ brandId: BRAND_ID, homepageUrl: "https://example.com" }, {} as never) as { merged: boolean };
    expect(result.merged).toBe(true);
  });

  it("throws when Supabase update fails", async () => {
    mockUpdateEq.mockResolvedValue({ error: { message: "DB error" } });
    mockUpdate.mockReturnValue({ eq: mockUpdateEq });
    mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });
    const { extractVisualIdentityTool } = await import("./visual-identity");
    await expect(
      extractVisualIdentityTool.execute!({ brandId: BRAND_ID, homepageUrl: "https://example.com" }, {} as never)
    ).rejects.toThrow("Failed to merge visual identity: DB error");
  });
});

describe("uploadToCloudinary", () => {
  function sink(): Writable {
    return new Writable({ write(_chunk, _enc, cb) { cb(); } });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "test-cloud");
    vi.stubEnv("CLOUDINARY_API_KEY", "test-key");
    vi.stubEnv("CLOUDINARY_API_SECRET", "test-secret");
  });

  it("streams the buffer and resolves with secure_url on success", async () => {
    mockUploadStream.mockImplementation((_options, callback) => {
      const stream = sink();
      stream.on("finish", () => callback(null, { secure_url: "https://res.cloudinary.com/x/homepage.png" }));
      return stream;
    });
    const { uploadToCloudinary } = await import("./visual-identity");
    const url = await uploadToCloudinary(Buffer.from("fake-image-bytes"), BRAND_ID);
    expect(url).toBe("https://res.cloudinary.com/x/homepage.png");
    expect(mockUploadStream).toHaveBeenCalledWith(
      expect.objectContaining({ public_id: `brands/${BRAND_ID}/screenshots/homepage` }),
      expect.any(Function),
    );
  });

  it("logs and returns null when the upload errors", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockUploadStream.mockImplementation((_options, callback) => {
      const stream = sink();
      stream.on("finish", () => callback(new Error("cloudinary boom"), undefined));
      return stream;
    });
    const { uploadToCloudinary } = await import("./visual-identity");
    const url = await uploadToCloudinary(Buffer.from("fake-image-bytes"), BRAND_ID);
    expect(url).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      "visual-identity: Cloudinary upload failed:",
      expect.any(Error),
    );
    errorSpy.mockRestore();
  });
});

describe("visual-identity model wiring (IPI-358 A6 — Groq cutover guard)", () => {
  afterEach(restoreBaseEnvStubs);

  it("does not throw when AI_PROVIDER=groq and GROQ_MODEL_VISION/GROQ_API_KEY are both unset", async () => {
    // If visual-identity.ts ever regresses to a bare resolveModel() (no "vision" tier),
    // this would attempt the Groq path and throw "GROQ_API_KEY is required" at import time.
    vi.stubEnv("AI_PROVIDER", "groq");
    vi.resetModules();
    await expect(import("./visual-identity")).resolves.toBeDefined();
  });
});
