/**
 * CF Shiki bridge — IPI-490 · CF-MIG-210.
 *
 * OpenNext/Turbopack aliases `shiki` + `@shikijs/*` here so the Worker
 * `handler.mjs` does not embed `@shikijs/langs` (~7.6 MiB).
 *
 * - Server / SSR: noop highlighter (plain `<pre><code>`).
 * - Browser: load real Shiki (+ JS regex engine) from jsDelivr ESM so
 *   CopilotKit/streamdown code blocks keep syntax highlighting without
 *   putting the language pack back into the Worker upload.
 *
 * Streamdown calls `Object.hasOwn(bundledLanguages, lang)` and remaps
 * misses to `"text"`. The Proxy below reports every language id as present
 * so createHighlighter still receives the real lang string (CDN loads it).
 *
 * Streamdown also passes `engine: createJavaScriptRegexEngine({forgiving})`.
 * A stub `{forgiving:true}` breaks CDN Shiki (`createString is not a function`),
 * so createHighlighter replaces that engine with the real CDN implementation.
 *
 * ponytail: ceiling = CDN/CSP offline → plain blocks; upgrade = server-only
 * alias once Turbopack supports it, or streamdown browser-only / CDN entry.
 */
const SHIKI_ESM = "https://cdn.jsdelivr.net/npm/shiki@3.19.0/+esm";
const SHIKI_ENGINE_ESM =
  "https://cdn.jsdelivr.net/npm/@shikijs/engine-javascript@3.19.0/+esm";

const noopHighlighter = {
  codeToHtml: (code) => `<pre><code>${escapeHtml(String(code))}</code></pre>`,
  codeToTokens: (code) => ({
    tokens: [[{ content: String(code), color: "inherit" }]],
    bg: "transparent",
    fg: "inherit",
  }),
  getLoadedLanguages: () => ["text"],
  getLoadedThemes: () => [],
  dispose: () => {},
};

/** Every lang id looks bundled so streamdown does not rewrite to `"text"`. */
export const bundledLanguages = new Proxy(
  {},
  {
    has: (_t, key) => typeof key === "string",
    get: (_t, key) => (typeof key === "string" ? true : undefined),
    getOwnPropertyDescriptor: (_t, key) =>
      typeof key === "string"
        ? { configurable: true, enumerable: true, value: true }
        : undefined,
    ownKeys: () => [],
  },
);

export const bundledThemes = {};

/**
 * Sync placeholder only — createHighlighter strips this and loads the real
 * CDN engine. Do not return a functional fake; CDN Shiki will throw.
 */
export function createJavaScriptRegexEngine(options = { forgiving: true }) {
  return { __ipixCfShikiStubEngine: true, forgiving: options?.forgiving !== false };
}

let browserHighlighterByKey = new Map();

export function createHighlighter(options = {}) {
  if (typeof window === "undefined") {
    return Promise.resolve(noopHighlighter);
  }

  const key = JSON.stringify({
    themes: options.themes ?? null,
    langs: options.langs ?? null,
  });
  const cached = browserHighlighterByKey.get(key);
  if (cached) return cached;

  const promise = Promise.all([
    import(/* webpackIgnore: true */ SHIKI_ESM),
    import(/* webpackIgnore: true */ SHIKI_ENGINE_ESM),
  ])
    .then(([shikiMod, engineMod]) => {
      const create = shikiMod.createHighlighter ?? shikiMod.default?.createHighlighter;
      if (typeof create !== "function") {
        throw new Error("shiki CDN module missing createHighlighter");
      }
      const createEngine =
        engineMod.createJavaScriptRegexEngine ??
        engineMod.default?.createJavaScriptRegexEngine;
      const engine =
        typeof createEngine === "function"
          ? createEngine({ forgiving: true })
          : undefined;
      const { engine: _discard, ...rest } = options;
      return create(engine ? { ...rest, engine } : rest);
    })
    .catch((err) => {
      console.warn("[IPI-490] Shiki CDN load failed; using plain code blocks", err);
      return noopHighlighter;
    });

  browserHighlighterByKey.set(key, promise);
  return promise;
}

export default {
  createHighlighter,
  bundledLanguages,
  bundledThemes,
  createJavaScriptRegexEngine,
};

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
