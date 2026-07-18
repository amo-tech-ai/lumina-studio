/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const replace = vi.fn();
let paramsString = "";
let pathname = "/app/planner/i1";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(paramsString),
  usePathname: () => pathname,
  useRouter: () => ({ push, replace }),
}));

import { usePlannerSelection } from "./use-planner-selection";

const TASK_ID = "11111111-1111-1111-1111-111111111111";
const MEMBER_ID = "33333333-3333-3333-3333-333333333333";

beforeEach(() => {
  push.mockClear();
  replace.mockClear();
  paramsString = "";
  pathname = "/app/planner/i1";
});

describe("usePlannerSelection", () => {
  it("parses the selection from the current URL", () => {
    paramsString = `selection=task:${TASK_ID}`;
    const { result } = renderHook(() => usePlannerSelection());
    expect(result.current.selection).toEqual({ type: "task", id: TASK_ID });
  });

  it("is null when no selection param is present", () => {
    paramsString = "skip=1";
    const { result } = renderHook(() => usePlannerSelection());
    expect(result.current.selection).toBeNull();
  });

  it("setSelection builds the right URL and preserves unrelated existing params (e.g. ?skip=), defaulting to push", () => {
    paramsString = "skip=1";
    const { result } = renderHook(() => usePlannerSelection());

    act(() => {
      result.current.setSelection({ type: "task", id: TASK_ID });
    });

    expect(push).toHaveBeenCalledTimes(1);
    const [url, opts] = push.mock.calls[0] as [string, { scroll: boolean }];
    expect(url).toBe(`/app/planner/i1?skip=1&selection=task%3A${TASK_ID}`);
    expect(opts).toEqual({ scroll: false });
    expect(replace).not.toHaveBeenCalled();
  });

  it("setSelection uses replace instead of push when opts.replace is true", () => {
    paramsString = "";
    const { result } = renderHook(() => usePlannerSelection());

    act(() => {
      result.current.setSelection({ type: "member", id: MEMBER_ID }, { replace: true });
    });

    expect(replace).toHaveBeenCalledWith(`/app/planner/i1?selection=member%3A${MEMBER_ID}`, { scroll: false });
    expect(push).not.toHaveBeenCalled();
  });

  it("deletes the `selection` key entirely on null instead of leaving `selection=`", () => {
    paramsString = `selection=task:${TASK_ID}&skip=1`;
    const { result } = renderHook(() => usePlannerSelection());

    act(() => {
      result.current.setSelection(null);
    });

    expect(push).toHaveBeenCalledWith("/app/planner/i1?skip=1", { scroll: false });
  });

  it("deselect() is setSelection(null, opts) and respects the replace option", () => {
    paramsString = `selection=task:${TASK_ID}`;
    const { result } = renderHook(() => usePlannerSelection());

    act(() => {
      result.current.deselect({ replace: true });
    });

    expect(replace).toHaveBeenCalledWith("/app/planner/i1", { scroll: false });
    expect(push).not.toHaveBeenCalled();
  });

  it("drops the query string entirely when no params remain", () => {
    paramsString = `selection=task:${TASK_ID}`;
    const { result } = renderHook(() => usePlannerSelection());

    act(() => {
      result.current.deselect();
    });

    expect(push).toHaveBeenCalledWith("/app/planner/i1", { scroll: false });
  });
});

describe("usePlannerSelection — focus restoration", () => {
  it("restores focus to the captured opener once the selection clears, if it's still connected", () => {
    paramsString = "";
    const { result, rerender } = renderHook(() => usePlannerSelection());

    const opener = document.createElement("button");
    document.body.appendChild(opener);
    opener.focus();
    expect(document.activeElement).toBe(opener);

    // null -> non-null: capture the currently focused element.
    paramsString = `selection=task:${TASK_ID}`;
    rerender();

    // Move focus elsewhere, as the Detail panel would on mount.
    const detailButton = document.createElement("button");
    document.body.appendChild(detailButton);
    detailButton.focus();

    // non-null -> null: restore focus to the captured opener.
    paramsString = "";
    rerender();

    expect(document.activeElement).toBe(opener);
    document.body.innerHTML = "";
    void result;
  });

  it("does nothing if the captured opener is no longer connected to the DOM", () => {
    paramsString = "";
    const { rerender } = renderHook(() => usePlannerSelection());

    const opener = document.createElement("button");
    document.body.appendChild(opener);
    opener.focus();

    paramsString = `selection=task:${TASK_ID}`;
    rerender();

    opener.remove();

    paramsString = "";
    expect(() => rerender()).not.toThrow();

    document.body.innerHTML = "";
  });
});
