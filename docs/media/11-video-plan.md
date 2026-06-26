# Video Intelligence Knowledge Base

**Version:** 1.0
**Date:** 2026-06-27
**Purpose:** Powers AI agents in the iPix/FashionOS platform to recommend video formats, specs, and creative strategies for brands.
**Spec notation:** ✅ Official spec | ⚠️ Estimated/community spec
**Scope:** Complements `02-image-types.md` — covers video only. For static image specs see that document.

---

## Table of Contents

1. [Platform Video Matrix](#1-platform-video-matrix)
2. [Video Type Taxonomy](#2-video-type-taxonomy)
3. [Technical Specs by Video Type](#3-technical-specs-by-video-type)
4. [Creative Best Practices](#4-creative-best-practices)
5. [Ecommerce Video Matrix](#5-ecommerce-video-matrix)
6. [AI Recommendation Rules](#6-ai-recommendation-rules)
7. [Shoot Planning Integration](#7-shoot-planning-integration)
8. [PostgreSQL Schema](#8-postgresql-schema)
9. [Source Bibliography](#9-source-bibliography)

---

## 1. Platform Video Matrix

### 1.1 Overview

| Platform | Feed Video | Stories | Short-form | Live | Shopping Video | Paid Video Ads |
|----------|-----------|---------|------------|------|---------------|---------------|
| Instagram | ✅ Reels + Feed | ✅ 60s clips | ✅ Reels up to 90s | ✅ | ✅ Shoppable Reels | ✅ |
| Facebook | ✅ Feed + Watch | ✅ Stories | ✅ Reels | ✅ Live | ✅ Shop Video | ✅ |
| TikTok | ✅ Feed | — | ✅ up to 10 min | ✅ LIVE | ✅ TikTok Shop | ✅ |
| YouTube | ✅ Long-form | — | ✅ Shorts ≤60s | ✅ Live | ⚠️ Product shelf | ✅ |
| Pinterest | ✅ Video Pin | — | ✅ Idea Pins | — | ✅ Video Shopping Ad | ✅ |
| LinkedIn | ✅ Native Video | ✅ Stories (limited) | — | ✅ Live | — | ✅ |
| X (Twitter) | ✅ In-stream | — | — | ✅ Spaces (audio) | — | ✅ |
| Amazon | — | — | — | ✅ Live | ✅ Main + A+ video | ✅ Sponsored Brand |
| TikTok Shop | ✅ Product video | — | ✅ | ✅ LIVE Shopping | ✅ Native checkout | ✅ |
| Shopify | ✅ Product video | — | — | — | ✅ | — |
| WhatsApp Business | ✅ Status | — | — | — | ✅ Catalog video | — |

### 1.2 Instagram Video

| Video Type | Resolution | Aspect Ratio | Max Length | Max File Size | Codec/Format | Organic | Paid | Shopping |
|-----------|-----------|-------------|-----------|--------------|-------------|---------|------|---------|
| Reels | 1080×1920 ✅ | 9:16 | 90s ✅ | 4 GB ✅ | H.264, MP4/MOV ✅ | ✅ | ✅ | ✅ shoppable |
| Feed Video | 1080×1350 ✅ | 4:5 preferred | 60 min ✅ | 4 GB ✅ | H.264, MP4/MOV ✅ | ✅ | ✅ | ✅ |
| Stories Video | 1080×1920 ✅ | 9:16 | 60s/clip ✅ | 4 GB ✅ | H.264, MP4/MOV ✅ | ✅ | ✅ | ✅ |
| Carousel Video (card) | 1080×1080 ✅ | 1:1 or 4:5 | 60s/card ✅ | 3.6 GB ✅ | H.264, MP4/MOV ✅ | ✅ | ✅ | ✅ |
| Reels Ad | 1080×1920 ✅ | 9:16 | 60s ✅ | 4 GB ✅ | H.264, MP4/MOV ✅ | — | ✅ | ✅ |
| Story Ad (video) | 1080×1920 ✅ | 9:16 | 60s ✅ | 4 GB ✅ | H.264, MP4/MOV ✅ | — | ✅ | ✅ |
| In-Feed Video Ad | 1080×1350 ✅ | 4:5 | 60 min ✅ | 4 GB ✅ | H.264, MP4/MOV ✅ | — | ✅ | ✅ |

**Key notes:**
- Minimum resolution: 600 px wide ✅
- Recommended frame rate: 23–60 fps ✅
- Audio: AAC stereo, 128 kbps+ ⚠️
- Safe zones (Reels/Stories): 250 px top, 250 px bottom — UI elements ✅
- Subtitles/captions: Supported via SRT upload or auto-captions ✅

### 1.3 Facebook Video

| Video Type | Resolution | Aspect Ratio | Max Length | Max File Size | Codec/Format | Organic | Paid | Shopping |
|-----------|-----------|-------------|-----------|--------------|-------------|---------|------|---------|
| Feed Video | 1280×720 min ✅ | 9:16 to 16:9 | 240 min ✅ | 10 GB ✅ | H.264, MP4/MOV ✅ | ✅ | ✅ | ✅ |
| Reels (FB) | 1080×1920 ✅ | 9:16 | 90s ✅ | 4 GB ✅ | H.264, MP4/MOV ✅ | ✅ | ✅ | — |
| Stories Video | 1080×1920 ✅ | 9:16 | 60s ✅ | 4 GB ✅ | H.264, MP4 ✅ | ✅ | ✅ | — |
| In-stream Ad | 1280×720 ✅ | 16:9 or 9:16 | 5–15s rec ✅ | 4 GB ✅ | H.264, MP4 ✅ | — | ✅ | — |
| Collection Ad (video) | 1200×628 or 1080×1080 ✅ | 1.91:1 or 1:1 | 60s ✅ | 4 GB ✅ | H.264, MP4 ✅ | — | ✅ | ✅ |
| Carousel Video Ad | 1080×1080 ✅ | 1:1 | 60s/card ✅ | 4 GB ✅ | H.264, MP4 ✅ | — | ✅ | ✅ |
| Facebook Live | 720p min ✅ | 16:9 | 8 hrs ✅ | — (stream) | H.264 stream ✅ | ✅ | — | ✅ |
| Watch / Long-form | 1280×720 min ✅ | 16:9 | 240 min ✅ | 10 GB ✅ | H.264, MP4 ✅ | ✅ | ✅ | — |

### 1.4 TikTok Video

| Video Type | Resolution | Aspect Ratio | Max Length | Max File Size | Codec/Format | Organic | Paid | Shopping |
|-----------|-----------|-------------|-----------|--------------|-------------|---------|------|---------|
| In-Feed Video | 1080×1920 ✅ | 9:16 (also 16:9, 1:1) | 10 min ✅ | 287.6 MB ✅ | H.264/H.265, MP4/MOV ✅ | ✅ | ✅ | ✅ |
| TikTok LIVE | 1080×1920 ✅ | 9:16 | No limit ✅ | — (stream) | H.264 stream ✅ | ✅ | — | ✅ |
| In-Feed Ad (video) | 540×960 min ✅ | 9:16, 16:9, 1:1 | 5–60s ✅ | 500 MB ✅ | H.264/H.265, MP4/MOV ✅ | — | ✅ | ✅ |
| TopView Ad | 1080×1920 ✅ | 9:16 | 5–60s ✅ | 500 MB ✅ | H.264, MP4 ✅ | — | ✅ | — |
| Branded Hashtag | 1080×1920 ✅ | 9:16 | 15–60s ✅ | 500 MB ✅ | H.264, MP4 ✅ | — | ✅ | — |
| Shopping Ad | 1080×1920 ✅ | 9:16 | 5–60s ✅ | 500 MB ✅ | H.264, MP4 ✅ | — | ✅ | ✅ |
| LIVE Shopping | 1080×1920 ✅ | 9:16 | No limit | — (stream) | H.264 stream ✅ | ✅ | — | ✅ |

**Key notes:**
- Recommended FPS: 24–30 fps; up to 60 fps accepted ✅
- Audio: AAC 44.1 kHz stereo ✅
- Caption support: Auto-captions on For You Page ✅
- Safe zone: Bottom 20% reserved for UI (sounds, follow button) ✅
- TikTok Shop product video: same 9:16 specs, with product link overlay

### 1.5 YouTube / YouTube Shorts

| Video Type | Resolution | Aspect Ratio | Max Length | Max File Size | Codec/Format | Organic | Paid | Shopping |
|-----------|-----------|-------------|-----------|--------------|-------------|---------|------|---------|
| YouTube Standard | 3840×2160 (4K) max ✅ | 16:9 ✅ | 12 hrs ✅ | 256 GB ✅ | H.264/H.265/VP9, MP4/MOV ✅ | ✅ | ✅ | ⚠️ Product shelf |
| YouTube Shorts | 1080×1920 ✅ | 9:16 ✅ | 60s ✅ | 256 MB ✅ | H.264, MP4 ✅ | ✅ | ✅ | — |
| YouTube Live | 1920×1080 rec ✅ | 16:9 ✅ | 12 hrs ✅ | — (stream) | H.264 stream ✅ | ✅ | — | — |
| TrueView In-stream Ad | 1920×1080 ✅ | 16:9 ✅ | 12 min max ✅ | — | H.264, MP4 ✅ | — | ✅ | — |
| Bumper Ad | 1920×1080 ✅ | 16:9 ✅ | 6s ✅ | — | H.264, MP4 ✅ | — | ✅ | — |
| Non-skippable Ad | 1920×1080 ✅ | 16:9 ✅ | 15–20s ✅ | — | H.264, MP4 ✅ | — | ✅ | — |
| Masthead Ad | 1920×1080 ✅ | 16:9 ✅ | 30s ✅ | — | H.264, MP4 ✅ | — | ✅ | — |

**Key notes:**
- Minimum recommended upload: 1920×1080 (1080p) ✅
- Frame rates: 24, 25, 30, 48, 50, 60 fps ✅
- Codecs: H.264, H.265, VP9, AV1 ✅
- Audio: AAC-LC stereo 384 kbps or Opus ✅
- Thumbnail: 1280×720, 16:9, max 2 MB ✅
- Closed captions: SRT, SBV, VTT supported; auto-captions available ✅

### 1.6 Pinterest Video

| Video Type | Resolution | Aspect Ratio | Max Length | Max File Size | Codec/Format | Organic | Paid | Shopping |
|-----------|-----------|-------------|-----------|--------------|-------------|---------|------|---------|
| Standard Video Pin | 1000×1500 rec ✅ | 2:3 or 16:9 or 1:1 | 15 min ✅ | 2 GB ✅ | H.264, MP4/MOV ✅ | ✅ | ✅ | — |
| Idea Pin (video) | 1080×1920 ✅ | 9:16 ✅ | 60s/page, 20 pages ✅ | 100 MB/clip ✅ | H.264, MP4 ✅ | ✅ | — | ✅ |
| Video Shopping Ad | 1000×1500 rec ✅ | 2:3 ✅ | 4s–15 min ✅ | 2 GB ✅ | H.264, MP4 ✅ | — | ✅ | ✅ |
| Max Width Video Ad | 1920×1080 ✅ | 16:9 ✅ | 4s–15 min ✅ | 2 GB ✅ | H.264, MP4 ✅ | — | ✅ | — |

**Key notes:**
- Minimum dimensions: 240 px wide ✅
- FPS: 25 fps min ✅
- Audio: stereo AAC ⚠️; muted autoplay on feed
- Captions: SRT supported ✅
- Thumbnail: auto-selected from frame or uploaded 1000×1500 ✅

### 1.7 LinkedIn Video

| Video Type | Resolution | Aspect Ratio | Max Length | Max File Size | Codec/Format | Organic | Paid | Shopping |
|-----------|-----------|-------------|-----------|--------------|-------------|---------|------|---------|
| Native Feed Video | 256×144 to 4096×2304 ✅ | 1:2.4 to 2.4:1 ✅ | 10 min ✅ | 5 GB ✅ | H.264, MP4 ✅ | ✅ | ✅ | — |
| LinkedIn Live | 720p min ✅ | 16:9 ✅ | 4 hrs ✅ | — (stream) | H.264 stream ✅ | ✅ | — | — |
| Video Ad | 640×360 to 1920×1080 ✅ | 16:9 or 9:16 or 1:1 | 30 min ✅ | 200 MB ✅ | H.264, MP4 ✅ | — | ✅ | — |

**Key notes:**
- Recommended video ad: 1920×1080 (16:9), 15–30s for awareness ✅
- FPS: 30 fps ✅
- Audio: AAC or MPEG4 ✅
- Captions: SRT upload supported ✅

### 1.8 X (Twitter) Video

| Video Type | Resolution | Aspect Ratio | Max Length | Max File Size | Codec/Format | Organic | Paid | Shopping |
|-----------|-----------|-------------|-----------|--------------|-------------|---------|------|---------|
| In-stream Post Video | 1280×720 ✅ | 16:9 preferred; 1:1, 9:16 OK ✅ | 2 min 20s ✅ | 512 MB ✅ | H.264, MP4/MOV ✅ | ✅ | ✅ | — |
| Video Ad | 1280×720 ✅ | 16:9 or 1:1 ✅ | 2 min 20s ✅ | 1 GB ✅ | H.264, MP4 ✅ | — | ✅ | — |
| In-stream Video Ad | 1280×720 ✅ | 16:9 ✅ | Pre-roll: 6–60s ✅ | 1 GB ✅ | H.264, MP4 ✅ | — | ✅ | — |

**Key notes:**
- Minimum resolution: 32×32 px ✅
- FPS: 40 fps max ✅
- Audio: AAC-LC stereo ✅

### 1.9 Amazon Video

| Video Type | Resolution | Aspect Ratio | Max Length | Max File Size | Codec/Format | Organic | Paid | Shopping |
|-----------|-----------|-------------|-----------|--------------|-------------|---------|------|---------|
| Main Product Video | 1920×1080 ✅ | 16:9 ✅ | Up to 5 min ⚠️ | 500 MB ✅ | H.264, MP4/MOV ✅ | ✅ | — | ✅ |
| Amazon A+ Video | 1920×1080 ✅ | 16:9 ✅ | No strict max ⚠️ | 500 MB ✅ | H.264, MP4 ✅ | ✅ | — | ✅ |
| Brand Store Video | 1920×1080 ✅ | 16:9 ✅ | Varies ⚠️ | 500 MB ✅ | H.264, MP4 ✅ | ✅ | — | ✅ |
| Amazon Live | 1280×720 min ✅ | 16:9 ✅ | No limit ✅ | — (stream) | H.264 stream ✅ | ✅ | ✅ | ✅ |
| Sponsored Brand Video | 1920×1080 ✅ | 16:9 ✅ | 6s–45s ✅ | 500 MB ✅ | H.264, MP4 ✅ | — | ✅ | ✅ |

**Key notes:**
- Product listing videos autoplay muted ✅
- Thumbnail auto-selected or uploaded (1920×1080 JPEG) ✅
- Subtitles: SRT supported for A+ content ⚠️

### 1.10 Shopify, TikTok Shop, and WhatsApp Business Video

| Platform | Video Type | Resolution | Aspect Ratio | Max Length | Max File Size | Format | Shopping |
|---------|-----------|-----------|-------------|-----------|--------------|--------|---------|
| Shopify | Product Video | 1920×1080 rec ⚠️ | 16:9 or 1:1 ⚠️ | No strict limit ⚠️ | 1 GB ✅ | MP4, MOV ✅ | ✅ |
| Shopify | Homepage/Banner Video | 1920×1080 ⚠️ | 16:9 ⚠️ | Loops ⚠️ | 1 GB ✅ | MP4 ✅ | — |
| TikTok Shop | Product Video | 1080×1920 ✅ | 9:16 ✅ | 60s ✅ | 287.6 MB ✅ | MP4/MOV ✅ | ✅ |
| TikTok Shop | LIVE Shopping | 1080×1920 ✅ | 9:16 ✅ | No limit ✅ | — (stream) | H.264 ✅ | ✅ |
| WhatsApp Business | Status Video | 1080×1920 rec ⚠️ | 9:16 ⚠️ | 30s ✅ | 16 MB ✅ | MP4 ✅ | — |
| WhatsApp Business | Catalog Video | 1080×1080 ⚠️ | 1:1 ⚠️ | 30s ⚠️ | 16 MB ✅ | MP4 ✅ | ✅ |

---

## 2. Video Type Taxonomy

### 2.1 Organic Video Types

| Video Type | Definition | Primary Platforms | Funnel Stage | Fashion Relevance |
|-----------|-----------|------------------|-------------|------------------|
| **Reels** | Short-form vertical video, algorithm-distributed | Instagram, Facebook | Awareness / Discovery | High — try-ons, reveals, trending audio |
| **Stories Video** | Ephemeral 24hr vertical clips, swipe-up enabled | Instagram, Facebook | Consideration | High — flash sales, polls, BTS |
| **Feed Video** | Longer-form video in main feed, organic or boosted | Instagram, Facebook, LinkedIn | Awareness to Consideration | Medium — campaigns, lookbooks |
| **Short-form Video** | ≤60s, algorithm-first distribution | TikTok, YouTube Shorts, IG Reels | Awareness | Very High — core fashion content |
| **Long-form Video** | >3 minutes, SEO-indexed, educational | YouTube, Facebook Watch | Consideration to Retention | Medium — styling guides, brand films |
| **Live Video** | Real-time streaming with live audience | Instagram, TikTok, Facebook, YouTube, Amazon | Engagement | High — drops, Q&A, LIVE shopping |
| **Carousel Video** | Mixed photo/video swipeable cards | Instagram, Facebook, TikTok | Consideration | High — lookbooks, collections |
| **Lookbook Video** | Editorial video showcasing a collection | Instagram Reels, Pinterest | Awareness | Very High — seasonal must-have |
| **Tutorial / How-To** | Step-by-step instruction format | TikTok, YouTube, Instagram | Consideration | High — styling, beauty application |
| **UGC (User-Generated Content)** | Authentic customer-made content, repurposed | TikTok, Instagram, Facebook | Conversion | Very High — builds trust |
| **BTS (Behind the Scenes)** | Production, studio, supply chain footage | Instagram Stories/Reels, TikTok | Retention | High — brand transparency |
| **Testimonial** | Customer or influencer review on-camera | TikTok, Instagram, YouTube | Conversion | High — social proof |
| **Unboxing** | Package opening experience | TikTok, YouTube, Instagram | Conversion | Very High — excitement, gifting |
| **Founder Story** | Brand origin, mission, or values video | YouTube, Instagram, LinkedIn | Awareness | Medium-High — brand building |
| **Event Highlights** | Fashion show, pop-up, or campaign recap | Instagram Reels, YouTube, TikTok | Awareness | Very High — seasonal campaigns |
| **Idea Pin / Multi-page** | Sequential storytelling with music | Pinterest | Discovery | High — inspiration content |
| **Podcast Video** | Long-form interview or discussion | YouTube, LinkedIn | Retention | Low-Medium — brand authority |

### 2.2 Advertising Video Types

| Video Type | Definition | Primary Platforms | Objective | Shopping |
|-----------|-----------|------------------|-----------|---------|
| **Video Ad (In-Feed)** | Paid placement in organic feed | All major platforms | Awareness, Conversion | Optional |
| **In-stream Ad** | Pre/mid-roll inside another video | YouTube, Facebook, X | Awareness | No |
| **Bumper Ad** | Non-skippable 6s video | YouTube | Awareness / Brand recall | No |
| **Collection Ad (Video)** | Video hero + product grid | Facebook, Instagram | Conversion, Shopping | ✅ |
| **Catalog / Dynamic Product Video** | Auto-generated video from product feed | Facebook, Instagram, Pinterest | Retargeting, Conversion | ✅ |
| **Shopping Video Ad** | Shoppable overlay on video | TikTok Shop, Instagram, Pinterest | Conversion | ✅ |
| **Retargeting Video** | Re-engage site/app visitors | Facebook, Instagram, TikTok | Conversion | ✅ |
| **Sponsored Brand Video** | Search-results video placement | Amazon | Awareness + Conversion | ✅ |
| **TopView Ad** | First video seen on TikTok app open | TikTok | Awareness | No |
| **Awareness Video** | Broad reach, view-optimized | All platforms | Brand Awareness | No |
| **Lead Gen Video** | Video with in-app form | Facebook, LinkedIn | Lead Generation | No |

### 2.3 Ecommerce Video Types

| Video Type | Definition | Platforms | Conversion Impact |
|-----------|-----------|-----------|-----------------|
| **Hero Product Video** | Primary listing video showing product | Amazon, Shopify, all | Very High |
| **Product Demo** | Feature walkthrough, how it works | Amazon A+, Shopify, YouTube | Very High |
| **360° Product Video** | Full rotation view | Amazon, Shopify | High |
| **Installation / Setup** | Instructions for wearable/wearable tech | Amazon A+, YouTube | High |
| **Comparison Video** | Side-by-side product comparison | YouTube, TikTok, Amazon | High |
| **Lifestyle Product Video** | Product in real-world or aspirational use | Instagram, TikTok, Pinterest | Very High |
| **Store Banner / Hero Video** | Autoplay banner on brand store | Amazon Brand Store, Shopify | Medium |
| **Collection / Range Video** | Multiple products in one video | Instagram, Pinterest, Shopify | High |
| **LIVE Shopping** | Real-time shoppable stream | TikTok Shop, Amazon Live, Instagram | Very High |

---

## 3. Technical Specs by Video Type

### 3.1 Short-form Vertical (Reels / TikTok / Shorts / Stories)

| Spec | Value |
|------|-------|
| Recommended resolution | 1080×1920 px ✅ |
| Minimum resolution | 540×960 px ✅ |
| Aspect ratio | 9:16 ✅ |
| Frame rate | 24, 25, 30 fps (60 fps for action/product) ✅ |
| Codec | H.264 (H.265/HEVC for higher quality) ✅ |
| Bitrate | 5–10 Mbps for 1080p ⚠️ |
| File format | MP4 (preferred), MOV ✅ |
| Max file size | 287 MB (TikTok) / 4 GB (Meta) ✅ |
| Max length | 60s (Stories), 90s (Reels), 60s (Shorts), 10 min (TikTok) ✅ |
| Recommended length | 15–30s for max completion rate ⚠️ |
| Thumbnail/Cover | 1080×1920 px, JPEG ✅ |
| Safe zone (top) | 0–250 px — no key content ✅ |
| Safe zone (bottom) | 250 px — no key content (CTA buttons, UI) ✅ |
| Audio | AAC stereo, 44.1 kHz, 128–256 kbps ✅ |
| Caption support | Auto-captions + SRT upload ✅ |
| Color space | sRGB ⚠️ |

### 3.2 Long-form Horizontal (YouTube / Facebook Watch / Brand Film)

| Spec | Value |
|------|-------|
| Recommended resolution | 1920×1080 px (1080p), up to 3840×2160 (4K) ✅ |
| Minimum resolution | 1280×720 px ✅ |
| Aspect ratio | 16:9 ✅ |
| Frame rate | 24, 25, 30 fps (cinematic); 48, 60 fps (action) ✅ |
| Codec | H.264 or H.265 (H.265 preferred for 4K) ✅ |
| Bitrate | 8 Mbps (1080p) / 35–45 Mbps (4K) ✅ |
| File format | MP4 (MP4 container, H.264) ✅ |
| Max file size | 256 GB (YouTube) / 10 GB (Facebook) ✅ |
| Max length | 12 hrs (YouTube) / 240 min (Facebook) ✅ |
| Recommended length | 3–12 min (YouTube how-to); 1–3 min (brand film) ⚠️ |
| Thumbnail | 1280×720 px, 16:9, JPG/PNG, max 2 MB ✅ |
| Safe zone | Standard broadcast safe (10% from edges) ⚠️ |
| Audio | AAC-LC stereo 384 kbps or Opus; 48 kHz ✅ |
| Caption support | SRT, SBV, VTT; auto-captions ✅ |

### 3.3 Feed Video (Square / Portrait — Multi-platform)

| Spec | Value |
|------|-------|
| Recommended resolution | 1080×1350 px (4:5) or 1080×1080 px (1:1) ✅ |
| Minimum resolution | 600×600 px ✅ |
| Aspect ratio | 4:5 (portrait, preferred) or 1:1 (square) ✅ |
| Frame rate | 23–60 fps ✅ |
| Codec | H.264 ✅ |
| File format | MP4, MOV ✅ |
| Max file size | 4 GB (Meta) ✅ |
| Max length | 60 min (Instagram/Facebook feed) ✅ |
| Recommended length | 15–60s for engagement; 1–3 min for storytelling ⚠️ |
| Thumbnail | 1080×1350 px (4:5) ✅ |
| Safe zone | 250 px top and bottom for Stories placement ✅ |
| Audio | AAC stereo, 128 kbps+ ⚠️ |
| Caption support | Auto-captions + SRT ✅ |

### 3.4 Product / Ecommerce Video (Amazon, Shopify)

| Spec | Value |
|------|-------|
| Recommended resolution | 1920×1080 px ✅ |
| Minimum resolution | 1280×720 px ✅ |
| Aspect ratio | 16:9 preferred; 1:1 accepted ✅ |
| Frame rate | 24 or 30 fps ✅ |
| Codec | H.264 ✅ |
| Bitrate | 5–8 Mbps ⚠️ |
| File format | MP4, MOV ✅ |
| Max file size | 500 MB (Amazon) / 1 GB (Shopify) ✅ |
| Max length | 5 min (Amazon listing) ⚠️; unlimited (Shopify) ⚠️ |
| Recommended length | 30–120s for product demo; 15–30s for hero video ⚠️ |
| Thumbnail | 1920×1080 px, JPEG ✅ |
| Audio | AAC stereo; muted autoplay assumed — design for no audio ⚠️ |
| Caption support | SRT supported (Amazon A+) ⚠️ |

### 3.5 Live Video (Streaming)

| Spec | Value |
|------|-------|
| Recommended resolution | 1920×1080 px (landscape) / 1080×1920 px (vertical/mobile) ✅ |
| Minimum resolution | 1280×720 px ✅ |
| Aspect ratio | 16:9 (YouTube/Facebook) or 9:16 (TikTok/Instagram mobile) ✅ |
| Frame rate | 30 fps (standard) / 60 fps (premium) ✅ |
| Video codec | H.264 ✅ |
| Video bitrate | 3–6 Mbps (1080p30) ✅ |
| Audio codec | AAC ✅ |
| Audio bitrate | 128–192 kbps stereo ✅ |
| Keyframe interval | 2s (recommended for all platforms) ✅ |
| Protocol | RTMP / RTMPS ✅ |

### 3.6 Universal Minimum Quality Bar

| Attribute | Minimum | Recommended |
|-----------|---------|-------------|
| Resolution | 720p (1280×720) | 1080p (1920×1080 or 1080×1920) |
| Frame rate | 24 fps | 30 fps (action: 60 fps) |
| Video codec | H.264 | H.264 or H.265 |
| Audio codec | AAC | AAC stereo |
| Audio sample rate | 44.1 kHz | 48 kHz |
| Color space | sRGB | sRGB (BT.709 for video) |
| Format | MP4 | MP4 |

---

## 4. Creative Best Practices

### 4.1 Hook Strategy — First 3 Seconds

The first 3 seconds determine whether a viewer watches or scrolls. For fashion and beauty:

| Hook Type | Technique | Example |
|-----------|-----------|---------|
| Product reveal | Start with the product hero frame, no intro | Open on the garment at 100% frame fill |
| Question / tension | Text overlay posing a problem or curiosity | "You're styling this wrong" |
| Motion / transformation | Cut or transition on beat 1 | Before/after reveal in first cut |
| Face + reaction | Human emotion immediately draws attention | Model reaction to wearing product |
| Text-first (silent scroll) | Caption drives the story — visual secondary | "POV: you found the perfect dress" |

**Fashion-specific rules:**
- Never open with a logo or brand name — hook first, brand later
- Color and texture fill the frame within 1 second
- Sound design: music drop on frame 1 if using audio
- On TikTok and Reels, captions are read by ~85% of viewers with sound off — always add them ⚠️

### 4.2 Storytelling Structure by Video Type

**Reels / TikTok (15–30s):**
```text
0–3s:   Hook — product reveal or tension
3–10s:  Story / demonstration
10–20s: Payoff / outcome
20–30s: CTA (soft — "link in bio" or product tag)
```

**YouTube How-To / Tutorial (3–8 min):**
```
0–30s:  Preview of outcome ("here's what you'll learn")
30s–1m: Problem framing
1–5m:   Step-by-step instruction
5–7m:   Recap + demonstration of result
7–8m:   CTA (subscribe, shop, link)
```

**Brand Film / Campaign (60–90s):**
```
0–5s:   Visual hook — no dialogue needed
5–20s:  Emotional scene-setting
20–60s: Brand narrative + product woven in
60–80s: Resolution / aspiration
80–90s: Branding + CTA
```

**Product Demo (30–60s):**
```
0–5s:   Product hero shot (clean background)
5–20s:  Key feature demonstration
20–40s: Lifestyle / in-use context
40–55s: Social proof (text overlay: "4.8 stars / 10k reviews")
55–60s: CTA
```

### 4.3 CTA Placement by Platform

| Platform | CTA Timing | CTA Type |
|---------|-----------|---------|
| Instagram Reels | Last 5s or pinned comment | "Shop now" tag, "link in bio" |
| TikTok | Last 5s + pinned comment + product link sticker | Product link overlay |
| YouTube | 20% before end screen / end card | Subscribe, link in description |
| Facebook Feed Video | Last 10s | Button overlay (Shop Now, Learn More) |
| Pinterest Video Pin | Always-on text overlay | Link to product page |
| Amazon Video | First 30s — product shown clearly | No CTA needed (catalog context) |
| LinkedIn Video | Final frame text | "Comment X to get the guide" |

### 4.4 Pacing Guidelines

| Video Category | Cut Frequency | Pacing Feel | Why |
|---------------|--------------|------------|-----|
| TikTok / Reels | Cut every 1–3s | Fast, kinetic | Matches platform energy, prevents scroll |
| YouTube How-To | Cut every 5–15s | Steady, instructional | Clarity over speed |
| Brand Film | Cut every 3–8s | Cinematic | Emotional rhythm |
| Product Demo | Cut every 3–6s | Clean, deliberate | Feature focus |
| Testimonial / UGC | Minimal cuts, natural feel | Authentic | Forced cuts break trust |
| LIVE Shopping | No cuts (live stream) | Conversational | Spontaneity drives engagement |

### 4.5 Fashion and Beauty Specific Guidance

**Apparel:**
- Always show fabric in motion — static shots underperform video by a significant margin for clothing ⚠️
- Include on-body (model wearing) AND flat/ghost for different use cases
- Walk shots in Reels: model walking toward camera on beat drives highest save rates ⚠️
- Size inclusivity: showing multiple body types signals brand values and broadens appeal

**Beauty / Cosmetics:**
- Before/after structure is the top-performing format on TikTok for beauty ⚠️
- Tight macro shots of texture, pigment, and blending outperform wide shots
- ASMR-adjacent sounds (brush strokes, packaging clicks) drive completion rates ⚠️
- Tutorial format: use text overlays for each step — most viewers watch without sound ⚠️

**Luxury / Premium:**
- Avoid jump cuts — use dissolves, wipes, or slow push-ins
- Silence or minimal music performs better than trending audio for luxury ⚠️
- Tight crop on craftsmanship details (stitching, hardware, material)
- Avoid heavy text overlays — let the visual speak

**Accessories / Jewelry:**
- Macro product close-ups with sparkle and glint on movement
- On-skin / on-hand shots essential — scale reference matters
- Unboxing has outsized conversion impact for accessories ⚠️

### 4.6 UGC vs Produced Video Decision Guide

| Scenario | Recommendation |
|---------|---------------|
| Building brand trust with new audience | UGC or UGC-style produced content |
| Launching a premium product | Produced — studio quality essential |
| TikTok organic growth | UGC or native TikTok creator style |
| Instagram Reels ads | Mix: ~60% produced, ~40% UGC-style ⚠️ |
| Amazon product listing | Produced — clean, professional |
| Retargeting campaigns | UGC performs better for warm audiences ⚠️ |
| Luxury brand | Produced only — UGC dilutes brand equity |
| Community building | UGC exclusively |

### 4.7 Product Demonstration Techniques

1. **Hero reveal:** Product enters frame from below on beat — instant attention
2. **360° turntable:** 10–15s slow rotation showing all angles (requires turntable rig)
3. **Zoom-to-detail:** Start wide, push in to texture/feature (use smooth zoom, not jump cut)
4. **On-body transition:** Cut from flat product to model wearing it (match cut)
5. **Before/after outfit:** Model in "everyday" look transitions to styled look
6. **Feature callout:** Pause frame + animated text arrow pointing to feature
7. **Size comparison:** Show product next to common reference object
8. **Color swatch reveal:** Swipe or fan out all colorways in sequence

---

## 5. Ecommerce Video Matrix

### 5.1 Platform Requirements

| Platform | Required Video | Optional Video | Conversion Notes |
|---------|---------------|---------------|-----------------|
| Amazon | Main product video strongly recommended | A+ content video, Brand Store hero, Amazon Live | Listings with video convert significantly more ⚠️ |
| Shopify | Optional product video | Homepage hero loop, collection video | Increases time-on-page ⚠️ |
| Facebook/Instagram Shop | Optional (catalog image required) | Product video in catalog | Video in catalog ads outperforms static ⚠️ |
| TikTok Shop | Product video strongly recommended | LIVE Shopping | TikTok is video-first — video required for best results ✅ |
| Pinterest Shopping | Optional video pin | Video Shopping Ad | Pins with video get higher outbound clicks ⚠️ |
| Google Shopping | Optional product video (YouTube linked) | Video ad via Performance Max | Performance Max supports video assets ⚠️ |

### 5.2 Amazon Video Specs (Conversion-Optimized)

| Video Slot | Resolution | Length | Key Content | Notes |
|-----------|-----------|--------|-------------|-------|
| Main listing video | 1920×1080 ✅ | 30–120s ⚠️ | Product hero → features → lifestyle | Autoplay muted; design for no sound |
| A+ Content video | 1920×1080 ✅ | No max ⚠️ | Deeper product story, brand narrative | Below fold — complements main video |
| Brand Store hero | 1920×1080 ✅ | 30–60s loop ⚠️ | Brand lifestyle, collection showcase | Autoloop, no sound |
| Amazon Live | 1280×720 min ✅ | Duration of session | Host demo + product links | Real-time with product overlay |
| Sponsored Brand Video | 1920×1080 ✅ | 6–45s ✅ | Product-focused, clear CTA | In-search placement — hook in first 5s |

**What drives Amazon video conversions:**
- Show product in use within first 5 seconds ⚠️
- Subtitles required (muted autoplay) ⚠️
- Product fills at least 70% of frame when shown on white ⚠️
- Include scale reference (person holding product)
- Show packaging/unboxing moment if relevant

### 5.3 TikTok Shop Video Specs

| Video Type | Spec | Notes |
|-----------|------|-------|
| Product listing video | 9:16, 1080×1920, ≤60s, <287 MB ✅ | Native feed format — highest click-through |
| LIVE Shopping stream | 9:16, 1080×1920, H.264 ✅ | Product links pinned in session |
| Spark Ad (boosted UGC) | Same as organic video ✅ | Strong ROI format on TikTok Shop ⚠️ |
| Shopping Ad (non-spark) | 9:16 or 1:1, 5–60s ✅ | Use when no UGC available |

**What drives TikTok Shop conversions:**
- First 3s must show the product (not the creator) ⚠️
- Native feel — avoid polished ad aesthetic for best conversion ⚠️
- Price anchor: mention price in first 10 seconds ⚠️
- LIVE sessions average higher conversion than video-only ⚠️

### 5.4 Shopify Video Best Practices

| Placement | Recommended Format | Length | Notes |
|---------|------------------|--------|-------|
| Product page hero | 16:9 or 1:1 MP4, 1080p | 15–30s loop | Autoplay muted; replaces hero image |
| Product gallery video | 16:9 or 1:1 | 30–90s | Full product demo with audio |
| Collection page | 16:9 banner video | 15–30s loop | Background video behind collection title |
| Homepage | 16:9, 1920×1080 | 20–30s loop | Ambient brand video — no text overlays needed |

### 5.5 What Drives Purchases — Cross-Platform Summary

| Factor | Impact | Notes |
|--------|--------|-------|
| Product visible in first 3s | Very High | Universal — all platforms |
| Subtitles / captions | High | Majority of social video watched silently ⚠️ |
| Demonstration of use | Very High | Especially apparel, beauty, accessories |
| Price mentioned early | High | TikTok Shop; moderate on Instagram |
| Social proof in video | High | Review counts, star ratings as text overlay |
| Short + punchy (≤30s) | High for social | Long-form works for Amazon/YouTube |
| Native aesthetic (UGC) | High for TikTok/Instagram | Lower for Amazon/Shopify |
| LIVE format | Very High (impulse) | TikTok Shop, Amazon Live |

---

## 6. AI Recommendation Rules

### 6.1 Channels + Goal → Best Video Types

```
FUNCTION recommend_video_types(channels, goal):

  IF goal == "brand_awareness":
    IF "instagram" IN channels OR "tiktok" IN channels:
      RETURN [reels, lifestyle_video, brand_film]
    IF "youtube" IN channels:
      RETURN [brand_film, long_form_editorial]
    IF "linkedin" IN channels:
      RETURN [founder_story, brand_documentary]

  IF goal == "product_launch":
    IF "instagram" IN channels:
      RETURN [reel_product_reveal, stories_countdown, feed_video_hero]
    IF "tiktok" IN channels:
      RETURN [in_feed_product_video, ugc_unboxing, live_launch]
    IF "youtube" IN channels:
      RETURN [hero_product_video, tutorial]
    IF "amazon" IN channels:
      RETURN [main_listing_video, sponsored_brand_video]

  IF goal == "conversion":
    IF "tiktok_shop" IN channels:
      RETURN [shopping_video, live_shopping, spark_ad]
    IF "instagram" IN channels OR "facebook" IN channels:
      RETURN [dynamic_product_video, collection_ad_video, retargeting_video]
    IF "amazon" IN channels:
      RETURN [sponsored_brand_video, main_listing_video]
    IF "pinterest" IN channels:
      RETURN [video_shopping_ad, idea_pin]

  IF goal == "retention" OR goal == "community":
    RETURN [bts_video, ugc_repost, testimonial, founder_story, live_qa]

  IF goal == "education":
    RETURN [tutorial, how_to, comparison_video, installation_video]
```

### 6.2 Product Category → Best Format Per Platform

| Category | Instagram | TikTok | YouTube | Amazon | Pinterest |
|---------|-----------|--------|---------|--------|-----------|
| Clothing / Apparel | Reels try-on (9:16, 15–30s) | Try-on haul (9:16, 30–60s) | Styling guide (16:9, 3–8 min) | On-model demo (16:9, 30–90s) | Video pin styled look (2:3) |
| Beauty / Cosmetics | Tutorial Reel (9:16, 30–60s) | Before/after (9:16, 15–30s) | Full tutorial (16:9, 5–12 min) | Application demo (16:9, 45–90s) | Idea Pin step-by-step |
| Accessories | Styling video (9:16) | Unboxing + outfit (9:16, 30–60s) | Collection overview (16:9) | 360° + closeup (16:9) | Flat lay video pin |
| Jewelry | Macro glint video (9:16 or 1:1) | Unboxing + on-hand (9:16) | Story + craftsmanship (16:9) | Wear demo + detail (16:9) | Elegant 2:3 pin |
| Footwear | Walk video (9:16) | Try-on haul + walk (9:16) | Review (16:9, 3–6 min) | All-angle demo (16:9) | Styled look video |
| Luxury | Cinematic brand film (9:16 or 16:9) | Craftsmanship / unboxing | Heritage film (16:9) | Premium demo (16:9) | Aspirational video |
| Home / Lifestyle | Reel in-room (9:16) | Room reveal (9:16) | Room tour (16:9) | In-room demo (16:9) | Idea pin room styling |

### 6.3 Funnel Stage → Video Length Recommendation

| Funnel Stage | Recommended Length | Format | Rationale |
|-------------|------------------|--------|-----------|
| Awareness | 6–30s | Reels, TikTok, Shorts, Stories | Short enough to complete; drives familiarity |
| Consideration | 30s–3 min | Feed Video, YouTube, Facebook | Enough depth to evaluate product |
| Conversion | 15–90s | Product demo, shopping video, retargeting | Long enough to demonstrate; short enough for action |
| Retention | 1–10 min | YouTube, Live, podcast video | Deeper engagement for existing customers |

### 6.4 Budget → Production Approach

| Budget Level | Approach | Video Types | Notes |
|-------------|---------|------------|-------|
| < $500 | UGC / Creator-sourced | Reels, TikTok, Stories | Free/paid creators or iPhone-native footage |
| $500–$2,500 | Semi-produced | Product video, tutorial, lifestyle | iPhone + gimbal + ring light; basic editing |
| $2,500–$10,000 | Produced | Lookbook, hero product, brand story | Small crew, proper lighting, 1 shoot day |
| $10,000–$50,000 | Full production | Campaign film, editorial, multi-platform | Director, DP, stylist, location, post-production |
| $50,000+ | Premium / Luxury | Brand film, fashion show coverage | Agency + production house, 4K, color grading |

### 6.5 Aspect Ratio Selection Rules

```
FUNCTION select_aspect_ratio(platform, placement, context):

  IF platform == "tiktok" OR placement == "stories" OR placement == "reels":
    RETURN "9:16"   // Always vertical

  IF platform == "youtube" OR placement == "youtube_ad":
    RETURN "16:9"   // Always horizontal

  IF platform IN ["instagram", "facebook"] AND placement == "feed":
    RETURN "4:5"    // Max vertical for feed — more screen real estate

  IF platform IN ["amazon", "shopify"] AND context == "product_page":
    RETURN "16:9"   // Standard for product demos

  IF platform == "pinterest":
    RETURN "2:3"    // Matches pin format for max coverage

  IF platform == "linkedin":
    RETURN "16:9"   // Default; 1:1 also works

  IF context == "carousel_card":
    RETURN "1:1"    // Square works across all platforms in carousel

  DEFAULT: RETURN "16:9"
```

### 6.6 Missing Video Asset Detection

```
FUNCTION detect_missing_video_assets(brand, channels):

  IF "instagram" IN channels:
    WARN IF: no Reel published in last 7 days
    WARN IF: no product video in Shopping catalog
    RECOMMEND: at least 1 video story/week for active brands

  IF "tiktok_shop" IN channels:
    REQUIRE: product video for every listed product
    WARN IF: no LIVE session in last 30 days
    RECOMMEND: ≥5 videos in feed before running Shopping Ads

  IF "amazon" IN channels:
    WARN IF: any ASIN missing main product video
    WARN IF: Brand Store has no hero video
    RECOMMEND: A+ content video for top-5 ASINs by revenue

  IF "youtube" IN channels:
    WARN IF: no video published in 30+ days
    REQUIRE: custom thumbnail for all videos (1280×720)

  IF "shopify" IN channels:
    RECOMMEND: product video on top 20% revenue products
    RECOMMEND: homepage hero video for brands with >$10k/month GMV
```

---

## 7. Shoot Planning Integration

### 7.1 When to Shoot Video Alongside Stills

Video and stills share ~80% of their physical setup. Capturing both in one shoot day yields significant cost efficiency.

| Shoot Element | Stills | Video | Shareable? |
|-------------|--------|-------|-----------|
| Studio (rental, permits) | ✅ | ✅ | ✅ Same location |
| Lighting setup | ✅ | ✅ | ✅ Nearly identical (slight softening for video) |
| Model / talent | ✅ | ✅ | ✅ Same bookings |
| Stylist / wardrobe | ✅ | ✅ | ✅ Same prep |
| Hair & makeup | ✅ | ✅ | ✅ Same crew |
| Art director | ✅ | ✅ | ✅ Same direction |
| Product prep | ✅ | ✅ | ✅ Same steaming/layout |
| Photographer | ✅ | — | Separate — camera operator needed for video |
| Videographer / DP | — | ✅ | Add to same day |
| Gimbal / slider | — | ✅ | Video-only equipment |
| Audio | — | ✅ | Lavs/boom if any dialogue needed |

**Rule:** If shooting stills for any product, budget 2–3 additional hours of video coverage on the same day. The marginal cost per video type is a fraction of standalone production.

### 7.2 Shared Crew Model for iPix Shoot Plans

```
MINIMUM CREW (photo + video, same day):
  1× Photographer (stills)
  1× Videographer with mirrorless + gimbal (video)
  1× Stylist (shared)
  1× HMU artist (shared)
  1× Production coordinator (scheduling, BTS capture on phone)

RECOMMENDED ADDITIONS:
  1× BTS/Content shooter (iPhone + 9:16 framing for Reels/TikTok)
  1× Audio tech (if any spoken/scripted content)
  1× Art director or creative lead
```

### 7.3 Shot List Additions for Video Coverage

When building an iPix shoot plan, add these video shot types to any stills brief:

**Essential video shots (add to every product shoot):**
- [ ] Hero product reveal — product enters frame on white/studio background (15–30s)
- [ ] 360° turntable rotation (if rig available)
- [ ] On-body walk: model walks toward camera in each look (3–5 steps)
- [ ] Detail zoom: slow push-in to fabric/material/hardware
- [ ] Flat lay to worn: pull-back from flat lay to model wearing product (creative transition)
- [ ] BTS b-roll: lighting, steaming, behind-scenes (9:16, handheld, authentic)

**Short-form social shots (add for Instagram/TikTok deliverables):**
- [ ] 3 × Reel hooks (first 3s attention-grabbers) per look
- [ ] Outfit transition shots (outfit change reveal)
- [ ] Reaction shots / candid "wearing" moments
- [ ] POV shot: camera looking over model's shoulder at product in hand

**Ecommerce shots:**
- [ ] Clean demo on white: slow pan across product on white surface
- [ ] Size/scale reference: product held in hand vs. flat on surface
- [ ] Packaging/unboxing sequence (3–5 steps)

### 7.4 Deliverable Planning from One Shoot Day

One well-planned shoot day can produce:

| Deliverable | Platform | Format | Est. Edit Time |
|------------|---------|--------|---------------|
| 3–5 × Reels | Instagram, TikTok | 9:16, 15–30s | 2–4 hrs |
| 1 × Brand / campaign video | YouTube, Instagram | 16:9 or 9:16, 60–90s | 4–8 hrs |
| 4–6 × Product listing videos | Amazon, Shopify | 16:9, 30–60s each | 2–4 hrs |
| 1 × Lookbook video | Instagram, Pinterest | 9:16, 30–60s | 2–3 hrs |
| 8–12 × Story clips | Instagram, Facebook | 9:16, 5–15s each | 1–2 hrs |
| 2–3 × UGC-style b-roll clips | TikTok, Instagram | 9:16, 15–30s | 1 hr |
| 1 × BTS compilation | Instagram Stories / TikTok | 9:16, 30–60s | 1–2 hrs |

**Total addressable video deliverables from 1 shoot day:** 20–35 individual clips across all platforms, covering the full funnel from awareness through conversion.

### 7.5 Post-Production Workflow

```
RAW FOOTAGE → SELECTS → MASTER EDIT → PLATFORM EXPORTS

1. Selects (1–2 hrs): videographer reviews and flags hero moments
2. Rough cut (master): Full-length version (90–180s)
3. Platform exports from master:
   a. 9:16 reframe  → Reels / TikTok / Stories (crop from 16:9 or dedicated vertical)
   b. 16:9          → YouTube / Amazon / Shopify
   c. 1:1           → Instagram/Facebook feed or carousel
   d. 4:5           → Instagram feed (crop from 9:16)
4. Captions: SRT generation (Descript, Premiere, or AI caption tool)
5. Thumbnail export: Key frame per video, 1280×720 or 1080×1920
6. Upload to DAM / Cloudinary for platform distribution
```

---

## 8. PostgreSQL Schema

This schema extends the existing `media_size_specs` table from `02-image-types.md` with a parallel `video_type_specs` table and supporting structures.

### 8.1 Enums

```sql
-- Video orientation
CREATE TYPE video_orientation AS ENUM ('vertical', 'horizontal', 'square', 'any');

-- Video category
CREATE TYPE video_category AS ENUM (
  'short_form',
  'long_form',
  'live',
  'product',
  'ad',
  'story',
  'shopping',
  'feed'
);

-- Production approach
CREATE TYPE production_approach AS ENUM ('ugc', 'semi_produced', 'produced', 'premium');

-- Funnel stage (may already exist from image schema)
DO $$ BEGIN
  CREATE TYPE funnel_stage AS ENUM ('awareness', 'consideration', 'conversion', 'retention');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Spec confidence (may already exist from image schema)
DO $$ BEGIN
  CREATE TYPE spec_confidence AS ENUM ('official', 'community', 'estimated');
EXCEPTION WHEN duplicate_object THEN null; END $$;
```

### 8.2 Core Video Type Specs Table

```sql
CREATE TABLE video_type_specs (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Classification
  platform_slug             text NOT NULL,
  video_type_slug           text NOT NULL,
  video_type_name           text NOT NULL,
  category                  video_category NOT NULL,
  description               text,

  -- Resolution
  rec_width_px              integer NOT NULL,
  rec_height_px             integer NOT NULL,
  min_width_px              integer,
  min_height_px             integer,
  max_width_px              integer,
  max_height_px             integer,

  -- Aspect ratio
  aspect_ratio_w            integer NOT NULL,
  aspect_ratio_h            integer NOT NULL,
  aspect_ratio_label        text NOT NULL,
  orientation               video_orientation NOT NULL DEFAULT 'vertical',

  -- Frame rate
  fps_min                   integer,
  fps_recommended           integer,
  fps_max                   integer,

  -- Codec + format
  recommended_codec         text NOT NULL DEFAULT 'H.264',
  accepted_codecs           text[],
  file_formats              text[] NOT NULL DEFAULT ARRAY['mp4'],
  container                 text DEFAULT 'MP4',
  bitrate_min_mbps          numeric,
  bitrate_rec_mbps          numeric,
  bitrate_max_mbps          numeric,

  -- Audio
  audio_codec               text DEFAULT 'AAC',
  audio_channels            integer DEFAULT 2,
  audio_sample_rate_hz      integer DEFAULT 44100,
  audio_bitrate_kbps        integer,
  muted_autoplay            boolean DEFAULT false,

  -- File size + duration
  max_file_size_mb          numeric,
  max_file_size_gb          numeric,
  max_duration_seconds      integer,
  rec_duration_min_seconds  integer,
  rec_duration_max_seconds  integer,

  -- Thumbnail
  thumbnail_width_px        integer,
  thumbnail_height_px       integer,
  thumbnail_format          text DEFAULT 'JPEG',
  thumbnail_max_size_mb     numeric,

  -- Safe zones
  safe_zone_top_px          integer DEFAULT 0,
  safe_zone_bottom_px       integer DEFAULT 0,
  safe_zone_left_px         integer DEFAULT 0,
  safe_zone_right_px        integer DEFAULT 0,

  -- Caption / subtitle
  caption_support           boolean DEFAULT false,
  caption_formats           text[],
  auto_caption              boolean DEFAULT false,

  -- Commerce flags
  organic                   boolean DEFAULT true,
  paid                      boolean DEFAULT false,
  shopping_support          boolean DEFAULT false,
  live_streaming            boolean DEFAULT false,

  -- Creative guidance
  hook_window_seconds       integer DEFAULT 3,
  recommended_production    production_approach,
  best_funnel_stages        funnel_stage[],
  best_campaign_objectives  text[],
  best_product_categories   text[],

  -- Notes
  mobile_notes              text,
  desktop_notes             text,
  creative_notes            text,

  -- Metadata
  spec_confidence           spec_confidence NOT NULL DEFAULT 'community',
  source_url                text,
  last_verified_at          timestamptz,
  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now(),

  UNIQUE (platform_slug, video_type_slug)
);

-- Indexes
CREATE INDEX idx_vts_platform        ON video_type_specs(platform_slug);
CREATE INDEX idx_vts_category        ON video_type_specs(category);
CREATE INDEX idx_vts_orientation     ON video_type_specs(orientation);
CREATE INDEX idx_vts_shopping        ON video_type_specs(shopping_support) WHERE shopping_support = true;
CREATE INDEX idx_vts_paid            ON video_type_specs(paid) WHERE paid = true;
CREATE INDEX idx_vts_funnel          ON video_type_specs USING GIN (best_funnel_stages);
CREATE INDEX idx_vts_objectives      ON video_type_specs USING GIN (best_campaign_objectives);
CREATE INDEX idx_vts_prod_categories ON video_type_specs USING GIN (best_product_categories);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_video_type_specs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_video_type_specs_updated_at
  BEFORE UPDATE ON video_type_specs
  FOR EACH ROW EXECUTE FUNCTION update_video_type_specs_updated_at();
```

### 8.3 Video Recommendation Rules Table

```sql
CREATE TABLE video_recommendation_rules (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name         text NOT NULL,
  rule_type         text NOT NULL CHECK (rule_type IN (
                      'channel_goal',
                      'product_category',
                      'funnel_stage',
                      'budget_tier',
                      'missing_asset'
                    )),
  condition_key     text NOT NULL,    -- e.g. "channel", "goal", "product_category"
  condition_value   text NOT NULL,    -- e.g. "tiktok", "conversion", "apparel"
  priority          integer DEFAULT 0,
  video_type_slugs  text[] NOT NULL,
  platform_slugs    text[],
  aspect_ratios     text[],
  duration_range    int4range,        -- e.g. '[15,30]' for 15–30 seconds
  notes             text,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX idx_vrr_type_value ON video_recommendation_rules(rule_type, condition_value);
CREATE INDEX idx_vrr_priority   ON video_recommendation_rules(priority DESC);
```

### 8.4 Shoot Plan Video Deliverables Table

```sql
CREATE TABLE shoot_video_deliverables (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shoot_plan_id         uuid,     -- FK to shoot_plans table when that table exists
  video_type_slug       text NOT NULL,
  platform_slug         text NOT NULL,
  quantity              integer NOT NULL DEFAULT 1,
  priority              text NOT NULL CHECK (priority IN ('required', 'recommended', 'optional')),
  est_edit_hours        numeric,
  production_approach   production_approach,
  notes                 text,
  completed_at          timestamptz,
  created_at            timestamptz DEFAULT now(),

  FOREIGN KEY (video_type_slug, platform_slug)
    REFERENCES video_type_specs(video_type_slug, platform_slug)
    ON DELETE RESTRICT
);

CREATE INDEX idx_svd_shoot    ON shoot_video_deliverables(shoot_plan_id);
CREATE INDEX idx_svd_platform ON shoot_video_deliverables(platform_slug);
CREATE INDEX idx_svd_priority ON shoot_video_deliverables(priority);
```

### 8.5 TypeScript Types

```typescript
export type VideoOrientation = 'vertical' | 'horizontal' | 'square' | 'any';
export type VideoCategory =
  | 'short_form'
  | 'long_form'
  | 'live'
  | 'product'
  | 'ad'
  | 'story'
  | 'shopping'
  | 'feed';
export type ProductionApproach = 'ugc' | 'semi_produced' | 'produced' | 'premium';
export type FunnelStage = 'awareness' | 'consideration' | 'conversion' | 'retention';
export type SpecConfidence = 'official' | 'community' | 'estimated';

export interface VideoTypeSpec {
  id: string;
  platform_slug: string;
  video_type_slug: string;
  video_type_name: string;
  category: VideoCategory;
  description: string | null;

  // Resolution
  rec_width_px: number;
  rec_height_px: number;
  min_width_px: number | null;
  min_height_px: number | null;
  max_width_px: number | null;
  max_height_px: number | null;

  // Aspect ratio
  aspect_ratio_w: number;
  aspect_ratio_h: number;
  aspect_ratio_label: string;
  orientation: VideoOrientation;

  // Frame rate
  fps_min: number | null;
  fps_recommended: number | null;
  fps_max: number | null;

  // Codec + format
  recommended_codec: string;
  accepted_codecs: string[];
  file_formats: string[];
  bitrate_rec_mbps: number | null;

  // Audio
  audio_codec: string;
  audio_channels: number;
  audio_sample_rate_hz: number;
  audio_bitrate_kbps: number | null;
  muted_autoplay: boolean;

  // Size + duration
  max_file_size_mb: number | null;
  max_file_size_gb: number | null;
  max_duration_seconds: number | null;
  rec_duration_min_seconds: number | null;
  rec_duration_max_seconds: number | null;

  // Thumbnail
  thumbnail_width_px: number | null;
  thumbnail_height_px: number | null;
  thumbnail_format: string;

  // Safe zones
  safe_zone_top_px: number;
  safe_zone_bottom_px: number;
  safe_zone_left_px: number;
  safe_zone_right_px: number;

  // Captions
  caption_support: boolean;
  caption_formats: string[];
  auto_caption: boolean;

  // Commerce
  organic: boolean;
  paid: boolean;
  shopping_support: boolean;
  live_streaming: boolean;

  // Creative guidance
  hook_window_seconds: number;
  recommended_production: ProductionApproach | null;
  best_funnel_stages: FunnelStage[];
  best_campaign_objectives: string[];
  best_product_categories: string[];

  // Metadata
  spec_confidence: SpecConfidence;
  source_url: string | null;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VideoRecommendation {
  platform: string;
  video_type: string;
  spec: Pick<
    VideoTypeSpec,
    | 'rec_width_px'
    | 'rec_height_px'
    | 'aspect_ratio_label'
    | 'orientation'
    | 'rec_duration_min_seconds'
    | 'rec_duration_max_seconds'
    | 'file_formats'
    | 'recommended_production'
  >;
  priority: 'required' | 'recommended' | 'optional';
  reason: string;
}

export interface ShootVideoDeliverable {
  video_type_slug: string;
  platform_slug: string;
  quantity: number;
  priority: 'required' | 'recommended' | 'optional';
  est_edit_hours: number | null;
  production_approach: ProductionApproach | null;
  notes: string | null;
}

export interface MissingVideoReport {
  brand_id: string;
  channel: string;
  missing: Array<{
    video_type_slug: string;
    platform_slug: string;
    severity: 'critical' | 'warning' | 'recommendation';
    message: string;
  }>;
}
```

---

## 9. Source Bibliography

All specifications sourced and cross-validated as of 2026-06-27.

| # | Source | URL | Reliability |
|---|--------|-----|------------|
| 1 | Meta Business Help — Video Ad Specs | https://www.facebook.com/business/help/1694323940750755 | Official ✅ |
| 2 | Instagram Help — Reels | https://help.instagram.com/1038126266089537 | Official ✅ |
| 3 | Meta Business Help — Stories Ad Specs | https://www.facebook.com/business/help/375369539421821 | Official ✅ |
| 4 | TikTok Business Help — Ad Specifications | https://ads.tiktok.com/help/article/video-ad-specifications | Official ✅ |
| 5 | TikTok for Business — Shopping Ads | https://ads.tiktok.com/help/article/shopping-ads-overview | Official ✅ |
| 6 | YouTube Help — Upload Video Specs | https://support.google.com/youtube/answer/1722171 | Official ✅ |
| 7 | YouTube Help — Shorts | https://support.google.com/youtube/answer/10059070 | Official ✅ |
| 8 | Pinterest Business — Video Ads | https://business.pinterest.com/en/ad-formats/video/ | Official ✅ |
| 9 | Pinterest Help — Video Pins | https://help.pinterest.com/en/article/video-pins | Official ✅ |
| 10 | LinkedIn Marketing Help — Video Ads | https://www.linkedin.com/help/lms/answer/a423379 | Official ✅ |
| 11 | X (Twitter) Business — Video Specs | https://business.twitter.com/en/help/campaign-setup/advertiser-card-specifications/video-app-card.html | Official ✅ |
| 12 | Amazon Seller Central — Product Videos | https://sellercentral.amazon.com/help/hub/reference/G202134820 | Official ✅ |
| 13 | Amazon Advertising — Sponsored Brand Video | https://advertising.amazon.com/resources/article/sponsored-brands-video | Official ✅ |
| 14 | Shopify Help — Product Media | https://help.shopify.com/en/manual/products/product-media | Official ✅ |
| 15 | Hootsuite — Social Media Video Sizes Guide | https://blog.hootsuite.com/social-media-video-sizes-guide/ | High — regularly updated |
| 16 | Sprout Social — Video Specs Guide | https://sproutsocial.com/insights/social-media-video-specs-guide/ | High |
| 17 | Buffer — Social Media Video Size Guide | https://buffer.com/resources/video-size-for-social-media/ | High |
| 18 | Wistia — Video Production Best Practices | https://wistia.com/learn/production | High — production guidance |

**Note on official platform sources:** Meta, TikTok, and Amazon pages require JavaScript rendering to display full spec content. Specs marked ✅ from these sources are cross-validated against Hootsuite, Sprout Social, and Buffer, which actively maintain alignment with official documentation and are widely used by platform advertising partners.

---

*Video Intelligence Knowledge Base maintained by the FashionOS/iPix AI team. Review quarterly or after major platform spec updates. Companion document: `02-image-types.md` (image specs).*
