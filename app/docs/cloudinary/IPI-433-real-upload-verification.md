# IPI-433 — Real Cloudinary upload verification

Use this after mocked Playwright proof passes. Confirms **Cloudinary → webhook → Supabase mirror → status poll** on a real environment.

## Prerequisites

- `app/.env.local` with Cloudinary + Supabase + QA brand (`CLD105_BRAND_ID`)
- Operator auth for sign routes (`CLD105_OPERATOR_EMAIL` / `CLD105_OPERATOR_PASSWORD` or token)
- App running locally on port **3002** (or set `CLD105_APP_BASE_URL`)
- Production or staging webhook URL configured in Cloudinary (`CLD105_WEBHOOK_BASE_URL`)

## Automated live proof (recommended)

From `app/`:

```bash
npm run verify:cloudinary-webhook-live
```

This script:

1. Signs an upload via `POST /api/assets/upload-sign` (Bearer or cookie operator auth)
2. Uploads a tiny PNG to Cloudinary with the signed params
3. Waits for the genuine webhook to upsert `cloudinary_assets`
4. Asserts mirror row is `ready` with `cloudinary_asset_id` populated

## Manual UI proof (optional)

1. Log in as an org member who can access the QA brand (not only `brands.user_id` owner).
2. Open `/app/assets`, select the brand, click **Upload**, pick a small JPG/PNG.
3. Confirm queue: **uploading → processing → ready**.
4. Confirm the asset appears in the library after refresh.
5. In DevTools → Network, confirm:
   - `POST /api/assets/cloudinary-sign` returns signature only (no API secret)
   - `GET /api/assets/status?cloudinaryAssetId=…` polls until `ready`

## Failure triage

| Symptom | Likely cause |
|---------|----------------|
| Sign 403 | Brand not visible via RLS / org membership |
| Stuck on processing | Webhook not firing or mirror lag |
| Missing `cloudinary_asset_id` | Upload preset / widget response shape |
| Timeout (not failed) | Expected if webhook slow; check library manually |
