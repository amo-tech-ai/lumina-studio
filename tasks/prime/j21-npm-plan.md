> **⚠️ SUPERSEDED — see [`j21-npm-plan-verified.md`](./j21-npm-plan-verified.md) (2026-07-21/22).** This is a pasted draft; several of its central claims were wrong when checked against real `npm explain`/registry/advisory data — e.g. §2 claims upgrading wrangler/miniflare fixes the sharp CVE (no released version does), §4 claims the Mastra CLI bump is independent tooling hygiene (it forces a `@mastra/core` major bump), and §5's "no patched version exists" is only true for one of two vulnerable `@ai-sdk/provider-utils` paths. Use the verified doc for implementation.

Yes—but **not six separate full tasks**. The safest structure is **four implementation tasks plus one security-tracking item**.

Your audit confirms these findings come from different dependency owners and therefore have different testing and rollback requirements. 

## Recommended task structure

| Priority | Full task name                                                                                           | Includes                                       | Why separate                                                                                   |
| -------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| P1       | **IPI-XXX · DEP-NEXT-001 — Upgrade Next.js and OpenNext Together and Clear the Nested PostCSS Advisory** | Next.js, OpenNext, nested PostCSS              | Framework and Cloudflare adapter must remain peer-compatible                                   |
| P1       | **IPI-XXX · DEP-CF-001 — Upgrade Wrangler, Miniflare, and Sharp Security Chain**                         | Wrangler, Miniflare, Sharp                     | Cloudflare preview/build tooling has a different failure surface                               |
| P1       | **IPI-XXX · DEP-COPILOT-001 — Align CopilotKit, AG-UI, and UUID Dependencies**                           | CopilotKit packages, `@ag-ui/mastra`, UUID     | Streaming, tools and HITL must be tested together                                              |
| P1/P2    | **IPI-XXX · DEP-MASTRA-001 — Upgrade Mastra CLI, Deployer, MCP SDK, and Hono Node Adapter**              | Mastra CLI, transitive deployer, MCP SDK, Hono | These packages share server/build dependencies and must converge together                      |
| Tracking | **IPI-XXX · SEC-AISDK-001 — Track and Mitigate AI SDK Provider Utilities Resource-Consumption Advisory** | `@ai-sdk/provider-utils`                       | No patched version currently exists, so this is monitoring and mitigation—not a normal upgrade |

## 1. Next.js, OpenNext and PostCSS: one task

PostCSS versions below `8.5.10` are affected; `8.5.10` contains the fix. The vulnerable copy in your audit is nested inside Next.js, so directly installing a newer top-level PostCSS may not remove the alert. ([GitHub][1])

This belongs with the Next/OpenNext compatibility work because your current versions already have a peer-resolution conflict:

```text
next 16.2.10
@opennextjs/cloudflare allows 1.20.2
1.20.2 requires Next >=16.2.11
```

**Acceptance criteria:**

```text
- Next.js and OpenNext versions intentionally selected
- npm ci succeeds from a clean checkout
- nested postcss is >=8.5.10 or the advisory is documented
- npm run typecheck passes
- npm test passes
- npm run build passes
- OpenNext preview passes
```

Do not combine this with Wrangler/Sharp. A framework upgrade and a Cloudflare CLI upgrade have different rollback paths.

## 2. Wrangler, Miniflare and Sharp: separate task

Sharp versions below `0.35.0` are vulnerable; the latest patched line is currently `0.35.3`. The advisory specifically matters when processing untrusted images. ([GitHub][2])

Your dependency path is:

```text
Wrangler
└── Miniflare
    └── Sharp
```

This is Cloudflare tooling—not the same dependency path as Next.js. Wrangler also moves quickly, with the current release far ahead of older versions, so upgrading it should have its own preview and Worker validation. ([npm][3])

**Acceptance criteria:**

```text
- sharp resolves to >=0.35.0
- Wrangler and Miniflare remain compatible
- wrangler types generation succeeds
- OpenNext build succeeds
- local Cloudflare preview succeeds
- workers.dev smoke tests pass
```

## 3. CopilotKit, AG-UI and UUID: one coordinated task

UUID versions below `11.1.1` are vulnerable; `11.1.1` is patched. ([GitHub][4])

The vulnerable UUID copy is under `@copilotkit/runtime`, so installing a top-level UUID override would be risky and may not correctly fix the package that imports it.

Your installed CopilotKit runtime is `1.61.0`; the current release is `1.63.1`. Your installed `@ag-ui/mastra` is an old beta, while the current release is `1.1.1`. The current AG-UI package explicitly requires aligned Mastra, AG-UI and CopilotKit peer dependencies. ([npm][5])

Upgrade these together:

```text
@copilotkit/runtime
@copilotkit/react-core
@copilotkit/react-ui
@copilotkit/shared
@ag-ui/client
@ag-ui/core
@ag-ui/mastra
```

