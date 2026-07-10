# Standalone Mastra Worker (`CloudflareDeployer`)

**Not iPix Phase 1.** Use when splitting Mastra to its own Worker (separate from OpenNext app).

Docs: [Deploy Mastra to Cloudflare](https://mastra.ai/guides/deployment/cloudflare) · [CloudflareDeployer reference](https://mastra.ai/reference/deployer/cloudflare)

Task notes: `tasks/cloudflare/mastra/deploy-cloudflare.md` · `cloudfalre-deployer.md`

---

## Install

```bash
npm install @mastra/deployer-cloudflare@latest
npm install -D wrangler
```

---

## Minimal config

```typescript
import { Mastra } from "@mastra/core";
import { CloudflareDeployer } from "@mastra/deployer-cloudflare";

export const mastra = new Mastra({
  deployer: new CloudflareDeployer({
    name: "your-project-name",
    vars: { NODE_ENV: "production" },
  }),
});
```

---

## Secrets

`.env` is **not** written to `wrangler.jsonc`. Upload at deploy:

```bash
npx wrangler secret bulk .env
```

Use `vars` in deployer constructor for non-sensitive config only.

---

## Build + deploy flow

1. `mastra build` → output under `.mastra/output` + generated `wrangler.jsonc`
2. `npx wrangler deploy`
3. Smoke: `GET https://<name>.<subdomain>.workers.dev/api/agents`

All Mastra HTTP routes are prefixed with `/api`.

---

## Bindings (`cloudflare:workers`)

Keep bindings **inside** `new Mastra({ ... })` — Mastra defers evaluation so `env` is populated:

```typescript
import { env } from "cloudflare:workers";

export const mastra = new Mastra({
  storage: new D1Store({ binding: env.DB }), // ✅ inside new Mastra()
});
```

```typescript
const storage = new D1Store({ binding: env.DB }); // ❌ env undefined at load
export const mastra = new Mastra({ storage });
```

---

## When to choose standalone vs in-process

| Choose in-process (iPix now) | Choose standalone |
|------------------------------|-------------------|
| CopilotKit + Next.js same origin | Agent API only, no Next.js |
| Single OpenNext deploy | Independent agent scaling |
| Phase 1 migration | Phase 2+ after CF-MIG stable |
