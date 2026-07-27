// @vitest-environment jsdom
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

import { OnboardingFlow } from "./onboarding-flow";
import { LAST_SCREEN, MARKETING_SCREENS } from "@/lib/onboarding/navigation";
import type { OnboardingHistoryState } from "@/lib/onboarding/use-screen-history";

// IPI-833 · ONB2-UI-001 — standalone onboarding UI.

const SRC = resolve(process.cwd(), "src");
const HERE = resolve(SRC, "components/onboarding");
const ONBOARDING_ROUTE = resolve(SRC, "app/(onboarding)");
const TOKENS = resolve(SRC, "styles/tokens.css");

/** Third-party brand marks legitimately carry brand hex. Everything else must not. */
const HEX_ALLOWLIST = new Set(["sales-channels.data.ts"]);

function sourceFilesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) return sourceFilesUnder(full);
    return /\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [full] : [];
  });
}

const SOURCE_FILES = [...sourceFilesUnder(HERE), ...sourceFilesUnder(ONBOARDING_ROUTE)];

function codeWithoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

function renderAt(node: React.ReactElement) {
  window.history.replaceState(null, "", "/onboarding");
  return render(node);
}

const historyState = (
  onboardingScreen: number,
  onboardingDepth: number,
): OnboardingHistoryState => ({ onboardingScreen, onboardingDepth });

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  window.history.replaceState(null, "", "/onboarding");
});

describe("every screen renders", () => {
  it("renders all 13 screens without throwing", () => {
    for (let s = 1; s <= LAST_SCREEN; s += 1) {
      const { unmount } = renderAt(<OnboardingFlow initialScreen={s} />);
      expect(screen.getByTestId(`onboarding-screen-${s}`), `screen ${s}`).toBeTruthy();
      expect(screen.getByTestId("onboarding-card")).toBeTruthy();
      unmount();
    }
  });

  it("shows the step count on every screen", () => {
    render(<OnboardingFlow initialScreen={7} />);
    expect(screen.getByText(/7 \/ 13/)).toBeTruthy();
  });
});

describe("the seven marketing screens are distinct", () => {
  it("renders a different body component on each marketing screen", () => {
    const seen = new Set<string>();

    for (const s of MARKETING_SCREENS) {
      const { unmount } = renderAt(<OnboardingFlow initialScreen={s} />);
      const region = screen.getByTestId(`onboarding-screen-${s}`);
      const body = within(region)
        .getByTestId(/^marketing-body-/)
        .getAttribute("data-testid");
      expect(body, `screen ${s} has no marketing body`).toBeTruthy();
      seen.add(body as string);
      unmount();
    }

    expect(seen.size, `expected 7 distinct bodies, saw ${[...seen].join(", ")}`).toBe(7);
  });
});

describe("Continue is really disabled, not just styled", () => {
  it("disables Continue on each question screen until it is answered", () => {
    const cases = [
      { screen: 2, answer: () => fireEvent.click(screen.getByTestId("build-option-fashion")) },
      {
        screen: 4,
        answer: () =>
          fireEvent.change(screen.getByLabelText(/brand name/i), {
            target: { value: "Maison Noir" },
          }),
      },
      { screen: 5, answer: () => fireEvent.click(screen.getByTestId("channel-shopify")) },
      { screen: 7, answer: () => fireEvent.click(screen.getByTestId("grow-option-social")) },
    ];

    for (const { screen: s, answer } of cases) {
      const { unmount } = renderAt(<OnboardingFlow initialScreen={s} />);
      const cta = screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement;
      expect(cta.disabled, `screen ${s} should start disabled`).toBe(true);
      answer();
      expect(cta.disabled, `screen ${s} should release after answering`).toBe(false);
      unmount();
    }
  });

  it("never disables Continue on a marketing screen", () => {
    for (const s of MARKETING_SCREENS) {
      const { unmount } = renderAt(<OnboardingFlow initialScreen={s} />);
      const cta = screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement;
      expect(cta.disabled, `screen ${s}`).toBe(false);
      unmount();
    }
  });

  it("clears invalid question values when Skip advances", () => {
    renderAt(<OnboardingFlow initialScreen={4} />);
    fireEvent.change(screen.getByLabelText(/brand name/i), {
      target: { value: "Maison Noir" },
    });
    fireEvent.change(screen.getByLabelText(/website/i), {
      target: { value: "not-a-url" },
    });

    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    expect(screen.getByTestId("onboarding-screen-5")).toBeTruthy();

    fireEvent.popState(window, { state: historyState(4, 0) });
    expect((screen.getByLabelText(/brand name/i) as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText(/website/i) as HTMLInputElement).value).toBe("");
  });
});

