---
name: cloudinary-nextjs-integration
description: >
  Cloudinary Next.js SDK overview — install next-cloudinary, env configuration,
  CldImage/CldUploadWidget intro. Load for setup questions or SDK orientation before
  diving into topic-specific references.
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

# Next.js SDK


[changelog-link]: https://github.com/cloudinary-community/next-cloudinary/blob/main/CHANGELOG.md
[sample-projects-link]:nextjs_sample_projects

The Cloudinary Next.js SDK provides simple, yet comprehensive image and video rendering, transformation, optimization, and delivery capabilities that you can implement using code that integrates seamlessly with your existing Next.js application.

## How would you like to learn?

{table:class=no-borders overview}Resource | Description 
--|--
[Next.js quick start](nextjs_quick_start) | Get up and running in five minutes with a walk through of installation, configuration, upload, rendering, and transformations.
[Video tutorials](nextjs_video_tutorials) | Watch tutorials relevant to your use cases, from getting started with the Next.js SDK, to rendering and transforming your images and videos. 
[Sample projects](nextjs_sample_projects) | Explore sample projects to see how to implement Cloudinary functionality such as rendering and delivery with transformations.
[Next Cloudinary GitHub repo](https://github.com/cloudinary-community/next-cloudinary) | Explore the source code and see the [CHANGELOG][changelog-link] for details on all new features and fixes from previous versions. 

Other helpful resources...

This guide focuses on how to set up and implement popular Cloudinary capabilities using the Next.js SDK, but it doesn't cover every feature or option. Check out these other resources to learn about additional concepts and functionality in general. 

{table:class=no-borders overview}Resource | Description 
--|--
[Developer kickstart](dev_kickstart) |A hands-on, step-by-step introduction to Cloudinary features.
[Glossary](cloudinary_glossary) | A helpful resource to understand Cloudinary-specific terminology.
[Guides](programmable_media_guides) | In depth guides to help you understand the many, varied capabilities provided by the product. 
[References](cloudinary_references) | Comprehensive references for all APIs, including Next.js code examples.

## Install

Install the `next-cloudinary` package using the NPM package manager:

```
npm install next-cloudinary
```

## Configure

### Set required configuration parameters

Add your Cloudinary cloud name to your environment variables:

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
```

### Set additional configuration parameters

In addition to the required configuration parameters, you can define a number of optional environment variables if relevant:

```
NEXT_PUBLIC_CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
NEXT_PUBLIC_CLOUDINARY_SECURE_DISTRIBUTION="your_cname"
NEXT_PUBLIC_CLOUDINARY_PRIVATE_CDN="<true|false>"
```

{notes}

* You need to set the API key and secret if using the Cloudinary Upload Widget for signed uploads.
* You can share the API key publicly, but you must keep the API secret private and use it only on the server.
* For more information about the secure distribution and private CDN options, see [Configuration parameters](cloudinary_sdks#configuration_parameters).
{/note}

### Configuration video tutorials

The following tutorials can help you install and set up your SDK:

  
  
  
    Find Your Credentials
    Find your Cloudinary credentials for APIs and SDKs 
  

  
  
  
    Configure the Next.js SDK
    Install and configure the Cloudinary Next.js SDK 
  

See more [Next.js video tutorials](nextjs_video_tutorials).

## Use

Once you've installed and configured the Next.js SDK, you can use it for:

* **Rendering and transforming images** - Render your images with transformations applied, using the `CldImage` component. [See examples](#quick_examples_image_transformations)
* **Rendering and transforming videos** - Render your videos with transformations applied, using the `CldVideoPlayer` component. [See example](#quick_example_video_transformations)
* **Uploading assets** - Use the upload components to easily add upload functionality to your application. [See example](#uploading_assets)
* **Generating social media cards** - Create Open Graph images and social media cards with the `CldOgImage` component. [See example](#social_media_cards)

### Quick examples: Image transformations

Here are two quick examples to get you started with image transformations:

* [Image transformation example 1](#image_transformation_example_1) - Apply a sepia effect to an image
* [Image transformation example 2](#image_transformation_example_2) - Apply multiple transformations

A key benefit of the Next.js SDK is that it automatically optimizes images for responsiveness, format and quality. In the examples below, you'll notice `c_limit`, `f_auto` and `q_auto` automatically added to the generated URLs. 

* `c_limit`: Used in responsive image sizing to constrain the maximum dimensions of an image. This ensures smaller images are served on smaller screens, reducing bandwidth and improving page load speed. [Learn more](nextjs_image_transformations#responsive_images)
* `f_auto`: Delivers the image in the best format for the requesting browser. [Learn more](image_optimization#automatic_format_selection_f_auto)
* `q_auto`: Compresses the image enough to reduce its size without impacting visual quality. [Learn more](image_optimization#automatic_quality_selection_q_auto)

#### Image transformation example 1

The following Next.js code renders the front_face.jpg image with a sepia effect applied:

```jsx
'use client';

import { CldImage } from 'next-cloudinary';

export default function Page() {
  return (
    <CldImage
      src="front_face"
      width="500"
      height="500"
      alt="Face with sepia effect"
      sepia
    />
  );
}
```

This code creates the HTML required to render the following transformation URL:

![Sample image transformation](https://res.cloudinary.com/demo/image/upload/e_sepia/c_limit,w_1080/f_auto/q_auto/v1/front_face "with_url:true, with_code:false, thumb: c_scale,w_150")

> **TIP**: Notice that image optimizations: `c_limit,w_1080/f_auto/q_auto`, are automatically applied by the Next.js SDK.

#### Image transformation example 2

You can apply more than one transformation at a time to give more interesting results:

```jsx
'use client';

import { CldImage } from 'next-cloudinary';

export default function Page() {
  return (
      <CldImage
        src="front_face"
        width="150"
        height="150"
        rawTransformations={[
          'c_thumb,g_face,h_150,w_150',
          'r_20',
          'e_sepia',
          'l_cloudinary_icon,e_brightness:90,o_60,w_50/fl_layer_apply,g_south_east,x_5,y_5',
          'a_10'
        ]}
        alt="Transformed face"
      />
  );
}
```

> **NOTE**: When using props for transformations, their order isn't guaranteed. For transformations where the order is important, as in this example, you may need to use [rawTransformations](nextjs_image_transformations#raw_transformations), which honors the order you specify.

This  code performs all of the following on the original front_face.jpg image before delivering it:

* **Crop** to a 150x150 thumbnail using face-detection gravity to automatically determine the location for the crop
* **Round the corners** with a 20 pixel radius
* Apply a **sepia effect**
* **Overlay the Cloudinary logo** on the southeast corner of the image (with a slight offset). Scale the logo overlay down to a 50 pixel width, with increased brightness and partial transparency (opacity = 60%).
* **Rotate** the resulting image (including the overlay) by 10 degrees

And here's the URL that's automatically generated and rendered from the above code:

![Sample image transformation](https://res.cloudinary.com/demo/image/upload/c_thumb,g_face,h_150,w_150/r_20/e_sepia/l_cloudinary_icon,e_brightness:90,o_60,w_50/fl_layer_apply,g_south_east,x_5,y_5/a_10/c_limit,w_384/f_auto/q_auto/v1/front_face "disable_all_tab: true, with_code:false, with_image:true")

> **TIP**: Notice that image optimizations: `c_limit,w_384/f_auto/q_auto`, are automatically applied by the Next.js SDK.

> **Learn more about image transformations**:
>
> * Read the [image transformation guide](image_transformations) to learn about the different ways to transform your images.

> * See more examples of [image transformations](nextjs_image_transformations) using the Cloudinary Next.js SDK.

> * See all possible transformations in the [Transformation URL API reference](transformation_reference).

### Quick example: Video transformations

Here's an example to get you started with video transformations using the `CldVideoPlayer` component.

The following Next.js code renders the ship.mp4 video with the Cloudinary Video Player and transformations applied:

```jsx
'use client';

import { CldVideoPlayer, getCldImageUrl } from 'next-cloudinary';
import 'next-cloudinary/dist/cld-video-player.css';

export default function Page() {
  return (
      <div style={{ width: '300px', height: '300px' }}>
        <CldVideoPlayer
          width="300"
          height="300"
          src="ship"
          transformation={[
            {
              width: 300,
              height: 300,
              crop: 'fill',
              gravity: 'auto'
            },
            {
              effect: 'blur:50'
            },
            {
              radius: 'max'
            }
          ]}
          poster={getCldImageUrl({
            src: 'ship',
            assetType: 'video',
            rawTransformations: [
              'c_fill,g_auto,h_300,w_300',
              'e_blur:50',
              'r_max'
            ]
          })}
        />
      </div>
  );
}
```

This code performs the following transformations on the video:

* **Crop** to a 1:1 aspect ratio (square) with a width of 300 pixels, using automatic gravity to determine the focal point
* Apply a **blur effect** with strength 50
* Apply **maximum rounding** to create a circular video

> **Learn more about video transformations**:
>
> * See the [Next.js video transformations](nextjs_video_transformations) guide for all available props and examples.

> * See all possible transformations in the [Transformation URL API reference](transformation_reference).

### Uploading assets

The Next.js SDK provides two components for uploading assets, [CldUploadButton](#clduploadbutton) and [CldUploadWidget](#clduploadwidget).

> **NOTE**: Neither of these options provide styled buttons by default.

#### CldUploadButton

A drop-in button component that opens the Cloudinary Upload Widget:

```jsx
'use client';

import { CldUploadButton } from 'next-cloudinary';

export default function Page() {
  return (
    <CldUploadButton uploadPreset="your_upload_preset" />
  );
}
```

#### CldUploadWidget

A customizable upload widget component:

```jsx
'use client';

import { CldUploadWidget } from 'next-cloudinary';

export default function Page() {
  return (
    <CldUploadWidget uploadPreset="your_upload_preset">
      {({ open }) => {
        return (
          <button onClick={() => open()}>
            Upload an Image
          </button>
        );
      }}
    </CldUploadWidget>
  );
}
```

> **Learn more about uploading**:
>
> * See the [Next.js image and video upload](nextjs_image_and_video_upload) guide for all available props and examples, including information on signed uploads for secure uploading.

### Social media cards

Generate Open Graph images and social media cards with the `CldOgImage` component:

```jsx
import { CldOgImage } from 'next-cloudinary';

export default function Page() {
  return (
    <CldOgImage
      src="your_public_id"
      alt="Social media card"
    />
  );
}
```

The component automatically generates the appropriate meta tags for social media platforms with links to the Cloudinary-hosted images.

```html
<meta property="og:image" content="https://res.cloudinary.com/.../sample" />
<meta property="og:image:secure_url" content="https://res.cloudinary.com/.../sample" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:image" content="https://res.cloudinary.com/.../sample" />
```

> **Learn more about social media cards**:
>
> * See the [Social media cards with CldOgImage](nextjs_image_transformations#social_media_cards_with_cldogimage) section in the image transformations guide for detailed examples and configuration options.

> * Learn about [Open Graph protocol](https://ogp.me/) for social media sharing.

## Helper methods

In addition to components, the Next.js SDK provides helper methods for generating Cloudinary URLs:

### getCldImageUrl

Generate a Cloudinary image URL using the same API as `CldImage`:

```jsx
import { getCldImageUrl } from 'next-cloudinary';

const url = getCldImageUrl({
  src: 'sample',
  width: 500,
  height: 500
});
```

[Learn more](nextjs_image_transformations#using_getcldimageurl)

### getCldOgImageUrl

Generate a Cloudinary URL specifically for OG Images or Social Media Cards:

```jsx
import { getCldOgImageUrl } from 'next-cloudinary';

const url = getCldOgImageUrl({
  src: 'sample',
  width: 1200,
  height: 627
});
```

[Learn more](nextjs_image_transformations#using_getcldogimageurl_helper)

### getCldVideoUrl

Generate a Cloudinary video URL:

```jsx
import { getCldVideoUrl } from 'next-cloudinary';

const url = getCldVideoUrl({
  src: 'ship',
  width: 1920,
  height: 1080
});
```

[Learn more](nextjs_video_transformations#alternative_using_getcldvideourl_helper)

## Next.js App Router

The Next.js SDK fully supports the App Router introduced in Next.js 13. When using components in the App Router, make sure to add the `'use client'` directive at the top of your file:

```jsx
'use client';

import { CldImage } from 'next-cloudinary';

export default function Page() {
  return (
    <CldImage
      src="sample"
      width="500"
      height="500"
      alt="Sample image"
    />
  );
}
```

## Sample projects
Take a look at the [Next.js sample projects][sample-projects-link] page to help you get started integrating Cloudinary into your Next.js application.
> **READING**:
>
> * Try out the Next.js SDK using the [quick start](nextjs_quick_start).

> * See examples of powerful [image](nextjs_image_transformations) and [video](nextjs_video_transformations) transformations using Next.js code, and see our [image transformation](image_transformations) and [video transformation](video_manipulation_and_delivery) docs.

> * For information about uploading images and videos from a Next.js application, see [Next.js image and video upload](nextjs_image_and_video_upload).

> * Explore the [GitHub repository](https://github.com/cloudinary-community/next-cloudinary), [Changelog](https://github.com/cloudinary-community/next-cloudinary/blob/main/CHANGELOG.md), and [NPM package](https://www.npmjs.com/package/next-cloudinary).

> * Stay tuned for updates by following the [Release Notes](programmable_media_release_notes) and the [Cloudinary Blog](https://cloudinary.com/blog).
