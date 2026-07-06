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
  version: '1.0.0'
---

# Cloudinary Next.js SDK

Entry guide for `next-cloudinary`. Load **one** sub-reference below — do not paste full
doc bodies into context.

## When to Use

- Cloudinary in **Next.js** (App Router, Pages Router, Server Components, Route Handlers)
- `CldImage`, `CldOgImage`, `getCldImageUrl`, `CldUploadWidget`, `CldVideoPlayer`
- Signed/unsigned uploads from Next.js with server-side signature routes
- Debugging Next.js Image + Cloudinary transformation URLs

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

## Reference map — load on demand

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