describe("no operator chrome", () => {
  it("renders none of the verified three-panel shell markers", () => {
    const { container } = render(<OnboardingFlow initialScreen={1} />);
    expect(screen.queryByRole("navigation", { name: "App navigation" })).toBeNull();
    expect(screen.queryByTestId("intelligence-panel")).toBeNull();
    expect(screen.queryByTestId("operator-chat-dock")).toBeNull();
    expect(container.querySelector("[data-agent-id]")).toBeNull();
    expect(container.querySelector("nav")).toBeNull();
  });
});

describe("browser history", () => {
  it("replaces rather than pushes the first entry", () => {
    const pushSpy = vi.spyOn(window.history, "pushState");
    render(<OnboardingFlow initialScreen={3} />);
    expect(pushSpy).not.toHaveBeenCalled();
    expect(window.location.hash).toBe("#3");
    pushSpy.mockRestore();
  });

  it("pushes one entry per user-driven transition", () => {
    render(<OnboardingFlow initialScreen={1} />);
    const pushSpy = vi.spyOn(window.history, "pushState");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(pushSpy).toHaveBeenCalledTimes(1);
    pushSpy.mockRestore();
  });

  it("moves back on popstate and preserves typed answers", () => {
    render(<OnboardingFlow initialScreen={4} />);
    fireEvent.change(screen.getByLabelText(/brand name/i), {
      target: { value: "Maison Noir" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByTestId("onboarding-screen-5")).toBeTruthy();

    fireEvent.popState(window, { state: historyState(4, 0) });

    expect(screen.getByTestId("onboarding-screen-4")).toBeTruthy();
    expect((screen.getByLabelText(/brand name/i) as HTMLInputElement).value).toBe("Maison Noir");
  });

  it("moves forward on popstate and still preserves answers", () => {
    render(<OnboardingFlow initialScreen={4} />);
    fireEvent.change(screen.getByLabelText(/brand name/i), {
      target: { value: "Atelier Sud" },
    });
    fireEvent.popState(window, { state: historyState(6, 1) });
    expect(screen.getByTestId("onboarding-screen-6")).toBeTruthy();

    fireEvent.popState(window, { state: historyState(4, 0) });
    expect((screen.getByLabelText(/brand name/i) as HTMLInputElement).value).toBe("Atelier Sud");
  });

  it("does not grow the history stack while handling popstate", () => {
    render(<OnboardingFlow initialScreen={5} />);
    const pushSpy = vi.spyOn(window.history, "pushState");
    fireEvent.popState(window, { state: historyState(4, 0) });
    expect(pushSpy).not.toHaveBeenCalled();
    pushSpy.mockRestore();
  });

  it("clamps a hostile hash instead of rendering an invalid screen", () => {
    window.history.replaceState(null, "", "/onboarding#999");
    render(<OnboardingFlow />);
    expect(screen.getByTestId("onboarding-screen-13")).toBeTruthy();
  });
});

describe("accessibility", () => {
  it("moves focus to the new screen heading after a transition", () => {
    render(<OnboardingFlow initialScreen={1} />);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    const heading = within(screen.getByTestId("onboarding-screen-2")).getByRole("heading", {
      level: 1,
    });
    expect(document.activeElement).toBe(heading);
  });

  it("does not steal focus on first paint, including StrictMode's repeated effect", () => {
    render(
      <StrictMode>
        <OnboardingFlow initialScreen={1} />
      </StrictMode>,
    );
    expect(document.activeElement).toBe(document.body);
  });

  it("uses native radios with stable answer IDs", () => {
    renderAt(<OnboardingFlow initialScreen={2} />);
    const build = screen.getByRole("radio", { name: "Fashion brand" }) as HTMLInputElement;
    expect(build.value).toBe("fashion");
    fireEvent.click(build);
    expect(build.checked).toBe(true);

    cleanup();
    renderAt(<OnboardingFlow initialScreen={7} />);
    const growth = screen.getByRole("radio", { name: "Social media" }) as HTMLInputElement;
    expect(growth.value).toBe("social");
    fireEvent.click(growth);
    expect(growth.checked).toBe(true);
  });

  it("keeps the growth affirmation live region mounted", () => {
    renderAt(<OnboardingFlow initialScreen={7} />);
    const region = screen.getByTestId("grow-affirmation");
    expect(region.textContent).toBe("");
    fireEvent.click(screen.getByTestId("grow-option-social"));
    expect(region.textContent).toMatch(/social posts/i);
  });

  it("labels every field on the question screens", () => {
    render(<OnboardingFlow initialScreen={4} />);
    expect(screen.getByLabelText(/brand name/i)).toBeTruthy();
    expect(screen.getByLabelText(/website/i)).toBeTruthy();

    cleanup();
    renderAt(<OnboardingFlow initialScreen={5} />);
    expect(screen.getByLabelText("Shopify")).toBeTruthy();
    expect(screen.getByLabelText("Instagram")).toBeTruthy();
  });

  it("gives Back and Skip accessible names", () => {
    render(<OnboardingFlow initialScreen={5} />);
    expect(screen.getByRole("button", { name: /go back/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /skip/i })).toBeTruthy();
  });

  it("describes an invalid website with aria-describedby", () => {
    render(<OnboardingFlow initialScreen={4} />);
    const url = screen.getByLabelText(/website/i);
    fireEvent.change(url, { target: { value: "not-a-url" } });
    const describedBy = url.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)?.textContent).toMatch(/valid url/i);
  });

  it("announces setup status politely on the analysis screen", () => {
    render(<OnboardingFlow initialScreen={12} />);
    const status = screen.getByTestId("analysis-status");
    expect(status.getAttribute("aria-live")).toBe("polite");
  });

  it("hides Back while setup is running", () => {
    render(<OnboardingFlow initialScreen={12} />);
    expect(screen.queryByRole("button", { name: /go back/i })).toBeNull();
  });
});

