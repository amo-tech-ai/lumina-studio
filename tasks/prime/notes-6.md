# Verification verdict

**Report quality: 94/100.**
The stop/go decisions are correct:

* ✅ Ship **IPI-669 · SB-CI-002 — Run Edge Deno Unit Tests in CI**
* 🟡 Keep **IPI-619 · CF-DB-005 — Add Initial Supabase Hyperdrive Binding to OpenNext Worker** gated
* 🛑 Do not start **IPI-623 · CF-DB-009 — Migrate One Mastra Workload to Hyperdrive**

Live Linear confirms IPI-669 is **In Progress**, High priority, assigned, and unblocked.

## Corrections still needed

| Severity | Finding                                          | Fix                                                                                                                                                                                                                                                  |
| -------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔴       | **IPI-616 has a contradictory dependency**       | Linear says IPI-616 is blocked by IPI-629, while its own execution plan says IPI-616 must precede IPI-628 → IPI-629. Remove IPI-629 from `blockedBy` on IPI-616.                                                                                     |
| 🟡       | Path filtering can create a stuck required check | Do not put `paths:` on a required workflow. GitHub warns that path-filtered workflows can remain Pending and block merges. Trigger the workflow normally and use an internal change-detection step or always-present summary job. ([GitHub Docs][1]) |
| 🟡       | Security ordering is stricter than necessary     | IPI-679 does not technically depend on IPI-681. They may run in parallel after IPI-669; only IPI-680 must wait for IPI-681 evidence.                                                                                                                 |
| 🟡       | IPI-680 addresses only anon GraphQL              | Add authenticated GraphQL exposure to its evidence matrix or create a clearly linked child task. Do not silently expand its migration scope.                                                                                                         |
| 🟡       | IPI-623 title lacks the required prefix          | Rename to **IPI-623 · CF-DB-009 — Migrate One Mastra Workload to Hyperdrive**.                                                                                                                                                                       |

## IPI-669 implementation guardrails

The efficient design is:

```text
pull_request / push workflow always starts
→ change-detection step
→ Deno test job runs when Edge files changed
→ stable summary job always completes
```

Use:

* exact pinned Deno version;
* existing `supabase/functions/deno.lock`;
* existing `npm run supabase:verify-edge-groq`;
* no production secrets;
* no live Edge Function calls;
* minimal `--allow-env`;
* mocked external HTTP;
* intentional-failure proof, followed by reverting the deliberate break.

Supabase’s official approach is to run Edge Function unit tests with Deno’s native test runner; no additional testing framework is needed. ([Supabase][2])

## Hyperdrive lane

Live dependencies confirm:

```text
IPI-616 ADR
→ IPI-619 binding
→ IPI-620 compatibility spike/helper
→ IPI-621 tenant authorization tests
→ IPI-624 monitoring
→ IPI-623 one workload
```

IPI-619 is currently Backlog and blocked by IPI-616 and IPI-625.
IPI-623 is Backlog and blocked by IPI-619, IPI-620, IPI-621 and IPI-624.

The binding must be declared in Wrangler configuration before the Worker can access Hyperdrive. ([Cloudflare Docs][3])

## Recommended next wave

```text
NOW
IPI-669 · SB-CI-002 — Run Edge Deno Unit Tests in CI

NEXT, parallel
├─ IPI-667 · SB-EDGE-001 — Quarantine Legacy FashionOS Edge Functions Not in Repo
├─ IPI-678 · SB-OPS-001 — Align Infisical DB URL with GitHub Session-Mode DATABASE_URL
├─ IPI-681 · SB-SEC-003 — Prove Anonymous Data API and GraphQL Row Access
└─ IPI-679 · SB-SEC-001 — Inventory and Revoke Residual Anon SECURITY DEFINER EXECUTE

THEN
IPI-680 · SB-SEC-002 — Disable or Scope pg_graphql Anon Table Exposure
→ IPI-682 · SB-PERF-001 — Prioritize DB Advisor Findings from Workload Evidence

CLOUDFLARE LATER
IPI-616 → IPI-619 → IPI-620 → IPI-621 → IPI-624 → IPI-623
```

**Probability IPI-669 succeeds:** **96%**.
**Main immediate fix:** remove workflow-level path filtering and correct the circular IPI-616/IPI-629 Linear relation.

[1]: https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs?utm_source=chatgpt.com "Skipping workflow runs - GitHub Docs"
[2]: https://supabase.com/docs/guides/functions/unit-test?utm_source=chatgpt.com "Testing your Edge Functions | Supabase Docs"
[3]: https://developers.cloudflare.com/hyperdrive/reference/wrangler-commands/?utm_source=chatgpt.com "Wrangler commands · Cloudflare Hyperdrive docs"# Verification verdict

**Report quality: 94/100.**
The stop/go decisions are correct:

* ✅ Ship **IPI-669 · SB-CI-002 — Run Edge Deno Unit Tests in CI**
* 🟡 Keep **IPI-619 · CF-DB-005 — Add Initial Supabase Hyperdrive Binding to OpenNext Worker** gated
* 🛑 Do not start **IPI-623 · CF-DB-009 — Migrate One Mastra Workload to Hyperdrive**

