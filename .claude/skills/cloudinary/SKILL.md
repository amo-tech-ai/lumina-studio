---
name: cloudinary
description: >
  Cloudinary media hub — transformation/delivery URLs, Next.js SDK (next-cloudinary,
  CldImage), Node.js SDK (server upload/signatures), React SDK, and API/docs lookup,
  consolidated into one skill with on-demand references. Use whenever the user mentions
  Cloudinary, image/video upload, CDN delivery, transformation URLs, f_auto/q_auto,
  resize/crop/overlay, signed uploads, CldImage, CldUploadWidget, next-cloudinary,
  @cloudinary/react, AdvancedImage, Upload Widget, video player, named/responsive
  transformations, transformation costs, webhooks/DAM/MediaFlows, or optimizing
  fashion/product photography assets — even if they do not say "Cloudinary" explicitly.
version: 2.1.0
metadata:
  priority: 2
---

# Cloudinary Skills Hub

One consolidated Cloudinary skill. **Load the matching `references/` file on demand** — do not
paste reference bodies here. Each topic folder keeps its own `references/` sub-docs.

> **Consolidation note:** v2.0.0 merged `cloudinary-transformations`, `cloudinary-react`, and
> `cloudinary-docs` into `references/`. v2.1.0 adds **Next.js** and **Node.js** SDK references
> with entry guides and front matter for progressive disclosure.

---

## Routing — load the reference that matches the task

| User intent | Reference to load |
|-------------|-------------------|
| Build/debug transformation **delivery URLs** — resize, crop, overlay, `f_auto/q_auto`, named/responsive/AI transformations, costs | [`references/transformations/transformations.md`](references/transformations/transformations.md) |
| **Next.js** (`app/`): `CldImage`, `CldUploadWidget`, `CldVideoPlayer`, App Router, signed upload routes | [`references/nextjs/nextjs.md`](references/nextjs/nextjs.md) |
| **Node.js** server: upload API, Admin API, signed signatures, programmatic transforms | [`references/node/node.md`](references/node/node.md) |
| **React/Vite** (legacy): AdvancedImage, Upload Widget, video player, signed uploads, TS pitfalls | [`references/react/react.md`](references/react/react.md) |
| **SDK / API / webhooks / DAM / MediaFlows / docs** lookup (llms.txt) | [`references/docs/docs.md`](references/docs/docs.md) |

### Priority when a task overlaps
1. **transformations** — URL syntax / effects / optimization
2. **nextjs** — `next-cloudinary` in the operator app (`app/`)
3. **node** — server upload, signatures, Admin API
4. **react** — legacy Vite components, widget, TypeScript
5. **docs** — webhooks, DAM, integrations, llms.txt fallback

Use **docs alongside** a specialized topic when the use-case spans both (e.g. signed-upload
backend + React widget).

### Don't use this hub for
- Non-Cloudinary image hosting (Supabase Storage) → `ipix-supabase`
- AI image generation (Gemini) → `gemini` / edge functions
- Generic frontend design without Cloudinary → `frontend-design`

**MCP:** Cloudinary plugin servers (`cloudinary-asset-mgmt`, `cloudinary-analysis`, …) complement
these references for live account operations.

---

## Routing decision tree

```
Cloudinary task
  ├─ "Make this URL crop/resize/overlay/optimize" or debug a transformation?
  │     → references/transformations/transformations.md
  ├─ Next.js / CldImage / next-cloudinary / App Router / app/**?
  │     → references/nextjs/nextjs.md
  │       (+ node for signed-upload route handlers; + transformations for URL syntax)
  ├─ Node server upload / Admin API / signature generation / cloudinary.uploader?
  │     → references/node/node.md
  │       (+ nextjs if wiring widget to a Next route; + docs for webhooks)
  ├─ Legacy React / Vite / AdvancedImage / Upload Widget?
  │     → references/react/react.md
  └─ Webhooks, DAM, MediaFlows, Python/other SDKs, llms.txt?
        → references/docs/docs.md
```

---

## Reference map (sub-docs to load deeper)

| Topic | Entry guide | Deeper references |
|-------|-------------|-------------------|
| **transformations** | `references/transformations/transformations.md` | `references/transformations/references/{examples,named-transformations,responsive-images,video-transformations,ai-transformations,advanced-features,transformation-costs,debugging}.md` |
| **nextjs** | `references/nextjs/nextjs.md` | `references/nextjs/{nextjs_integration,nextjs_quick_start,nextjs_image_transformations,nextjs_video_transformations,nextjs_image_and_video_upload,nextjs_sample_projects}.md` |
| **node** | `references/node/node.md` | `references/node/{node_integration,node_quickstart,node_image_and_video_upload,node_image_manipulation,node_video_manipulation,node_asset_administration,node_sample_projects}.md` |
| **react** | `references/react/react.md` | `references/react/references/{signed-uploads,video-player,typescript-patterns,troubleshooting}.md` |
| **docs** | `references/docs/docs.md` | — (looks up upstream llms.txt; single file) |

---

## How to use this skill

1. Identify the task from the routing table / decision tree.
2. Load **only** that topic's entry guide (`references/<topic>/<topic>.md`).
3. Load deeper sub-references **on demand** when the guide points to them — keep context lean.
