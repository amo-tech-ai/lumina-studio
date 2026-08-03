// @vitest-environment jsdom
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

vi.mock("@copilotkit/react-core/v2/styles.css", () => ({}));

const copilotKitMock = vi.fn(
  ({ children }: { children: ReactNode; headers?: Record<string, string> }) => (
    <div data-testid="copilot-kit">{children}</div>
  ),
);

vi.mock("@copilotkit/react-core/v2", () => ({
  CopilotKit: (props: {
    children: ReactNode;
    headers?: Record<string, string>;
  }) => copilotKitMock(props),
}));

vi.mock("@/components/operator-panel/operator-panel", () => ({
  OperatorPanel: ({ children }: { children: ReactNode }) => (
    <div data-testid="operator-panel">{children}</div>
  ),
}));

vi.mock("@/context/active-brand-context", () => ({
  ActiveBrandProvider: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));

const getSession = vi.fn();
const onAuthStateChange = vi.fn();
const unsubscribe = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      getSession,
      onAuthStateChange,
    },
  }),
}));

describe("AuthenticatedCopilotProvider", () => {
  beforeEach(() => {
    vi.resetModules();
    copilotKitMock.mockClear();
    getSession.mockReset();
    onAuthStateChange.mockReset();
    unsubscribe.mockReset();
    onAuthStateChange.mockImplementation(() => ({
      data: { subscription: { unsubscribe } },
    }));
  });

  afterEach(() => {
    cleanup();
  });

  it("does not mount CopilotKit while session is hydrating", async () => {
    getSession.mockReturnValue(new Promise(() => {}));
    const { AuthenticatedCopilotProvider } = await import(
      "./authenticated-copilot-provider"
    );

    render(
      <AuthenticatedCopilotProvider>
        <span>workspace</span>
      </AuthenticatedCopilotProvider>,
    );

    expect(screen.getByTestId("copilot-auth-loading")).toBeTruthy();
    expect(copilotKitMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("copilot-kit")).toBeNull();
  });

  it("mounts CopilotKit with Authorization Bearer after session is ready", async () => {
    getSession.mockResolvedValue({
      data: { session: { access_token: "test-access-token" } },
      error: null,
    });
    const { AuthenticatedCopilotProvider } = await import(
      "./authenticated-copilot-provider"
    );

    render(
      <AuthenticatedCopilotProvider>
        <span>workspace</span>
      </AuthenticatedCopilotProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("copilot-kit")).toBeTruthy();
    });

    expect(copilotKitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        runtimeUrl: "/api/copilotkit",
        useSingleEndpoint: false,
        enableInspector: false,
        showDevConsole: false,
        headers: { Authorization: "Bearer test-access-token" },
      }),
    );
    expect(screen.getByTestId("operator-panel")).toBeTruthy();
    expect(screen.getByText("workspace")).toBeTruthy();
  });

  it("does not mount CopilotKit when signed out (no premature /info)", async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    onAuthStateChange.mockImplementation(
      (cb: (event: string, session: null) => void) => {
        queueMicrotask(() => cb("SIGNED_OUT", null));
        return { data: { subscription: { unsubscribe } } };
      },
    );

    const { AuthenticatedCopilotProvider } = await import(
      "./authenticated-copilot-provider"
    );

    render(
      <AuthenticatedCopilotProvider>
        <span>workspace</span>
      </AuthenticatedCopilotProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("copilot-auth-signed-out")).toBeTruthy();
    });
    expect(copilotKitMock).not.toHaveBeenCalled();
    expect(screen.queryByText("workspace")).toBeNull();
    expect(
      screen.getByRole("link", { name: /sign in/i }).getAttribute("href"),
    ).toBe("/login");
  });

  it("updates Authorization header on TOKEN_REFRESHED without logging the token", async () => {
    let authCb: ((event: string, session: { access_token: string } | null) => void) |
      null = null;
    getSession.mockResolvedValue({
      data: { session: { access_token: "token-v1" } },
      error: null,
    });
    onAuthStateChange.mockImplementation((cb) => {
      authCb = cb;
      return { data: { subscription: { unsubscribe } } };
    });

    const { AuthenticatedCopilotProvider } = await import(
      "./authenticated-copilot-provider"
    );

    render(
      <AuthenticatedCopilotProvider>
        <span>workspace</span>
      </AuthenticatedCopilotProvider>,
    );

    await waitFor(() => {
      expect(copilotKitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: { Authorization: "Bearer token-v1" },
        }),
      );
    });

    authCb?.("TOKEN_REFRESHED", { access_token: "token-v2" });

    await waitFor(() => {
      expect(copilotKitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: { Authorization: "Bearer token-v2" },
        }),
      );
    });

    // Guard: test UI must not dump raw JWT into DOM text nodes.
    expect(document.body.textContent).not.toContain("token-v2");
  });
});
