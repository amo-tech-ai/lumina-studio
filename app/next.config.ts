import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CLOUDINARY_CLOUD_NAME } from "./src/lib/cloudinary/url";

const appDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@copilotkit/runtime",
    "@copilotkit/runtime/v2",
    "@mastra/core",
    "@mastra/libsql",
    "@mastra/pg",
    "@ast-grep/napi",
    "mastra",
    "pg",
    "pg-cloudflare",
    "xxhash-wasm",
    "jose",
    "@segment/analytics-node",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: `/${CLOUDINARY_CLOUD_NAME}/image/upload/**`,
      },
    ],
  },
  // Pin workspace root — repo has multiple lockfiles; otherwise Turbopack infers /home/sk.
  turbopack: { root: appDir },
  env: {
    NEXT_PUBLIC_COPILOTKIT_THREADS_ENABLED:
      process.env.COPILOTKIT_LICENSE_TOKEN && process.env.OPERATOR_AUTH_ENABLED === "true"
        ? "true"
        : "false",
  },
};

export default nextConfig;

// OpenNext dev integration only — must NOT run during `next build` / OpenNext bundle
// (wrangler proxy + vm monkey-patch can race Turbopack and break pages-manifest writes).
if (process.env.NODE_ENV !== "production") {
  void import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
}
