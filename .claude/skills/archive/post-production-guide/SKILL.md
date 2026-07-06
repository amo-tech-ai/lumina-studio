---
name: post-production-guide
description: Color grading direction, retouching guidelines, and export specifications per brand DNA and channel target. Bridges the gap between RAW upload and DNA-scored final. Use when preparing post-production briefs for editors/retouchers.
metadata:
  author: iPix
  version: "1.0"
  category: post-production
  requires: brand-dna-data, channel-specs
---

# Post-Production Guide

## When to Use This Skill

Use when you need to:
- Create color grading direction matched to brand DNA
- Define retouching standards per shot type
- Specify export settings per channel (Shopify, Amazon, Instagram, etc.)
- Brief a retoucher or editor with consistent, reproducible instructions
- Ensure final assets pass DNA compliance after post-production

## Core Principle

**Post-production is where brand DNA becomes visible.** The gap between a RAW file and a final asset is the retoucher's domain. Without clear direction, every editor interprets differently. Specify it once, apply it to every shot.

## Post-Production Workflow

```
RAW SELECTS → COLOR CORRECTION → COLOR GRADING → RETOUCHING → EXPORT → DNA REVIEW

1. COLOR CORRECTION (Technical — get it accurate)
   - White balance to target Kelvin
   - Exposure normalization
   - Shadow/highlight recovery
   - Lens distortion correction
   - Chromatic aberration removal

2. COLOR GRADING (Creative — match brand DNA)
   - Apply brand color profile/LUT
   - Tone curve adjustment
   - Color channel shifts (warmth, tint)
   - Saturation/vibrance targets
   - Consistency across all shots in setup

3. RETOUCHING (Cleanup — brand-appropriate level)
   - Skin retouching (if models)
   - Product cleanup (dust, scratches, threads)
   - Background cleanup
   - Garment fixes (wrinkles, folds)
   - Compositing (if needed)

4. EXPORT (Technical — match channel specs)
   - Resolution per channel
   - Color space (sRGB, Adobe RGB, P3)
   - File format (JPEG, PNG, TIFF, WebP)
   - Naming convention
   - Metadata embedding
```

## Brand DNA → Color Grade Translation

### Warm / Luxury

```
COLOR PROFILE: Warm Luxury
Target Kelvin:    4800-5200K (slightly warm of neutral)
Tone Curve:       Lifted shadows (+10), soft highlights (-5)
Highlights:       Warm shift (+5 yellow, +3 magenta)
Shadows:          Neutral to slightly warm
Saturation:       -10 global, +15 skin tones, +10 warm tones
Vibrance:         +5 (subtle richness)
Contrast:         Medium-low (flat shadows, soft rolloff)
Black Point:      Lifted slightly (no true blacks — matte feel)

REFERENCE: Think Bottega Veneta, Loro Piana, The Row
```

### Cool / Modern

```
COLOR PROFILE: Cool Modern
Target Kelvin:    5800-6200K (slightly cool)
Tone Curve:       Standard S-curve, punchy
Highlights:       Cool shift (+3 blue)
Shadows:          Cool shift (+5 blue, +2 cyan)
Saturation:       +5 global, desaturate warm tones (-10)
Vibrance:         +10 (crisp, clean)
Contrast:         Medium-high (defined edges)
Black Point:      Full black (no lift — clean modern)

REFERENCE: Think Balenciaga, Acne Studios, COS
```

### Neutral / Clean

```
COLOR PROFILE: Neutral Clean
Target Kelvin:    5500K (daylight neutral)
Tone Curve:       Minimal — near-linear
Highlights:       No shift
Shadows:          No shift
Saturation:       0 global (true to life)
Vibrance:         +5 (prevent flatness)
Contrast:         Low-medium (accurate representation)
Black Point:      True black but not crushed

REFERENCE: Think product photography standard, ecommerce baseline
```

### Dramatic / Editorial

```
COLOR PROFILE: Dramatic Editorial
Target Kelvin:    5500K base, creative shifts per shot
Tone Curve:       Strong S-curve, deep shadows
Highlights:       Per creative direction
Shadows:          Crushed or color-shifted per mood
Saturation:       Selective — pop hero colors, desaturate background
Vibrance:         Variable
Contrast:         High (strong directional light emphasized)
Black Point:      Deep (dramatic mood)

REFERENCE: Think Versace, Alexander McQueen, editorial magazines
```

### Natural / Organic

```
COLOR PROFILE: Natural Organic
Target Kelvin:    Match ambient (golden hour 3500K, overcast 6500K)
Tone Curve:       Gentle, preserve natural light feel
Highlights:       Warm if golden hour, neutral if overcast
Shadows:          Open, natural
Saturation:       -5 to -15 (muted, earthy)
Vibrance:         +5 (greens and earth tones)
Contrast:         Low (airy, light)
Black Point:      Lifted (dreamy, soft)

REFERENCE: Think Patagonia, Everlane, Reformation
```

## Retouching Standards by Shot Type

### Product — Clean / White Background

```
RETOUCHING LEVEL: High precision
Skin:        N/A
Product:     Remove ALL dust, threads, scratches, fingerprints
             Straighten seams, align patterns
             Ensure color accuracy to physical sample
Background:  Pure white (255, 255, 255) or per brand spec
             No shadows unless specified in brief
Garment:     Remove all wrinkles except natural drape
             Pin marks removed
             Tags hidden/removed
Compositing: Drop shadow or reflection if specified
Time target: 15-20 min per shot
```

