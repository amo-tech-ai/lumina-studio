// @vitest-environment jsdom
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

vi.mock("@copilotkit/react-core/v2/styles.css", () => ({}));

const copilotKitMock = vi.fn(({ children }: { children: ReactNode }) => (
  <div data-testid="copilot-kit">{children}</div>
));

vi.mock("@copilotkit/react-core/v2", () => ({
  CopilotKit: (props: { children: ReactNode }) => copilotKitMock(props),
  CopilotPopup: () => <div data-testid="copilot-popup" />,
  useFrontendTool: vi.fn(),
  useConfigureSuggestions: vi.fn(),
  useDefaultRenderTool: vi.fn(),
}));

describe("MarketingChat — feature flag behavior", () => {
  beforeEach(() => {
    vi.resetModules();
    copilotKitMock.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("does not mount CopilotKit when NEXT_PUBLIC_MARKETING_CHAT_ENABLED is false", async () => {
    vi.stubEnv("NEXT_PUBLIC_MARKETING_CHAT_ENABLED", "false");
    const { MarketingChat } = await import("./marketing-chat");

    const { container } = render(<MarketingChat />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
    expect(copilotKitMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("copilot-kit")).toBeNull();
  });

  it("mounts CopilotKit when NEXT_PUBLIC_MARKETING_CHAT_ENABLED is true", async () => {
    vi.stubEnv("NEXT_PUBLIC_MARKETING_CHAT_ENABLED", "true");
    const { MarketingChat } = await import("./marketing-chat");

    render(<MarketingChat />);

    await waitFor(() => {
      expect(screen.getByTestId("copilot-kit")).toBeTruthy();
    });
    expect(copilotKitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        runtimeUrl: "/api/marketing-chat",
        enableInspector: false,
        showDevConsole: false,
        useSingleEndpoint: true,
      }),
    );
    expect(screen.getByTestId("copilot-popup")).toBeTruthy();
  });
});

describe("MarketingChat — error boundary behavior", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_MARKETING_CHAT_ENABLED", "true");
    copilotKitMock.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("renders the mailto fallback when CopilotKit throws during render", async () => {
    copilotKitMock.mockImplementation(() => {
      throw new Error("runtime sync failed");
    });

    const { MarketingChat } = await import("./marketing-chat");

    render(<MarketingChat />);

    await waitFor(() => {
      expect(screen.getByTestId("chat-error-fallback")).toBeTruthy();
    });
    expect(screen.getByText(/Chat is temporarily unavailable/i)).toBeTruthy();
    const mailto = screen.getByRole("link", { name: /email us/i });
    expect(mailto.getAttribute("href")).toBe("mailto:hello@fashionos.co");
  });
});
