// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

// Mock every CSS module the tree imports (EntityList + composed atoms).
vi.mock("./entity-list.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("./empty-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("./error-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));

import { EntityList } from "./entity-list";

type Row = { id: string; name: string };
const ITEMS: Row[] = [
  { id: "1", name: "Acme Co" },
  { id: "2", name: "Globex" },
];
const renderRow = (r: Row) => <span data-testid="row">{r.name}</span>;

afterEach(() => cleanup());

describe("EntityList", () => {
  it("renders a row per item via renderRow", () => {
    render(<EntityList items={ITEMS} renderRow={renderRow} emptyLabel="No companies yet" />);
    expect(screen.getAllByTestId("row")).toHaveLength(2);
    expect(screen.getByText("Acme Co")).toBeDefined();
    expect(screen.getByRole("list")).toBeDefined();
  });

  it("shows the EmptyState with emptyLabel when there is no data", () => {
    render(<EntityList items={[]} renderRow={renderRow} emptyLabel="No companies yet" />);
    expect(screen.getByTestId("empty-state")).toBeDefined();
    expect(screen.getByText("No companies yet")).toBeDefined();
  });

  it("shows a no-match empty state when a search yields nothing", () => {
    render(
      <EntityList
        items={[]}
        renderRow={renderRow}
        emptyLabel="No companies yet"
        searchPlaceholder="Search companies…"
        searchValue="zzz"
        onSearchChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/No matches for/)).toBeDefined();
    expect(screen.queryByText("No companies yet")).toBeNull();
  });

  it("uses a caller-supplied noMatchLabel instead of the default copy", () => {
    render(
      <EntityList
        items={[]}
        renderRow={renderRow}
        emptyLabel="No companies yet"
        searchPlaceholder="Search companies…"
        searchValue="zzz"
        onSearchChange={vi.fn()}
        noMatchLabel={(q) => `Nothing found for ${q}`}
      />,
    );
    expect(screen.getByText("Nothing found for zzz")).toBeDefined();
  });

  it("shows skeletons while loading (no rows, no empty state)", () => {
    render(<EntityList items={[]} renderRow={renderRow} emptyLabel="x" loading />);
    expect(screen.getByTestId("entity-list-loading")).toBeDefined();
    expect(screen.queryByTestId("row")).toBeNull();
    expect(screen.queryByTestId("empty-state")).toBeNull();
  });

  it("loading wins over rendered rows when items are already present", () => {
    render(<EntityList items={ITEMS} renderRow={renderRow} emptyLabel="x" loading />);
    expect(screen.getByTestId("entity-list-loading")).toBeDefined();
    expect(screen.queryByTestId("row")).toBeNull();
    expect(screen.queryByTestId("empty-state")).toBeNull();
  });

  it("announces loading to assistive tech outside the aria-hidden skeleton", () => {
    render(<EntityList items={[]} renderRow={renderRow} emptyLabel="x" loading />);
    expect(screen.getByRole("status").textContent).toBe("Loading…");
  });

  it("shows the ErrorState with a working retry, replacing the list and search", () => {
    const onRetry = vi.fn();
    render(
      <EntityList
        items={ITEMS}
        renderRow={renderRow}
        emptyLabel="x"
        error="Unable to load companies."
        onRetry={onRetry}
        searchPlaceholder="Search…"
        searchValue=""
        onSearchChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(screen.queryByTestId("row")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders a controlled search row only when searchPlaceholder is set", () => {
    const onSearchChange = vi.fn();
    const { rerender } = render(
      <EntityList items={ITEMS} renderRow={renderRow} emptyLabel="x" />,
    );
    expect(screen.queryByRole("searchbox")).toBeNull();

    rerender(
      <EntityList
        items={ITEMS}
        renderRow={renderRow}
        emptyLabel="x"
        searchPlaceholder="Search companies…"
        searchValue=""
        onSearchChange={onSearchChange}
      />,
    );
    const box = screen.getByRole("searchbox");
    expect(box.getAttribute("placeholder")).toBe("Search companies…");
    fireEvent.change(box, { target: { value: "acme" } });
    expect(onSearchChange).toHaveBeenCalledWith("acme");
  });
});
