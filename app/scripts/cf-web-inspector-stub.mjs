/**
 * CF CopilotKit web-inspector stub — IPI-849 · CF-BUNDLE-222.
 *
 * OpenNext/Turbopack + Wrangler alias `@copilotkit/web-inspector` here when
 * IPIX_CF_BUNDLE_STUBS=1 so the Worker does not embed the Lit inspector
 * (~578 KiB metafile input / ~0.12 MiB gzip) via CopilotKitInspector's
 * unconditional dynamic import string.
 *
 * Surface matches installed @copilotkit/web-inspector@1.61.0 exports used by
 * CopilotKitInspector (defineWebInspector, WEB_INSPECTOR_TAG, WebInspectorElement).
 *
 * Ceiling: AG-UI web inspector unavailable on CF Worker builds.
 * Upgrade: drop alias if upstream gates the dynamic import behind a build flag.
 * Node `next dev` / Vercel builds keep the real package (stubs unset).
 */

export const WEB_INSPECTOR_TAG = "cpk-web-inspector";

export class WebInspectorElement {}

export function defineWebInspector() {}

/** Exported by the real package; unused by CopilotKitInspector but kept for surface parity. */
export const ɵCpkThreadDetails = {};

export default {
  WEB_INSPECTOR_TAG,
  WebInspectorElement,
  defineWebInspector,
  ɵCpkThreadDetails,
};
