Below are the best **official links** for the iPix Cloudflare migration, Next.js on Cloudflare Workers, and Mastra hosting on Cloudflare.

## 1. Start here — Next.js on Cloudflare Workers

### Cloudflare’s official Next.js guide

[https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)

This is the main Cloudflare guide for deploying a full-stack Next.js app to Workers using `@opennextjs/cloudflare`.

It covers:

* new and existing Next.js projects;
* `wrangler.jsonc`;
* `open-next.config.ts`;
* local Worker preview;
* deployment;
* supported Next.js features;
* required `nodejs_compat` settings.

Cloudflare currently directs full-stack Next.js applications to **Workers with OpenNext**, not the older Pages adapter. ([Cloudflare Docs][1])

### OpenNext Cloudflare documentation

[https://opennext.js.org/cloudflare](https://opennext.js.org/cloudflare)

Use this as the detailed technical reference for the adapter. ([OpenNext][2])

### Existing application migration guide

[https://opennext.js.org/cloudflare/get-started](https://opennext.js.org/cloudflare/get-started)

This is the most relevant page for iPix because you are migrating an existing Next.js application.

It includes:

```bash
npx @opennextjs/cloudflare migrate
```

and explains:

* installing the adapter and Wrangler;
* generating `.open-next/worker.js`;
* adding `open-next.config.ts`;
* Worker preview and upload commands;
* static asset caching;
* removing unsupported Edge Runtime declarations;
* adding Cloudflare bindings. ([OpenNext][3])

### Official OpenNext Cloudflare GitHub repository

[https://github.com/opennextjs/opennextjs-cloudflare](https://github.com/opennextjs/opennextjs-cloudflare)

Use this for:

* examples;
* releases;
* issues;
* compatibility changes;
* source code;
* troubleshooting.

The adapter converts a normal Next.js standalone build into output compatible with Cloudflare’s `workerd` runtime. ([GitHub][4])

---

## 2. Important Next.js migration references

### Environment variables

[https://opennext.js.org/cloudflare/howtos/env-vars](https://opennext.js.org/cloudflare/howtos/env-vars)

This is important for the iPix split between:

* build-time `NEXT_PUBLIC_*` variables;
* runtime configuration;
* encrypted Worker secrets;
* local `.env` and `.dev.vars`;
* CI build variables.

OpenNext warns that build-time and runtime variables must be handled separately. ([OpenNext][5])

### OpenNext caching and ISR

[https://opennext.js.org/cloudflare/caching](https://opennext.js.org/cloudflare/caching)

Use this when deciding whether iPix needs:

* R2 incremental caching;
* static-asset caching;
* queues;
* tag-based revalidation;
* `revalidatePath`;
* `revalidateTag`.

For ordinary SSR routes, no additional cache configuration is required. The advanced setup mainly concerns SSG, ISR and Next.js data caching. ([OpenNext][6])

### Cloudflare Node.js compatibility

[https://developers.cloudflare.com/workers/runtime-apis/nodejs/](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)

Cloudflare Workers does not run a full traditional Node.js server. It supports a growing subset of Node.js APIs through the Workers runtime and compatibility polyfills. ([Cloudflare Docs][7])

### Compatibility flags

[https://developers.cloudflare.com/workers/configuration/compatibility-flags/](https://developers.cloudflare.com/workers/configuration/compatibility-flags/)

For Next.js and most Mastra packages, your `wrangler.jsonc` normally needs:

```json
{
  "compatibility_flags": ["nodejs_compat"]
}
```

with a compatibility date of `2024-09-23` or later. ([Cloudflare Docs][8])

### How Workers works

[https://developers.cloudflare.com/workers/reference/how-workers-works/](https://developers.cloudflare.com/workers/reference/how-workers-works/)

This explains the underlying runtime differences between:

* Cloudflare Workers;
* browsers;
* Node.js servers;
* Vercel functions.

([Cloudflare Docs][9])

---

## 3. Cloudflare deployment and operations

### Workers overview

[https://developers.cloudflare.com/workers/](https://developers.cloudflare.com/workers/)

General documentation for:

* Workers;
* bindings;
* observability;
* deployments;
* domains;
* storage;
* limits.

([Cloudflare Docs][10])

### Wrangler commands

[https://developers.cloudflare.com/workers/wrangler/commands/workers/](https://developers.cloudflare.com/workers/wrangler/commands/workers/)

Use this for official syntax for:

* `wrangler deploy`;
* `wrangler versions upload`;
* Worker creation;
* Worker deletion;
* configuration and deployment management.

([Cloudflare Docs][11])

### Worker versions and deployments

[https://developers.cloudflare.com/workers/versions-and-deployments/](https://developers.cloudflare.com/workers/versions-and-deployments/)

This is especially relevant to your planned workflow:

```text
build
→ upload version
→ smoke test
→ deploy version
→ gradual rollout or rollback
```

A Worker version includes code, static assets, bindings and compatibility settings. A deployment decides which version receives traffic. ([Cloudflare Docs][12])

### Secrets

[https://developers.cloudflare.com/workers/configuration/secrets/](https://developers.cloudflare.com/workers/configuration/secrets/)

Use this for:

* encrypted Worker secrets;
* `wrangler secret`;
* secret access through `env`;
* Node-compatible `process.env`;
* production secret management.

([Cloudflare Docs][13])

### Routes and custom domains

[https://developers.cloudflare.com/workers/configuration/routing/](https://developers.cloudflare.com/workers/configuration/routing/)

Use this later for:

* preview `workers.dev` URLs;
* custom preview domains;
* `www.ipix.co`;
* production DNS cutover;
* Worker Routes versus Custom Domains.

Cloudflare recommends production applications use a Custom Domain or Worker Route rather than relying on `workers.dev`. ([Cloudflare Docs][14])

### Automatic existing-project setup

[https://developers.cloudflare.com/workers/framework-guides/automatic-configuration/](https://developers.cloudflare.com/workers/framework-guides/automatic-configuration/)

This explains how Wrangler can detect an existing Next.js application and configure the OpenNext adapter automatically. ([Cloudflare Docs][15])

---

## 4. Mastra hosting on Cloudflare

### Official Mastra `CloudflareDeployer` reference

[https://mastra.ai/reference/deployer/cloudflare](https://mastra.ai/reference/deployer/cloudflare)

This is the main official Mastra Cloudflare page.

It explains:

* installing `@mastra/deployer-cloudflare`;
* generating `wrangler.jsonc`;
* deploying the Mastra server as a Worker;
* configuring D1 and KV bindings;
* adding custom domains;
* handling secrets;
* accessing bindings through `cloudflare:workers`;
* running `mastra build` before Wrangler deployment.

([Mastra][16])

Install:

```bash
npm install @mastra/deployer-cloudflare@latest
```

Basic configuration:

```ts
import { Mastra } from "@mastra/core";
import { CloudflareDeployer } from "@mastra/deployer-cloudflare";

export const mastra = new Mastra({
  deployer: new CloudflareDeployer({
    name: "ipix-mastra",
  }),
});
```

### Mastra Cloudflare deployer package

[https://www.npmjs.com/package/@mastra/deployer-cloudflare](https://www.npmjs.com/package/@mastra/deployer-cloudflare)

Use this to check:

* current version;
* installation;
* release frequency;
* package metadata;
* basic configuration.

The package is specifically described as a Cloudflare Workers deployer for Mastra applications. ([NPM][17])

### Mastra main repository

[https://github.com/mastra-ai/mastra](https://github.com/mastra-ai/mastra)

Use the repository for:

* source code;
* current issues;
* Cloudflare fixes;
* changelogs;
* examples;
* package implementation.

### Mastra releases

[https://github.com/mastra-ai/mastra/releases](https://github.com/mastra-ai/mastra/releases)

Check this before upgrading because Mastra is changing quickly and Cloudflare compatibility fixes appear regularly. ([GitHub][18])

### Mastra main documentation

[https://mastra.ai/docs](https://mastra.ai/docs)

### Mastra documentation index for AI tools

[https://mastra.ai/llms.txt](https://mastra.ai/llms.txt)

This is useful for Claude Code, Cursor, OpenCode and other agents because it lists current Mastra documentation pages in a machine-readable format.

### Mastra Cloudflare storage update

[https://mastra.ai/blog/changelog-2026-03-12](https://mastra.ai/blog/changelog-2026-03-12)

This documents Mastra’s Cloudflare Durable Objects storage adapter, including SQLite-backed persistence for stateful Mastra workloads. ([Mastra][19])

---

## 5. Important Mastra warning for iPix

The official Mastra Cloudflare documentation says Cloudflare bindings should be initialized **inside** `new Mastra({...})`, not at module scope.

Correct:

```ts
export const mastra = new Mastra({
  storage: new D1Store({
    binding: env.DB,
  }),
});
```

Risky:

```ts
const storage = new D1Store({
  binding: env.DB,
});

export const mastra = new Mastra({
  storage,
});
```

The second pattern can evaluate before Cloudflare populates `env`, causing an import-time failure. This is closely related to the type of import-time storage problem you encountered with CopilotKit on Vercel. ([Mastra][16])

---

## 6. Do not use these older guides

### Deprecated `next-on-pages`

[https://github.com/cloudflare/next-on-pages](https://github.com/cloudflare/next-on-pages)

This repository is archived and explicitly tells users to migrate to `@opennextjs/cloudflare`. ([GitHub][20])

Do not build new iPix migration tasks around:

```text
@cloudflare/next-on-pages
```

Use:

```text
@opennextjs/cloudflare
```

---

## Recommended reading order for the iPix migration

1. [https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
2. [https://opennext.js.org/cloudflare/get-started](https://opennext.js.org/cloudflare/get-started)
3. [https://opennext.js.org/cloudflare/howtos/env-vars](https://opennext.js.org/cloudflare/howtos/env-vars)
4. [https://developers.cloudflare.com/workers/configuration/secrets/](https://developers.cloudflare.com/workers/configuration/secrets/)
5. [https://developers.cloudflare.com/workers/versions-and-deployments/](https://developers.cloudflare.com/workers/versions-and-deployments/)
6. [https://mastra.ai/reference/deployer/cloudflare](https://mastra.ai/reference/deployer/cloudflare)
7. [https://developers.cloudflare.com/workers/configuration/routing/](https://developers.cloudflare.com/workers/configuration/routing/)
8. [https://opennext.js.org/cloudflare/caching](https://opennext.js.org/cloudflare/caching)

## Mapping to your Linear tasks

| Task                                                                          | Primary documentation                                                     |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **IPI-606 · CF-SEC-010 — Connect Infisical Secrets to Cloudflare Deployment** | Secrets, environment variables, versions and deployments                  |
| **IPI-472 · INFRA-001 — OpenNext CI and Deployment Pipeline**                 | Cloudflare Next.js guide, OpenNext migration guide                        |
| **IPI-632 · CF-MIG-220 — Protected Preview Runtime Smoke Validation**         | Worker preview, observability, routing                                    |
| **IPI-586 · CF-AI-003 — Wire One Workers AI Call Through ipix-prod Gateway**  | Workers AI and AI Gateway docs                                            |
| **Mastra Cloudflare hosting task**                                            | Mastra `CloudflareDeployer`, bindings, storage and Wrangler configuration |

[1]: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/?utm_source=chatgpt.com "Next.js · Cloudflare Workers docs"
[2]: https://opennext.js.org/cloudflare?utm_source=chatgpt.com "Index - OpenNext"
[3]: https://opennext.js.org/cloudflare/get-started?utm_source=chatgpt.com "Get Started - OpenNext"
[4]: https://github.com/opennextjs/opennextjs-cloudflare?utm_source=chatgpt.com "GitHub - opennextjs/opennextjs-cloudflare: Open Next.js adapter for Cloudflare · GitHub"
[5]: https://opennext.js.org/cloudflare/howtos/env-vars?utm_source=chatgpt.com "Env Vars - OpenNext"
[6]: https://opennext.js.org/cloudflare/caching?utm_source=chatgpt.com "Caching - OpenNext"
[7]: https://developers.cloudflare.com/workers/runtime-apis/nodejs/?utm_source=chatgpt.com "Node.js compatibility · Cloudflare Workers docs"
[8]: https://developers.cloudflare.com/workers/configuration/compatibility-flags/?utm_source=chatgpt.com "Compatibility flags · Cloudflare Workers docs"
[9]: https://developers.cloudflare.com/workers/reference/how-workers-works/?utm_source=chatgpt.com "How Workers works · Cloudflare Workers docs"
[10]: https://developers.cloudflare.com/workers/?utm_source=chatgpt.com "Overview · Cloudflare Workers docs"
[11]: https://developers.cloudflare.com/workers/wrangler/commands/workers/?utm_source=chatgpt.com "Workers · Cloudflare Workers docs"
[12]: https://developers.cloudflare.com/workers/versions-and-deployments/?utm_source=chatgpt.com "Versions & deployments · Cloudflare Workers docs"
[13]: https://developers.cloudflare.com/workers/configuration/secrets/?utm_source=chatgpt.com "Secrets · Cloudflare Workers docs"
[14]: https://developers.cloudflare.com/workers/configuration/routing/?utm_source=chatgpt.com "Routes and domains · Cloudflare Workers docs"
[15]: https://developers.cloudflare.com/workers/framework-guides/automatic-configuration/?utm_source=chatgpt.com "Deploy an existing project · Cloudflare Workers docs"
[16]: https://mastra.ai/reference/deployer/cloudflare "Reference: CloudflareDeployer | Deployer | Mastra Docs"
[17]: https://www.npmjs.com/package/%40mastra/deployer-cloudflare?utm_source=chatgpt.com "@mastra/deployer-cloudflare - npm"
[18]: https://github.com/mastra-ai/mastra/releases?utm_source=chatgpt.com "Releases · mastra-ai/mastra · GitHub"
[19]: https://mastra.ai/blog/changelog-2026-03-12?utm_source=chatgpt.com "Mastra Changelog 2026-03-12 | Mastra Blog"
[20]: https://github.com/cloudflare/next-on-pages?utm_source=chatgpt.com "GitHub - cloudflare/next-on-pages: CLI to build and develop Next.js apps for Cloudflare Pages · GitHub"
