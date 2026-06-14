# Mercur Basic Template

This template comes configured with the bare minimum to get started building your marketplace with Mercur.

## Quick Start

To spin up this template locally, follow these steps:

### Clone

If you've already cloned this repo, skip to [Development](#development).

### Development

Secrets live in [Infisical](https://app.infisical.com) (`secret-management` project). See [`docs/infisical/folder-structure.md`](../docs/infisical/folder-structure.md).

1. From **iPix repo root**, log in once: `infisical login`

2. Install and run the API with injected secrets:

```bash
cd my-marketplace
yarn install
# from repo root:
infisical run --path=/mercur/api -- sh -c 'cd my-marketplace/packages/api && yarn dev'
# or monorepo turbo:
infisical run --path=/mercur --recursive -- sh -c 'cd my-marketplace && yarn dev'
```

**Fallback only:** `cp packages/api/.env.example packages/api/.env` and fill manually (do not commit).

3. Required secrets in Infisical `/mercur/api`: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `COOKIE_SECRET`, CORS vars, Stripe keys.

4. Shared Stripe keys also under `/mercur` (`my-marketplace/.env.example`).

5. Open `http://localhost:9000` to access the Medusa backend
6. Open `http://localhost:7000` to access the admin dashboard
6. Open `http://localhost:7001` to access the vendor dashboard

That's it! Follow the on-screen instructions to login and create your first admin user.

## What's Inside

This monorepo includes the following packages and apps:

### Apps and Packages

- `packages/api` - The Medusa backend with all marketplace functionality
- `apps/admin` - Admin dashboard customizations
- `apps/vendor` - Vendor portal customizations

### Project Structure

```
├── apps/
│   ├── admin/          # Admin dashboard extensions
│   └── vendor/         # Vendor portal extensions
├── packages/
│   └── api/            # Medusa backend
│       ├── src/
│       │   ├── api/         # Custom API routes
│       │   ├── jobs/        # Background jobs
│       │   ├── links/       # Module links
│       │   ├── modules/     # Custom modules
│       │   ├── scripts/     # CLI scripts
│       │   ├── subscribers/ # Event subscribers
│       │   └── workflows/   # Business workflows
│       └── medusa-config.ts
├── blocks.json         # Mercur blocks configuration
├── package.json
└── turbo.json
```

### Utilities

This project has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [Turborepo](https://turborepo.dev/) for monorepo management
- [Prettier](https://prettier.io) for code formatting

## How It Works

The Mercur basic template is built on top of [Medusa](https://medusajs.com) and is pre-configured for marketplace functionality.

### Modules

Custom modules allow you to extend the core functionality. See the [Modules](https://docs.medusajs.com/learn/fundamentals/modules) docs for details.

### Workflows

Workflows define multi-step business processes. See the [Workflows](https://docs.medusajs.com/learn/fundamentals/workflows) docs for details.

### API Routes

Custom API routes expose HTTP endpoints. See the [API Routes](https://docs.medusajs.com/learn/fundamentals/api-routes) docs for details.

### Links

Links define relationships between modules. See the [Links](https://docs.medusajs.com/learn/fundamentals/links) docs for details.

## Adding Blocks

You can extend your project with pre-built blocks using the Mercur CLI:

```bash
bunx @mercurjs/cli add block-name
```

Configure your block sources in `blocks.json`:

```json
{
  "aliases": {
    "workflows": "packages/api/src/workflows",
    "links": "packages/api/src/links",
    "api": "packages/api/src/api",
    "modules": "packages/api/src/modules"
  },
  "registries": {}
}
```

## Build

To build all apps and packages:

```bash
bun run build
```

## Questions

If you have any issues or questions start a [GitHub discussion](https://github.com/mercurjs/mercur/discussions).
