Cloudflare
The @opennextjs/cloudflare adapter lets you deploy Next.js apps to Cloudflare Workers using the Node.js "runtime" from Next.js.

Get Started
New apps
To create a new Next.js app, pre-configured to run on Cloudflare using @opennextjs/cloudflare, run:

npm create cloudflare@latest -- my-next-app --framework=next --platform=workers
Existing Next.js apps
Follow the guide here to use @opennextjs/cloudflare with an existing Next.js app.

Supported Next.js runtimes
Next.js has two "runtimes" — "Edge" and "Node.js". When you use @opennextjs/cloudflare, your app should use the Node.js runtime, which is more fully featured, and allows you to use the Node.js APIs that are provided by the Cloudflare Workers runtime.

This is an important difference from @cloudflare/next-on-pages, which only supports the "Edge" runtime. The Edge Runtime code in Next.js intentionally constrains which APIs from Node.js can be used, and the "Edge" runtime does not support all Next.js features.

Supported Next.js versions
All minor and patch versions of Next.js 16 and the latest minors of Next.js 14 and 15 are supported. Next.js 14 support will be dropped Q1 2026. It is no more supported by the Next.js team.

To help improve compatibility, we encourage you to report bugs and contribute code!

Supported Next.js features
 App Router
 Route Handlers
 Dynamic routes
 Static Site Generation (SSG)
 Server-Side Rendering (SSR)
 Middleware
 Node Middleware introduced in 15.2 are not yet supported
 Image optimization (See this guide to configure Cloudflare Images)
 Partial Prerendering (PPR)
 Pages Router
 Incremental Static Regeneration (ISR)
 Support for after
 Composable Caching ('use cache')
 Turbopack
We welcome both contributions and feedback!

Windows support
OpenNext can be used on Windows systems but Windows full support is not guaranteed because:

Next.js tooling itself has Windows support issues and OpenNext is built on these tools
the OpenNext team has limited capacity and fully supporting Windows (given the point above) has been determined to be a lower priority, thus the effort and testing on Windows is limited
Given the above, you can develop your application under Windows at your own risk. If you don't have an alternative we recommend either:

running OpenNext using the Windows Subsystem for Linux (WSL),
in a Linux Virtual Machine or
develop your application using the standard Next.js tooling and deploy it using OpenNext in CI/CD systems such as GitHub Actions that run linux/MacOS environments
Windows Subsystem for Linux (WSL) allows you to run a Linux environment on your Windows machine, without the need for a separate virtual machine or dual booting. Visual Studio Code has an extension that makes developing with WSL very easy.

How @opennextjs/cloudflare Works
The OpenNext Cloudflare adapter works by taking the Next.js build output and transforming it, so that it can run in Cloudflare Workers.

When you add @opennextjs/cloudflare as a dependency to your Next.js app, and then run npx @opennextjs/cloudflare the adapter first builds your app by running the build script in your package.json, and then transforms the build output to a format that you can run locally using Wrangler, and deploy to Cloudflare.

You can view the code for @opennextjs/cloudflare here to understand what it does under the hood.

Note on Worker Size Limits
The size limit of a Cloudflare Worker is 3 MiB on the Workers Free plan, and 10 MiB on the Workers Paid plan. After building your Worker, wrangler will show both the original and compressed sizes:

Total Upload: 13833.20 KiB / gzip: 2295.89 KiB