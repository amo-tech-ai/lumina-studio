---
name: cloudinary-nextjs
description: >
  Cloudinary Next.js SDK (next-cloudinary) — CldImage, CldOgImage, getCldImageUrl,
  CldUploadWidget, CldVideoPlayer, App Router and Pages Router. Use when building or
  debugging Cloudinary in Next.js (including the iPix operator app in app/) — even if
  the user mentions CldImage, next/image with Cloudinary, or upload widget without
  saying "Cloudinary" explicitly.
license: MIT
metadata:
  author: cloudinary
  hub: cloudinary
  topic: nextjs
  version: '1.1.0'
---

# Cloudinary Next.js SDK

Entry guide for `next-cloudinary` plus iPix-oriented patterns. Load **one** sub-reference
below — do not paste full doc bodies into context.

## When to Use

- Cloudinary in **Next.js** (App Router, Pages Router, Server Components, Route Handlers)
- `CldImage`, `CldOgImage`, `getCldImageUrl`, `CldUploadWidget`, `CldVideoPlayer`
- Signed/unsigned uploads from Next.js with server-side signature routes
- Debugging Next.js Image + Cloudinary transformation URLs

## Non-negotiable rules

- Use `next-cloudinary` for Next.js components and URL helpers: `CldImage`, `CldVideoPlayer`, `CldUploadWidget`, `CldUploadButton`, `CldOgImage`, `getCldImageUrl`, `getCldOgImageUrl`, and `getCldVideoUrl`.
- Use the Cloudinary Node SDK v2 only for server-side operations: `import { v2 as cloudinary } from 'cloudinary'`.
- Never expose `CLOUDINARY_API_SECRET` to the browser. Never create `NEXT_PUBLIC_CLOUDINARY_API_SECRET`.
- Put upload widgets, video player UI, and any component with React event handlers behind a Client Component boundary with `'use client'`.
- `CldImage` may be used from a Server Component for static rendering, but if you add client-only props such as `onLoad` or local state, move it into a Client Component.
- Do not import `cloudinary` in Client Components or Edge runtime code. Server Actions and route handlers that import `cloudinary` must run on the Node.js runtime.
- Use documented `next-cloudinary` prop names and shapes. Do not infer prop names from Cloudinary URL transformation parameters.
- Use `onSuccess` for upload widget success handling. Do not use deprecated upload callback names unless the installed version explicitly documents them.
- For deletes, pass a public ID, not a delivery URL. Pass `resource_type` when deleting videos or raw assets, and use `invalidate: true` when CDN cache invalidation is desired.

## Quick Start

```bash
npm install next-cloudinary
```

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
# Server-only for signed uploads:
CLOUDINARY_API_SECRET=your_api_secret
```

```tsx
import { CldImage } from 'next-cloudinary';

<CldImage src="folder/public_id" width={800} height={600} alt="..." />
```

## Patterns — load on demand (preferred for build/debug/review)

Opinionated App Router patterns (from former `cloudinary-next` skill). Prefer these for
implementation work in `app/`; use official dumps below when you need full SDK docs.

| Task | Reference |
|------|-----------|
| Choose API/component/helper | [patterns/api-decision-tree.md](patterns/api-decision-tree.md) |
| Install, image domains, presets | [patterns/project-setup.md](patterns/project-setup.md) |
| Env vars + TS typing | [patterns/environment.md](patterns/environment.md) |
| Imports + server/client boundaries | [patterns/imports.md](patterns/imports.md) |
| `CldImage` + `getCldImageUrl` | [patterns/cldimage.md](patterns/cldimage.md) |
| Transformation props / crop traps | [patterns/cldimage-transformations.md](patterns/cldimage-transformations.md) |
| Responsive `sizes` | [patterns/responsive-images.md](patterns/responsive-images.md) |
| `CldVideoPlayer` | [patterns/video-player.md](patterns/video-player.md) |
| Upload widget / button | [patterns/upload-widget.md](patterns/upload-widget.md) |
| Signed upload signature route | [patterns/signed-uploads.md](patterns/signed-uploads.md) |
| Server upload / delete | [patterns/server-upload-delete.md](patterns/server-upload-delete.md) |
| Overlays / text overlays | [patterns/overlays.md](patterns/overlays.md) |
| OG / social cards | [patterns/og-images.md](patterns/og-images.md) |
| TypeScript narrowing | [patterns/typescript.md](patterns/typescript.md) |
| Common errors | [patterns/troubleshooting.md](patterns/troubleshooting.md) |
| Review checklist | [patterns/quick-checklist.md](patterns/quick-checklist.md) |
| Official doc links | [patterns/official-docs.md](patterns/official-docs.md) |

**Templates** (copy and adapt): `assets/app-router-signature-route.ts`, `assets/server-action-upload.ts`, `assets/server-action-delete.ts`.

## Official SDK dumps — load on demand

| Task | Reference |
|------|-----------|
| Install, configure, SDK overview | [nextjs_integration.md](nextjs_integration.md) |
| 5-minute end-to-end walkthrough | [nextjs_quick_start.md](nextjs_quick_start.md) |
| `CldImage`, image transforms, overlays | [nextjs_image_transformations.md](nextjs_image_transformations.md) *(large — load for specific sections only)* |
| `CldVideoPlayer`, video transforms | [nextjs_video_transformations.md](nextjs_video_transformations.md) |
| `CldUploadWidget`, signed/unsigned upload | [nextjs_image_and_video_upload.md](nextjs_image_and_video_upload.md) |
| Sample apps (App Router album, etc.) | [nextjs_sample_projects.md](nextjs_sample_projects.md) |

## Cross-topic routing

| Also need | Load |
|-----------|------|
| Raw transformation URL syntax, `f_auto/q_auto`, costs | [../transformations/transformations.md](../transformations/transformations.md) |
| Server upload API, Admin API, webhooks | [../node/node.md](../node/node.md) or [../docs/docs.md](../docs/docs.md) |
| Legacy Vite React (`@cloudinary/react`) | [../react/react.md](../react/react.md) |

## iPix note

Canonical frontend is `app/` (Next.js :3002). Use `next-cloudinary` here — not
`@cloudinary/react` from the legacy Vite surface.

## Output expectations

When generating code, include the file path, the complete relevant code block, and a short note about where the code runs: Client Component, Server Component, Server Action, or route handler.

When reviewing code, report issues in this order: secret exposure, server/client boundary mistakes, import/runtime mistakes, incorrect component/helper choice, incorrect prop/event names, missing TypeScript narrowing, and missing cache invalidation or resource type handling.
