---
name: cloudinary-nextjs-image-transformations
description: >
  CldImage and Next.js image transformations — resize, crop, overlays, effects,
  getCldImageUrl, responsive delivery. Load for image transform debugging in Next.js;
  file is large — read only the section matching the task.
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

# Next.js image transformations


## Overview

The Next.js SDK provides the `CldImage` component for rendering images with transformations. The component is built on top of the Next.js Image component, providing all the benefits of Next.js image optimization while adding Cloudinary's powerful transformation capabilities.

If you haven't yet installed the Next.js SDK, you might want to jump to the [quick start](nextjs_quick_start) first. 

See also: [Next.js video transformations](nextjs_video_transformations)

## Image transformations with Next.js

### Using CldImage

To transform and display an image asset, use the `CldImage` component with transformation props. For example:

```jsx
'use client';

import { CldImage } from 'next-cloudinary';

export default function Page() {
  return (
    <CldImage
      src="front_face"
      width="150"
      height="150"
      crop="thumb"
      gravity="face"
      grayscale
      alt="Cropped face in grayscale"
    />
  );
}
```

This produces the following HTML:

```html
<img alt="Cropped face in grayscale" loading="lazy" width="150" height="150" decoding="async" data-nimg="1"
 srcset="https://res.cloudinary.com/demo/image/upload/e_grayscale/c_thumb,w_256,h_256,g_face/f_auto/q_auto/v1/front_face?_a=BAVMn6B00 1x, 
 https://res.cloudinary.com/demo/image/upload/e_grayscale/c_thumb,w_384,h_384,g_face/f_auto/q_auto/v1/front_face?_a=BAVMn6B00 2x" 
 src="https://res.cloudinary.com/demo/image/upload/e_grayscale/c_thumb,w_384,h_384,g_face/f_auto/q_auto/v1/front_face?_a=BAVMn6B00" 
 style="color: transparent;">
```

The HTML displays the front_face image as a 150 x 150 pixel grayscale thumbnail, focusing on the face:

  

A key benefit of the Next.js SDK is that it automatically optimizes images for responsiveness, format and quality. While you might expect your transformation to use the URL parameters `c_thumb,g_face,h_150,w_150/e_grayscale`, the SDK dynamically adjusts the width and height parameters in the generated URLs based on responsive breakpoints and automatically adds `f_auto/q_auto`.

