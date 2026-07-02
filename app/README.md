# Lumina Operator (iPix)

Operator app for the [iPix](https://ipix.ai) fashion-content platform. Connects
[Mastra](https://mastra.ai) agents to a [CopilotKit](https://copilotkit.ai) chat
interface for shoot planning, creative direction, and brand intelligence.

## Prerequisites

- Node.js 18+
- Any of the following package managers:
  - npm (default)
  - [pnpm](https://pnpm.io/installation)
  - [yarn](https://classic.yarnpkg.com/lang/en/docs/install/)
  - [bun](https://bun.sh/)

## Getting Started

1. Set up environment variables

```bash
cp .env.example .env.local
```

Required variables — agents need Gemini (default model `gemini-3.1-flash-lite` via `src/mastra/models.ts`):

- `GEMINI_API_KEY` — Google Gemini API key (used by all Mastra agents)
- `DATABASE_URL` — Mastra Postgres storage

Optional variables:

- `AI_PROVIDER` — `gemini` (default) or `openai` (only if you explicitly wire OpenAI)
- `GEMINI_MODEL` — override registry default (`gemini-3.1-flash-lite`)
- `COPILOTKIT_LICENSE_TOKEN` — Enable CopilotKit Intelligence (threads, persistence, analytics)
- `INTELLIGENCE_API_KEY` — Required **only if** `COPILOTKIT_LICENSE_TOKEN` is set
- `INTELLIGENCE_API_URL` — CopilotKit Intelligence API URL (default: `http://localhost:4201`)
- `INTELLIGENCE_GATEWAY_WS_URL` — CopilotKit Intelligence WebSocket URL (default: `ws://localhost:4401`)

2. Install dependencies using your preferred package manager:

```bash
# Using npm (default)
npm install

# Using pnpm
pnpm install

# Using yarn
yarn install

# Using bun
bun install
```

3. Start the development server:

```bash
# Using npm (default)
npm run dev

# Using pnpm
pnpm dev

# Using yarn
yarn dev

# Using bun
bun run dev
```

This will start both the UI and agent servers concurrently.

## Available Scripts

The following scripts can also be run using your preferred package manager:

- `dev` - Starts both UI and agent servers in development mode
- `dev:ui` - Starts only the Next.js UI server
- `dev:agent` - Starts only the Mastra agent server
- `dev:debug` - Starts development servers with debug logging enabled
- `build` - Builds the application for production
- `start` - Starts the production server

## Documentation

- [Mastra Documentation](https://mastra.ai/en/docs) - Learn more about Mastra and its features
- [CopilotKit Documentation](https://docs.copilotkit.ai) - Explore CopilotKit's capabilities
- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## CopilotKit Intelligence

This app is connected to the CopilotKit Intelligence project **ipix**
(recorded in `.copilotkit/project.json`). Intelligence adds durable threads,
message & event persistence, and analytics for your agent.

- **License:** a token is stored as `COPILOTKIT_LICENSE_TOKEN` in your `.env`.
- **Switch project:** run `copilotkit project select` from this directory.
- **Run it:** follow "Getting Started" above — install dependencies, set your
  keys in `.env`, then `npm run dev`.

Learn more at https://docs.copilotkit.ai.
