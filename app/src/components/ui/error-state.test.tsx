// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

vi.mock("./error-state.module.css", () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

import { ErrorState } from "./error-state";

afterEach(() => cleanup());

describe("ErrorState", () => {
  it("renders as an alert with a default title and the message", () => {
    render(<ErrorState message="Unable to load companies." />);
    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText("Something went wrong")).toBeDefined();
    expect(screen.getByText("Unable to load companies.")).toBeDefined();
  });

  it("shows the retry button only when onRetry is provided and calls it on click", () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Boom" onRetry={onRetry} />);
    const btn = screen.getByRole("button", { name: "Try again" });
    fireEvent.click(btn);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("omits the retry button when onRetry is absent", () => {
    render(<ErrorState message="Boom" />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
