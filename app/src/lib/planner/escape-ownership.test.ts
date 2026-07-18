/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";

import { isEscapeOwnedByNestedOverlay } from "./escape-ownership";

afterEach(() => {
  document.body.innerHTML = "";
  (document.activeElement as HTMLElement | null)?.blur?.();
});

describe("isEscapeOwnedByNestedOverlay", () => {
  it("returns false when nothing is focused", () => {
    expect(isEscapeOwnedByNestedOverlay()).toBe(false);
  });

  it("returns false when the focused element is outside any overlay", () => {
    const button = document.createElement("button");
    document.body.appendChild(button);
    button.focus();

    expect(document.activeElement).toBe(button);
    expect(isEscapeOwnedByNestedOverlay()).toBe(false);
  });

  it('returns true when the focused element is inside a role="dialog" descendant', () => {
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    const input = document.createElement("input");
    dialog.appendChild(input);
    document.body.appendChild(dialog);
    input.focus();

    expect(isEscapeOwnedByNestedOverlay()).toBe(true);
  });

  it('returns true when the focused element is inside a role="menu" descendant', () => {
    const menu = document.createElement("div");
    menu.setAttribute("role", "menu");
    const item = document.createElement("div");
    item.setAttribute("tabindex", "-1");
    menu.appendChild(item);
    document.body.appendChild(menu);
    item.focus();

    expect(isEscapeOwnedByNestedOverlay()).toBe(true);
  });
});
