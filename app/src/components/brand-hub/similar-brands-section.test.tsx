// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("./brand-detail.module.css", () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

import { SimilarBrandsSection } from "./similar-brands-section";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("SimilarBrandsSection", () => {
  it("calls the server route and renders similarity plus shared-node chips", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        similar: [
          {
            brand_id: "22222222-2222-2222-2222-222222222222",
            brand_name: "Reformation",
            similarity: 0.87,
            shared_nodes: [{ node_type: "category", label: "sustainable fashion" }],
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<SimilarBrandsSection brandId="11111111-1111-1111-1111-111111111111" />);
    fireEvent.click(screen.getByRole("button", { name: "Find similar brands" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/brand/11111111-1111-1111-1111-111111111111/similar",
        { method: "GET", credentials: "same-origin" },
      );
    });

    expect(await screen.findByText(/Reformation/)).toBeTruthy();
    expect(screen.getByText(/87% similar/)).toBeTruthy();
    expect(screen.getByText("sustainable fashion")).toBeTruthy();
  });

  it("renders the no-embeddings state cleanly", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ similar: [], notice: "no-embeddings" }),
      }),
    );

    render(<SimilarBrandsSection brandId="11111111-1111-1111-1111-111111111111" />);
    fireEvent.click(screen.getByRole("button", { name: "Find similar brands" }));

    expect(await screen.findByText(/No brand embeddings are available yet/i)).toBeTruthy();
  });

  it("renders a retryable error state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Internal error" }),
      }),
    );

    render(<SimilarBrandsSection brandId="11111111-1111-1111-1111-111111111111" />);
    fireEvent.click(screen.getByRole("button", { name: "Find similar brands" }));

    expect((await screen.findByRole("alert")).textContent).toMatch(/could not be loaded/i);
  });
});