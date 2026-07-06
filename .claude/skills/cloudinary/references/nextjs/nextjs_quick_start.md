---
name: cloudinary-nextjs-quick-start
description: >
  Cloudinary Next.js 5-minute quick start — install, configure NEXT_PUBLIC_CLOUDINARY_*,
  first CldImage render and upload. Load when onboarding or validating a minimal
  next-cloudinary integration.
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

# Next.js quick start


[readme-version-support-link]:https://github.com/cloudinary-community/next-cloudinary#version-support
[sdk-image-and-video-upload-link]:nextjs_image_and_video_upload
This quick start lets you get an end-to-end implementation up and running using the Next.js SDK in 5 minutes or less.

#### Prerequisites **To perform this quick start, you'll need:**

* A Cloudinary account. If you don't have one yet, you can quickly [register for free](https://cloudinary.com/users/register_free).
* Your product environment credentials. You can find your [credentials](product_environment_settings#api_keys) on the [API Keys](https://console.cloudinary.com/app/settings/api-keys) page of the Cloudinary Console Settings. 
  * To use your **API environment variable**, copy the provided format and replace the `<your_api_key>` and `<your_api_secret>` placeholders with the actual values found on the page. Your cloud name will already be correctly included in the format.
* A working Next.js development environment with a [supported version][readme-version-support-link] of Next.js.

> **NOTES**:
>
> * This quick start is designed for quick onboarding.  It doesn't necessarily employ coding best practices and the code you create here isn't intended for production.  

> * If you aren't familiar with Cloudinary, you may want to first take a look at the [Developer Kickstart](dev_kickstart) for a hands-on, step-by-step introduction to Cloudinary features. You may also find our [Glossary](cloudinary_glossary) helpful to understand Cloudinary-specific terminology.
## 1. Set up and configure the SDK

### Install the package

Install the required package using the NPM package manager:

```
npm install next-cloudinary
```

> **TIP**: The `next-cloudinary` package provides all the components and helpers you need to work with Cloudinary in Next.js.

More info about the package...

The next-cloudinary library provides:

* **Components** for rendering images, videos, and upload widgets
* **Helper methods** for generating Cloudinary URLs
* **Built-in optimization** and transformation capabilities

> **TIP**:
>
> :title=Tips:

> * To get a more in-depth understanding, you may want to take a look at the [Next.js SDK introduction](nextjs_integration). 

> * To start with full example apps, see [Next.js sample projects](nextjs_sample_projects).

### Configure Cloudinary

Create or update your `.env.local` file in your Next.js project root and add your cloud name:

.env.local

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
```

More info about configuration...

Change the `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` value to your cloud name (found on the [Cloudinary Console Dashboard](https://console.cloudinary.com/app/home/dashboard)).

For Next.js, you can also set additional optional environment variables:

```
NEXT_PUBLIC_CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

## 2. Upload an image

The Next.js SDK provides easy-to-use upload components. For this quick start, we'll use the `CldUploadButton` component to upload an image.

First, you need to create an upload preset in your Cloudinary Console:

1. Log into your [Cloudinary Console](https://console.cloudinary.com/console)
2. Go to **Settings > Upload**
3. Scroll to **Upload presets** and click **Add upload preset**
4. Set **Signing Mode** to **Unsigned**
5. Set **Folder** to `docs` (optional, but helps organize your assets)
6. Click **Save**
7. Copy the **Preset name** - you'll need this in the next step

Now add upload functionality to your project (if you've created a new Next.js project, you can replace the contents of **app/page.tsx**, otherwise create a new page in your project, or modify an existing page):

app/page.tsx

```tsx
'use client';

import { CldUploadButton } from 'next-cloudinary';
import { useState } from 'react';
import type { CloudinaryUploadWidgetInfo } from 'next-cloudinary';

export default function UploadPage() {
  const [uploadedImage, setUploadedImage] = useState<CloudinaryUploadWidgetInfo | null>(null);

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Upload an Image</h1>

      <div style={{
        backgroundColor: '#0070f3',
        color: 'white',
        padding: '12px 24px',
        border: 'none',
        borderRadius: '6px',
        fontSize: '16px',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'inline-block'
      }}>
        <CldUploadButton
          uploadPreset="your_upload_preset"
          onSuccess={(result) => {
            if (result.info && typeof result.info !== 'string') {
              setUploadedImage(result.info);
              console.log('Upload successful:', result.info);
            }
          }}
          onQueuesEnd={(result, { widget }) => {
            widget.close();
          }}
        >
          Upload Image
        </CldUploadButton>
      </div>

      {uploadedImage && (
        <div style={{ marginTop: '2rem' }}>
          <p>Upload successful!</p>
          <p><strong>Public ID:</strong> {uploadedImage.public_id}</p>
        </div>
      )}
    </main>
  );
}
```

Replace `your_upload_preset` with the preset name you copied from the Cloudinary Console.

This code creates an "Upload Image" button, which, when clicked, opens the Cloudinary Upload Widget, allowing you to upload from various sources. 

> **TIP**: For production applications, you should use [signed uploads](nextjs_image_and_video_upload#using_signed_uploads) for better security. Learn more in the [Next.js image and video upload](nextjs_image_and_video_upload) guide.

## 3. Transform and deliver the image

Following upload, you can use the `CldImage` component to transform and deliver the image, using its public ID.

Update your page to include the transformation:

1. Add `CldImage` to the import from next-cloudinary.

      ```tsx
      import { CldUploadButton, CldImage } from 'next-cloudinary';
      ```
1. Add the `CldImage` component inside the conditional block, after the Public ID paragraph and before the closing `</div>`:
   
      ```tsx
          <h2 style={{ marginTop: '2rem' }}>Transformed Image:</h2>
          <CldImage
            src={uploadedImage.public_id}
            width="250"
            height="250"
            crop="fill"
            alt="Transformed uploaded image"
          />
       ```   
    The `CldImage` component uses the uploaded image's public ID to apply transformations:
      * **width**: 250 pixels
      * **height**: 250 pixels  
      * **crop**: fill (ensures the image fills the entire space)

The full code should look like this (with `your_upload_preset` replaced with your own upload preset name):

app/page.tsx

```tsx
'use client';

import { CldUploadButton, CldImage } from 'next-cloudinary';
import { useState } from 'react';
import type { CloudinaryUploadWidgetInfo } from 'next-cloudinary';

export default function UploadPage() {
  const [uploadedImage, setUploadedImage] = useState<CloudinaryUploadWidgetInfo | null>(null);

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Upload an Image</h1>

      <div style={{
        backgroundColor: '#0070f3',
        color: 'white',
        padding: '12px 24px',
        border: 'none',
        borderRadius: '6px',
        fontSize: '16px',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'inline-block'
      }}>
        <CldUploadButton
          uploadPreset="your_upload_preset"
          onSuccess={(result) => {
            if (result.info && typeof result.info !== 'string') {
              setUploadedImage(result.info);
              console.log('Upload successful:', result.info);
            }
          }}
          onQueuesEnd={(result, { widget }) => {
            widget.close();
          }}
        >
          Upload Image
        </CldUploadButton>
      </div>

      {uploadedImage && (
        <div style={{ marginTop: '2rem' }}>
          <p>Upload successful!</p>
          <p><strong>Public ID:</strong> {uploadedImage.public_id}</p>
          
          <h2 style={{ marginTop: '2rem' }}>Transformed Image:</h2>
          <CldImage
            src={uploadedImage.public_id}
            width="250"
            height="250"
            crop="fill"
            alt="Transformed uploaded image"
          />
        </div>
      )}
    </main>
  );
}
```

> **NOTE**: When using the App Router in Next.js 13+, add the `'use client'` directive at the top of your file to use Cloudinary components.

More info about transformations...

There are many [transformations](nextjs_image_transformations) you can apply to your assets. Find them all in the [transformation reference](transformation_reference).

The `CldImage` component accepts transformation props that make it easy to apply common transformations:

```jsx
<CldImage
  src={uploadedImage.public_id}
  width="250"
  height="250"
  crop="fill"
  gravity="face"
  sepia
  alt="Transformed image"
/>
```

You can also use the `getCldImageUrl` helper to generate a URL:

```jsx
import { getCldImageUrl } from 'next-cloudinary';

const url = getCldImageUrl({
  src: uploadedImage.public_id,
  width: 250,
  height: 250,
  crop: 'fill'
});
```

## 4. Run your code

Start your Next.js development server:

```
npm run dev
```

Navigate to `http://localhost:3000` (or your configured port) and:

1. Click the "Upload Image" button
2. Upload an image using the Cloudinary Upload Widget
3. After upload completes, you'll see:
   * The public ID
   * The transformed image (250x250, cropped to fill)

![Transformed models image](https://res.cloudinary.com/demo/image/upload/c_fill,h_250,w_250/docs/models "with_code: false")

## View the completed code

You can find the full code example for this quick start on [GitHub](https://github.com/cloudinary-devs/cld-nextjs-sdk-quick-start).

> **Ready to learn more?**:
>
> * Get a detailed [overview](nextjs_integration) of the Next.js SDK and its capabilities.

> * Learn about [image transformations](nextjs_image_transformations) using the CldImage component.

> * Discover how to [upload images and videos](nextjs_image_and_video_upload) in your Next.js app.

> * Explore [video delivery](nextjs_video_transformations) with the CldVideoPlayer component.