### Lifestyle

```
RETOUCHING LEVEL: Light — maintain authenticity
Skin:        Light frequency separation (remove blemishes only)
             NO skin smoothing, NO reshaping
             Maintain natural skin texture and color
Product:     Light cleanup (visible dust/threads only)
             Maintain garment as it naturally falls
Background:  Minimal — remove only truly distracting elements
             Do NOT sanitize the environment
Garment:     Minor wrinkle reduction only if unnatural
             Keep natural movement and drape
Color:       Maintain ambient light character
Time target: 10-15 min per shot
```

### Editorial / Beauty

```
RETOUCHING LEVEL: Medium-high — polished but real
Skin:        Frequency separation for blemishes
             Dodge and burn for shape/dimension
             Even skin tone (remove redness, blotchiness)
             Maintain pores and texture (NO plastic look)
             Eye enhancement: slight brighten, sharpen
Product:     Full cleanup — every detail matters
             Color accuracy critical
Background:  Clean seamless — remove any marks, seams
Garment:     Smooth major wrinkles, maintain structure
             Pattern alignment if visible
Hair:        Remove flyaways that break silhouette
             Maintain natural volume and movement
Time target: 25-40 min per shot
```

### Detail / Macro

```
RETOUCHING LEVEL: Minimal — accuracy over aesthetics
Skin:        N/A
Product:     Remove ONLY non-product elements (dust on lens, etc.)
             Do NOT remove real product characteristics
             Stitching, texture, grain = keep as-is
Background:  Depth-of-field blur is natural — don't alter
Sharpening:  Apply capture sharpening to subject area only
             Do NOT over-sharpen (haloing = reject)
Color:       True-to-life, match physical sample
Time target: 5-10 min per shot
```

## Export Specifications by Channel

### Shopify / Direct Ecommerce

```
PRIMARY PRODUCT IMAGES:
  Format:     JPEG (quality 85-90) or WebP
  Resolution: 2048 x 2048px (square) — Shopify auto-resizes
  Color space: sRGB
  Background: Pure white (#FFFFFF) or brand-specified
  DPI:        72
  Max size:   20MB (Shopify limit) — target <2MB for speed
  Naming:     {sku}_{view}_{sequence}.jpg
              e.g., ME-SS26-001_front_01.jpg

VARIANT IMAGES:
  Same specs, naming includes variant:
  {sku}_{color}_{view}_{sequence}.jpg
```

### Amazon

```
MAIN IMAGE:
  Format:     JPEG or PNG
  Resolution: 2000 x 2000px minimum (for zoom)
  Color space: sRGB
  Background: Pure white (RGB 255,255,255)
  DPI:        72
  Product:    Must fill 85%+ of frame
  Naming:     {asin}_MAIN.jpg

ADDITIONAL IMAGES:
  Up to 8 additional images
  Infographics, lifestyle, detail allowed
  Text overlays permitted on non-main images
  Naming:     {asin}_PT01.jpg through {asin}_PT08.jpg
```

### Instagram

```
FEED POSTS:
  Format:     JPEG (quality 90+)
  Resolution: 1080 x 1350px (4:5 portrait — max feed real estate)
              1080 x 1080px (square — alternative)
  Color space: sRGB
  Naming:     {brand}_{campaign}_{sequence}.jpg

STORIES / REELS:
  Format:     JPEG or MP4
  Resolution: 1080 x 1920px (9:16)
  Video:      H.264, AAC audio, <4GB
  Naming:     {brand}_{campaign}_story_{sequence}

CAROUSEL:
  All images same dimensions within carousel
  Max 10 slides
```

### TikTok

```
VIDEO:
  Format:     MP4 (H.264)
  Resolution: 1080 x 1920px (9:16)
  Duration:   15s / 30s / 60s (platform optimized)
  FPS:        30 or 60
  Audio:      AAC, stereo
  Max size:   287MB
```

### Print (Lookbook / Catalog)

```
Format:     TIFF (uncompressed) or PSD (layered)
Resolution: 300 DPI at final print size
Color space: Adobe RGB (for wider gamut)
            Convert to CMYK at print stage
Bleed:      3mm on all sides
Naming:     {brand}_{season}_{page}_{position}.tiff
```

## Consistency Checklist

```
BATCH CONSISTENCY — Apply to ALL shots in a setup group:

- [ ] White balance identical across setup (±50K tolerance)
- [ ] Exposure within 1/3 stop across setup
- [ ] Shadow density consistent
- [ ] Highlight rolloff consistent
- [ ] Skin tone consistent across all model shots
- [ ] Product color matches physical sample
- [ ] Background tone/density consistent
- [ ] Sharpening settings identical within setup
- [ ] Export settings identical within channel batch

CROSS-SETUP CONSISTENCY:
- [ ] Brand color grade applied to all setups
- [ ] Skin tone bridge between studio and location
- [ ] Product color matches across different lighting setups
```

## Validation

- [ ] Color grade matches brand DNA direction
- [ ] Retouching level appropriate for shot type
- [ ] Export specs match target channel requirements
- [ ] Color space correct per channel (sRGB for web, Adobe RGB for print)
- [ ] File naming follows convention
- [ ] Batch consistency verified across setup groups
- [ ] Final assets ready for DNA compliance review
- [ ] No over-retouching (maintains natural look per brand)
