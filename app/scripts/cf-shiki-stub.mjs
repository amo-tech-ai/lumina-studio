/**
 * Wrangler alias stub — IPI-490 · CF-MIG-210.
 *
 * Proven in Worker bundle via OpenNext esbuild meta + dry-run worker.js:
 * `@shikijs/langs` (~7.6 MiB) enters through CopilotKit → streamdown code blocks.
 * Syntax highlighting is a browser concern; ASSETS keep the real client chunks.
 * SSR falls back to plain tokens / no-op highlighter.
 */
export const bundledLanguages = {};
export const bundledThemes = {};

export function createJavaScriptRegexEngine() {
  return {};
}

export function createHighlighter() {
  return Promise.resolve({
    codeToHtml: (code) => `<pre><code>${escapeHtml(String(code))}</code></pre>`,
    codeToTokens: (code) => ({
      tokens: [[{ content: String(code), color: "inherit" }]],
      bg: "transparent",
      fg: "inherit",
    }),
    getLoadedLanguages: () => ["text"],
    getLoadedThemes: () => [],
    dispose: () => {},
  });
}

export default { createHighlighter, bundledLanguages, bundledThemes, createJavaScriptRegexEngine };

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
