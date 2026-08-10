import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { middleware } from "./middleware";

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: vi.fn(),
}));

const mockCf = vi.mocked(getCloudflareContext);

const TEST_VERSION_ID = "test-worker-version-id-abc123";

function mockVersionContext(versionId: string | null) {
  mockCf.mockReturnValue({
    env: {
      WORKER_VERSION_METADATA: versionId ? { id: versionId } : undefined,
    },
  } as never);
}

describe("middleware version header with Cloudflare context (IPI-707)", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";
    mockVersionContext(TEST_VERSION_ID);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sets X-iPix-Worker-Version on an operator surface when Cloudflare version metadata exists", async () => {
    const request = new NextRequest("http://localhost:3000/app");
    const response = await middleware(request);
    expect(response.headers.get("x-ipix-worker-version")).toBe(TEST_VERSION_ID);
  });

  it("does not set X-iPix-Worker-Version on a public route even with Cloudflare context", async () => {
    const request = new NextRequest("http://localhost:3000/");
    const response = await middleware(request);
    expect(response.headers.get("x-ipix-worker-version")).toBeNull();
  });
});