describe("automatic completion does not trap the user", () => {
  it("replaces rather than pushes when the analysis screen completes", () => {
    vi.useFakeTimers();
    try {
      renderAt(<OnboardingFlow initialScreen={12} />);
      const pushSpy = vi.spyOn(window.history, "pushState");
      const replaceSpy = vi.spyOn(window.history, "replaceState");

      act(() => {
        vi.advanceTimersByTime(40 * 110);
      });
      act(() => {
        vi.advanceTimersByTime(700);
      });

      expect(screen.getByTestId("onboarding-screen-13")).toBeTruthy();
      expect(pushSpy, "auto-completion must not add a history entry").not.toHaveBeenCalled();
      expect(replaceSpy).toHaveBeenCalled();
      pushSpy.mockRestore();
      replaceSpy.mockRestore();
    } finally {
      vi.useRealTimers();
    }
  });

  it("leaves the loader out of history so Back skips past it", () => {
    vi.useFakeTimers();
    try {
      renderAt(<OnboardingFlow initialScreen={11} />);
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      });
      expect(screen.getByTestId("onboarding-screen-12")).toBeTruthy();

      act(() => {
        vi.advanceTimersByTime(40 * 110);
      });
      act(() => {
        vi.advanceTimersByTime(700);
      });
      expect(screen.getByTestId("onboarding-screen-13")).toBeTruthy();

      act(() => {
        fireEvent.popState(window, { state: historyState(11, 0) });
      });
      expect(screen.getByTestId("onboarding-screen-11")).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("no fabricated results", () => {
  it("never renders the design comp's hardcoded crawl summary", () => {
    render(<OnboardingFlow initialScreen={4} />);
    fireEvent.change(screen.getByLabelText(/website/i), {
      target: { value: "https://maisonnoir.com" },
    });
    expect(screen.getByTestId("url-echo").textContent).toContain("maisonnoir.com");
    expect(document.body.textContent).not.toContain("47 pages found");
  });

  it("contains no invented crawl result anywhere in the source", () => {
    for (const file of SOURCE_FILES) {
      const src = codeWithoutComments(readFileSync(file, "utf8"));
      expect(src, file).not.toMatch(/pages found/i);
    }
  });
});

describe("design tokens", () => {
  it("uses no raw hex colours outside the documented brand-mark file", () => {
    for (const file of SOURCE_FILES) {
      if (HEX_ALLOWLIST.has(file.split("/").pop() as string)) continue;
      const src = readFileSync(file, "utf8");
      const hexes = src.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
      expect(hexes, `${file} should resolve colours through tokens.css`).toEqual([]);
    }
  });

  it("never puts the tint ink on the solid accent", () => {
    for (const file of SOURCE_FILES) {
      const src = readFileSync(file, "utf8");
      const offenders = (src.match(/class[nN]ame="[^"]*"/g) ?? []).filter(
        (cls) =>
          cls.includes("bg-[var(--onboarding-accent)]") &&
          cls.includes("text-[var(--onboarding-accent-ink)]"),
      );
      expect(offenders, `${file} pairs tint ink with the solid accent`).toEqual([]);
    }
  });

  it("defines a dedicated ink for the solid accent", () => {
    const tokens = readFileSync(TOKENS, "utf8");
    expect(tokens).toContain("--onboarding-on-accent");
  });

  it("scopes a real font instead of inheriting Arial from globals.css", () => {
    const routeEntry = readFileSync(resolve(ONBOARDING_ROUTE, "onboarding/page.tsx"), "utf8");
    expect(routeEntry).toMatch(/\bonboarding\b/);
    expect(routeEntry).toContain("onboarding.css");

    const css = codeWithoutComments(
      readFileSync(resolve(ONBOARDING_ROUTE, "onboarding.css"), "utf8"),
    );
    expect(css).not.toMatch(/Arial|Helvetica/);
    expect(css).toMatch(/\.onboarding\s*\{/);
    expect(css).toMatch(/\.onboarding\s+h1/);
  });

  it("uses the AGENTS.md brand fonts, not the comp's Inter", () => {
    const css = codeWithoutComments(
      readFileSync(resolve(ONBOARDING_ROUTE, "onboarding.css"), "utf8"),
    );
    expect(css).toContain("var(--font-outfit)");
    expect(css).toContain("var(--font-cormorant)");
    expect(css).not.toMatch(/\bInter\b|\bRoboto\b/);

    const rootLayout = readFileSync(resolve(SRC, "app/layout.tsx"), "utf8");
    expect(rootLayout).toContain("--font-outfit");
    expect(rootLayout).toContain("--font-cormorant");
    const routeEntry = codeWithoutComments(
      readFileSync(resolve(ONBOARDING_ROUTE, "onboarding/page.tsx"), "utf8"),
    );
    expect(routeEntry, "the route must not load a second font").not.toContain("next/font");
  });

  it("makes the step indicator visible against the black shell", () => {
    // `className` on Progress reaches only its root; the filled indicator is
    // hardcoded to bg-primary (near-black). Unstyled, the bar reads as empty at
    // every step because it is black on the black onboarding background.
    renderAt(<OnboardingFlow initialScreen={5} />);
    const bars = screen.getAllByRole("progressbar", { hidden: true });
    expect(bars.length).toBeGreaterThanOrEqual(3);
    for (const bar of bars.slice(0, 3)) {
      expect(
        bar.className,
        "segment fill must be recoloured or it is invisible on the shell",
      ).toContain("[&>*]:bg-[var(--onboarding-accent)]");
    }
  });

  it("stops onboarding animations under reduced motion", () => {
    const tokens = readFileSync(TOKENS, "utf8");
    const reducedMotionBlock = tokens.slice(tokens.indexOf("@media (prefers-reduced-motion"));
    for (const cls of ["onb-float", "onb-pulse", "onb-slide", "onb-blink"]) {
      expect(reducedMotionBlock, `${cls} must be disabled`).toContain(`.${cls}`);
    }
  });

  it("only uses animation classes that reduced motion disables", () => {
    const tokens = readFileSync(TOKENS, "utf8");
    const reducedMotionBlock = tokens.slice(tokens.indexOf("@media (prefers-reduced-motion"));
    for (const file of SOURCE_FILES) {
      const used = readFileSync(file, "utf8").match(/onb-(float|pulse|slide|blink)/g) ?? [];
      for (const cls of used) {
        expect(reducedMotionBlock, `${cls} used in ${file} but not disabled`).toContain(cls);
      }
    }
  });
});
