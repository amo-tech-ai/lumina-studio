// @vitest-environment jsdom
// IPI-924 · AGENT-RAG-001 — SimilarBrandsSection calls GET /api/brands/[id]/similar
// and covers every response state: loading, no embedding, matches, no matches, error.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("./brand-detail.module.css", () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import { SimilarBrandsSection } from "./similar-brands-section";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function stubFetch(body: unknown, init?: { status?: number }) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(body), {
      status: init?.status ?? 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

describe("SimilarBrandsSection", () => {
  it("shows the empty-embedding state when the route reports no_embedding", async () => {
    stubFetch({ data: [], reason: "no_embedding" });
    render(<SimilarBrandsSection brandId="b1" />);
    expect(await screen.findByText(/once this brand has an AI embedding/i)).toBeTruthy();
  });

  it("renders similar brands with similarity and shared-node chips", async () => {
    stubFetch({
      data: [
        {
          brand_id: "b2",
          brand_name: "Acme Denim",
          similarity: 0.91,
          shared_nodes: ["sustainable-denim", "minimalist"],
        },
        {
          brand_id: "b3",
          brand_name: "Nova Basics",
          similarity: 0.74,
          shared_nodes: ["minimalist"],
        },
      ],
    });
    render(<SimilarBrandsSection brandId="b1" />);

    const link = (await screen.findByRole("link", { name: "Acme Denim" })) as HTMLAnchorElement;
    expect(link.href).toContain("/app/brand/b2");
    expect(screen.getByText("91% similar")).toBeTruthy();
    expect(screen.getByText("74% similar")).toBeTruthy();
    expect(screen.getByText("sustainable-denim")).toBeTruthy();
  });

  it("shows a no-matches message when the list is empty", async () => {
    stubFetch({ data: [] });
    render(<SimilarBrandsSection brandId="b1" />);
    expect(await screen.findByText(/No similar brands in your workspace yet/i)).toBeTruthy();
  });

  it("shows a graceful error message on non-200 responses", async () => {
    stubFetch({ error: { code: "INTERNAL_ERROR" } }, { status: 500 });
    render(<SimilarBrandsSection brandId="b1" />);
    expect(await screen.findByText(/Couldn't load similar brands/i)).toBeTruthy();
  });

  it("shows a graceful error message when fetch rejects", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    render(<SimilarBrandsSection brandId="b1" />);
    expect(await screen.findByText(/Couldn't load similar brands/i)).toBeTruthy();
  });

  it("clears the previous brand's results immediately when brandId changes", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [{ brand_id: "b2", brand_name: "Acme Denim", similarity: 0.91, shared_nodes: [] }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const { rerender } = render(<SimilarBrandsSection brandId="b1" />);
    expect(await screen.findByText("Acme Denim")).toBeTruthy();

    // Next fetch (for the new brand) deliberately never resolves — old results must
    // be gone before it completes, otherwise users see the wrong brand's matches.
    fetchSpy.mockReturnValueOnce(new Promise(() => {}));
    rerender(<SimilarBrandsSection brandId="b3" />);

    expect(screen.queryByText("Acme Denim")).toBeNull();
    expect(screen.getByText(/Finding similar brands/i)).toBeTruthy();
  });
});