**Acceptance criteria:**

```text
- all CopilotKit packages use one version family
- UUID resolves to >=11.1.1 in the CopilotKit path
- chat streaming works
- tool calls render correctly
- Mastra workflow interrupts and resumes work
- HITL approval cards work
- conversation memory remains intact
```

## 4. Mastra CLI, Deployer, MCP SDK and Hono: one task

Do **not** create a standalone `@mastra/deployer` task. It is transitive through your Mastra CLI and should move with that package family.

Your installed Mastra CLI is an early alpha, while the current stable CLI is `1.19.0`; the current `@mastra/deployer` release is `1.51.0`. ([npm][6])

The Hono Node adapter issue affects versions below `2.0.5`; version `2.0.5` patched it, and the current release is `2.0.11`. The specific advisory concerns Windows hosts serving protected static subtrees; iPix runs Linux and Cloudflare Workers, so the immediate production exposure appears lower, but the vulnerable dependency should still be removed. ([GitHub][7])

The task should update or remove every vulnerable path:

```text
Mastra CLI
└── @mastra/deployer
    └── @hono/node-ws
        └── @hono/node-server

@mastra/core
└── @modelcontextprotocol/sdk
    └── @hono/node-server
```

**Acceptance criteria:**

```text
- Mastra packages use a tested compatible version set
- @hono/node-server resolves to >=2.0.5 on every path
- Mastra Studio starts
- agents load successfully
- workflows load successfully
- PostgresStore connects
- CopilotKit-to-Mastra streaming succeeds
- OpenNext production build succeeds
```

## 5. AI SDK provider-utils: tracking item, not upgrade task

The advisory affects `@ai-sdk/provider-utils <=3.0.97`, but GitHub currently lists **no patched version**. It is low severity and concerns uncontrolled resource consumption in JSON response processing. ([GitHub][8])

Therefore, creating a task that simply says “upgrade provider-utils” would not currently succeed.

Use temporary mitigations:

```text
- limit model response size
- apply request timeouts
- apply rate limits
- reject unexpectedly large JSON responses
- monitor upstream AI SDK releases
- rerun npm audit after CopilotKit and Mastra upgrades
```

This can be a child issue under the CopilotKit or Mastra dependency tasks rather than a standalone engineering PR.

## Best execution order

```text
1. IPI-XXX · DEP-NEXT-001 — Upgrade Next.js and OpenNext Together and Clear the Nested PostCSS Advisory
2. IPI-XXX · DEP-CF-001 — Upgrade Wrangler, Miniflare, and Sharp Security Chain
3. IPI-XXX · DEP-COPILOT-001 — Align CopilotKit, AG-UI, and UUID Dependencies
4. IPI-XXX · DEP-MASTRA-001 — Upgrade Mastra CLI, Deployer, MCP SDK, and Hono Node Adapter
5. IPI-XXX · SEC-AISDK-001 — Track and Mitigate AI SDK Provider Utilities Resource-Consumption Advisory
```

Do not combine all dependency upgrades into one PR. If one upgrade breaks the build, streaming, Worker preview, or Mastra workflows, separate tasks make the cause and rollback clear.

[1]: https://github.com/postcss/postcss/security/advisories/GHSA-qx2v-qp2m-jg93?utm_source=chatgpt.com "XSS via Unescaped </style> in CSS Stringify Output · Advisory · postcss/postcss · GitHub"
[2]: https://github.com/advisories/GHSA-f88m-g3jw-g9cj "sharp inherited vulnerabilities in libvips: CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591 · GHSA-f88m-g3jw-g9cj · GitHub Advisory Database · GitHub"
[3]: https://www.npmjs.com/package/wrangler?activeTab=versions&utm_source=chatgpt.com "wrangler - npm"
[4]: https://github.com/advisories/GHSA-w5hq-g745-h8pq "uuid: Missing buffer bounds check in v3/v5/v6 when buf is provided · CVE-2026-41907 · GitHub Advisory Database · GitHub"
[5]: https://www.npmjs.com/package/%40ag-ui/mastra?utm_source=chatgpt.com "@ag-ui/mastra - npm"
[6]: https://www.npmjs.com/package/mastra?utm_source=chatgpt.com "mastra - npm"
[7]: https://github.com/advisories/GHSA-frvp-7c67-39w9 "Node.js Adapter for Hono: Path traversal in `serve-static` on Windows via encoded backslash (`%5C`) · GHSA-frvp-7c67-39w9 · GitHub Advisory Database · GitHub"
[8]: https://github.com/advisories/GHSA-866g-f22w-33x8 "@ai-sdk/provider-utils has an Uncontrolled Resource Consumption issue · CVE-2026-8769 · GitHub Advisory Database · GitHub"
