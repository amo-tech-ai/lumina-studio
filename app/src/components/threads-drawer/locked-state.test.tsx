// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { ThreadsPanelGate } from "./locked-state";

describe("ThreadsPanelGate — feature flag behavior", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_COPILOTKIT_THREADS_ENABLED", "false");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it("renders the locked panel when threads are disabled", () => {
    render(
      <ThreadsPanelGate>
        <div data-testid="threads-content">Threads</div>
      </ThreadsPanelGate>,
    );

    expect(screen.getByLabelText(/threads \(locked\)/i)).toBeTruthy();
    expect(screen.getByText(/licensed feature/i)).toBeTruthy();
    expect(screen.queryByTestId("threads-content")).toBeNull();
  });

  it("does not render children when threads are disabled", () => {
    render(
      <ThreadsPanelGate>
        <div data-testid="threads-content">Threads</div>
      </ThreadsPanelGate>,
    );

    expect(screen.queryByTestId("threads-content")).toBeNull();
  });
});

describe("ThreadsPanelGate — enabled path", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_COPILOTKIT_THREADS_ENABLED", "true");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it("renders children after client mount when threads are enabled", async () => {
    render(
      <ThreadsPanelGate>
        <div data-testid="threads-content">Threads</div>
      </ThreadsPanelGate>,
    );

    expect(await screen.findByTestId("threads-content")).toBeTruthy();
  });
});
