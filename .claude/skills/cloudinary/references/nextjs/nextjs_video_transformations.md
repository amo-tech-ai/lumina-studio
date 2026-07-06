---
name: cloudinary-nextjs-video-transformations
description: >
  CldVideoPlayer and Next.js video transformations — playback, trim, transcode,
  overlays. Load when implementing or debugging Cloudinary video in Next.js.
license: MIT
metadata:
  author: cloudinary
  hub: cloudinary
  topic: nextjs
  version: '1.0.0'
---

> ## Documentation Index
> This page is part of the Image and Video APIs product. Fetch the complete documentation index for Image and Video APIs at: https://cloudinary.com/documentation/llms-image-and-video-apis.txt?referrer=docpage and then use it to discover all relevant pages before exploring further.
> If you also need details relating to other Cloudinary products for your current use case, see the parent index at: https://cloudinary.com/documentation/llms.txt?referrer=docpage

# Next.js video transformations


## Overview

The Next.js SDK provides the `CldVideoPlayer` component for rendering videos with transformations and playback controls. The component is built on top of the [Cloudinary Video Player](cloudinary_video_player), providing a feature-rich video experience with powerful transformation capabilities.

If you haven't yet installed the Next.js SDK, you might want to jump to the [quick start](nextjs_quick_start) first.

See also: [Next.js image transformations](nextjs_image_transformations)

## Video transformation functionality
In addition to transformation features that are equally relevant for images and video, such as resizing, cropping, rotating, adding text or image overlays, and setting video quality or format, there are a variety of special transformations you can use for video. For example, you can:
 
