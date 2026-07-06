# Onboarding

Use when a project needs `FIRECRAWL_API_KEY`, Firecrawl wired into `.env`, or the first SDK integration.

## When This Applies

- Project needs `FIRECRAWL_API_KEY`
- User wants Firecrawl in `.env` or Infisical
- Adding Firecrawl to an app for the first time
- Choosing the first SDK or REST path

## Quick Start (Key Already Available)

```dotenv
FIRECRAWL_API_KEY=fc-...
```

Self-hosted:

```dotenv
FIRECRAWL_API_URL=https://your-firecrawl-instance.example.com
```

**iPix:** Store keys in Infisical — never commit. Edge functions use Supabase secrets, not client env.

## Browser Auth Flow

Use when the user does not already have an API key.

### Step 1: Generate auth parameters

```bash
SESSION_ID=$(openssl rand -hex 32)
CODE_VERIFIER=$(openssl rand -base64 32 | tr '+/' '-_' | tr -d '=\n' | head -c 43)
CODE_CHALLENGE=$(printf '%s' "$CODE_VERIFIER" | openssl dgst -sha256 -binary | openssl base64 -A | tr '+/' '-_' | tr -d '=')
```

### Step 2: Ask the user to open this URL

```text
https://www.firecrawl.dev/cli-auth?code_challenge=$CODE_CHALLENGE&source=coding-agent#session_id=$SESSION_ID
```

### Step 3: Poll for completion

```http
POST https://www.firecrawl.dev/api/auth/cli/status
Content-Type: application/json

{"session_id":"$SESSION_ID","code_verifier":"$CODE_VERIFIER"}
```

Responses: `{"status":"pending"}` or `{"status":"complete","apiKey":"fc-...","teamName":"..."}`.

### Step 4: Save the key

```bash
echo "FIRECRAWL_API_KEY=fc-..." >> .env
```

## SDK Installation

Install the SDK matching the project stack:

**JavaScript / TypeScript**

```bash
npm install @mendable/firecrawl-js
```

**Python**

```bash
pip install firecrawl-py
```

Direct REST calls are fine if the project already has a preferred HTTP client.

## Project Setup

- Keep the key in environment variables or the platform secret manager.
- Do not hardcode credentials in source files.
- Mirror key setup across dev, preview, and production as needed.

## Next Step

Once the key is present, return to [SKILL.md](../SKILL.md) and pick the endpoint reference (search, scrape, interact, or research-index).