![Cropped face in grayscale](https://res.cloudinary.com/demo/image/upload/e_grayscale/c_thumb,w_384,h_384,g_face/f_auto/q_auto/v1/front_face "with_code:false, with_image:false, with_url:true")

> **NOTES**:
>
> * `f_auto/q_auto` is added to ensure the best format and quality are delivered - [learn more](image_optimization).

> * The width and height are using the closest breakpoints to the requested dimensions as defined by the `srcset` - [learn more](responsive_images).

> * As `CldImage` is a wrapper around the Next.js `Image` component, you also gain access to all built-in `Image` component features, like [Responsive sizing](#responsive_images).

> * The order of props in the `CldImage` component doesn't guarantee the order of transformations in the URL - [learn more](#ensuring_transformation_order_in_chained_transformations).

#### Required props

These are the props required to use `CldImage`:

{table:class=sdk-props-table} Prop | Type | Required | Example Value | More Info
--|--|--|--|--
alt | string | Yes | `"Dog catching a frisbee"` | [alt](https://nextjs.org/docs/pages/api-reference/components/image#alt)
height | number &#124; string | Yes, unless using Next Image [fill](https://nextjs.org/docs/pages/api-reference/components/image#fill) | `{600}`, `"600"` | [height](https://nextjs.org/docs/pages/api-reference/components/image#height)
src | string | Yes | `"my-public-id"` | A [public ID](cloudinary_glossary#public_id) or a [full Cloudinary URL](#using_cloudinary_urls_as_source).
width | number &#124; string | Yes, unless using Next Image [fill](https://nextjs.org/docs/pages/api-reference/components/image#fill) | `{600}`, `"600"` | [width](https://nextjs.org/docs/pages/api-reference/components/image#width)

#### Next Image props

`CldImage` extends the Next.js Image component, which means all props available on the Image component are also available on `CldImage`. For more information, see the [Next.js Image documentation](https://nextjs.org/docs/pages/api-reference/components/image).

##### Using fill

Because `CldImage` extends Next.js Image, it's important to understand the distinction between what "fill" applies to in different contexts:

* The Next.js Image [fill](https://nextjs.org/docs/pages/api-reference/components/image#fill) prop causes the image to expand to the size of the parent element.
* The Cloudinary [fill crop mode](https://cloudinary.com/documentation/transformation_reference#c_fill) crops the image file itself to the aspect ratio of the parent element, while keeping important content in the crop.

To use the Next.js Image fill mode, set `fill` or `fill={true}`.

To use the Cloudinary fill crop mode, set `crop="fill"`.

Using the Next.js Image fill mode can result in the image squashing or stretching if the container's aspect ratio doesn't match that of the image.

For example, the original image has dimensions of 1000 x 636 pixels. When it's displayed inside a 250 x 250 pixel container, the image appears squashed:

```jsx
<div style={{ width: '250px', height: '250px', position: 'relative' }}>
  <CldImage
    src="basketball_in_net"
    fill
    alt="Squashed basketball in net"
  />
</div>
```

When you use the Cloudinary fill crop mode, auto gravity intelligently crops the image to preserve key content and avoids squashing or distortion:

```jsx
<div style={{ width: '250px', height: '250px', position: 'relative' }}>
  <CldImage
    src="basketball_in_net"
    width="250"
    height="250"
    crop="fill"
    alt="Basketball in net"
  />
</div>
```      

###  Using getCldImageUrl

You can also generate a Cloudinary URL directly using the `getCldImageUrl` helper method and display it in a standard `img` tag:

```jsx
'use client';

import { getCldImageUrl } from 'next-cloudinary';

export default function Page() {
  const url = getCldImageUrl({
    src: 'front_face',
    width: 150,
    height: 150,
    crop: 'thumb',
    gravity: 'face',
    grayscale: true
  });

  return (
    <div>
      <img 
        src={url} 
        alt="Cropped face in grayscale" 
        width="150" 
        height="150"
      />
    </div>
  );
}
```

The `getCldImageUrl` method returns the transformation URL:

![Cropped face in grayscale](https://res.cloudinary.com/demo/image/upload/e_grayscale/c_thumb,w_150,h_150,g_face/f_auto/q_auto/v1/front_face "with_url:true, with_code:false, with_image:false")

With the full HTML looking like this:

```html
<img alt="Cropped face with rounded corners" width="150" height="150" 
src="https://res.cloudinary.com/demo/image/upload/e_grayscale/c_thumb,w_150,h_150,g_face/f_auto/q_auto/v1/front_face?_a=BAVMn6B00">
```

In this case, the width and height are set exactly as specified, unlike when using [CldImage](#using_cldimage), which automatically adjusts dimensions based on responsive breakpoints.

### Ensuring transformation order in chained transformations

When using multiple transformations with the `CldImage` component or the `getCldImageUrl` method, the order in which they appear in the URL isn't guaranteed. This can affect transformations that depend on a specific sequence, such as overlays, underlays, or chained effects.

For example, cropping an image to keep the right side (east) and then applying rounded corners produces a different result than applying rounded corners first and then cropping:

**Crop to east first, then apply rounded corners:**

![Cropped to east then rounded](https://res.cloudinary.com/demo/image/upload/c_fill,g_east,h_300,w_300/r_30/f_auto/q_auto/cld-sample-3 "with_code: false, with_url:true")

**Apply rounded corners first, then crop to east:**

![Rounded then cropped to east](https://res.cloudinary.com/demo/image/upload/r_30/c_fill,g_east,h_300,w_300/f_auto/q_auto/cld-sample-3 "with_code: false, with_url:true")

Notice that in the second example, the left corners aren't rounded because the rounding happened before the image was cropped. Also, the rounding on the right corners is less pronounced because the original image is 1870 x 1250px. 

To ensure the order of transformations, use raw transformations.

#### Raw transformations

The `rawTransformations` parameter allows you to pass transformation strings using [transformation URL syntax](transformation_reference). This allows you to control the order in which they're applied to the URL.

With `CldImage`:

```jsx
<CldImage
  src="cld-sample-3"
  width="300"
  height="300"
  rawTransformations={['c_fill,w_300,h_300,g_east', 'r_30']}
  alt="Cropped to east then rounded"
/>
```

With `getCldImageUrl`:

```jsx
const rawUrl = getCldImageUrl({
  src: 'cld-sample-3',
  rawTransformations: ['c_fill,w_300,h_300,g_east', 'r_30']
});
```

The resulting URL:

![Cropped to east then rounded](https://res.cloudinary.com/demo/image/upload/c_fill,g_east,h_300,w_300/r_30/f_auto/q_auto/cld-sample-3 "with_code: false, with_url:true")

> **NOTES**:
>
> * When using `rawTransformations`, if you include a format (`f_`, such as `f_png` or even `f_auto`) or quality (`q_`, such as `q_70` or `q_auto`) transformation, the raw transformation is respected and `f_auto` and/or `q_auto` aren't automatically additionally applied to the URL.

> * The height and width set in the raw transformation define the image's aspect ratio, while the height and width props limit how large the image appears on the page.

> * You can combine other transformation props with `rawTransformations` and they'll be applied to the end of the transformation chain.

### Using Cloudinary URLs as source

You can pass a full Cloudinary URL as the `src` prop. The URL must include a version number (`/v1234/`) to be correctly parsed:

```jsx
<CldImage
  src="https://res.cloudinary.com/demo/image/upload/v1234/sample"
  width="500"
  height="500"
  alt="Image from Cloudinary URL"
/>
```

#### Preserving existing transformations

If your Cloudinary URL in `src` already has transformations applied, use `preserveTransformations` to keep them:

```jsx
<CldImage
  src="https://res.cloudinary.com/demo/image/upload/e_background_removal/b_blueviolet/v1/sample"
  width="500"
  height="500"
  preserveTransformations
  alt="Image with preserved transformations"
/>
```

Or, with `getCldImageUrl`:

```jsx
const preservedUrl = getCldImageUrl({
  src: 'https://res.cloudinary.com/demo/image/upload/e_background_removal/b_blueviolet/v1/sample',
  width: 500,
  height: 500,
  preserveTransformations: true
});
```

Any other transformation props that you include are applied in addition to the existing transformation.

## Common image transformations

The following transformations are available for both `CldImage` and `getCldImageUrl`:

{table:class=sdk-props-table} Prop/Name | Type | Default | Example Value | More Info |
|--|--|--|--|--|
| angle | number | - | `45` | [angle](#angle) |
| aspectRatio | string | - | `"16:9"` | [aspectRatio](#aspectratio) |
| background | string | - | `"blue"`, `"rgb:0000ff"` | [background](#background) |
| crop | string &#124; object | limit | `"fill"`, `{ type: 'thumb', source: true }` | [crop](#crop) |
| enhance | boolean | - | `true` | [enhance](#enhance) |
| extract | string &#124; array &#124; object | - | `"space jellyfish"`, `['camera', 'man']`, `{ prompt: 'woman', multiple: true }` | [extract](#extract) |
| fillBackground | boolean &#124; object | - | `true`, `{ gravity: 'east', prompt: 'cupcakes' }` | [fillBackground](#fillbackground) |
| gravity | string | auto | `"faces"` | [gravity](#gravity) |
| loop | boolean &#124; number | - | `true`, `3` | [loop](#loop) |
| recolor | array &#124; object | - | `['duck', 'blue']`, `{ prompt: 'goose', to: 'blue', multiple: true }` | [recolor](#recolor) |
| remove | string &#124; array &#124; object | - | `"apple"`, `['keyboard', 'mouse']`, `{ prompt: 'apple', multiple: true }` | [remove](#remove) |
| removeBackground | boolean &#124; string | false | `true`, `"cloudinary_ai"` | [removeBackground](#removebackground) |
| replace | array &#124; object | - | `['apple', 'banana']`, `{ from: 'shirt', to: 'sweater', preserveGeometry: true }` | [replace](#replace) |
| replaceBackground | boolean &#124; string &#124; object | - | `true`, `"fish tank"`, `{ prompt: 'fish tank', seed: 3 }` | [replaceBackground](#replacebackground) |
| restore | boolean | - | `true` | [restore](#restore) |
| zoom | string | - | `"0.5"` | [zoom](#zoom) |
| zoompan | boolean &#124; string &#124; object | - | `true`, `"loop"`, `{ loop: 2, options: 'mode_ztr' }` | [zoompan](#zoompan) |

### angle

Rotates the image by a specified angle.

```jsx
<CldImage
  src="cld-sample-5"
  width="150"
  height="150"
  angle={45}
  alt="Rotated image"
/>
```

![Rotated image](https://res.cloudinary.com/demo/image/upload/a_45/c_limit,w_150/f_auto/q_auto/v1/cld-sample-5 "with_code:false, with_url:false")

[Learn more](transformation_reference#a_angle)

### aspectRatio

Resizes the image to a new aspect ratio.

#### Usage constraints

The `aspectRatio` prop works only with specific crop modes: `auto`, `crop`, `fill`, `lfill`, `fill_pad`, and `thumb`.

Because Next.js Image components require `width` and `height` props (unless using `fill`), and these props conflict with aspect ratio transformations, you must use the `fill` prop when applying `aspectRatio`.

Requirements for using `aspectRatio`:

* Set `fill={true}` on the component
* Use a supported crop mode
* Omit the `width` and `height` props

```jsx
<div style={{ position: 'relative', aspectRatio: '9 / 16', maxWidth: '150px' }}>
  <CldImage
    src="cld-sample-3"
    sizes="(max-width: 150px) 100vw, 150px"
    aspectRatio="9:16"
    crop="fill"
    fill={true}
    alt="Different aspect ratio"
  />
</div>
```

![Different aspect ratio](https://res.cloudinary.com/demo/image/upload/c_fill,ar_9:16,w_150,g_auto/f_auto/q_auto/v1/cld-sample-3 "with_code:false, with_url:false")

If using `getCldImageUrl`, you can specify `width` or `height` together with `aspectRatio`: 

```jsx
const responsiveUrl = getCldImageUrl({
  src: 'cld-sample-3',
  width: 150,
  aspectRatio: '9:16',
  crop: 'fill'
});
```

[Learn more](transformation_reference#ar_aspect_ratio)

### background

Applies a solid color background to transparent or empty areas. You can use color names or RGB values:

**Color name:**

```jsx
<CldImage
  src="car_white"
  width="300"
  height="300"
  background="red"
  alt="Image with named color background"
/>
```

**RGB value:**

```jsx
<CldImage
  src="car_white"
  width="300"
  height="300"
  background="rgb:ff0000"
  alt="Image with RGB color background"
/>
```

![Image with RGB color background](https://res.cloudinary.com/demo/image/upload/b_rgb:ff0000/c_limit,w_300/f_auto/q_auto/v1/car_white "with_code:false, with_url:false")

[Learn more](transformation_reference#b_color_value)

### crop

Changes the size of the delivered asset according to the requested width and height dimensions.

The `crop` prop can be a string (any valid [Cloudinary crop mode](transformation_reference#c_crop_resize), e.g. `"thumb"`), or an object (or array of objects) with the following options:

{table:class=sdk-props-table} Option | Type | Example Value | More Info
--|--|--|--
aspectRatio | string | `"16:9"` | [aspectRatio](#aspectratio)
gravity | string | `"face"` | [gravity](#gravity)
height | string | `"300"` | [height](#required_props)
source | boolean | `true` | [source](#dynamic_crop_modes)
type (crop mode) | string | `"fill"` | [c (crop/resize)](transformation_reference#c_crop_resize)
width | string | `"300"` | [width](#required_props)
x | number &#124; string | `100`, `"100"` | [x, y (x & y coordinates)](transformation_reference#x_y_coordinates)
y | number &#124; string | `200`, `"200"` | [x, y (x & y coordinates)](transformation_reference#x_y_coordinates)
zoom | string | `"1.75"` | [zoom](#zoom)

#### Dynamic crop modes

When using a dynamic crop mode like `thumb`, the resulting image may look visually different based on the given dimensions. For instance, an image cropped using `thumb` with dimensions 600x600 will give different results than 1200x1200 (assuming a gravity of `auto` or similar, which is the default for `CldImage`).

This is especially important for [responsive images](#responsive_images), where the resize mechanism may cause different device sizes to show different-looking images, which doesn't provide a great experience.

To resolve this, when using dynamic crop modes, you can opt into a two-stage crop: first cropping the original source image, then allowing the resize mechanism to handle resizing to the appropriate device size.

> **NOTE**: Versions 5 and below of Next Cloudinary automatically opted `CldImage` into two-stage cropping to improve the experience, but this came with [drawbacks](https://github.com/cloudinary-community/next-cloudinary/discussions/432) including prematurely limiting the potential resulting size of an image.

#### Examples

**Cropping an image and filling the containing space:**

```jsx
<CldImage
  src="basketball_in_net"
  width="300"
  height="300"
  crop="fill"
  alt="Cropped image"
/>
```

![Cropped image](https://res.cloudinary.com/demo/image/upload/c_fill,w_300,h_300,g_auto/f_auto/q_auto/v1/basketball_in_net "with_code: false, with_url: false")

> **TIP**: By default, `CldImage` uses a gravity of `auto`, meaning the crop automatically positions the subject in the center of the resulting image.

**Using a crop of `thumb` on the original source image:**

```jsx
<CldImage
  src="docs/camera"
  width="300"
  height="300"
  crop={{
    width: 1200,
    height: 1200,
    type: 'thumb',
    source: true
  }}
  alt="Thumbnail crop"
/>
```

![Thumbnail crop](https://res.cloudinary.com/demo/image/upload/c_thumb,w_1200,h_1200,g_auto/c_limit,w_300/f_auto/q_auto/v1/docs/camera "with_code: false, with_url: false")

**Using coordinates to crop to a specific location:**

```jsx
<CldImage
  src="docs/camera"
  width="250"
  height="250"
  crop={{
    type: 'crop',
    width: 350,
    height: 400,
    x: 50,
    y: 40,
    gravity: 'north_east',
    source: true
  }}
  alt="Coordinate-based crop"
/>
```

![Coordinate-based crop](https://res.cloudinary.com/demo/image/upload/c_crop,w_350,h_400,x_50,y_40,g_north_east/c_limit,w_250/f_auto/q_auto/v1/docs/camera "with_code: false, with_url: false")

[Learn more](transformation_reference#c_crop_resize)

### enhance

Uses AI to enhance the visual appeal of an image:

```jsx
<CldImage
  src="docs/under-exposed"
  width="200"
  height="200"
  enhance
  alt="Enhanced image"
/>
```

![Enhanced image](https://res.cloudinary.com/demo/image/upload/e_enhance/c_limit,w_200/f_auto/q_auto/v1/docs/under-exposed "with_code: false, with_url: false")

[Learn more](transformation_reference#e_enhance)

### extract

Extracts an area or multiple areas of an image, described in natural language, keeping the content of the extracted area (like background removal) or making the extracted area transparent while keeping the rest of the image, which can be helpful for creating a mask.

The `extract` prop can be a string (the prompt of what to extract, e.g. `"the woman on the left"`), an array of strings, or an object with the following options:

{table:class=sdk-props-table} Option | Type | Example Value
--|--|--
invert | boolean | `true`
mode | string | `"mask"`
multiple | boolean | `true`
prompt | string | `"the woman on the left"`

For more info about each of the options, see the [extract syntax details](transformation_reference#syntax_e_extract).

#### Examples

**Extracting part of the image by prompt:**

```jsx
<CldImage
  src="docs/ladies-smiling"
  width="300"
  height="300"
  extract="the woman on the left"
  alt="Extracted content"
/>
```

![Extracted content](https://res.cloudinary.com/demo/image/upload/e_extract:prompt_the%20woman%20on%20the%20left/c_limit,w_300/f_auto/q_auto/v1/docs/ladies-smiling "with_code: false, with_url: false")

**Using an array of strings:**

```jsx
<CldImage
  src="docs/camera"
  width="300"
  height="300"
  extract={['the camera', 'the man', 'the straps hanging from the camera']}
  alt="Extracted multiple objects"
/>
```

![Extracted multiple objects](https://res.cloudinary.com/demo/image/upload/e_extract:prompt_(the%20camera;the%20man;the%20straps%20hanging%20from%20the%20camera)

```nodejs
cloudinary.image("e_extract:prompt_(the camera;the man;the straps hanging from the camera")
```

```react
new CloudinaryImage(
  "e_extract:prompt_(the camera;the man;the straps hanging from the camera"
);
```

```vue
new CloudinaryImage(
  "e_extract:prompt_(the camera;the man;the straps hanging from the camera"
);
```

```angular
new CloudinaryImage(
  "e_extract:prompt_(the camera;the man;the straps hanging from the camera"
);
```

```js
new CloudinaryImage(
  "e_extract:prompt_(the camera;the man;the straps hanging from the camera"
);
```

```python
CloudinaryImage("e_extract:prompt_(the camera;the man;the straps hanging from the camera").image()
```

```php
(new ImageTag('e_extract:prompt_(the camera;the man;the straps hanging from the camera'));
```

```java
cloudinary.url().transformation(new Transformation().imageTag("e_extract:prompt_(the camera;the man;the straps hanging from the camera");
```

```ruby
cl_image_tag("e_extract:prompt_(the camera;the man;the straps hanging from the camera")
```

```csharp
cloudinary.Api.UrlImgUp.BuildImageTag("e_extract:prompt_(the camera;the man;the straps hanging from the camera")
```

```dart
cloudinary.image('e_extract:prompt_(the camera;the man;the straps hanging from the camera').transformation(Transformation());
```

```swift
imageView.cldSetImage(cloudinary.createUrl().generate("e_extract:prompt_(the camera;the man;the straps hanging from the camera")!, cloudinary: cloudinary)
```

```android
MediaManager.get().url().transformation(new Transformation().generate("e_extract:prompt_(the camera;the man;the straps hanging from the camera");
```

```flutter
cloudinary.image('e_extract:prompt_(the camera;the man;the straps hanging from the camera').transformation(Transformation());
```

```kotlin
cloudinary.image {
	publicId("e_extract:prompt_(the camera;the man;the straps hanging from the camera") 
}.generate()
```

```jquery
$.cloudinary.image("e_extract:prompt_(the camera;the man;the straps hanging from the camera")
```

```react_native
new CloudinaryImage(
  "e_extract:prompt_(the camera;the man;the straps hanging from the camera"
);
```/c_limit,w_300/f_auto/q_auto/v1/docs/camera "with_code: false, with_url: false")

**Using object syntax:**

```jsx
<CldImage
  src="docs/ladies-smiling"
  width="300"
  height="300"
  extract={{
    prompt: 'woman',
    multiple: true,
    mode: 'mask',
    invert: true
  }}
  alt="Extracted with mask"
/>
```

![Extracted with mask](https://res.cloudinary.com/demo/image/upload/e_extract:prompt_woman;invert_true;mode_mask;multiple_true/c_limit,w_300/f_auto/q_auto/v1/docs/ladies-smiling "with_code: false, with_url: false")

**Using object syntax with multiple prompts:**

```jsx
<CldImage
  src="docs/camera"
  width="300"
  height="300"
  extract={{
    prompt: ['the camera', 'the man', 'the straps hanging from the camera'],
    mode: 'mask'
  }}
  alt="Extracted multiple with mask"
/>
```

![Extracted with mask](https://res.cloudinary.com/demo/image/upload/e_extract:prompt_(the%20camera;the%20man;the%20straps%20hanging%20from%20the%20camera)

```nodejs
cloudinary.image("e_extract:prompt_(the camera;the man;the straps hanging from the camera")
```

```react
new CloudinaryImage(
  "e_extract:prompt_(the camera;the man;the straps hanging from the camera"
);
```

```vue
new CloudinaryImage(
  "e_extract:prompt_(the camera;the man;the straps hanging from the camera"
);
```

```angular
new CloudinaryImage(
  "e_extract:prompt_(the camera;the man;the straps hanging from the camera"
);
```

```js
new CloudinaryImage(
  "e_extract:prompt_(the camera;the man;the straps hanging from the camera"
);
```

```python
CloudinaryImage("e_extract:prompt_(the camera;the man;the straps hanging from the camera").image()
```

```php
(new ImageTag('e_extract:prompt_(the camera;the man;the straps hanging from the camera'));
```

```java
cloudinary.url().transformation(new Transformation().imageTag("e_extract:prompt_(the camera;the man;the straps hanging from the camera");
```

```ruby
cl_image_tag("e_extract:prompt_(the camera;the man;the straps hanging from the camera")
```

```csharp
cloudinary.Api.UrlImgUp.BuildImageTag("e_extract:prompt_(the camera;the man;the straps hanging from the camera")
```

```dart
cloudinary.image('e_extract:prompt_(the camera;the man;the straps hanging from the camera').transformation(Transformation());
```

```swift
imageView.cldSetImage(cloudinary.createUrl().generate("e_extract:prompt_(the camera;the man;the straps hanging from the camera")!, cloudinary: cloudinary)
```

```android
MediaManager.get().url().transformation(new Transformation().generate("e_extract:prompt_(the camera;the man;the straps hanging from the camera");
```

```flutter
cloudinary.image('e_extract:prompt_(the camera;the man;the straps hanging from the camera').transformation(Transformation());
```

```kotlin
cloudinary.image {
	publicId("e_extract:prompt_(the camera;the man;the straps hanging from the camera") 
}.generate()
```

```jquery
$.cloudinary.image("e_extract:prompt_(the camera;the man;the straps hanging from the camera")
```

```react_native
new CloudinaryImage(
  "e_extract:prompt_(the camera;the man;the straps hanging from the camera"
);
```;mode_mask/c_limit,w_300/f_auto/q_auto/v1/docs/camera "with_code: false, with_url: false")

[Learn more](transformation_reference#e_extract)

### fillBackground

Automatically fills the padded area using generative AI to extend the image seamlessly.

The `fillBackground` prop can be a boolean (which uses safe defaults), or an object with the following options:

{table:class=sdk-props-table}  Option    | Type   | Example Value  |
|---------|--------|----------|
| crop    | string | `"lpad"`    |
| gravity | string | `"south"`    |
| prompt  | string | `"cupcakes"` |

For crop modes that `fillBackground` supports, see [b_gen_fill](transformation_reference#b_gen_fill).

#### Examples

**Applying Generative Fill with defaults:**

```jsx
<CldImage
  src="docs/coffee-man"
  width="200"
  height="400"
  fillBackground
  alt="Image with generative fill"
/>
```

![Image with generative fill](https://res.cloudinary.com/demo/image/upload/b_gen_fill,ar_640:1280,c_pad/c_limit,w_200/f_auto/q_auto/v1/docs/coffee-man "with_code: false, with_url: false")

**Customizing options:**

In this example, the [limit pad](transformation_reference#c_lpad) crop mode and a gravity of "north" are used to add generative padding to the bottom of the image. Setting `gravity: "north"` positions the original image at the top, allowing the generative fill to appear at the bottom.

```jsx
<CldImage
    src="docs/coffee-man"
    width="200"
    height="400"
    fillBackground={{
        crop: "lpad",
        gravity: "north",
        prompt: "cupcakes"
    }}
    alt="Image with custom generative fill"
/>
```

![Image with custom generative fill](https://res.cloudinary.com/demo/image/upload/b_gen_fill:cupcakes,ar_640:1280,c_lpad,g_north/c_limit,w_200/f_auto/q_auto/v1/docs/coffee-man "with_code: false, with_url: false")

[Learn more](transformation_reference#b_gen_fill)

### gravity

The `gravity` prop determines which part of the image to focus on when cropping:

```jsx
<CldImage
  src="cld-sample"
  width="300"
  height="300"
  crop="fill"
  gravity="face"
  alt="Face-focused crop"
/>
```

Common gravity values include: `auto`, `face`, `faces`, `center`, `north`, `south`, `east`, `west`, `north_east`, `north_west`, `south_east`, `south_west`.

![Image with custom generative fill](https://res.cloudinary.com/demo/image/upload/c_fill,w_300,h_300,g_face/f_auto/q_auto/v1/cld-sample "with_code: false, with_url: false")

[Learn more](transformation_reference#g_gravity)

### loop

Loops an animated image infinitely or for the specified number of times.

```jsx
<CldImage
  src="spiral_animated"
  width="300"
  height="300"
  loop
  alt="Looping animation"
/>
```

![Looping animation](https://res.cloudinary.com/demo/image/upload/e_loop/c_limit,w_300/f_auto/q_auto/v1/spiral_animated "with_code: false, with_url: false")

[Learn more](transformation_reference#e_loop)

### recolor

Uses generative AI to recolor parts of your image, maintaining the relative shading.

The `recolor` prop can be an array with the objects to be replaced, or an object with the following options:

{table:class=sdk-props-table} Option | Type | Example Value
---------|------------------|----------------------
multiple | boolean          | `true`
prompt   | string &#124; array | `"duck"`, `["duck", "horse"]`
to       | string           | `"blue"`

For more information, see [gen_recolor](transformation_reference#e_gen_recolor).

#### Examples

**Recoloring an object with an array:**

```jsx
<CldImage
  src="docs/geese"
  width="300"
  height="300"
  recolor={['goose', 'blue']}
  alt="Recolored image"
/>
```

![Recolored image](https://res.cloudinary.com/demo/image/upload/e_gen_recolor:prompt_goose;to-color_blue/c_limit,w_300/f_auto/q_auto/v1/docs/geese "with_code: false, with_url: false")

**Using the object format:**

```jsx
<CldImage
  src="docs/geese"
  width="300"
  height="300"
  recolor={{
    prompt: 'goose',
    to: 'blue',
    multiple: true
  }}
  alt="Recolored image"
/>
```

![Recolored multiple](https://res.cloudinary.com/demo/image/upload/e_gen_recolor:prompt_goose;to-color_blue;multiple_true/c_limit,w_300/f_auto/q_auto/v1/docs/geese "with_code: false, with_url: false")

[Learn more](transformation_reference#e_gen_recolor)

### remove

Uses generative AI to remove unwanted parts of your image, replacing the area with realistic pixels.

The `remove` prop can be a string (the prompt of what to remove, e.g. `"person"`), an array, or an object with the following options:

{table:class=sdk-props-table} Option       | Type            | Example Value |
|--------------|-----------------|---------------|
| multiple     | boolean         | `true` |
| prompt       | string &#124; array | `"duck"`, `["duck", "horse"]` |
| removeShadow | boolean         | `true` |
| region       | array           | `[300, 200, 1900, 3500]` |

For more information, see [gen_remove](transformation_reference#e_gen_remove).

#### Examples

**Removing an object by string:**

```jsx
<CldImage
  src="docs/horse-with-rider"
  width="300"
  height="300"
  remove="person"
  alt="Image with person removed"
/>
```

![Image with person removed](https://res.cloudinary.com/demo/image/upload/e_gen_remove:prompt_person/c_limit,w_300/f_auto/q_auto/v1/docs/horse-with-rider "with_code: false, with_url: false")

**Removing multiple objects by array:**

```jsx
<CldImage
  src="docs/gadgets"
  width="300"
  height="300"
  remove={['keyboard', 'mouse', 'phone']}
  alt="Image with gadgets removed"
/>
```

![Image with gadgets removed](https://res.cloudinary.com/demo/image/upload/e_gen_remove:prompt_(keyboard;mouse;phone)

```nodejs
cloudinary.image("e_gen_remove:prompt_(keyboard;mouse;phone")
```

```react
new CloudinaryImage("e_gen_remove:prompt_(keyboard;mouse;phone");
```

```vue
new CloudinaryImage("e_gen_remove:prompt_(keyboard;mouse;phone");
```

```angular
new CloudinaryImage("e_gen_remove:prompt_(keyboard;mouse;phone");
```

```js
new CloudinaryImage("e_gen_remove:prompt_(keyboard;mouse;phone");
```

```python
CloudinaryImage("e_gen_remove:prompt_(keyboard;mouse;phone").image()
```

```php
(new ImageTag('e_gen_remove:prompt_(keyboard;mouse;phone'));
```

```java
cloudinary.url().transformation(new Transformation().imageTag("e_gen_remove:prompt_(keyboard;mouse;phone");
```

```ruby
cl_image_tag("e_gen_remove:prompt_(keyboard;mouse;phone")
```

```csharp
cloudinary.Api.UrlImgUp.BuildImageTag("e_gen_remove:prompt_(keyboard;mouse;phone")
```

```dart
cloudinary.image('e_gen_remove:prompt_(keyboard;mouse;phone').transformation(Transformation());
```

```swift
imageView.cldSetImage(cloudinary.createUrl().generate("e_gen_remove:prompt_(keyboard;mouse;phone")!, cloudinary: cloudinary)
```

```android
MediaManager.get().url().transformation(new Transformation().generate("e_gen_remove:prompt_(keyboard;mouse;phone");
```

```flutter
cloudinary.image('e_gen_remove:prompt_(keyboard;mouse;phone').transformation(Transformation());
```

```kotlin
cloudinary.image {
	publicId("e_gen_remove:prompt_(keyboard;mouse;phone") 
}.generate()
```

```jquery
$.cloudinary.image("e_gen_remove:prompt_(keyboard;mouse;phone")
```

```react_native
new CloudinaryImage("e_gen_remove:prompt_(keyboard;mouse;phone");
```/c_limit,w_300/f_auto/q_auto/v1/docs/gadgets "with_code: false, with_url: false")

**Removing multiple instances of an object and their shadow:**

```jsx
<CldImage
  src="docs/apples"
  width="300"
  height="300"
  remove={{
    prompt: 'apple',
    multiple: true,
    removeShadow: true
  }}
  alt="Image with apples and shadows removed"
/>
```

![Image with apples and shadows removed](https://res.cloudinary.com/demo/image/upload/e_gen_remove:prompt_apple;multiple_true;remove-shadow_true/c_limit,w_300/f_auto/q_auto/v1/docs/apples "with_code: false, with_url: false")

**Removing a region:**

```jsx
<CldImage
  src="docs/accessories-bag"
  width="300"
  height="300"
  remove={{
    region: [300, 200, 750, 500]
  }}
  alt="Image with region removed"
/>
```

![Image with region removed](https://res.cloudinary.com/demo/image/upload/e_gen_remove:region_(x_300;y_200;w_750;h_500)

```nodejs
cloudinary.image("e_gen_remove:region_(x_300;y_200;w_750;h_500")
```

```react
new CloudinaryImage("e_gen_remove:region_(x_300;y_200;w_750;h_500");
```

```vue
new CloudinaryImage("e_gen_remove:region_(x_300;y_200;w_750;h_500");
```

```angular
new CloudinaryImage("e_gen_remove:region_(x_300;y_200;w_750;h_500");
```

```js
new CloudinaryImage("e_gen_remove:region_(x_300;y_200;w_750;h_500");
```

```python
CloudinaryImage("e_gen_remove:region_(x_300;y_200;w_750;h_500").image()
```

```php
(new ImageTag('e_gen_remove:region_(x_300;y_200;w_750;h_500'));
```

```java
cloudinary.url().transformation(new Transformation().imageTag("e_gen_remove:region_(x_300;y_200;w_750;h_500");
```

```ruby
cl_image_tag("e_gen_remove:region_(x_300;y_200;w_750;h_500")
```

```csharp
cloudinary.Api.UrlImgUp.BuildImageTag("e_gen_remove:region_(x_300;y_200;w_750;h_500")
```

```dart
cloudinary.image('e_gen_remove:region_(x_300;y_200;w_750;h_500').transformation(Transformation());
```

```swift
imageView.cldSetImage(cloudinary.createUrl().generate("e_gen_remove:region_(x_300;y_200;w_750;h_500")!, cloudinary: cloudinary)
```

```android
MediaManager.get().url().transformation(new Transformation().generate("e_gen_remove:region_(x_300;y_200;w_750;h_500");
```

```flutter
cloudinary.image('e_gen_remove:region_(x_300;y_200;w_750;h_500').transformation(Transformation());
```

```kotlin
cloudinary.image {
	publicId("e_gen_remove:region_(x_300;y_200;w_750;h_500") 
}.generate()
```

```jquery
$.cloudinary.image("e_gen_remove:region_(x_300;y_200;w_750;h_500")
```

```react_native
new CloudinaryImage("e_gen_remove:region_(x_300;y_200;w_750;h_500");
```/c_limit,w_300/f_auto/q_auto/v1/docs/accessories-bag "with_code: false, with_url: false")

**Removing multiple regions:**

```jsx
<CldImage
  src="docs/accessories-bag"
  width="300"
  height="300"
  remove={{
    region: [
      [300, 200, 750, 500],
      [1800, 1200, 1000, 800]
    ]
  }}
  alt="Image with multiple regions removed"
/>
```

![Image with multiple regions removed](https://res.cloudinary.com/demo/image/upload/e_gen_remove:region_((x_300;y_200;w_750;h_500)

```nodejs
cloudinary.image("e_gen_remove:region_((x_300;y_200;w_750;h_500")
```

```react
new CloudinaryImage("e_gen_remove:region_((x_300;y_200;w_750;h_500");
```

```vue
new CloudinaryImage("e_gen_remove:region_((x_300;y_200;w_750;h_500");
```

```angular
new CloudinaryImage("e_gen_remove:region_((x_300;y_200;w_750;h_500");
```

```js
new CloudinaryImage("e_gen_remove:region_((x_300;y_200;w_750;h_500");
```

```python
CloudinaryImage("e_gen_remove:region_((x_300;y_200;w_750;h_500").image()
```

```php
(new ImageTag('e_gen_remove:region_((x_300;y_200;w_750;h_500'));
```

```java
cloudinary.url().transformation(new Transformation().imageTag("e_gen_remove:region_((x_300;y_200;w_750;h_500");
```

```ruby
cl_image_tag("e_gen_remove:region_((x_300;y_200;w_750;h_500")
```

```csharp
cloudinary.Api.UrlImgUp.BuildImageTag("e_gen_remove:region_((x_300;y_200;w_750;h_500")
```

```dart
cloudinary.image('e_gen_remove:region_((x_300;y_200;w_750;h_500').transformation(Transformation());
```

```swift
imageView.cldSetImage(cloudinary.createUrl().generate("e_gen_remove:region_((x_300;y_200;w_750;h_500")!, cloudinary: cloudinary)
```

```android
MediaManager.get().url().transformation(new Transformation().generate("e_gen_remove:region_((x_300;y_200;w_750;h_500");
```

```flutter
cloudinary.image('e_gen_remove:region_((x_300;y_200;w_750;h_500').transformation(Transformation());
```

```kotlin
cloudinary.image {
	publicId("e_gen_remove:region_((x_300;y_200;w_750;h_500") 
}.generate()
```

```jquery
$.cloudinary.image("e_gen_remove:region_((x_300;y_200;w_750;h_500")
```

```react_native
new CloudinaryImage("e_gen_remove:region_((x_300;y_200;w_750;h_500");
```;(x_1800;y_1200;w_1000;h_800))/c_limit,w_300/f_auto/q_auto/v1/docs/accessories-bag "with_code: false, with_url: false")

[Learn more](transformation_reference#e_gen_remove)

### removeBackground

Remove the background of an image using AI:

```jsx
<CldImage
  src="cld-sample"
  width="300"
  height="300"
  removeBackground
  alt="Image with background removed"
/>
```

![Background removed](https://res.cloudinary.com/demo/image/upload/e_background_removal/c_limit,w_300/f_auto/q_auto/v1/cld-sample "with_code: false, with_url: false")

[Learn more](transformation_reference#e_background_removal)

### replace

Uses generative AI to replace parts of your image with something else.

The `replace` prop can be an array with the objects to be replaced, or an object with the following options:

{table:class=sdk-props-table} Option           | Type    | Example Value |
|------------------|---------|---------------|
| from             | string  | `"apple"` |
| to               | string  | `"banana"` |
| preserveGeometry | boolean | `true` |

For more information, see [gen_replace](transformation_reference#e_gen_replace).

#### Examples

**Replacing an object using an array:**

```jsx
<CldImage
  src="docs/woman-in-shirt"
  width="300"
  height="300"
  replace={['shirt', 'cable knit sweater']}
  alt="Image with shirt replaced by cable knit sweater"
/>
```

![Image with shirt replaced by cable knit sweater](https://res.cloudinary.com/demo/image/upload/e_gen_replace:from_shirt;to_cable%20knit%20sweater/c_limit,w_300/f_auto/q_auto/v1/docs/woman-in-shirt "with_code: false, with_url: false")

**Using the object format:**

```jsx
<CldImage
  src="docs/woman-in-shirt"
  width="300"
  height="300"
  replace={{
    from: 'shirt',
    to: 'cable knit sweater',
    preserveGeometry: true
  }}
  alt="Image with shirt replaced by cable knit sweater preserving geometry"
/>
```

![Image with shirt replaced by cable knit sweater preserving geometry](https://res.cloudinary.com/demo/image/upload/e_gen_replace:from_shirt;to_cable%20knit%20sweater;preserve-geometry_true/c_limit,w_300/f_auto/q_auto/v1/docs/woman-in-shirt "with_code: false, with_url: false")

[Learn more](transformation_reference#e_gen_replace)

### replaceBackground

Uses generative AI to replace the background of your image.

The `replaceBackground` prop can be a boolean, string, or object with the following options:

{table:class=sdk-props-table} Option | Type   | Example Value |
|--------|--------|---------------|
| prompt | string | `"fish tank"` |
| seed   | number | `2` |

For more information, see [gen_background_replace](transformation_reference#e_gen_background_replace).

#### Examples

**Replacing the background based on the image context:**

```jsx
<CldImage
  src="docs/woman-sitting"
  width="300"
  height="300"
  replaceBackground
  alt="Image with replaced background"
/>
```

![Image with replaced background](https://res.cloudinary.com/demo/image/upload/e_gen_background_replace/c_limit,w_300/f_auto/q_auto/v1/docs/woman-sitting "with_code: false, with_url: false")

**Using a string prompt:**

```jsx
<CldImage
  src="docs/woman-sitting"
  width="300"
  height="300"
  replaceBackground="fish tank"
  alt="Image with fish tank background"
/>
```

![Image with fish tank background](https://res.cloudinary.com/demo/image/upload/e_gen_background_replace:prompt_fish%20tank/c_limit,w_300/f_auto/q_auto/v1/docs/woman-sitting "with_code: false, with_url: false")

**Using the object format:**

```jsx
<CldImage
  src="docs/woman-sitting"
  width="300"
  height="300"
  replaceBackground={{
    prompt: 'fish tank',
    seed: 3
  }}
  alt="Image with fish tank background"
/>
```

In this case, the `seed` parameter is set to regenerate the result.

![Image with fish tank background seeded](https://res.cloudinary.com/demo/image/upload/e_gen_background_replace:prompt_fish%20tank;seed_3/c_limit,w_300/f_auto/q_auto/v1/docs/woman-sitting "with_code: false, with_url: false")

[Learn more](transformation_reference#e_gen_background_replace)

### restore

Uses generative AI to restore details in poor quality images or images that may have become degraded through repeated processing and compression.

```jsx
<CldImage
  src="docs/old-photo"
  width="250"
  height="250"
  restore
  alt="Restored image"
/>
```

![Restored image](https://res.cloudinary.com/demo/image/upload/e_gen_restore/c_limit,w_250/f_auto/q_auto/v1/docs/old-photo "with_code: false, with_url: false")

[Learn more](transformation_reference#e_gen_restore)

### zoom

Controls how close to crop to the detected coordinates when using face-detection, custom-coordinate, or object-specific gravity.

```jsx
<CldImage
  src="cld-sample"
  width="300"
  height="300"
  crop="thumb"
  gravity="face"
  zoom="1.75"
  alt="Zoomed crop"
/>
```

![Zoomed crop](https://res.cloudinary.com/demo/image/upload/c_thumb,w_300,h_300,g_face,z_1.75/f_auto/q_auto/v1/cld-sample "with_code: false, with_url: false")

[Learn more](transformation_reference#z_zoom)

### zoompan

Also known as the Ken Burns effect, this transformation applies zooming and/or panning to an image, resulting in a video or animated GIF.

`zoompan` can be applied with safe defaults as a boolean, a string, or an object for advanced customization.

As a string, you can pass in `"loop"` to automatically loop, or you can pass in raw configuration using the Cloudinary Transformation syntax.

As an object, you can use advanced configuration with the following options:

{table:class=sdk-props-table} Option  | Type              | Example Value |
|---------|-------------------|---------------|
| loop    | boolean &#124; number | `true`, `2` |
| options | string | `"mode_ztr;maxzoom_6.5;du_10"` |

For more information, see [zoompan](transformation_reference#e_zoompan).

#### Examples

**With defaults:**

```jsx
<CldImage
  src="docs/room"
  width="300"
  height="300"
  zoompan
  alt="Image with zoom pan effect"
/>
```

![Image with zoom pan effect](https://res.cloudinary.com/demo/image/upload/e_zoompan/c_limit,w_300/f_auto:animated/q_auto/v1/docs/room "with_code: false, with_url: false")

**Add looping:**

```jsx
<CldImage
  src="docs/room"
  width="300"
  height="300"
  zoompan="loop"
  alt="Looping zoom pan effect"
/>
```

![Looping zoom pan effect](https://res.cloudinary.com/demo/image/upload/e_zoompan/e_loop/c_limit,w_300/f_auto:animated/q_auto/v1/docs/room "with_code: false, with_url: false")

**Customize options (zoom to right, maximum zoom of 6.5, and duration of 10 seconds):**

```jsx
<CldImage
  src="docs/room"
  width="300"
  height="300"
  zoompan={{
    loop: 2,
    options: 'mode_ztr;maxzoom_6.5;du_10'
  }}
  alt="Custom zoom pan effect"
/>
```

![Custom zoom pan effect](https://res.cloudinary.com/demo/image/upload/e_zoompan:mode_ztr;maxzoom_6.5;du_10/e_loop:2/c_limit,w_300/f_auto:animated/q_auto/v1/docs/room "with_code: false, with_url: false")

[Learn more](transformation_reference#e_zoompan)

## Effects and filters

Cloudinary supports a wide variety of effects and artistic filters that help to easily change the appearance of an image.

{table:class=sdk-props-table} Prop | Type | Example Value | More Info
------|------|---------|----------
art | string | `"al_dente"` | [art](transformation_reference#e_art)
autoBrightness | boolean &#124; string | `{true}`, `"80"` | [auto_brightness](transformation_reference#e_auto_brightness)
autoColor | boolean &#124; string | `{true}`, `"80"` | [auto_color](transformation_reference#e_auto_color)
autoContrast | boolean &#124; string | `{true}`, `"80"` | [auto_contrast](transformation_reference#e_auto_contrast)
assistColorblind | boolean &#124; string | `{true}`, `"20"`, `"xray"` | [assist_colorblind](transformation_reference#e_assist_colorblind)
blackwhite | boolean &#124; string | `{true}`, `"40"` | [blackwhite](transformation_reference#e_blackwhite)
blur | boolean &#124; string | `{true}`, `"800"` | [blur](transformation_reference#e_blur)
blurFaces | boolean &#124; string | `{true}`, `"800"` | [blur_faces](transformation_reference#e_blur_faces)
blurRegion | boolean &#124; string | `{true}`, `"1000,h_425,w_550,x_600,y_400"` | [blur_region](transformation_reference#e_blur_region)
border | string | `"5px_solid_purple"` | [bo (border)](transformation_reference#bo_border)
brightness | boolean &#124; string | `{true}`, `"100"` | [brightness](transformation_reference#e_brightness)
brightnessHSB | boolean &#124; string | `{true}`, `"100"` | [brightness_hsb](transformation_reference#e_brightness_hsb)
cartoonify | boolean &#124; string | `{true}`, `"70:80"` | [cartoonify](transformation_reference#e_cartoonify)
color | string | `"blue"` | [co (color)](transformation_reference#co_color)
colorize | string | `"35,co_darkviolet"` | [colorize](transformation_reference#e_colorize)
contrast | boolean &#124; string | `{true}`, `"100"`, `"level_-70"` | [contrast](transformation_reference#e_contrast)
distort | string | `"150:340:1500:10:1500:1550:50:1000"`, `"arc:180.0"` | [distort](transformation_reference#e_distort)
fillLight | boolean &#124; string | `{true}`, `"70:20"` | [fill_light](transformation_reference#e_fill_light)
gamma | boolean &#124; string | `{true}`, `"100"` | [gamma](transformation_reference#e_gamma)
gradientFade | boolean &#124; string | `{true}`, `"symmetric:10,x_0.2,y_0.4"` | [gradient_fade](transformation_reference#e_gradient_fade)
grayscale | boolean | `{true}` | [grayscale](transformation_reference#e_grayscale)
improve | boolean &#124; string | `{true}`, `"50"`, `"indoor"` | [improve](transformation_reference#e_improve)
multiply | boolean | `{true}` | [multiply](transformation_reference#e_multiply)
negate | boolean | `{true}` | [negate](transformation_reference#e_negate)
oilPaint | boolean &#124; string | `{true}`, `"40"` | [oil_paint](transformation_reference#e_oil_paint)
opacity | number &#124; string | `{40}`, `"40"` | [o (opacity)](transformation_reference#o_opacity)
outline | boolean &#124; string | `{true}`, `"40"`, `"outer:15:200"` | [outline](transformation_reference#e_outline)
overlay | boolean | `{true}` | [overlay](transformation_reference#e_overlay)
pixelate | boolean &#124; string | `{true}`, `"20"` | [pixelate](transformation_reference#e_pixelate)
pixelateFaces | boolean &#124; string | `{true}`, `"20"` | [pixelate_faces](transformation_reference#e_pixelate_faces)
pixelateRegion | boolean &#124; string | `{true}`, `"35,h_425,w_550,x_600,y_400"` | [pixelate_region](transformation_reference#e_pixelate_region)
redeye | boolean &#124; string | `{true}` | [redeye](transformation_reference#e_redeye)
replaceColor | string | `"saddlebrown"`, `"2F4F4F:20"`, `"silver:55:89b8ed"` | [replace_color](transformation_reference#e_replace_color)
sanitize | boolean | `{true}` | [sanitize](transformation_reference#fl_sanitize)
saturation | boolean &#124; string | `{true}`, `"70"` | [saturation](transformation_reference#e_saturation)
screen | boolean | `{true}` | [screen](transformation_reference#e_screen)
sepia | boolean &#124; string | `{true}`, `"50"` | [sepia](transformation_reference#e_sepia)
shadow | boolean &#124; string | `{true}`, `"50,x_-15,y_15"` | [shadow](transformation_reference#e_shadow)
sharpen | boolean &#124; string | `{true}`, `"100"` | [sharpen](transformation_reference#e_sharpen)
shear | string | `"20.0:0.0"` | [shear](transformation_reference#e_shear)
simulateColorblind | boolean &#124; string | `"deuteranopia"` | [simulate_colorblind](transformation_reference#e_simulate_colorblind)
tint | boolean &#124; string | `{true}`, `"100:red:blue:yellow"` | [tint](transformation_reference#e_tint)
trim | boolean &#124; string | `{true}`, `"50:yellow"` | [trim](transformation_reference#e_trim)
unsharpMask | boolean &#124; string | `{true}`, `"500"` | [unsharp_mask](transformation_reference#e_unsharp_mask)
vectorize | boolean &#124; string | `{true}`, `"3:0.5"` | [vectorize](transformation_reference#e_vectorize)
vibrance | boolean &#124; string | `{true}`, `"70"` | [vibrance](transformation_reference#e_vibrance)
vignette | boolean &#124; string | `{true}`, `"30"` | [vignette](transformation_reference#e_vignette)

Apply various effects to your images using the `effects` array or individual effect props.

### Common effects

**blackwhite:**

```jsx
<CldImage
  src="cld-sample"
  width="200"
  height="200"
  blackwhite
  alt="Black white effect"
/>
```

![Black white effect](https://res.cloudinary.com/demo/image/upload/e_blackwhite/c_limit,w_200/f_auto/q_auto/v1/cld-sample "with_code: false, with_url: false")

**sepia:**

```jsx
<CldImage
  src="cld-sample"
  width="200"
  height="200"
  sepia
  alt="Sepia effect"
/>
```

![Sepia effect](https://res.cloudinary.com/demo/image/upload/e_sepia/c_limit,w_200/f_auto/q_auto/v1/cld-sample "with_code: false, with_url: false")

**grayscale:**

```jsx
<CldImage
  src="cld-sample"
  width="200"
  height="200"
  grayscale
  alt="Grayscale image"
/>
```

![Grayscale effect](https://res.cloudinary.com/demo/image/upload/e_grayscale/c_limit,w_200/f_auto/q_auto/v1/cld-sample "with_code: false, with_url: false")

**blur:**

```jsx
<CldImage
  src="cld-sample"
  width="200"
  height="200"
  blur="800"
  alt="Blurred image"
/>
```

![Blurred image](https://res.cloudinary.com/demo/image/upload/e_blur:800/c_limit,w_200/f_auto/q_auto/v1/cld-sample "with_code: false, with_url: false")

**pixelate:**

```jsx
<CldImage
  src="cld-sample"
  width="200"
  height="200"
  pixelate
  alt="Pixelated image"
/>
```

![Pixelated image](https://res.cloudinary.com/demo/image/upload/e_pixelate/c_limit,w_200/f_auto/q_auto/v1/cld-sample "with_code: false, with_url: false")

**tint:**

```jsx
<CldImage
  src="cld-sample"
  width="200"
  height="200"
  tint="equalize:80:blue:blueviolet"
  alt="Tinted image"
/>
```

![Tinted image](https://res.cloudinary.com/demo/image/upload/e_tint:equalize:80:blue:blueviolet/c_limit,w_200/f_auto/q_auto/v1/cld-sample "with_code: false, with_url: false")

**opacity:**

```jsx
<CldImage
  src="cld-sample"
  width="200"
  height="200"
  opacity="50"
  alt="Semi-transparent image"
/>
```

![Semi-transparent image](https://res.cloudinary.com/demo/image/upload/o_50/c_limit,w_200/f_auto/q_auto/v1/cld-sample "with_code: false, with_url: false")

**sharpen:**

```jsx
<CldImage
  src="cld-sample"
  width="200"
  height="200"
  sharpen={50}
  alt="Sharpened image"
/>
```

![Sharpened image](https://res.cloudinary.com/demo/image/upload/e_sharpen:50/c_limit,w_200/f_auto/q_auto/v1/cld-sample "with_code: false, with_url: false")

### Multiple effects

You can apply multiple effects to an image, either as individual props, or using the `effects` prop to specify an array of objects.

**Example with multiple effects as props:**

```jsx
<CldImage
  src="cld-sample"
  width="200"
  height="200"
  sharpen="100"
  saturation="70"
  contrast="20"
  alt="Enhanced image with multiple effects"
/>
```

![Enhanced image with multiple effects](https://res.cloudinary.com/demo/image/upload/e_contrast:20/e_saturation:70/e_sharpen:1000/c_limit,w_200/f_auto/q_auto/v1/cld-sample "with_code: false, with_url: false")

**Example with multiple effects in the `effects` prop:**

```jsx
<CldImage
  src="cld-sample"
  width="200"
  height="200"
  effects={[
    {
      background: 'green'
    },
    {
      gradientFade: true
    },
    {
      gradientFade: 'symmetric,x_0.5'
    }
  ]}
  alt="Gradient faded image with multiple effects"
/>
```

![Gradient faded image with multiple effects](https://res.cloudinary.com/demo/image/upload/b_green/e_gradient_fade/e_gradient_fade:symmetric,x_0.5/c_limit,w_200/f_auto/q_auto/v1/cld-sample "with_code: false, with_url: false")

## Overlays and underlays

Cloudinary gives you the ability to add layers above or below your base asset using overlays and underlays.

You can use these props in the `CldImage` component:

{table:class=sdk-props-table} Prop | Type | Example Value
------|------|--------
overlays | array | See [Customizing Overlays & Underlays](#customizing_overlays_and_underlays)
text | string | `"Next Cloudinary"`
underlay | string | `"my-public-id"`
underlays | array | See [Customizing Overlays & Underlays](#customizing_overlays_and_underlays)

### Customizing overlays and underlays

You can customize overlays and underlays using the following properties:

> **NOTE**: The API for underlays is similar to overlays except they do not support text.

{table:class=sdk-props-table} Option | Type | Example Value
------|------|--------
appliedEffects | array | See [appliedEffects](#appliedeffects)
effects | array | See [effects](#layer_effects)
position | object | See [position](#position)
publicId | string | `'cloudinary_icon'`
text | object &#124; string | `'Next Cloudinary'` or see [text](#text)
url | string | `'https://.../image.jpg'`

You can specify the asset to use for the overlay or underlay as a public ID, or a URL of an external image. 

### appliedEffects

In the `appliedEffects` array, you can specify blend modes, such as [multiply](transformation_reference#e_multiply), [overlay](transformation_reference#e_overlay), and [screen](transformation_reference#e_screen), in addition to [mask](transformation_reference#e_mask). These are all qualifiers that determine how the layer is applied to the image. In the URL syntax, they are in the same component as the `fl_layer_apply` flag.

Apply the `multiply` blend mode to an overlay (the overlay is darker where the base image is darker):

```jsx
<CldImage
  src="cld-sample"
  width="300"
  height="300"
  overlays={[
    {
      publicId: 'cloudinary_icon',
      appliedEffects: [
        {
          multiply: true
        }
      ]
    }
  ]}
  alt="Image overlay with multiply blend mode"
/>
```

![Image overlay with multiply blend mode](https://res.cloudinary.com/demo/image/upload/l_cloudinary_icon/fl_layer_apply,fl_no_overflow,e_multiply/c_limit,w_300/f_auto/q_auto/v1/cld-sample "with_code: false, with_url: false")


### effects

In the `effects` array, you can specify the transformations to apply to the layer (see [Common image transformations](#common_image_transformations) and [Effects and filters](#effects_and_filters)).  In the URL syntax, they are in the component(s) before the component containing the `fl_layer_apply` flag. 

Add an overlay, resized to a width of 800 px and colored white:

```jsx
<CldImage
  src="cld-sample"
  width="300"
  height="300"
  overlays={[
      {
      publicId: 'cloudinary_icon',
      effects: [
        {
          crop: 'scale',
          width: 800,
          colorize: 100,
          color: 'white'
        }
      ]
      }
  ]}
  alt="Image with resized, colored overlay"
/>
```

![Image with resized, colored overlay](https://res.cloudinary.com/demo/image/upload/l_cloudinary_icon,c_scale,w_800,e_colorize:100,co_white/fl_layer_apply,fl_no_overflow/c_limit,w_300/f_auto/q_auto/v1/cld-sample "with_code: false, with_url: false")

### position

Use the `position` object to specify where you want the layer to appear, on or under the base image.

The `position` object can include:

{table:class=sdk-props-table} Option | Type | Example Value | More Info
------|------|---------|----------
angle | number | `20` | [a (angle)](transformation_reference#a_angle)
gravity | string | `'north_east'` | [g (gravity)](transformation_reference#g_gravity)
x | number | `50` | [x, y (x & y coordinates)](transformation_reference#x_y_coordinates)
y | number | `50` | [x, y (x & y coordinates)](transformation_reference#x_y_coordinates)

Add an overlay to the top right of the base image (`gravity: 'north_east'`), offset by 50 pixels, at an angle of 20 degrees (`angle: 20`):

```jsx
<CldImage
  src="cld-sample"
  width="300"
  height="300"
  overlays={[
    {
      publicId: 'cloudinary_icon',
      position: {
          x: 50,
          y: 50,
          gravity: 'north_east',
          angle: 20
      },
      effects: [
        {
          crop: 'scale',
          width: 300
        }
      ]
    }
  ]}
  alt="Image with overlay positioned in the top right"
/>
```

![Image with overlay positioned in the top right](https://res.cloudinary.com/demo/image/upload/l_cloudinary_icon,c_scale,w_300/fl_layer_apply,fl_no_overflow,x_50,y_50,g_north_east,a_20/c_limit,w_300/f_auto/q_auto/v1/cld-sample "with_code: false, with_url: false")

### text

You can overlay text on an image, either by providing the text in the `text` property and using default styling, or by using the `text` object to customize text overlaid on your image.

The `text` object can include:

{table:class=sdk-props-table} Option | Type | Example Value | More Info
------|------|---------|----------
border | string | `'20px_solid_blue'` | [bo (border)](transformation_reference#bo_border)
color | string | `'blueviolet'` | [co (color)](transformation_reference#co_color)
fontFamily | string | `'Source Sans Pro'` | [Styling parameters](transformation_reference#styling_parameters)
fontSize | number | `280` | [Styling parameters](transformation_reference#styling_parameters)
fontWeight | string | `'bold'` | [Styling parameters](transformation_reference#styling_parameters)
letterSpacing | number | `14` | [Styling parameters](transformation_reference#styling_parameters)
lineSpacing | number | `14` | [Styling parameters](transformation_reference#styling_parameters)
stroke | boolean | `true` | [Styling parameters](transformation_reference#styling_parameters)
textDecoration | string | `'underline'` | [Styling parameters](transformation_reference#styling_parameters)

**Add text with default styling to an image:**

```jsx
<CldImage
  src="cld-sample"
  width="300"
  height="300"
  overlays={[
    {
      text: 'Cool Beans',
      position: {
          x: 140,
          y: 250,
          angle: -20,
          gravity: 'south_east'
      }
    }
  ]}
  alt="Image with text overlay"
/>
```

![Image with text overlay](https://res.cloudinary.com/demo/image/upload/l_text:Arial_200_bold:Cool%20Beans,co_black/fl_layer_apply,fl_no_overflow,x_140,y_250,a_-20,g_south_east/c_limit,w_300/f_auto/q_auto/v1/cld-sample "with_code: false, with_url: false")

**Add customized text to an image:**

```jsx
<CldImage
  src="cld-sample"
  width="300"
  height="300"
  overlays={[
    {
      text: {
        color: 'blueviolet',
        fontFamily: 'Source Sans Pro',
        fontSize: 280,
        fontWeight: 'bold',
        text: 'Cool Beans'
      },
      position: {
        x: 140,
        y: 250,
        angle: -20,
        gravity: 'south_east'
      }
    }
  ]}
  alt="Image with customized text overlay"
/>
```

![Image with customized text overlay](https://res.cloudinary.com/demo/image/upload/l_text:Source%20Sans%20Pro_280_bold:Cool%20Beans,co_blueviolet/fl_layer_apply,fl_no_overflow,x_140,y_250,a_-20,g_south_east/c_limit,w_300/f_auto/q_auto/v1/cld-sample "with_code: false, with_url: false")

**Apply effects to text overlays:**

```jsx
<CldImage
  src="cld-sample"
  width="300"
  height="300"
  overlays={[
      {
      text: {
          color: 'white',
          fontFamily: 'Source Sans Pro',
          fontSize: 300,
          fontWeight: 'black',
          text: 'COOL BEANS'
      },
      effects: [
        {
          shear: '40:0',
          opacity: 50
        }
      ],
      position: {
          x: 20,
          y: -450
      }
      }
  ]}
  alt="Text with effects"
/>
```

![Text with effects](https://res.cloudinary.com/demo/image/upload/l_text:Source%20Sans%20Pro_300_black:COOL%20BEANS,e_shear:40:0,o_50,co_white/fl_layer_apply,fl_no_overflow,x_20,y_-450/c_limit,w_300/f_auto/q_auto/v1/cld-sample "with_code: false, with_url: false")

### Image underlays

If you're placing an image behind another image, with no transformations, you can set the `underlay` prop to the public ID of the image.

Place the `cld-sample-2` image behind the `cld-sample-3` image:

```jsx
<CldImage
  src="cld-sample-3"
  width="300"
  height="300"
  removeBackground
  underlay="cld-sample-2"
  alt="Image with underlay"
/>
```

![Image with underlay](https://res.cloudinary.com/demo/image/upload/e_background_removal/u_cld-sample-2,c_fill,w_1.0,h_1.0,fl_relative/fl_layer_apply,fl_no_overflow/c_limit,w_300/f_auto/q_auto/v1/cld-sample-3 "with_code: false, with_url: false")

To apply transformations to an underlay image, or if you want to add multiple underlays, you can use the `underlays` prop.

Use multiple images as underlays:

```jsx
<CldImage
  src="cld-sample-3"
  width="300"
  height="300"
  removeBackground
  underlays={[
    {
      publicId: 'cld-sample-2',
      width: '0.5',
      height: '1.0',
      crop: 'fill',
      position: {
        gravity: 'north_west'
      },
      flags: ['relative']
    },
    {
      publicId: 'cld-sample-5',
      width: '0.5',
      height: '1.0',
      crop: 'fill',
      position: {
        gravity: 'south_east'
      },
      flags: ['relative']
    }
  ]}
  alt="Image with multiple underlays"
/>
```

![Image with multiple underlays](https://res.cloudinary.com/demo/image/upload/e_background_removal/u_cld-sample-2,w_0.5,h_1.0,c_fill,fl_relative/fl_layer_apply,fl_no_overflow,g_north_west/u_cld-sample-5,w_0.5,h_1.0,c_fill,fl_relative/fl_layer_apply,fl_no_overflow,g_south_east/c_limit,w_300/f_auto/q_auto/v1/cld-sample-3 "with_code: false, with_url: false")

> **NOTE**: Underlays support the same configuration options as overlays, except they don't support text.

## Configuration and delivery options

Configure how your assets are delivered and accessed:

{table:class=sdk-props-table} Prop | Type | Default | Example Value | More Info
------|------|---------|---------|----------
assetType | string | image | video | [Transformation URL structure](image_transformations#transformation_url_structure)
config | object | - | { url: { secureDistribution: 'spacejelly.dev' } } | [Configuration parameters](cloudinary_sdks#configuration_parameters)
deliveryType | string | upload | fetch | [Delivery types](image_trans_flags_delivery_types#delivery_types)
defaultImage | string | - | myimage.jpg | [d (default image)](transformation_reference#d_default_image)
flags | array | - | ['keep_iptc'] | [fl (flag)](transformation_reference#fl_flag)
seoSuffix | string | - | my-image-content | [Dynamic SEO suffixes](advanced_url_delivery_options#dynamic_seo_suffixes)
version | number | - | 1234 | [Asset versions](advanced_url_delivery_options#asset_versions)

### assetType

Specify the type of asset to be delivered. This is useful for creating image thumbnails from videos:

```jsx
<CldImage
  src="my-video"
  width="1920"
  height="1080"
  assetType="video"
  alt="Video thumbnail"
/>
```

### config

Configure the Cloudinary environment:

```jsx
<CldImage
  src="sample"
  width="500"
  height="500"
  config={{
    cloud: {
      cloudName: 'my-cloud-name'
    }
  }}
  alt="Custom cloud configuration"
/>
```

### deliveryType

Control the delivery type of the image:

```jsx
<CldImage
  src="https://example.com/image.jpg"
  width="500"
  height="500"
  deliveryType="fetch"
  alt="Fetched image"
/>
```

### defaultImage

Specify a fallback image if the requested image is not available:

```jsx
<CldImage
  src="sample"
  width="500"
  height="500"
  defaultImage="fallback.jpg"
  alt="Image with fallback"
/>
```

> **NOTE**: The `defaultImage` must include a format/file extension.

### flags

Alter the behavior of transformations or delivery:

```jsx
<CldImage
  src="sample"
  width="500"
  height="500"
  flags={['keep_iptc']}
  quality="default"
  alt="Image with flags"
/>
```

> **TIP**: The `keep_iptc` flag requires not using `quality="auto"`. Use `quality="default"` instead.

### seoSuffix

Add a descriptive suffix to the URL for better SEO:

```jsx
<CldImage
  src="sample"
  width="500"
  height="500"
  seoSuffix="my-descriptive-image-name"
  alt="Image with SEO suffix"
/>
```

### version

Specify a version number for the asset:

```jsx
<CldImage
  src="sample"
  width="500"
  height="500"
  version="1234"
  alt="Versioned image"
/>
```

## Event handlers and refs

Handle image loading events and access the underlying DOM element:

{table:class=sdk-props-table} Prop | Type | Example Value | More Info
------|------|---------|----------
onError | function/boolean | (event) => {} | [onError](https://nextjs.org/docs/pages/api-reference/components/image#onerror)
onLoad | function | (event) => {} | [onLoad](https://nextjs.org/docs/pages/api-reference/components/image#onload)
ref | ref | Ref | [useRef](https://react.dev/reference/react/useRef)

### onError event

Callback that fires when an image fails to load:

```jsx
<CldImage
  src="sample"
  width="500"
  height="500"
  onError={(e) => {
    console.error('Image failed to load');
  }}
  alt="Image with onError"
/>
```

> **TIP**: If an image returns a 423 status (Processing), CldImage will automatically poll the URL until it's available, then force refresh the image in the DOM.

### onLoad event

Callback that fires when an image loads completely:

```jsx
<CldImage
  src="sample"
  width="500"
  height="500"
  onLoad={(e) => {
    console.log('Image loaded!');
  }}
  alt="Image with onLoad"
/>
```

### Using refs

Pass a ref to access the underlying image element:

```jsx
'use client';

import { useRef } from 'react';
import { CldImage } from 'next-cloudinary';

export default function Page() {
  const imageRef = useRef(null);

  return (
    <CldImage
      src="sample"
      width="500"
      height="500"
      ref={imageRef}
      alt="Image with ref"
    />
  );
}
```

## Advanced transformations

### Chained transformations

You can apply multiple transformation steps by using the `effects` array or by combining multiple transformation props:

```jsx
<CldImage
  src="front_face"
  width="150"
  height="150"
  crop="auto"
  gravity="face"
  removeBackground
  effects={[
      {
      background: 'blue'
      },
      {
      sepia: true
      }
  ]}
  overlays={[
      {
      publicId: 'cloudinary_icon',
      position: {
          gravity: 'south_east',
          x: 5,
          y: 5
      },
      effects: [
          {
          brightness: 50,
          opacity: 90,
          crop: 'scale', 
          width: 50
          }
      ]
      }
  ]}
  alt="Complex transformation"
/>
```

![Complex transformation](https://res.cloudinary.com/demo/image/upload/e_background_removal/b_blue/e_sepia/l_cloudinary_icon,e_brightness:50,o_90,c_scale,w_50/fl_layer_apply,fl_no_overflow,g_south_east,x_5,y_5/c_auto,w_150,h_150,g_face/f_auto/q_auto/v1/front_face "with_code: false, with_url: false")

{tip}
The order of props in the `CldImage` component doesn't guarantee the order of transformations in the URL, which may impact how your asset is rendered. To ensure the order of transformations, use [raw transformations](#raw_transformations) or a [named transformation](#named_transformations).
{/tip}

### Named transformations

A [named transformation](named_transformations) is a pre-defined set of transformation parameters that has been given a custom name for easy reference. 

Use pre-defined named transformations from your Cloudinary account:

```jsx
<CldImage
  src="lighthouse_reflection"
  width="300"
  height="300"
  namedTransformations={['oval_cartoonified_frame']}
  alt="Image with named transformation"
/>
```

![Image with named transformation](https://res.cloudinary.com/demo/image/upload/t_oval_cartoonified_frame/c_limit,w_300/f_auto/q_auto/v1/lighthouse_reflection "with_code: false, with_url: false")

### Strict transformations

[Strict transformations](control_access_to_media#strict_transformations) give you control over which transformations can be used from your Cloudinary account. When enabled, only named transformations are allowed to by applied to assets on the fly:

```jsx
<CldImage
  src="lighthouse_reflection"
  width="300"
  height="300"
  strictTransformations
  namedTransformations={['oval_cartoonified_frame']}
  alt="Strictly transformed image"
/>
```

![Strictly transformed image](https://res.cloudinary.com/demo/image/upload/t_oval_cartoonified_frame/lighthouse_reflection "with_code: false, with_url: false, thumb: c_scale,w_300")

> **NOTE**: Strict transformations disable automatic optimization and [responsive](#responsive_images) sizing, only allowing approved named transformations.

## Optimization

The `CldImage` component and the `GetCldImageUrl` method automatically apply optimization best practices:

* **Automatic format selection** (`f_auto`) - Delivers images in the optimal format for each browser
* **Automatic quality** (`q_auto`) - Applies intelligent compression to minimize file size while maintaining visual quality

The `auto` optimizations are applied by default, but if you prefer, you can specify a certain [format](transformation_reference#f_format) and [quality](transformation_reference#q_quality) to deliver the image:

```jsx
<CldImage
  src="sample"
  width="500"
  height="500"
  format="webp"
  quality="80"
  alt="Custom optimization"
/>
```

### Disabling optimization

To deliver the image without automatic optimizations, use the `unoptimized` prop:

```jsx
<CldImage
  src="sample"
  width="500"
  height="500"
  unoptimized
  alt="Unoptimized image"
/>
```

> **NOTE**: Using `unoptimized` disables automatic format selection, quality optimization, and [responsive sizing](#responsive_images).

### Device pixel ratio (DPR)

Set the device pixel ratio for sharper images on high-density displays:

```jsx
<CldImage
  src="sample"
  width="500"
  height="500"
  dpr="2.0"
  alt="High DPR image"
/>
```

[Learn more](transformation_reference#dpr_dpr)

### Image placeholders

`CldImage` wraps the Next.js Image component, giving you access to the placeholder API which can display an SVG image while the image itself is loading.

This helps provide a better user experience by showing something meaningful rather than an empty space while the image loads.

You have several options for placeholders:

* `placeholder="blur"` coupled with a `blurDataURL`
* `placeholder="..."` with the contents being a data URL

#### Using CldImage in Server Components

When working in the App Router, it's recommended to wrap `CldImage` in a separate component to keep your pages as Server Components. This allows you to perform server-side data fetching and processing without having to opt your entire page into a Client Component.

Create a wrapper component that handles the `'use client'` directive:

```jsx
// components/CloudinaryImage.tsx
'use client';

import { CldImage } from 'next-cloudinary';
import type { CldImageProps } from 'next-cloudinary';

export function CloudinaryImage(props: CldImageProps) {
  return <CldImage {...props} />;
}
```

Then use it in your Server Component page:

```jsx
// app/page.tsx (Server Component - no 'use client' needed)
import { getCldImageUrl } from 'next-cloudinary';
import { CloudinaryImage } from '@/components/CloudinaryImage';

export default async function Page() {
  // Server-side data fetching and processing
  const imageUrl = getCldImageUrl({ src: 'sample', width: 100 });
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");
  const blurDataURL = `data:${response.type};base64,${base64}`;

  return (
    <CloudinaryImage
      src="sample"
      width="600"
      height="400"
      placeholder="blur"
      blurDataURL={blurDataURL}
      alt="Image with blur placeholder"
    />
  );
}
```

This approach keeps your page as a Server Component (allowing async data fetching) while only the image rendering happens client-side.

#### Blurred image placeholders

To achieve a blurred image effect, convert your Cloudinary image to a Data URL then pass it to your `CldImage` component.

**In a server component, generate the Data URL:**

```jsx
import { getCldImageUrl } from 'next-cloudinary';

const imageUrl = getCldImageUrl({
  src: 'sample',
  width: 100  // Resize to a smaller size for the placeholder
});

const response = await fetch(imageUrl);
const arrayBuffer = await response.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);
const base64 = buffer.toString("base64");
const dataUrl = `data:${response.type};base64,${base64}`;
```

**Then use it with CldImage:**

```jsx
import { CldImage } from 'next-cloudinary';

<CldImage
  src="sample"
  width="600"
  height="400"
  placeholder="blur"
  blurDataURL={dataUrl}
  alt="Image with blur placeholder"
/>
```

#### Shimmer effect placeholder

Create a shimmer loading effect.

**Create the shimmer helper functions:**

```jsx
const shimmer = (w, h) => `
  <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs>
      <linearGradient id="g">
        <stop stop-color="#333" offset="20%" />
        <stop stop-color="#222" offset="50%" />
        <stop stop-color="#333" offset="70%" />
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="#333" />
    <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
    <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
  </svg>`;

const toBase64 = (str) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

const dataUrl = `data:image/svg+xml;base64,${toBase64(shimmer(600, 400))}`;
```

**Use with CldImage:**

```jsx
<CldImage
  src="sample"
  width="600"
  height="400"
  placeholder={dataUrl}
  alt="Image with shimmer placeholder"
/>
```

### Responsive images

Responsive images are critical for page performance. `CldImage` makes them easy by leveraging Next.js's built-in responsive image capabilities combined with Cloudinary's transformation technology.

The component takes advantage of the Next.js Image component, which allows you to specify the sizes you need and handles generating the appropriate image variants automatically.

#### Using the sizes prop

Use the `sizes` prop to control how the image responds to different viewport sizes:

```jsx
<CldImage
  src="sample"
  width="960"
  height="600"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  alt="Responsive image"
/>
```

This would give you roughly full width images on mobile, a 2-column layout on tablets, and a 3-column layout on desktop views.

> **TIP**: The `sizes` prop helps the browser determine which image size to load based on the viewport. Use viewport-based values like `100vw` (full width), `50vw` (half width), or media queries like `(max-width: 768px) 100vw, 50vw` for responsive behavior.

#### How CldImage generates responsive images

`CldImage` utilizes Cloudinary technology to provide responsive sizing. When you use the `sizes` prop, the component generates a `srcset` with multiple image URLs, each optimized for different screen sizes.

For example, the output HTML might look like:

```html
<img
  alt="Responsive image"
  loading="lazy"
  width="960"
  height="600"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  srcset="
    https://res.cloudinary.com/<Cloud Name>/image/upload/c_limit,w_256/f_auto/q_auto/v1/<Public ID> 256w,
    https://res.cloudinary.com/<Cloud Name>/image/upload/c_limit,w_384/f_auto/q_auto/v1/<Public ID> 384w,
    https://res.cloudinary.com/<Cloud Name>/image/upload/c_limit,w_640/f_auto/q_auto/v1/<Public ID> 640w,
    https://res.cloudinary.com/<Cloud Name>/image/upload/c_limit,w_750/f_auto/q_auto/v1/<Public ID> 750w,
    https://res.cloudinary.com/<Cloud Name>/image/upload/c_limit,w_828/f_auto/q_auto/v1/<Public ID> 828w,
    https://res.cloudinary.com/<Cloud Name>/image/upload/c_limit,w_1080/f_auto/q_auto/v1/<Public ID> 1080w,
    https://res.cloudinary.com/<Cloud Name>/image/upload/c_limit,w_1200/f_auto/q_auto/v1/<Public ID> 1200w,
    https://res.cloudinary.com/<Cloud Name>/image/upload/c_limit,w_1920/f_auto/q_auto/v1/<Public ID> 1920w,
    https://res.cloudinary.com/<Cloud Name>/image/upload/c_limit,w_2048/f_auto/q_auto/v1/<Public ID> 2048w,
    https://res.cloudinary.com/<Cloud Name>/image/upload/c_limit,w_3840/f_auto/q_auto/v1/<Public ID> 3840w
  "
  src="https://res.cloudinary.com/<Cloud Name>/image/upload/c_limit,w_3840/f_auto/q_auto/v1/<Public ID>"
>
```

Each image is automatically generated on-the-fly by Cloudinary using the `w_<width>` URL parameter.

#### Upscaling behavior

By default, `CldImage` uses the `limit` crop mode which prevents Cloudinary from upscaling an image if the requested size is greater than the original. Instead, the browser resizes the image.

To allow Cloudinary to upscale images (which may result in blurry images for sizes larger than the original), set the crop mode to `scale`:

```jsx
<CldImage
  src="sample"
  width="2000"
  height="2000"
  crop="scale"
  alt="Upscaled image"
/>
```

#### Responsive images with cropping and resizing

You can combine responsive images with Cloudinary's dynamic cropping and resizing modes. When you specify a crop mode, each responsive size will be cropped accordingly:

```jsx
<CldImage
  src="sample"
  width="960"
  height="960"
  crop="fill"
  sizes="100vw"
  alt="Responsive cropped image"
/>
```

Each image will be cropped to a 1:1 ratio. As the Next.js Image component generates an image for each responsive size, Cloudinary uses those sizes when building the URL:

```html
<img
  alt="Responsive cropped image"
  loading="lazy"
  width="960"
  height="960"
  sizes="100vw"
  srcset="
    https://res.cloudinary.com/<Cloud Name>/image/upload/c_fill,w_640,h_640,g_auto/f_auto/q_auto/v1/<Public ID> 640w,
    https://res.cloudinary.com/<Cloud Name>/image/upload/c_fill,w_750,h_750,g_auto/f_auto/q_auto/v1/<Public ID> 750w,
    https://res.cloudinary.com/<Cloud Name>/image/upload/c_fill,w_828,h_828,g_auto/f_auto/q_auto/v1/<Public ID> 828w,
    https://res.cloudinary.com/<Cloud Name>/image/upload/c_fill,w_1080,h_1080,g_auto/f_auto/q_auto/v1/<Public ID> 1080w,
    https://res.cloudinary.com/<Cloud Name>/image/upload/c_fill,w_1200,h_1200,g_auto/f_auto/q_auto/v1/<Public ID> 1200w,
    https://res.cloudinary.com/<Cloud Name>/image/upload/c_fill,w_1920,h_1920,g_auto/f_auto/q_auto/v1/<Public ID> 1920w,
    https://res.cloudinary.com/<Cloud Name>/image/upload/c_fill,w_2048,h_2048,g_auto/f_auto/q_auto/v1/<Public ID> 2048w,
    https://res.cloudinary.com/<Cloud Name>/image/upload/c_fill,w_3840,h_3840,g_auto/f_auto/q_auto/v1/<Public ID> 3840w
  "
  src="https://res.cloudinary.com/<Cloud Name>/image/upload/c_fill,w_3840,h_3840,g_auto/f_auto/q_auto/v1/<Public ID>"
>
```

> **NOTE**: When using dynamic crop modes like `thumb` with responsive images, see the [crop section](#crop) for important information about two-stage cropping to ensure consistent results across different device sizes.

## Remote images

Use Cloudinary's transformation and delivery features with images not stored in your Cloudinary account.

### Fetching remote images on-the-fly

Use the `fetch` delivery type to transform remote images without storing them in your Media Library:

```jsx
<CldImage
  src="https://example.com/path/to/image.jpg"
  width="1080"
  height="675"
  deliveryType="fetch"
  tint="70:blue:purple"
  alt="Remote image"
/>
```

Cloudinary will fetch the image, apply transformations, cache it on the CDN, and deliver it.

### Auto-uploading remote images

Automatically upload remote images to your Cloudinary product environment on first request. First, configure auto-upload mapping in your Cloudinary Console settings:

1. Go to [Settings > Upload > Auto Upload Mapping](https://console.cloudinary.com/app/settings/upload/mapping)
1. Add a mapping:
   * **Source URL prefix**: Base URL of remote storage (e.g., `https://my-bucket.s3.amazonaws.com/images/`)
   * **Target Folder**: Virtual folder name (e.g., `s3-images`)

Then reference the mapped folder in your `src`:

```jsx
// Remote URL: https://my-bucket.s3.amazonaws.com/images/product.jpg
// Mapped Folder: s3-images

<CldImage
  src="s3-images/product.jpg"
  width="960"
  height="600"
  alt="Auto-uploaded image"
/>
```

> **TIP**: Auto-upload is useful for migrating from services like S3 to Cloudinary without downtime, or for building up assets from a trusted remote source over time.

## Social media cards with CldOgImage

The `CldOgImage` component allows you to easily generate Open Graph images (social media cards) using the same transformation API as `CldImage`. This component automatically generates the appropriate meta tags for social media platforms.

> **NOTE**: `CldOgImage` does not render an `<img>` tag and cannot be visually embedded on a page. It generates meta tags that social media platforms use when your page is shared.

### Basic usage

The basic required prop is `src`:

```jsx
import { CldOgImage } from 'next-cloudinary';

export default function Page() {
  return (
    <CldOgImage
      src="sample"
      alt="Description for social media"
    />
  );
}
```

> **TIP**: Place the `CldOgImage` component anywhere outside of the Next.js `Head` component, as the `Head` component does not accept React components as children.

The resulting HTML will include all applicable Open Graph tags:

```html
<meta property="og:image" content="https://res.cloudinary.com/.../sample" />
<meta property="og:image:secure_url" content="https://res.cloudinary.com/.../sample" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:image" content="https://res.cloudinary.com/.../sample" />
```

### Transformations for social cards

You can use the same transformation API as `CldImage` to customize your social media cards:

```jsx
import { CldOgImage } from 'next-cloudinary';

export default function Page() {
  return (
    <CldOgImage
      src="sample"
      tint="100:0762a0"
      removeBackground
      opacity="40"
      overlays={[
        {
          text: {
            color: 'white',
            fontFamily: 'Source Sans Pro',
            fontSize: 80,
            fontWeight: 'bold',
            text: 'My Awesome Page'
          }
        }
      ]}
      underlay="background-image"
      alt="My page social card"
      twitterTitle="My Awesome Page"
    />
  );
}
```

In this example:

* `tint="100:0762a0"`: Applies a blue tint to the image
* `removeBackground`: Removes the background
* `opacity="40"`: Reduces opacity to 40%
* `text:{...}`: Adds white text overlay with custom font
* `underlay="background-image"`: Places a background image underneath
* `twitterTitle="My Awesome Page"`: Sets specific alt text and Twitter title

### Image size for social cards

By default, the image canvas is based on 2400x1254 pixels, but resized down to 1200x627 pixels. This means you can design the image as if it were 2400x1254, but the resulting image will be optimized to 1200x627 to meet social media platform requirements.

The 1200x627 size satisfies the 1.91:1 ratio and minimum size requirements for LinkedIn.

You can use `width` and `height` to control the canvas and `widthResize` to change the final size the image is scaled to.

The height is ultimately calculated using the `width` and `widthResize` values to maintain the correct ratio.

```jsx
<CldOgImage
  src="sample"
  width="2000"
  height="2000"
  widthResize="1080"
  alt="Custom sized social card"
/>
```

### Text overlays on social cards

Add custom text to create engaging social media cards:

```jsx
<CldOgImage
  src="sample"
  overlays={[
    {
      text: {
        color: 'white',
        fontFamily: 'Source Sans Pro',
        fontSize: 120,
        fontWeight: 'bold',
        text: 'Next Cloudinary'
      },
      position: {
        x: 100,
        y: 100,
        gravity: 'north_west'
      }
    }
  ]}
  alt="Social card with text"
/>
```

### Background removal for social cards

Create professional social cards by removing backgrounds and adding custom underlays:

```jsx
<CldOgImage
  src="sample"
  removeBackground
  underlay="background-pattern"
  overlays={[
    {
      text: {
        color: 'white',
        fontFamily: 'Source Sans Pro',
        fontSize: 100,
        fontWeight: 'bold',
        text: 'Professional Card'
      }
    }
  ]}
  alt="Professional social card"
/>
```

### Twitter-specific configuration

Customize the Twitter card title:

```jsx
<CldOgImage
  src="sample"
  twitterTitle="Custom Twitter Title"
  alt="Social card"
/>
```

### Excluding specific meta tags

If you need to manage certain meta tags yourself, you can exclude them:

```jsx
<CldOgImage
  src="sample"
  excludeTags={['twitter:title']}
  alt="Social card"
/>
```

### Custom meta tag keys

Customize the keys used for meta tags to avoid duplication:

```jsx
<CldOgImage
  src="sample"
  keys={{
    'og:image': 'my-custom-og-image',
    'twitter:image': 'my-custom-twitter-image'
  }}
  alt="Social card"
/>
```

## Using getCldOgImageUrl helper

The `getCldOgImageUrl` helper function generates Social Card image URLs (Open Graph Images) for use with Next.js App Router metadata. This is particularly useful when you need more control over your metadata configuration or when working with the `generateMetadata` function.

> **NOTE**: If you're using the Pages Router, use the `CldOgImage` component instead. The `getCldOgImageUrl` helper is designed for the App Router's metadata API.

### Basic usage with App Router metadata

The only required parameter is `src`:

```jsx
import { Metadata } from 'next';
import { getCldOgImageUrl } from 'next-cloudinary';

const url = getCldOgImageUrl({
  src: 'sample'
});

export const metadata: Metadata = {
  openGraph: {
    images: [
      {
        width: 1200,
        height: 627,
        url
      }
    ]
  }
}
```

The function returns a URL for the image public ID with default configurations including standard width and height optimized for social media platforms.

### Image size and format

By default, the image canvas is based on 2400x1254 pixels, but resized down to 1200x627 pixels. This means you can design the image as if it were 2400x1254, but the resulting image will be optimized to 1200x627 to meet social media platform requirements.

The 1200x627 size satisfies the 1.91:1 ratio and minimum size requirements for LinkedIn.

You can use `width` and `height` to control the canvas and `widthResize` to change the final size the image is scaled to.

The height is ultimately calculated using the `width` and `widthResize` values to maintain the correct ratio.

```jsx
const url = getCldOgImageUrl({
  src: 'sample',
  width: 2000,
  height: 2000,
  widthResize: 1080
});
```

The default format is JPG, which provides the best compatibility across social media platforms. While Cloudinary's `f_auto` parameter works well for websites, JPG is safer for social cards because:

* WebP doesn't have broad support across all social platforms
* JPG reduces initial encoding time, which is critical for social networks to recognize and load images on first share

### Platform-specific formats

If you need to optimize for specific platforms, you can generate multiple URLs with different formats:

```jsx
import { Metadata } from 'next';
import { getCldOgImageUrl } from 'next-cloudinary';

const ogImageUrl = getCldOgImageUrl({
  src: 'sample',
  format: 'jpg',
});

const twitterImageUrl = getCldOgImageUrl({
  src: 'sample',
  format: 'webp',
});

export const metadata: Metadata = {
  openGraph: {
    images: [
      {
        width: 1200,
        height: 627,
        url: ogImageUrl
      }
    ]
  },
  twitter: {
    images: [twitterImageUrl],
  },
}
```

### Transformations with getCldOgImageUrl

Apply the same transformations available in `getCldImageUrl`:

```jsx
const url = getCldOgImageUrl({
  src: 'sample',
  crop: 'fill',
  gravity: 'auto',
  overlays: [
    {
      text: {
        fontFamily: 'Source Sans Pro',
        fontSize: 120,
        fontWeight: 'bold',
        text: 'Next Cloudinary'
      }
    }
  ]
});
```

### Background removal example

Create professional social cards with background removal and custom underlays:

```jsx
const url = getCldOgImageUrl({
  src: 'sample',
  removeBackground: true,
  underlay: 'background-pattern'
});

export const metadata: Metadata = {
  openGraph: {
    images: [
      {
        width: 1200,
        height: 627,
        url
      }
    ]
  }
}
```

> **TIP**: The Cloudinary AI Background Removal add-on is required to use the `removeBackground` feature.

### Default configuration

`getCldOgImageUrl` is a derivative of `getCldImageUrl` with these default settings optimized for Open Graph images:

{table:class=sdk-props-table}  Property | Default Value | Description |
|----------|---------------|-------------|
| crop | `fill` | Ensures the image fills the entire canvas |
| gravity | `center` | Centers the focal point of the image |
| width | `2400` | Canvas width in pixels |
| height | `1254` | Canvas height in pixels |
| widthResize | `1200` | Final output width after resizing |
| format | `jpg` | Output format for maximum compatibility |

All other configuration options from `getCldImageUrl` are available, including transformations, effects, overlays, and more.

> **READING**:
>
> * Learn about the [Next.js SDK](nextjs_integration) and its components.

> * See examples of [video transformations](nextjs_video_transformations) using Next.js code.

> * Learn how to [upload images and videos](nextjs_image_and_video_upload) in your Next.js app.

> * Check out the [Transformation URL API reference](transformation_reference) for complete transformation details.

> * Explore [image transformation concepts](image_transformations) to understand how transformations work.
