/**
 * CF KaTeX stub — IPI-706 · CF-BUNDLE-220.
 *
 * Aliased under IPIX_CF_BUNDLE_STUBS=1 so CopilotKit → streamdown → katex
 * (~0.25 MiB) stays out of the OpenNext Worker. Math renders as escaped text.
 */
export function render(tex, element, options) {
  if (element && typeof element.textContent !== "undefined") {
    element.textContent = String(tex ?? "");
  }
  return { options };
}

export function renderToString(tex) {
  return `<span data-ipix-katex-stub="1">${escapeHtml(String(tex ?? ""))}</span>`;
}

export function renderToDomTree(tex) {
  return { toMarkup: () => renderToString(tex) };
}

export default {
  render,
  renderToString,
  renderToDomTree,
  version: "0.0.0-ipix-stub",
};

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