Live Linear confirms IPI-669 is **In Progress**, High priority, assigned, and unblocked.

## Corrections still needed

| Severity | Finding                                          | Fix                                                                                                                                                                                                                                                  |
| -------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔴       | **IPI-616 has a contradictory dependency**       | Linear says IPI-616 is blocked by IPI-629, while its own execution plan says IPI-616 must precede IPI-628 → IPI-629. Remove IPI-629 from `blockedBy` on IPI-616.                                                                                     |
| 🟡       | Path filtering can create a stuck required check | Do not put `paths:` on a required workflow. GitHub warns that path-filtered workflows can remain Pending and block merges. Trigger the workflow normally and use an internal change-detection step or always-present summary job. ([GitHub Docs][1]) |
| 🟡       | Security ordering is stricter than necessary     | IPI-679 does not technically depend on IPI-681. They may run in parallel after IPI-669; only IPI-680 must wait for IPI-681 evidence.                                                                                                                 |
| 🟡       | IPI-680 addresses only anon GraphQL              | Add authenticated GraphQL exposure to its evidence matrix or create a clearly linked child task. Do not silently expand its migration scope.                                                                                                         |
| 🟡       | IPI-623 title lacks the required prefix          | Rename to **IPI-623 · CF-DB-009 — Migrate One Mastra Workload to Hyperdrive**.                                                                                                                                                                       |

## IPI-669 implementation guardrails

The efficient design is:

```text
pull_request / push workflow always starts
→ change-detection step
→ Deno test job runs when Edge files changed
→ stable summary job always completes
```

Use:

* exact pinned Deno version;
* existing `supabase/functions/deno.lock`;
* existing `npm run supabase:verify-edge-groq`;
* no production secrets;
* no live Edge Function calls;
* minimal `--allow-env`;
* mocked external HTTP;
* intentional-failure proof, followed by reverting the deliberate break.

Supabase’s official approach is to run Edge Function unit tests with Deno’s native test runner; no additional testing framework is needed. ([Supabase][2])

## Hyperdrive lane

Live dependencies confirm:

```text
IPI-616 ADR
→ IPI-619 binding
→ IPI-620 compatibility spike/helper
→ IPI-621 tenant authorization tests
→ IPI-624 monitoring
→ IPI-623 one workload
```

IPI-619 is currently Backlog and blocked by IPI-616 and IPI-625.
IPI-623 is Backlog and blocked by IPI-619, IPI-620, IPI-621 and IPI-624.

The binding must be declared in Wrangler configuration before the Worker can access Hyperdrive. ([Cloudflare Docs][3])

## Recommended next wave

```text
NOW
IPI-669 · SB-CI-002 — Run Edge Deno Unit Tests in CI

NEXT, parallel
├─ IPI-667 · SB-EDGE-001 — Quarantine Legacy FashionOS Edge Functions Not in Repo
├─ IPI-678 · SB-OPS-001 — Align Infisical DB URL with GitHub Session-Mode DATABASE_URL
├─ IPI-681 · SB-SEC-003 — Prove Anonymous Data API and GraphQL Row Access
└─ IPI-679 · SB-SEC-001 — Inventory and Revoke Residual Anon SECURITY DEFINER EXECUTE

THEN
IPI-680 · SB-SEC-002 — Disable or Scope pg_graphql Anon Table Exposure
→ IPI-682 · SB-PERF-001 — Prioritize DB Advisor Findings from Workload Evidence

CLOUDFLARE LATER
IPI-616 → IPI-619 → IPI-620 → IPI-621 → IPI-624 → IPI-623
```

**Probability IPI-669 succeeds:** **96%**.
**Main immediate fix:** remove workflow-level path filtering and correct the circular IPI-616/IPI-629 Linear relation.

[1]: https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs?utm_source=chatgpt.com "Skipping workflow runs - GitHub Docs"
[2]: https://supabase.com/docs/guides/functions/unit-test?utm_source=chatgpt.com "Testing your Edge Functions | Supabase Docs"
[3]: https://developers.cloudflare.com/hyperdrive/reference/wrangler-commands/?utm_source=chatgpt.com "Wrangler commands · Cloudflare Hyperdrive docs"

---

## Live verification stamp — 2026-07-18 (task-verifier + MCP)

| Claim (notes-6) | Probe | Result |
| -- | -- | -- |
| Circular `IPI-616` blockedBy `IPI-629` | Linear relations | ✅ Removed (`blockedBy` empty; chain remains 616→628→629) |
| Anon DEFINER residual | Security Advisor MCP | ✅ **13** `anon_security_definer_function_executable` |
| GraphQL anon / auth | Security Advisor MCP | ✅ **79** / **107** |
| `auth_rls_initplan` | Security Advisor MCP | ✅ **146** (FashionOS-heavy) |
| Notes-6 Linear dependency fix | `save_issue` removeBlockedBy/removeBlocks | ✅ Applied |

**Verdict:** notes-6 critical dependency claim was **correct**; Linear updated.
