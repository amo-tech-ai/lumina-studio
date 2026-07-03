---
name: cloudinary
description: >
  Cloudinary media hub — transformation/delivery URLs, React SDK, and SDK/API/docs
  lookup, consolidated into one skill with on-demand references. Use whenever the user
  mentions Cloudinary, image/video upload, CDN delivery, transformation URLs,
  f_auto/q_auto, resize/crop/overlay, signed uploads, @cloudinary/react, AdvancedImage,
  Upload Widget, video player, named/responsive transformations, transformation costs,
  webhooks/DAM/MediaFlows, or optimizing fashion/product photography assets — even if
  they do not say "Cloudinary" explicitly.
version: 2.0.0
metadata:
  priority: 2
---

# Cloudinary Skills Hub

One consolidated Cloudinary skill. **Load the matching `references/` file on demand** — do not
paste reference bodies here. Each topic folder keeps its own `references/` sub-docs.

> **Consolidation note (v2.0.0):** the former standalone skills `cloudinary-transformations`,
> `cloudinary-react`, and `cloudinary-docs` are now `references/` inside this skill. Behavior is
> preserved; only the packaging changed.

---

## Routing — load the reference that matches the task

| User intent | Reference to load |
|-------------|-------------------|
| Build/debug transformation **delivery URLs** — resize, crop, overlay, `f_auto/q_auto`, named/responsive/AI transformations, costs | [`references/transformations/transformations.md`](references/transformations/transformations.md) |
| **React/Vite**: AdvancedImage, Upload Widget, video player, signed uploads, TS pitfalls | [`references/react/react.md`](references/react/react.md) |
| **SDK / API / webhooks / DAM / MediaFlows / docs** lookup (llms.txt) | [`references/docs/docs.md`](references/docs/docs.md) |

### Priority when a task overlaps
1. **transformations** — URL syntax / effects / optimization
2. **react** — components, widget, TypeScript
3. **docs** — upload APIs, Node/Python SDK, webhooks, DAM, integrations

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
  ├─ React / Vite / AdvancedImage / Upload Widget / video player / signed upload?
  │     → references/react/react.md
  │       (+ transformations for URL building; + docs for API options not in the React guide)
  └─ Node/Python SDK, upload API, webhooks, DAM, MediaFlows, integrations?
        → references/docs/docs.md
```

---

## Reference map (sub-docs to load deeper)

| Topic | Entry guide | Deeper references |
|-------|-------------|-------------------|
| **transformations** | `references/transformations/transformations.md` | `references/transformations/references/{examples,named-transformations,responsive-images,video-transformations,ai-transformations,advanced-features,transformation-costs,debugging}.md` |
| **react** | `references/react/react.md` | `references/react/references/{signed-uploads,video-player,typescript-patterns,troubleshooting}.md` |
| **docs** | `references/docs/docs.md` | — (looks up upstream llms.txt; single file) |

---

## How to use this skill

1. Identify the task from the routing table / decision tree.
2. Load **only** that topic's entry guide (`references/<topic>/<topic>.md`).
3. Load deeper sub-references **on demand** when the guide points to them — keep context lean.
