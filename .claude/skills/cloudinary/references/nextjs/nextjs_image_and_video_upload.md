---
name: cloudinary-nextjs-upload
description: >
  Next.js upload — CldUploadWidget, unsigned presets, signed uploads with server
  signature routes. Load when wiring file upload UI or debugging upload widget in
  Next.js.
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

# Next.js image and video upload



The Next.js SDK provides React components that make it easy to add file upload functionality to your Next.js application. These components wrap the [Cloudinary Upload Widget](upload_widget), giving you a ready-made, responsive UI that supports uploads from multiple sources including local files, camera, URL, and more.

You can implement uploads using either unsigned upload presets for quick setup, or signed uploads with server-side signature generation for enhanced security.

> **TIP**:
>
> Remember to: 

> * [Configure your cloud name](nextjs_integration#configure). 

> * [Set up your API key and secret](nextjs_integration#set_additional_configuration_parameters) for signed uploads.

## Upload options

The Next.js SDK offers two components for uploading assets. Both components open the [Cloudinary Upload Widget](upload_widget), a ready-made, responsive user interface that enables your users to upload files from a variety of sources (local files, camera, URL, and more).

* **CldUploadButton** - A simple button component that opens the upload widget when clicked. Best for straightforward upload functionality.
* **CldUploadWidget** - A flexible component that provides full programmatic control over the upload widget, including the ability to open it from custom UI elements.

Both components provide access to callback functions, configuration options, and instance methods to customize the upload experience for your users.

## Using CldUploadButton

The `CldUploadButton` component provides the simplest way to add upload functionality to your Next.js app. It renders a button that, when clicked, opens the Cloudinary Upload Widget.

### Basic usage

This example shows the minimal setup required to add an upload button to your Next.js application. The `uploadPreset` prop specifies which [upload preset](upload_presets) to use, which defines the upload configuration:

```jsx
'use client';

import { CldUploadButton } from 'next-cloudinary';

export default function Page() {
  return (
    <CldUploadButton uploadPreset="your_unsigned_upload_preset">
      Upload Files
    </CldUploadButton>
  );
}
```

> **NOTE**: For quick setup, an unsigned upload preset is required. For production applications requiring enhanced security, configure [signed uploads](#using_signed_uploads) with server-side signature generation. For signed uploads, an upload preset is optional.

### Handling upload results

Use the `onSuccess` callback to handle successful uploads:

```tsx
'use client';

import { CldUploadButton } from 'next-cloudinary';
import { useState } from 'react';
import type { CloudinaryUploadWidgetInfo } from 'next-cloudinary';

export default function Page() {
  const [resource, setResource] = useState<CloudinaryUploadWidgetInfo | undefined>();

  return (
    <>
      <CldUploadButton
        uploadPreset="your_unsigned_upload_preset"
        onSuccess={(result, { widget }) => {
          if (typeof result?.info !== 'string') {
            setResource(result?.info);
          }
          console.log('Upload successful:', result?.info);
          widget.close();
        }}
        onError={(error, { widget }) => {
          console.error('Upload error:', error);
        }}
      >
        Upload Files
      </CldUploadButton>

      {resource && (
        <div>
          <p>Public ID: {resource.public_id}</p>
          <p>URL: {resource.secure_url}</p>
        </div>
      )}
    </>
  );
}
```

### Customizing the button

The `CldUploadButton` component inherits all props from `CldUploadWidget` (including callback functions like `onSuccess`, `onQueuesEnd`, etc.), however, it handles children differently.

**Button-specific props:**

* `className` - CSS class name for styling
* `onClick` - Click event handler function

Other HTML button props (like `style`, `type`, etc.) are spread onto the `<button>` element, giving you full control over the button's appearance and behavior.

**Button content:**

You can customize the content inside the button by placing elements between the opening and closing `<CldUploadButton>` tags. If no content is provided, the button displays "Upload" by default.
  
> **NOTE**: In `CldUploadWidget`, the content between the tags is a render function that receives widget state. In `CldUploadButton`, the content is simply the button's label or inner elements.

**Example with custom styling:**

Create styling for your button in CSS, for example, in **globals.css**:

```css
@layer components {
  .custom-button {
    background-color: blue;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
```

Set the `className` prop to the name of the class, in this case, `custom-button`: 

```jsx
<CldUploadButton
    uploadPreset="your_unsigned_upload_preset"
    className="custom-button"
    >
    <span>Upload Files</span>
</CldUploadButton>
```

This renders a styled button with the text "Upload Files":

  Upload Files

**Example with default label:**

If you don't provide content between the tags, the button displays "Upload":

```jsx
<CldUploadButton
  uploadPreset="your_unsigned_upload_preset"
  className="custom-button"
/>
```

This renders a styled button with the text "Upload":

  Upload

**Example with onClick handler:**

You can add custom logic when the button is clicked, before the upload widget opens:

```tsx
<CldUploadButton
  uploadPreset="your_unsigned_upload_preset"
  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
    console.log('Upload button clicked');
    // Add any pre-upload logic here
  }}
>
  Upload Files
</CldUploadButton>
```

## Using CldUploadWidget

The `CldUploadWidget` component provides more control over the upload experience, allowing you to customize when and how the widget opens.

> **NOTE**: The `CldUploadWidget` won't render any UI by default. It uses a render prop pattern where you provide a function that returns your custom UI, giving you complete control over the trigger element and interface.

### Basic usage

```jsx
'use client';

import { CldUploadWidget } from 'next-cloudinary';

export default function Page() {
  return (
    <CldUploadWidget uploadPreset="your_unsigned_upload_preset">
      {({ open }) => {
        return (
          <button onClick={() => open()}>
            Upload Files
          </button>
        );
      }}
    </CldUploadWidget>
  );
}
```

### Render function parameters

The render function receives an object with the following parameters:

{table:class=sdk-props-table-wide-desc}  Parameter | Type | Description |
|-----------|------|-------------|
| cloudinary | Cloudinary | The Cloudinary instance which creates and manages the Widget instance |
| error | string | The error, if any, produced by an upload widget action |
| isLoading | boolean | Designates whether the upload widget is loading and initializing |
| results | object | The event that triggered the results and information related to that event, which can include upload results |
| widget | Widget | The widget instance attached to the current component |
| open | function | Instance method to open the widget |
| close | function | Instance method to close the widget |
| hide | function | Instance method to hide the widget |
| show | function | Instance method to show the widget |
| minimize | function | Instance method to minimize the widget |
| destroy | function | Instance method to destroy the widget |
| isDestroyed | function | Instance method to check if widget is destroyed |
| isShowing | function | Instance method to check if widget is showing |
| isMinimized | function | Instance method to check if widget is minimized |
| update | function | Instance method to update widget options |

**Example accessing multiple parameters:**

```jsx
<CldUploadWidget uploadPreset="your_unsigned_upload_preset">
  {({ open, cloudinary, widget, isLoading, error }) => {
      if (isLoading) return <p>Loading...</p>;
      if (error) return <p>Error: {typeof error === 'string' ? error : `${error.status} ${error.statusText}`}</p>;
      
      return (
      <button onClick={() => open()}>
          Upload Files
      </button>
      );
  }}
  </CldUploadWidget>
```

### Handling upload events

The widget provides callback functions for different events in the upload lifecycle. There are two types of callbacks:

1. **Callback functions** - Receive both results and options (including widget instance and instance methods)
2. **Action callbacks** - Receive only results (designed for Server Actions workflow)

#### Callback functions

These callbacks receive `(results, options)` or `(error, options)` parameters:

{table:class=sdk-two-col-table-wide-desc} Callback | Description |
|----------|-------------|
| onAbort | Triggered when upload is aborted |
| onBatchCancelled | Triggered when batch upload is cancelled |
| onClose | Triggered when widget is closed |
| onDisplayChanged | Triggered when widget display changes |
| onError | Triggered when an error occurs |
| onOpen | Triggered when widget opens (receives only widget parameter) |
| onPublicId | Triggered when public ID is generated |
| onQueuesEnd | Triggered when all uploads in queue complete |
| onQueuesStart | Triggered when upload queue starts |
| onRetry | Triggered when upload is retried |
| onShowCompleted | Triggered when completed uploads are shown |
| onSourceChanged | Triggered when upload source changes |
| onSuccess | Triggered on successful upload |
| onTags | Triggered when tags are processed |
| onUpload | (Deprecated) Use onSuccess instead |
| onUploadAdded | Triggered when file is added to upload queue |

**Example:**

This example demonstrates using multiple callback functions to handle different stages of the upload process. It uses `onSuccess` to capture upload results, `onQueuesEnd` to automatically close the widget after all uploads complete, and `onError` to handle any upload failures:

```tsx
'use client';

import { CldUploadWidget } from 'next-cloudinary';
import { useState } from 'react';
import type { CloudinaryUploadWidgetInfo } from 'next-cloudinary';

export default function Page() {
  const [resource, setResource] = useState<CloudinaryUploadWidgetInfo | undefined>();

  return (
    <CldUploadWidget
      uploadPreset="your_unsigned_upload_preset"
      onSuccess={(result, { widget }) => {
        if (typeof result?.info !== 'string') {
          setResource(result?.info);
        }
        console.log('Upload successful:', result?.info);
      }}
      onQueuesEnd={(result, { widget }) => {
        console.log('All uploads complete');
        widget.close();
      }}
      onError={(error, { widget }) => {
        console.error('Upload error:', error);
      }}
    >
      {({ open }) => {
        return (
          <button onClick={() => open()}>
            Upload Files
          </button>
        );
      }}
    </CldUploadWidget>
  );
}
```

#### Action callbacks

These callbacks receive only the `(results)` parameter for use with Server Actions:

{table:class=sdk-two-col-table-wide-desc} Action Callback | Description |
|-----------------|-------------|
| onAbortAction | Action version of onAbort |
| onBatchCancelledAction | Action version of onBatchCancelled |
| onCloseAction | Action version of onClose |
| onDisplayChangedAction | Action version of onDisplayChanged |
| onPublicIdAction | Action version of onPublicId |
| onQueuesEndAction | Action version of onQueuesEnd |
| onQueuesStartAction | Action version of onQueuesStart |
| onRetryAction | Action version of onRetry |
| onShowCompletedAction | Action version of onShowCompleted |
| onSourceChangedAction | Action version of onSourceChanged |
| onSuccessAction | Action version of onSuccess |
| onTagsAction | Action version of onTags |
| onUploadAddedAction | Action version of onUploadAdded |

> **TIP**: For more details on when each event triggers, see the [Upload Widget events documentation](upload_widget_reference#events).

#### Callback parameters

Most callbacks provide parameters with the following structure:

**For Callback Functions:**

* `results` (object) - Contains `event` (string) and `info` (object with upload details like `public_id`, `secure_url`, `width`, `height`, etc.)
* `options` (object) - Contains `widget` (Widget instance) and instance methods

**For Action Callbacks:**

* `results` (object) - Contains `event` and `info` only

**Example results object:**

```javascript
{
  event: 'success',
  info: {
    public_id: 'my-folder/my-image',
    secure_url: 'https://res.cloudinary.com/.../my-image',
    width: 1920,
    height: 1080,
    format: 'jpg',
    resource_type: 'image',
    created_at: '2024-01-01T00:00:00Z',
    bytes: 123456,
    // ... additional metadata
  }
}
```

### Instance methods

The Upload Widget exposes instance methods that provide greater control over the upload experience. These are available through the `children` function parameters or callback `options`:

{table:class=sdk-two-col-table-wide-desc} Method | Description |
|--------|-------------|
| open() | Renders an existing widget currently in memory, but not currently displayed |
| close() | Closes and resets the widget to its initial state without removing it from memory |
| hide() | Hides a previously rendered widget while retaining its current state in memory |
| show() | Renders a previously hidden widget |
| minimize() | Minimizes the widget |
| destroy() | Closes the widget and completely removes it from the DOM. Returns a promise that resolves upon cleanup completion |
| isShowing() | Returns whether the widget is currently visible |
| isMinimized() | Returns whether the widget is currently minimized |
| isDestroyed() | Returns whether the destroy method was called on this instance |
| update(options) | Updates a widget currently in memory with new options |

**Example using instance methods:**

This example demonstrates how to programmatically control the upload widget using instance methods. It creates multiple buttons that allow you to open, close, hide, show, and minimize the widget, as well as check its current state:

```jsx
<CldUploadWidget uploadPreset="your_unsigned_upload_preset">
  {({ open, close, hide, show, minimize, isShowing }) => {
    return (
      <div>
        <button onClick={() => open()}>Open Widget</button>
        <button onClick={() => close()}>Close Widget</button>
        <button onClick={() => hide()}>Hide Widget</button>
        <button onClick={() => show()}>Show Widget</button>
        <button onClick={() => minimize()}>Minimize Widget</button>
        <button onClick={() => console.log('Showing:', isShowing())}>
          Check if Showing
        </button>
      </div>
    );
  }}
</CldUploadWidget>
```

## Signed vs unsigned uploads

There are two options when using the upload components: **signed** and **unsigned**. These options allow you to control the amount of security and restrictions you place on uploads.

**Unsigned uploads:**

* Simpler to implement (no server-side code required)
* Require an unsigned upload preset
* Anyone with the preset name can upload
* Best for: Public assets, demos, prototypes

**Signed uploads:**

* More secure (requires server-side signature generation)
* Prevents unauthorized uploads
* Allows more control over upload parameters
* Best for: Production applications, restricted uploads, sensitive content

> **TIP**: To learn more about the differences, see the [authenticated upload requests](upload_images#authenticated_requests) documentation.

### Using unsigned uploads

Unsigned uploads are the simplest option and work well for public assets. All the examples in [Using CldUploadButton](#using_clduploadbutton) and [Using CldUploadWidget](#using_clduploadwidget) show unsigned uploads.

For unsigned uploads, you need to set the `uploadPreset` prop to your unsigned upload preset.

For `CldUploadButton`:

```jsx
<CldUploadButton uploadPreset="your_unsigned_upload_preset">
    Upload Files
</CldUploadButton>
```

For `CldUploadWidget`:

```jsx
<CldUploadWidget uploadPreset="your_unsigned_upload_preset">
    {({ open }) => {
    return (
      <button onClick={() => open()}>
        Upload an Image
      </button>
    );
  }}
</CldUploadWidget>
```

Unsigned uploads should only be used when you don't need to restrict who can upload or what can be uploaded. Anyone with access to your upload preset name can upload to your account.

### Using signed uploads

Signed upload requests provide enhanced security for your file uploads. This helps prevent unauthorized uploads to your Cloudinary account.

For signed uploads, you need to set the `signatureEndpoint` prop to an API endpoint that'll provide the signature.

For `CldUploadButton`:

```jsx
<CldUploadButton signatureEndpoint="/api/sign-cloudinary-params">
  Upload Files
</CldUploadButton>
```

For `CldUploadWidget`:

```jsx
<CldUploadWidget signatureEndpoint="/api/sign-cloudinary-params">
  {({ open }) => {
    return (
      <button onClick={() => open()}>
        Upload an Image
      </button>
    );
  }}
</CldUploadWidget>
```

You can optionally also provide a signed upload preset in the `uploadPreset` prop, but this isn't **required** for signed uploads.

For `CldUploadButton`:

```jsx
<CldUploadButton uploadPreset="your_signed_upload_preset" signatureEndpoint="/api/sign-cloudinary-params">
  Upload Files
</CldUploadButton>
```

For `CldUploadWidget`:

```jsx
<CldUploadWidget uploadPreset="your_signed_upload_preset" signatureEndpoint="/api/sign-cloudinary-params">
  {({ open }) => {
    return (
      <button onClick={() => open()}>
        Upload an Image
      </button>
    );
  }}
</CldUploadWidget>
```

#### Creating the signature endpoint

When working in Next.js, you can use the [Cloudinary Node SDK](node_integration) in a server-side API route to sign your upload requests.

**Step 1: Install the Cloudinary Node SDK**

```bash
npm install cloudinary
```

**Step 2: Set up environment variables**

Add your Cloudinary API credentials to your environment variables:

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
NEXT_PUBLIC_CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

Never expose your `CLOUDINARY_API_SECRET` to the client. Keep it in server-side environment variables only (without the `NEXT_PUBLIC_` prefix).

**Step 3: Create the API endpoint**

The implementation differs based on whether you're using the App Router or Pages Router.

**For App Router (Next.js 13+):**

Create a new file at `app/api/sign-cloudinary-params/route.js`:

```jsx
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  const body = await request.json();
  const { paramsToSign } = body;

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET
  );

  return Response.json({ signature });
}
```

**For Pages Router:**

Create a new file at `pages/api/sign-cloudinary-params.js`:

```jsx
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default function handler(req, res) {
  const { paramsToSign } = req.body;

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET
  );

  res.status(200).json({ signature });
}
```

That's it! The upload components now automatically call your signature endpoint before each upload to generate a secure signature.

> **TIP**: Learn more about [generating authentication signatures](upload_images#generating_authentication_signatures) in the Cloudinary documentation.

## Configuration

Both `CldUploadButton` and `CldUploadWidget` support configuration through props.

### Cloudinary environment configuration

The upload components automatically use environment variables for Cloudinary configuration:

* `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name (required)
* `NEXT_PUBLIC_CLOUDINARY_API_KEY` - Your API key (optional, for signed uploads)
* `CLOUDINARY_API_SECRET` - Your API key (optional, for signed uploads)

You can also use the `config` prop to override the environment variables:

```jsx
<CldUploadButton
  uploadPreset="your_unsigned_upload_preset"
  config={{
    cloud: {
      cloudName: 'your_cloud_name'
    }
  }}
>
  Upload Files
</CldUploadButton>
```

> **TIP**: Using environment variables is the recommended approach. The components will automatically detect and use these values.

### Upload Widget configuration options

You can pass any [Upload Widget configuration option](upload_widget_reference#parameters) using the `options` prop:

```jsx
<CldUploadWidget
  uploadPreset="your_unsigned_upload_preset"
  options={{
    sources: ['local', 'camera'],
    multiple: true
  }}
>
  {({ open }) => <button onClick={() => open()}>Upload</button>}
</CldUploadWidget>
```

Common configuration options include:

{table:class=sdk-props-table-wide-desc}  Option | Type | Description |
|--------|------|-------------|
| sources | array | Upload sources (e.g., `['local', 'camera', 'url']`) |
| multiple | boolean | Allow multiple file uploads |
| maxFiles | number | Maximum number of files |
| maxFileSize | number | Maximum file size in bytes |
| clientAllowedFormats | array | Allowed file formats (e.g., `['jpg', 'png']`) |
| resourceType | string | Resource type (`'image'`, `'video'`, `'raw'`, `'auto'`) |
| folder | string | Upload folder path |
| tags | array | Tags to apply to uploaded assets |
| context | object | Contextual metadata |
| styles | object | Custom widget styling |
| text | object | Custom widget text/labels |
| language | string | Widget language (e.g., `'en'`, `'es'`) |
| showAdvancedOptions | boolean | Show advanced upload options |
| showCompletedButton | boolean | Show completed button |
| showUploadMoreButton | boolean | Show upload more button |
| showSkipCropButton | boolean | Show skip crop button |
| cropping | boolean | Enable image cropping |
| croppingAspectRatio | number | Aspect ratio for cropping |
| croppingDefaultSelectionRatio | number | Default selection ratio |
| croppingShowDimensions | boolean | Show dimensions during cropping |
| croppingCoordinatesMode | string | Coordinates mode (`'custom'` or `'face'`) |
| croppingShowBackButton | boolean | Show back button in cropping view |

**Example with multiple configuration options:**

```jsx
<CldUploadWidget
  uploadPreset="your_unsigned_upload_preset"
  options={{
    sources: ['local', 'camera', 'url'],
    multiple: true,
    maxFiles: 5,
    maxFileSize: 10000000, // 10MB
    clientAllowedFormats: ['jpg', 'png', 'gif'],
    folder: 'user-uploads',
    tags: ['profile-photo'],
    styles: {
      palette: {
        window: '#FFFFFF',
        windowBorder: '#90A0B3',
        tabIcon: '#0078FF',
        menuIcons: '#5A616A',
        textDark: '#000000',
        textLight: '#FFFFFF',
        link: '#0078FF',
        action: '#FF620C',
        inactiveTabIcon: '#0E2F5A',
        error: '#F44235',
        inProgress: '#0078FF',
        complete: '#20B832',
        sourceBg: '#E4EBF1'
      }
    }
  }}
>
  {({ open }) => <button onClick={() => open()}>Upload Up To Five Images</button>}
</CldUploadWidget>
```

> **TIP**:
>
> :title=Tips

> * For a complete list of configuration options, see the [Upload Widget reference](upload_widget_reference#parameters).

> * Try the [Upload Widget Demo](https://demo.cloudinary.com/uw/) to see how the options behave.

> **READING**:
>
> * Learn about the [Next.js SDK](nextjs_integration) and its components.

> * See examples of [image transformations](nextjs_image_transformations) and [video transformations](nextjs_video_transformations) using Next.js code.

> * Check out the [Upload Widget Reference](upload_widget) for complete upload widget documentation.

> * Learn about configuring [Upload Presets](upload_presets) for your uploads.

> * Understand [signed upload requests](upload_images#signed_upload_requests) for secure uploads.
