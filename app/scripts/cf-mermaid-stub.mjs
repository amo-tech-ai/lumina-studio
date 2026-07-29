/**
 * CF Mermaid stub — IPI-706 · CF-BUNDLE-220.
 *
 * OpenNext/Turbopack aliases `mermaid` here when IPIX_CF_BUNDLE_STUBS=1 so the
 * Worker does not embed mermaid + cytoscape (~2.7 MiB uncompressed inputs) via
 * CopilotKit → streamdown.
 *
 * Ceiling: diagram fenced blocks render as plain <pre><code> (no live SVG).
 * Upgrade: browser CDN load (same pattern as cf-shiki-stub.mjs) if product
 * needs Mermaid in operator/marketing chat markdown.
 */
export async function initialize() {}

export async function render(id, text) {
  const code = String(text ?? "");
  return {
    svg: `<pre data-ipix-mermaid-stub="1"><code>${escapeHtml(code)}</code></pre>`,
    bindFunctions: undefined,
  };
}

export async function renderAsync(id, text) {
  return render(id, text);
}

export async function parse() {
  return { diagramType: "stub" };
}

export function getDiagramFromText() {
  return null;
}

const api = {
  initialize,
  render,
  renderAsync,
  parse,
  getDiagramFromText,
  mermaidAPI: { render, initialize },
};

export default api;

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
