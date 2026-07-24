# IPI-622 · CF-DB-008A — Hyperdrive benchmark tooling

Disposable Worker + runner. **Not** part of the operator app build.

## Auth (required)

Every route — including `/dataapi` which uses `SUPABASE_SERVICE_ROLE_KEY` — requires:

```http
Authorization: Bearer <BENCH_TOKEN>
```

```bash
# once per Worker after deploy
npx wrangler secret put BENCH_TOKEN -c wrangler.jsonc
npx wrangler secret put SUPABASE_URL -c wrangler.jsonc
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY -c wrangler.jsonc
# repeat with -c wrangler.placement.jsonc for the placement A/B Worker

BENCH_TOKEN=… npm run bench -- --url https://ipix-bench-hyperdrive.<sub>.workers.dev --label fresh --n 40
```

Delete both Workers after collecting numbers (`npm run delete` / `delete:placement`). Never leave a service-role secret on a public `workers.dev` URL without `BENCH_TOKEN`.

## Tests

```bash
npm test
```
