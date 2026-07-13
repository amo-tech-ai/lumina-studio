---
title: "Task 23: Create OpenNext Configuration"
references:
  - title: "OpenNext Cloudflare"
    url: "https://opennext.js.org/cloudflare"
    topic: "OpenNext adapter configuration"
  - title: "OpenNext GitHub Repository"
    url: "https://github.com/opennextjs/opennextjs-cloudflare"
    topic: "Adapter code, examples, and issues"
  - title: "TypeScript in Workers"
    url: "https://developers.cloudflare.com/workers/languages/typescript/"
    topic: "TypeScript configuration and types"
---

# CF-NEXTJS-003 — Create OpenNext Configuration File

**Status:** ✅ Already done (corrected 2026-07-13 — verified against `app/wrangler.jsonc`, which already has this exact config)  
**Effort:** 5 minutes  
**Dependency:** 016 (wrangler.jsonc created)  
**Enables:** Build with OpenNext adapter

---

## Purpose

Create `open-next.config.ts` file that tells OpenNext:
- Use Cloudflare Workers as the build target
- Configure cache behavior
- Set up static site generation (ISR) options
- Enable edge function support

## Real-World Context

iPix uses dynamic routes (streaming chat, agents). OpenNext config tells the build system:
- Which routes are API endpoints (run in Worker)
- Which routes are static (cache at edge)
- How to handle server components (stream from edge)

## Goal

Configure OpenNext to correctly build iPix's Next.js app for Cloudflare Workers runtime.

---

## Success Criteria

✅ **File created:**
- `open-next.config.ts` exists in project root
- Uses TypeScript (`.ts` extension)
- Exports default configuration

✅ **Configuration complete:**
- Imports `defineCloudflareConfig` from `@opennextjs/cloudflare`
- Calls `defineCloudflareConfig()` to generate Cloudflare-specific config
- TypeScript compiles without errors

✅ **Validation:**
- TypeScript compiler accepts file (no type errors)
- Next build can read configuration

---

## Step-by-Step Instructions

### Step 1: Create File

**In project root:**

```bash
cd /home/sk/ipix
# Create the TypeScript config file
touch open-next.config.ts
# File created: /home/sk/ipix/open-next.config.ts
```

### Step 2: Add Configuration

**Open `open-next.config.ts` and paste:**

```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
```

**That's it.** The entire file is just those 3 lines.

### Step 3: Understand What It Does

| Line | What It Does |
|------|--------------|
| `import { defineCloudflareConfig }...` | Import OpenNext's Cloudflare config builder |
| `export default defineCloudflareConfig()` | Create and export default Cloudflare configuration |

**Why so simple?**
- `defineCloudflareConfig()` auto-detects your setup
- It reads your `wrangler.jsonc` automatically
- It configures routes, cache, streaming, etc. correctly
- You rarely need custom overrides

### Step 4: Optional Customization

If you need custom behavior later, you can expand it:

```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Optional: Custom routes configuration
  // routes: {
  //   "api/*": "stream",  // Stream API responses
  //   "/admin/*": "cache",  // Cache admin pages
  // },
  
  // Optional: Custom caching
  // caching: {
  //   cache: true,
  //   isr: true,
  // },
});
```

**For iPix:** Use the simple version. No customization needed.

---

## Real-World User Journey

### Scenario: iPix Build Engineer

**Goal:** Get OpenNext to recognize the Cloudflare target

**Journey:**
1. ✅ "I have wrangler.jsonc configured" (previous task)
2. ✅ "I create open-next.config.ts file"
3. ✅ "I paste the simple config"
4. ✅ "TypeScript accepts the file"
5. ✅ "I'm ready to update package.json scripts"

**Success moment:** "File is created and TypeScript doesn't complain"

---

## Testing & Verification

### File Exists Test

```bash
# Confirm file created
ls -la open-next.config.ts
# Expected: -rw-r--r-- ... open-next.config.ts
```

### TypeScript Test

```bash
# Check TypeScript compiles the file
npx tsc --noEmit open-next.config.ts
# Expected: No errors output
# If error: "Cannot find module '@opennextjs/cloudflare'"
# Fix: Run `npm i @opennextjs/cloudflare@latest` again
```

### File Content Test

```bash
# Verify content
cat open-next.config.ts
# Expected output:
# import { defineCloudflareConfig } from "@opennextjs/cloudflare";
# 
# export default defineCloudflareConfig();
```

---

## Why This File Exists

**Before (Vercel only):**
```
package.json → "build": "next build"
             → Creates .next/ directory
             → Deployed to Vercel
```

**Now (Vercel + Cloudflare):**
```
package.json → "build": "next build && opennextjs-cloudflare build"
             → Creates .next/ (for Vercel)
             → AND creates .open-next/ (for Workers)
             → open-next.config.ts guides the .open-next/ build
```

**open-next.config.ts** tells OpenNext how to build the .open-next/ output for Cloudflare.

---

## File Structure After This Task

```
/home/sk/ipix/
├── wrangler.jsonc              ← Created in task 016
├── open-next.config.ts         ← ← YOU CREATE THIS
├── package.json                ← Will update in task 018
├── app/                        ← Your Next.js app
└── tsconfig.json              ← Existing TypeScript config
```

---

## Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| `.js` extension | `open-next.config.js` | Use `.ts` (TypeScript) |
| Missing import | `defineCloudflareConfig is not defined` | Ensure `import` line is present |
| Missing export | `No default export` | Ensure `export default` is present |
| Wrong package | Import from `@opennext/cloudflare` | Should be `@opennextjs/cloudflare` (note the `js`) |
| Extra code | Adding custom logic | Keep it simple; OpenNext handles it |

---

## What Happens Next

After tasks 017-018, when you run `npm run build`:

```bash
$ npm run build

1. Next.js builds app → .next/
2. open-next.config.ts is read
3. OpenNext builds adapter → .open-next/
4. Output structure:
   .open-next/
   ├── worker.js           ← Main file (referenced in wrangler.jsonc)
   ├── assets/             ← Static files
   └── server-functions/   ← API routes
```

---

## Next Task

→ `018-CF-NEXTJS-update-package-json.md`

After this config is created, update package.json with build/deploy scripts.

---

## References

- **OpenNext Docs:** https://opennext.js.org/
- **OpenNext Cloudflare:** https://opennext.js.org/cloudflare
- **defineCloudflareConfig:** https://opennext.js.org/docs/builders/cloudflare

---

## Time Estimate

- **Create file:** 1 minute
- **Paste config:** 1 minute
- **Validation:** 2 minutes
- **Total:** ~5 minutes (fastest task)

---

## Rollback

If you need to undo:

```bash
# Delete the file
rm open-next.config.ts

# Your app is back to using only wrangler.jsonc
# (no other code affected)
```

---

## Done Checklist

- [ ] `open-next.config.ts` created in project root
- [ ] File contains import from `@opennextjs/cloudflare`
- [ ] File exports `defineCloudflareConfig()`
- [ ] TypeScript compiles without errors
- [ ] File has exactly 3 lines (import, blank line, export)
- [ ] Ready for next task (package.json update)
