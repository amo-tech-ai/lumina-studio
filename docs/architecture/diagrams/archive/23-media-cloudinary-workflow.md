# 23 — Media Upload & Cloudinary Workflow

**Purpose:** Show the signed-upload → transform → webhook → asset-record → DNA-audit flow, the only media pipeline in the platform.

## Explanation

Verified against `app/src/app/api/assets/upload-sign/route.ts` and `app/src/app/api/assets/cloudinary/webhook/route.ts`. The client never talks to Cloudinary's API secret — the server signs upload params (`type: "authenticated"`, i.e. private/signed delivery, per IPI-257 §5, until HITL approval flips it to public) and the browser uploads directly to Cloudinary. Cloudinary's webhook (HMAC-verified, 300s replay window) is the only writer of `assets`/`cloudinary_assets` rows. Image uploads fire an async, best-effort DNA audit (`audit-asset-dna` edge fn, Gemini) via `after()` so the webhook still acks within its ~3s budget. **Known gap in code** (own `ponytail:` comment at `cloudinary/webhook/route.ts:33-37`): shoot/campaign-folder uploads don't yet resolve `brand_id` — it stays `null` for those until a `shoot.shoots` folder→brand lookup is added.

## Diagram

```mermaid
sequenceDiagram
    participant Op as Operator (browser)
    participant Sign as POST /api/assets/upload-sign
    participant CL as Cloudinary
    participant WH as POST /api/assets/cloudinary/webhook
    participant DB as Supabase (assets, cloudinary_assets)
    participant DNA as audit-asset-dna edge fn (Gemini)

    Op->>Sign: {brandId, resourceType, filename, context:{shootId?|campaignId?}}
    Sign->>Sign: verify brand ownership, sign params (type=authenticated, eager presets)
    Sign-->>Op: {cloudName, apiKey, timestamp, signature, uploadUrl}
    Op->>CL: direct upload (signed params)
    CL-->>Op: upload accepted
    CL->>WH: webhook notification (upload/eager), HMAC-signed
    WH->>WH: verifyWebhookSignature (300s replay window)
    WH->>DB: upsertAssetRecord (assets) + upsertCloudinaryAssetRecord (cloudinary_assets, status=ready)
    WH->>DB: logNonFatal → ai_agent_logs (audit trail)
    alt resourceType == image
        WH->>DNA: after() → POST audit-asset-dna {assetId} (fire-and-forget, 35s abort)
        DNA-->>DB: DNA score written (async, separate from this webhook's response)
    end
    WH-->>CL: 200 OK (always acks, even on non-fatal processing errors)

    Note over Op,DB: Attach to Shoot/Campaign happens via context.shootId/campaignId\nat upload time — no separate attach step
```

## Related Linear issues

IPI-257 (Cloudinary signed upload + webhook pipeline, phases 074a–074e).

## Related PRD section

`prd.md` §6.5 (Assets & Notifications — Mature: "Cloudinary is the dedicated pipeline").