* [Transcode videos](video_transcoding) from one format to another
* Apply [video effects](video_effects_and_enhancements) such as fade-in/out, accelerating or decelerating, adjusting volume, playing in reverse
* Play [video-in-video](video_layers#video_overlays), [trim](video_trimming#trimming_videos) videos, or [concatenate](video_concatenation) multiple videos
* Set [video](video_manipulation_and_delivery#video_codec_settings) and [audio](audio_transformations#audio_settings) quality options such as bitrate, video codec, audio sampling frequency, or audio codec
* Adjust the visual tone of your video with [3-color-dimension LUTs](video_color_effects#3_color_dimension_luts_3d_luts)
* Generate [thumbnails](video_previews_and_posters#video_thumbnails) or [animated](videos_to_animated_images) images from video
* Deliver your video using [adaptive bitrate streaming](adaptive_bitrate_streaming) in HLS or MPEG-DASH

You can optionally specify all of the above transformations to videos using methods that generate image tags or via direct URL-building directives.

## Video transformations with Next.js

To transform a video asset, use the `CldVideoPlayer` component with transformation props. The component handles video playback and transformations. For example:

```jsx
'use client';

import { CldVideoPlayer } from 'next-cloudinary';
import 'next-cloudinary/dist/cld-video-player.css';

export default function Page() {
  return (
    <>
      <div style={{ width: '300px', height: '300px' }}>
        <CldVideoPlayer
          src="docs/walking_talking"
          width="300"
          height="300"
          transformation={{
            width: 300,
            height: 300,
            crop: 'fill',
            gravity: 'auto:faces'
          }}
        />
      </div>
    </>
  );
}
```

In the above example, the walking_talking video is cropped to a 300 x 300 pixel video, focusing on the faces.

> **TIP**: The examples in this guide cover the most commonly used player and transformation options. For additional video transformation capabilities, refer to the [Video transformations guide](video_manipulation_and_delivery) and [Transformation URL API reference](transformation_reference).

### Alternative: Using getCldVideoUrl helper

You can also generate Cloudinary video URLs directly using the `getCldVideoUrl` helper method, then use the URL in a standard video tag:

```jsx
'use client';

import { getCldVideoUrl } from 'next-cloudinary';

export default function Page() {
  const url = getCldVideoUrl({
    src: 'docs/walking_talking',
    width: 300,
    height: 300,
    crop: 'fill',
    gravity: 'auto:faces'
  });

  return (
    <>
      <video 
        src={url}
        width="300"
        height="300"
        controls
        style={{ display: 'block', margin: '1rem auto 0' }}
      />
    </>
  );
}
```

> **TIP**: `getCldVideoUrl` uses the same API as `getCldImageUrl`, but defaults the asset type to `video` and doesn't include image-specific transformations.

## Common video transformations

The `transformation` prop accepts an object or array of objects to apply transformations. Here are some examples of common video transformations.

### Cropping and resizing

Crop a video to 300 x 300 pixels, using a `fill` crop with automatic gravity (keeping the important parts of the video in the crop):

```jsx
<div style={{ width: '300px', height: '300px' }}>
  <CldVideoPlayer
    src="docs/walking_talking"
    width="300"
    height="300"
    transformation={{
        width: 300,
        height: 300,
        crop: 'fill',
        gravity: 'auto'
    }}
  />
</div>
```

### Blur effect

Blur a video:

```jsx
<div style={{ width: '300px', height: '300px' }}>
  <CldVideoPlayer
    src="docs/walking_talking"
    width="300"
    height="300"
    transformation={{
        effect: 'blur:800'
      }}
  />
</div>
```

### Accelerate

Speed up a video:

```jsx
<div style={{ width: '300px', height: '300px' }}>
  <CldVideoPlayer
    src="docs/walking_talking"
    width="300"
    height="300"
    transformation={{
        effect: 'accelerate:100'
      }}
  />
</div>
```

### Brightness

Adjust the brightness of a video:

```jsx
<div style={{ width: '300px', height: '300px' }}>
  <CldVideoPlayer
    src="docs/walking_talking"
    width="300"
    height="300"
    transformation={{
        effect: 'brightness:20'
      }}
  />
</div>
```

### Image overlay

Add an image on top of the video:

```jsx
<div style={{ width: '300px', height: '300px' }}>
  <CldVideoPlayer
    src="docs/walking_talking"
    width="300"
    height="300"
    transformation={[
      {
        overlay: 'cloudinary_icon',
        width: 500,
        gravity: 'north_east',
        x: 10,
        y: 10
      }
    ]}
  />
</div>
```

### Text overlay

Add text on top of the video:

```jsx
<div style={{ width: '300px', height: '300px' }}>
  <CldVideoPlayer
    src="docs/walking_talking"
    width="300"
    height="300"
    transformation={[
      {
        overlay: {
          font_family: 'Arial',
          font_size: 300,
          text: 'Sample Video'
        },
        color: 'white',
        gravity: 'south',
        y: 620
      }
    ]}
  />
</div>
```

### Video overlay

Add a video on top of another video:

```jsx
<div style={{ width: '300px', height: '300px' }}>
  <CldVideoPlayer
    src="docs/walking_talking"
    width="300"
    height="300"
    transformation={[
      {
        overlay: 'video:man_on_phone',
        width: 650,
        gravity: 'north_east',
        x: 10,
        y: 10
      }
    ]}
  />
</div>
```

### Adaptive Bitrate Streaming

Enable adaptive bitrate streaming for optimal playback across different network conditions:

```jsx
<div style={{ width: '300px', height: '300px' }}>
  <CldVideoPlayer
    src="docs/walking_talking"
    width="300"
    height="300"
    transformation={{
      streaming_profile: 'hd'
    }}
    sourceTypes={['hls']}
  />
</div>
```

> **TIP**: HLS (HTTP Live Streaming) automatically adjusts video quality based on the viewer's network speed and device capabilities. The `streaming_profile` can be set to `'hd'`, `'sd'`, or `'full_hd'`.

## Player configuration

Customize the video player's appearance, behavior, and functionality using the configuration options in the following sections.

### General props

{table:class=sdk-props-table} Prop | Type | Description | Example Value |
|--|--|--|--|
| className | string | Additional class names added to the video container | `"my-video-player"` |
| height | string &#124; number | **Required**: Player height | `{1080}`, `"1080"` |
| id | string | Video instance ID, defaults to src value | `"my-video"` |
| logo | boolean &#124; object | Logo to display in Player UI. **Default:** `{true}` to include the Cloudinary logo. | See [Logo](#logo) |
| onDataLoad | Function | Triggered when video metadata is loaded | See [Event handlers](#event_handlers) |
| onError | Function | Triggered on video error | See [Event handlers](#event_handlers) |
| onMetadataLoad | Function | Triggered when video data is loaded | See [Event handlers](#event_handlers) |
| onPause | Function | Triggered on video pause | See [Event handlers](#event_handlers) |
| onPlay | Function | Triggered on video play | See [Event handlers](#event_handlers) |
| onEnded | Function | Triggered when video has ended play | See [Event handlers](#event_handlers) |
| playerRef | Ref | React ref to access Player instance | See [Refs](#refs) |
| poster | string &#124; object | Customize the video's poster | See [Poster](#poster) |
| src | string | **Required**: Video public ID | `"videos/my-video"` |
| videoRef | Ref | React ref to access video element | See [Refs](#refs) |
| width | string &#124; number | **Required**: Player width | `{1920}`, `"1920"` |

#### Logo

The `logo` prop gives the option to customize the player's logo.

`logo` defaults to `true`, showing the Cloudinary logo and linking to https://cloudinary.com when clicked.

When `logo` is set to `false`, no logo will be displayed.

To customize the logo, the following options are available in the form of an object:

{table:class=sdk-props-table} Prop | Type | Description | Example Value |
|--|--|--|--|--|
| imageUrl | string | Image URL for player logo. | `"https://example.com/logo.png"` |
| onClickUrl | string | URL to browse to on logo click. | `"https://example.com"` |

**Example:**

```jsx
<div style={{ width: '300px', height: '300px' }}>
  <CldVideoPlayer
    src="docs/walking_talking"
    width="300"
    height="300"
    logo={{
      imageUrl: 'https://res.cloudinary.com/cloudinary/image/upload/w_100/e_colorize,co_white/next-js-plain.png',
      onClickUrl: 'https://nextjs.org/'
    }}
  />
</div>
```

Or hide the logo entirely:

```jsx
<div style={{ width: '300px', height: '300px' }}>
  <CldVideoPlayer
    src="docs/walking_talking"
    width="300"
    height="300"
    logo={false}
  />
</div>
```

#### Poster

The `poster` prop optionally takes a string or object to customize the generated poster.

When passing a string, you can either pass a Cloudinary Public ID or a remote URL to render the desired image.

When passing an object, use the same configuration and API as `getCldImageUrl` to customize the image. You can either specify a `src` option with a custom public ID or omit the `src`, which will use the video's ID to render an automatically generated preview image.

**Using a Cloudinary public ID:**

```jsx
<div style={{ width: '300px', height: '300px' }}>
  <CldVideoPlayer
    src="docs/walking_talking"
    width="300"
    height="300"
    poster="samples/coffee"
  />
</div>
```

**Using a remote URL:**

```jsx
<div style={{ width: '300px', height: '300px' }}>
  <CldVideoPlayer
    src="docs/walking_talking"
    width="300"
    height="300"
    poster="https://res.cloudinary.com/demo/image/upload/samples/food/fish-vegetables.jpg"
  />
</div>
```

**Using transformations:**

When passing an object, you can use the same API as `getCldImageUrl` to customize the poster. Omit the `src` to use the video's ID for an auto-generated preview:

```jsx
<div style={{ width: '300px', height: '300px' }}>
  <CldVideoPlayer
    src="docs/walking_talking"
    width="300"
    height="300"
    poster={{
      tint: 'equalize:80:blue:blueviolet'
    }}
  />
</div>
```

**Selecting a frame from the video:**

You can select a specific frame from the video itself to use as the poster by specifying a start offset (`so_<seconds>`) in the transformation. This example uses a frame at 3.0 seconds:

```jsx
<div style={{ width: '300px', height: '300px' }}>
<CldVideoPlayer
    src="docs/walking_talking"
    width="300"
    height="300"
    poster={{
      src: 'docs/walking_talking',
      rawTransformations: ['so_3.0'],
      assetType: 'video'
    }}
/>
</div>
```

#### Event handlers

React to player events. All event handlers receive an object containing the `player` instance:

```tsx
'use client';

import { CldVideoPlayer } from 'next-cloudinary';
import 'next-cloudinary/dist/cld-video-player.css';

export default function Page() {
  const handlePlay = ({ player }: any) => {
    console.log('Video started playing');
  };

  const handlePause = ({ player }: any) => {
    console.log('Video paused at:', player.currentTime());
  };

  const handleEnded = ({ player }: any) => {
    console.log('Video ended');
  };

  const handleMetadataLoad = ({ player }: any) => {
    console.log('Video duration:', player.duration());
  };

  const handleDataLoad = ({ player }: any) => {
    console.log('Video data loaded');
  };

  const handleError = ({ player }: any) => {
    console.error('Video error occurred');
  };

  return (
    <CldVideoPlayer
      src="docs/walking_talking"
      width="1920"
      height="1080"
      onPlay={handlePlay}
      onPause={handlePause}
      onEnded={handleEnded}
      onMetadataLoad={handleMetadataLoad}
      onDataLoad={handleDataLoad}
      onError={handleError}
    />
  );
}
```

**Available event handlers:**

* **onPlay** - Triggered when video starts playing
* **onPause** - Triggered when video is paused
* **onEnded** - Triggered when video playback ends
* **onMetadataLoad** - Triggered when video metadata is loaded
* **onDataLoad** - Triggered when video data is loaded
* **onError** - Triggered when a video error occurs

#### Refs

Access the player instance and video element directly using refs:

```tsx
'use client';

import { useRef } from 'react';
import { CldVideoPlayer } from 'next-cloudinary';
import 'next-cloudinary/dist/cld-video-player.css';

export default function Page() {
  const playerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleClick = () => {
    if (playerRef.current) {
      console.log('Current time:', playerRef.current.currentTime());
      console.log('Duration:', playerRef.current.duration());
    }
  };

  return (
    <>
      <CldVideoPlayer
        src="docs/walking_talking"
        width="1920"
        height="1080"
        playerRef={playerRef}
        videoRef={videoRef}
      />
      <button onClick={handleClick}>Get Video Info</button>
    </>
  );
}
```

### Player visuals props

{table:class=sdk-props-table} Prop | Type | Default | Description | Example Value|
|--|--|--|--|--|
| aiHighlightsGraph | boolean | `{false}` | Display AI-generated highlights graph for video navigation | `{true}` |
| bigPlayButton | boolean &#124; string | `{true}` | Show or customize the large play button in the center of the player | `{false}`, `"init"` |
| colors | object | See [Theme colors](#theme_colors) | Player chrome colors | See [Theme colors](#theme_colors) |
| controlBar | object | - | Customize the player control bar appearance and controls. [More Info](video_player_api_reference#constructor_parameters) | `{ pictureInPictureToggle: false }` |
| controls | boolean | `{true}` | Show player controls | See [Controls](#controls) |
| floatingWhenNotVisible | string | - | Enable floating player when scrolled out of view. Options: "left", "right" | `"right"` |
| fluid | boolean | - | Player fills container width while maintaining aspect ratio | `{true}` |
| fontFace | string | - | Player UI font. Uses Google Fonts. | `"Source Serif Pro"` |
| hideContextMenu | boolean | `{false}` | Hide the right-click context menu | `{true}` |
| interactionAreas | any | - | Define clickable areas within the video for interactive experiences. [More Info](video_player_interactive_videos) | `[{ x: 0, y: 0, width: 100, height: 100 }]` |
| playbackRates | array | - | Available playback speed options | `[0.5, 1, 1.5, 2]` |
| playlistWidget | object | - | Configure playlist widget appearance and behavior. [More Info](video_player_playlists_recommendations) | `{ direction: "vertical" }` |
| posterOptions | object | - | Advanced poster image configuration options | `{ transformation: { effect: "blur" } }` |
| showJumpControls | boolean | - | Show skip forward/backward buttons in the control bar | `{true}` |
| showLogo | boolean | `{true}` | Show the Cloudinary logo on Player | `{false}` |
| seekThumbnails | boolean | `{true}` | Show thumbnail previews when hovering over the seek bar | `{false}` |
| videoJS | object | - | Pass additional Video.js configuration options. [More Info](https://videojs.com/guides/options/) | `{ nativeControlsForTouch: true }` |

#### Theme colors

The `colors` prop takes an object that can control what colors are used in the player:

| Prop Name | Type | Default | Description |
|--|--|--|--|
| accent | string | "#FF620C" | Seek bar, volume control and for highlighting interactions. |
| base | string | "#000000" | Player controls bar, information bar, central play button, and right-click context menu. |
| text | string | "#FFFFFF" | All the text and icons that are present within the video player UI. |

**Example:**

```jsx
<div style={{ width: '300px', height: '300px' }}>
  <CldVideoPlayer
    src="docs/walking_talking"
    width="300"
    height="300"
    colors={{
      accent: '#00FF00',
      base: '#0000FF',
      text: '#FFFF00'
    }}
  />
</div>
```

#### Controls

Show or hide player controls:

```jsx
<div style={{ width: '300px', height: '300px' }}>
  <CldVideoPlayer
    src="docs/walking_talking"
    width="300"
    height="300"
    controls={false}
    autoplay="on-scroll"
    muted
  />
</div>
```

### Player behavior props

{table:class=sdk-props-table} Prop | Type | Default | Description | Example Value |
|--|--|--|--|--|
| autoplay | string &#124; boolean | `"never"` | When, if, should the video automatically play. Note that if the value passed is a boolean then the value will be passed to autoplay but if the value passed is a string then the value will be passed to autoplayMode. See autoplayMode in [Video Player docs](video_player_api_reference#constructor_parameters) | See [Autoplay](#autoplay) |
| autoShowRecommendations | boolean | `{false}` | Automatically show recommended videos when playback ends | `{true}` |
| disableRemotePlayback | boolean | `{false}` | Disable the ability to use remote playback (cast video) on the video element | `{true}` |
| loop | boolean | `{false}` | Loop the video | See [Loop](#loop) |
| maxTries | number | `{3}` | Maximum number of retry attempts if video fails to load | `{5}` |
| muted | boolean | `{false}` | Load muted by default | `{true}` |
| pictureInPictureToggle | boolean | `{false}` | Uses browser's Picture-in-Picture API to add floating video UI. | `{true}` |
| playedEventPercents | array | `[25, 50, 75, 100]` | Percentage milestones that trigger played events for analytics | `[10, 25, 50, 75, 90, 100]` |
| playedEventTimes | array &#124; null | `null` | Specific time points (in seconds) that trigger played events for analytics | `[5, 10, 30, 60]` |
| playsinline | boolean | - | Play video inline on mobile devices instead of fullscreen | `{true}` |
| videoTimeout | number | `{55000}` | Timeout (in milliseconds) before considering video load failed | `{60000}` |
| withCredentials | boolean | - | Include credentials in cross-origin video requests | `{true}` |

#### Autoplay

Control when videos automatically play:

```jsx
<div style={{ width: '300px', height: '300px' }}>
  <CldVideoPlayer
    src="docs/walking_talking"
    width="300"
    height="300"
    autoplay="on-scroll"
    muted
  />
</div>
```

> **NOTE**: Most browsers require videos to be muted for autoplay to work. Use the `muted` prop in conjunction with `autoplay`.

#### Loop

Make videos loop continuously:

```jsx
<div style={{ width: '300px', height: '300px' }}>
  <CldVideoPlayer
    src="docs/walking_talking"
    width="300"
    height="300"
    loop
  />
</div>
```

### Video config props

{table:class=sdk-props-table} Prop | Type | Description | Example Value |
|--|--|--|--|
| chapters | object | Define chapter markers for video navigation. [More Info](video_player_api_reference#chapters) | `{ 0: "Intro", 30: "Main Content", 120: "Conclusion" }` |
| preload | string | How much video data to preload. Options: `"auto"` (default), `"metadata"`, `"none"` | `"metadata"` |
| publicId | string | Alternative way to specify the video public ID (use `src` instead) | `"my-video"` |
| sourceTransformation | object | Transformations applied to the source before other transformations | `{ quality: "auto" }` |
| sourceTypes | array | Streaming format | `['hls']` |
| textTracks | object | Captions or subtitles for the active video | See [Text tracks](#text_tracks) |
| transformation | object &#124; array | Transformations to apply to the video | `{ width: 200, height: 200, crop: 'fill' }` |

#### Text tracks

The `textTracks` prop allows you to add captions or subtitles to the player.

Each Text Track is an object containing details about where the captions or subtitles should be loaded from as well as any customization of that track.

**Example:**

```jsx
<div style={{ width: '300px', height: '300px' }}>
  <CldVideoPlayer
    src="outdoors"
    width="300"
    height="300"
    textTracks={{
      captions: {
        label: 'English',
        language: 'en',
        default: true,
        url: 'https://res.cloudinary.com/demo/raw/upload/outdoors.vtt'
      }
    }}
  />
</div>
```

> **TIP**: Upload your VTT (WebVTT) caption files to Cloudinary as raw files and reference them in the `textTracks` prop.

### Ads and analytics props

{table:class=sdk-props-table} Prop | Type | Default | Description | Example Value |
|--|--|--|--|--|
| ads | object | - | Configure video ads using IMA SDK. [More Info](video_player_ads_monetization) | `{ adTagUrl: "https://example.com/ad-tag" }` |
| analytics | boolean | `{false}` | Enable Cloudinary video analytics to track playback metrics | `{true}` |
| allowUsageReport | boolean | `{true}` | Allow the player to send anonymous usage data to Cloudinary | `{false}` |

## Advanced features

### Picture-in-Picture

Enable picture-in-picture mode:

```jsx
<div style={{ width: '300px', height: '300px' }}>
  <CldVideoPlayer
    src="docs/walking_talking"
    width="300"
    height="300"
    pictureInPictureToggle
  />
</div>
```

### Playback rates

Allow users to change playback speed:

```jsx
<div style={{ width: '300px', height: '300px' }}>
  <CldVideoPlayer
    src="docs/walking_talking"
    width="300"
    height="300"
    playbackRates={[0.5, 1, 1.5, 2]}
  />
</div>
```

### Analytics

Enable Cloudinary video analytics:

```jsx
<CldVideoPlayer
  src="docs/walking_talking"
  width="1920"
  height="1080"
  analytics
/>
```

### Chapters

Add chapters to your video with a chapter selector button:

```jsx
<div style={{ width: '300px', height: '300px' }}>
  <CldVideoPlayer
    src="docs/walking_talking"
    width="300"
    height="300"
    chapters={{
      0: 'Introduction',
      5: 'Main Content',
      10: 'Conclusion'
    }}
    chaptersButton
  />
</div>
```

> **TIP**: The `chaptersButton` prop adds a button to the player controls that allows users to navigate between chapters.

### Disable remote playback

Prevent the video from being cast to remote devices:

```jsx
<CldVideoPlayer
  src="docs/walking_talking"
  width="1920"
  height="1080"
  disableRemotePlayback
/>
```

### Localization

Customize the player's language and labels (notice the tool tips that appear when you hover over the controls):

```jsx
<div style={{ width: '300px', height: '300px' }}>
  <CldVideoPlayer
    src="docs/walking_talking"
    width="300"
    height="300"
    language="es"
    languages={{
      es: {
        Play: "Reproducción",
        "Play Video": "Reproduce el Video",
        Pause: "Pausa",
        "Current Time": "Tiempo reproducido",
        Duration: "Duración total",
        "Remaining Time": "Tiempo restante",
        Fullscreen: "Pantalla completa",
        Mute: "Silenciar",
        Unmute: "No silenciado"
      }
    }}
  />
</div>
```

> **TIP**: Localization uses the Video.js JSON format. See the [Video.js languages guide](https://videojs.com/guides/languages/#json-format) for more details.

## Configuration and delivery

### Cloudinary environment configuration

Configure the Cloudinary environment:

```jsx
<CldVideoPlayer
  src="docs/walking_talking"
  width="1920"
  height="1080"
  config={{
    cloud: {
      cloudName: 'my-cloud-name'
    }
  }}
/>
```

### Custom domain (CNAME)

Use a [custom domain](advanced_url_delivery_options#private_cdns_and_custom_delivery_hostnames_cnames) for video delivery:

```jsx
<CldVideoPlayer
  src="docs/walking_talking"
  width="1920"
  height="1080"
  cname="videos.example.com"
/>
```

### Secure distribution

For [private CDN distributions](advanced_url_delivery_options#private_cdns_and_custom_delivery_hostnames_cnames):

```jsx
<CldVideoPlayer
  src="docs/walking_talking"
  width="1920"
  height="1080"
  privateCdn
  secureDistribution="videos.example.com"
/>
```

### Query parameters

Add custom query parameters to video URLs for cache busting, analytics tracking, A/B testing, or passing metadata to third-party services:

```jsx
<CldVideoPlayer
  src="docs/walking_talking"
  width="1920"
  height="1080"
  queryParams={{
    myParam: 'value'
  }}
/>
```

> **READING**:
>
> * Learn about the [Next.js SDK](nextjs_integration) and its components.

> * See examples of [image transformations](nextjs_image_transformations) using Next.js code.

> * Learn how to [upload images and videos](nextjs_image_and_video_upload) in your Next.js app.

> * Check out the [Video Player API Reference](video_player_api_reference) for complete player details.

> * Explore [video transformation concepts](video_manipulation_and_delivery) to understand how video transformations work.

> * Review the [Transformation URL API reference](transformation_reference) for complete transformation details.
