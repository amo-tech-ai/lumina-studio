# Migration Guide: Mercur 1.x → 2.0

Self-contained — works without the mercur monorepo. Optional arg: path to old project.

## Package mapping

| 1.x | 2.0 |
|-----|-----|
| `@mercurjs/b2c-core` | `@mercurjs/core` (built in) |
| `@mercurjs/commission` | built into core |
| `@mercurjs/algolia` | block: `mercurjs add algolia` |
| `@mercurjs/resend` | no equivalent — port manually |
| `@mercurjs/payment-stripe-connect` | port manually |
| `@mercurjs/stripe-tax-provider` | port manually |
| `@medusajs/admin-vite-plugin` | `@mercurjs/dashboard-sdk` |
| `@medusajs/js-sdk` | `@mercurjs/client` |

## Directory mapping

| 1.x | 2.0 |
|-----|-----|
| `apps/backend/src/*` | `packages/api/src/*` |
| `apps/admin/src/routes/` | `apps/admin/src/routes/` |
| `apps/vendor/src/routes/` | `apps/vendor/src/routes/` |

## Import changes

| Old | New |
|-----|-----|
| `@medusajs/utils` | `@medusajs/framework/utils` |
| `@medusajs/js-sdk` | `@mercurjs/client` |
| `@custom-types/*` | `@mercurjs/types` |
| `@hooks/*`, `@components/*`, `@lib/*` | `@mercurjs/dashboard-shared` or local |
| `@mercurjs/b2c-core` | `@mercurjs/core` |

## Provider registration

```typescript
// Wrong
resolve: './providers/my-provider'
// Correct
resolve: './src/providers/my-provider'
```

Provider entry: `import { Modules, ModuleProvider } from "@medusajs/framework/utils"`

## Workflow

### 1. Analyze old project

- `package.json` — all `@mercurjs/*` / `@medusajs/*` deps; if b2c-core < 1.4.0, admin may live in backend
- `medusa-config.ts` — plugins, modules, providers
- Count custom modules, workflows, API routes, subscribers, links
- Custom pages in `apps/admin/src`, `apps/vendor/src`

### 2. Classify

| Level | Criteria |
|-------|----------|
| Starter | config only |
| Light | <10 endpoints, <5 workflows, no custom modules |
| Heavy | custom modules, >10 workflows, custom admin, integrations |

### 3. Map elements

- In 2.0 core? → skip
- Registry block? → `mercurjs add`
- Else → manual port queue

### 4. Port order

1. Config (`medusa-config.ts`)
2. Providers → `packages/api/src/providers/`
3. Modules → register in config
4. Workflows → `packages/api/src/workflows/<entity>/`
5. Links (skip core duplicates)
6. Subscribers
7. API routes (type both generics)
8. Middleware → merge `middlewares.ts`
9. Dashboard → `src/routes/` (NOT `src/pages/`)

After each group: `bun medusa develop`. After API routes: `bunx @mercurjs/cli@latest codegen`. After dashboard: `bun vite build` in admin/vendor.

### 5. Verify

Server starts; endpoints respond; dashboard builds; custom pages render.

## Stop and ask user when

- custom module depends on non-public APIs
- no migration path for third-party integration
- schema conflicts
- Medusa core modifications in old project
- server won't start after port and cause unclear

## Avoid

- in-place upgrade of 1.x tree
- installing 1.x packages in 2.0 project
- barrel `index.ts` in `workflows/` or `steps/` (block install conflicts)
- duplicating core links

Docs: https://docs.mercurjs.com/v2/migrations/overview
