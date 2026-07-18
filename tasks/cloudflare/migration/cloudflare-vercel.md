> **SSOT:** [`plan-migrate.md`](./plan-migrate.md) — use this file for OpenNext/Workers migration steps. This doc is supplementary reference (package install, wrangler snippets).

Yes — best practice now is **Cloudflare Workers + OpenNext**, not Cloudflare Pages for serious Next.js apps.

## Do you need Cloudflare Pages?

**No, probably not.**

Use:

```text
Next.js → OpenNext → Cloudflare Workers
```

Avoid old setup:

```text
Next.js → Cloudflare Pages → next-on-pages
```

`next-on-pages` is deprecated; Cloudflare’s current docs recommend the OpenNext Cloudflare adapter for Next.js on Workers. ([GitHub][1])

## Best migration path from Vercel to Cloudflare Workers

### 1. Add Cloudflare packages

```bash
npm i @opennextjs/cloudflare@latest
npm i -D wrangler@latest
```

### 2. Add `wrangler.jsonc`

```json
{
  "name": "ipix-app",
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-07-08",
  "compatibility_flags": ["nodejs_compat"],
  "observability": {
    "enabled": true
  },
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  }
}
```

### 3. Add `open-next.config.ts`

```ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
```

### 4. Update `package.json`

```json
{
  "scripts": {
    "cf:build": "opennextjs-cloudflare build",
    "cf:preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "cf:deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
    "cf:typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
  }
}
```

### 5. Move env vars

Move Vercel env vars into Cloudflare:

```bash
wrangler secret put NEXT_PUBLIC_SUPABASE_URL
wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put CLOUDINARY_API_SECRET
wrangler secret put GEMINI_API_KEY
```

Keep public vars safe: anything starting with `NEXT_PUBLIC_` is visible to browser.

### 6. Check Vercel-specific code

Search for:

```bash
grep -R "vercel\|process.env.VERCEL\|@vercel\|next/image" .
```

Review:

* `vercel.json`
* Vercel rewrites/headers
* Image optimization config
* cron jobs
* edge functions
* route handlers
* server actions
* middleware

### 7. Test locally

```bash
npm run cf:preview
```

### 8. Deploy preview

```bash
npm run cf:deploy
```

### 9. Move DNS only after testing

Keep Vercel live until Cloudflare preview works.

Then switch DNS/custom domain.

## Important checks before migrating

| Area                   | What to verify                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Next.js version**    | Cloudflare Workers supports most Next.js features through OpenNext, but always test your exact version. ([Cloudflare Docs][2]) |
| **Middleware**         | Some Node.js middleware behavior may differ.                                                                                   |
| **Image optimization** | Use Cloudflare Images/Transformations or OpenNext image support; verify `next/image`.                                          |
| **Node APIs**          | Workers is not a normal Node server, even with `nodejs_compat`.                                                                |
| **File system writes** | Do not rely on local persistent file writes. Use R2, Supabase, or Cloudinary.                                                  |
| **Cron**               | Move Vercel Cron to Cloudflare Cron Triggers or Workflows.                                                                     |
| **Background jobs**    | Move to Cloudflare Queues/Workflows.                                                                                           |
| **AI routes**          | Prefer Workers AI / AI Gateway / Cloudflare Workers.                                                                           |

## Most efficient recommendation

Do this in phases:

```text
Phase 1: Keep Vercel live
Phase 2: Add OpenNext + Wrangler
Phase 3: Deploy same app to Cloudflare Workers preview
Phase 4: Fix runtime/env/image issues
Phase 5: Move AI routes/workflows to Workers
Phase 6: Switch production DNS
Phase 7: Remove Vercel config
```

## Final answer

For iPix: **use Cloudflare Workers, not Pages**, for the Next.js app.

Cloudflare Pages is still fine for simple/static sites, but for your AI-heavy app with agents, workflows, Supabase, pgvector, media, and server logic, Workers + OpenNext is the better long-term path.

[1]: https://github.com/cloudflare/next-on-pages?utm_source=chatgpt.com "cloudflare/next-on-pages: CLI to build and develop ..."
[2]: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/?utm_source=chatgpt.com "Next.js · Cloudflare Workers docs"
Yes — **if you just started, the Next.js option is better only if your goal is to move the existing app to Cloudflare now.**

But do **not** create a second Next.js app inside the repo.

Cloudflare docs say `--framework=next` is for scaffolding a **new** Next.js app on Workers. For an **existing** Next.js app, Cloudflare says you can deploy/configure the existing project with Wrangler/OpenNext instead.  

## Best move now

Keep:

```bash
services/cloudflare-worker
```

Then convert the existing Next.js app manually.

## Do this instead of `--framework=next`

From the existing Next.js app root:

```bash
npm i @opennextjs/cloudflare@latest
npm i -D wrangler@latest
```

Add `wrangler.jsonc`:

```json
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "main": ".open-next/worker.js",
  "name": "ipix-app",
  "compatibility_date": "2026-07-08",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "observability": {
    "enabled": true
  }
}
```

Add `open-next.config.ts`:

```ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
```

Add scripts:

```json
{
  "scripts": {
    "cf:preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "cf:deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
    "cf:typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
  }
}
```

Cloudflare’s docs list these as the manual setup steps for existing Next.js projects. 

## Simple answer

Run **Next.js Cloudflare setup**, but as a **conversion of the existing app**, not by generating a new app.

So: **don’t run `npm create cloudflare -- --framework=next` in `/home/sk/ipix` now.**
