---
name: infisical
description: >
  Infisical secret-management hub — agent daemon, REST API, dynamic/ephemeral
  credentials, secret syncs, and project setup (CLI, Docker, CI/CD, K8s, SDKs),
  consolidated into one skill with on-demand references. Use for: injecting secrets,
  infisical run / infisical init, machine identity auth (Universal Auth, K8s, AWS,
  OIDC), the Infisical Agent daemon + Go-template config + sidecar injection, the
  Infisical REST API (secrets CRUD, projects, identities, pagination/rate limits),
  dynamic/short-lived credentials for PostgreSQL/MySQL/Redis/MongoDB/cloud IAM/SSH/K8s,
  pushing secrets to AWS/GCP/Azure/GitHub/Vercel/Cloudflare/Vault via Secret Syncs,
  and SDK setup (Node, Python, Go, Java, .NET, Ruby). The one skill for any Infisical task.
version: 2.0.0
metadata:
  priority: 2
---

# Infisical Skills Hub

One consolidated Infisical skill. **Load the matching `references/` file on demand** — do not
paste reference bodies here. Each topic folder keeps its own `references/` sub-docs.

> **Consolidation note (v2.0.0):** the former standalone skills `infisical-agent`,
> `infisical-api`, `infisical-dynamic-secrets`, `infisical-secret-syncs`, and
> `infisical-user-setup-guide` are now `references/` inside this skill. Behavior is preserved;
> only the packaging changed.

---

## Routing — load the reference that matches the task

| User intent | Reference to load |
|-------------|-------------------|
| Local dev / Docker / CI/CD / K8s operator / SDK setup, `infisical run`, machine-identity auth | [`references/user-setup-guide/user-setup-guide.md`](references/user-setup-guide/user-setup-guide.md) |
| Infisical **Agent** daemon — YAML config, Go templates, sinks, token renewal, sidecar injection | [`references/agent/agent.md`](references/agent/agent.md) |
| Infisical **REST API** — secrets CRUD, projects, identities, pagination/rate limits, auth | [`references/api/api.md`](references/api/api.md) |
| **Dynamic / ephemeral** credentials — SQL (PostgreSQL/MySQL/MSSQL/…), Redis/Mongo, cloud IAM, SSH, K8s | [`references/dynamic-secrets/dynamic-secrets.md`](references/dynamic-secrets/dynamic-secrets.md) |
| **Secret Syncs** — push secrets to AWS/GCP/Azure, GitHub/Vercel/Cloudflare, Vault, others | [`references/secret-syncs/secret-syncs.md`](references/secret-syncs/secret-syncs.md) |

---

## Routing decision tree

```
Infisical task
  ├─ Getting started: infisical run, Docker, CI/CD, K8s operator, SDK, auth method?
  │     → references/user-setup-guide/user-setup-guide.md
  ├─ Agent daemon config / templates / token renewal / sidecar?
  │     → references/agent/agent.md
  ├─ HTTP API calls (list/create/update secrets, projects, identities)?
  │     → references/api/api.md
  ├─ Short-lived DB / cloud / SSH / K8s credentials?
  │     → references/dynamic-secrets/dynamic-secrets.md
  └─ Sync secrets out to an external provider?
        → references/secret-syncs/secret-syncs.md
```

**Typical onboarding:** `user-setup-guide` → auth + CLI/SDK → optional `agent` or `dynamic-secrets`.
For iPix, secrets are injected via `infisical run -- npm run dev` (see project `CLAUDE.md`).

---

## Reference map (sub-docs to load deeper)

| Topic | Entry guide | Deeper references |
|-------|-------------|-------------------|
| **user-setup-guide** | `references/user-setup-guide/user-setup-guide.md` | `references/.../references/{cli-setup,docker-integration,cicd-integration,kubernetes-operator,sdks,machine-identity-auth}.md` |
| **agent** | `references/agent/agent.md` | `references/.../references/{agent-config,template-functions,deployment-examples}.md` |
| **api** | `references/api/api.md` | `references/.../references/{authentication,secrets-endpoints,projects-and-identities,pagination-and-rate-limits}.md` |
| **dynamic-secrets** | `references/dynamic-secrets/dynamic-secrets.md` | `references/.../references/{overview,sql-databases,nosql-and-cache,cloud-iam,ssh-and-kubernetes}.md` |
| **secret-syncs** | `references/secret-syncs/secret-syncs.md` | `references/.../references/{sync-overview,aws-gcp-azure,github-vercel-cloudflare,vault-and-others}.md` |

---

## How to use this skill

1. Identify the task from the routing table / decision tree above.
2. Load **only** that topic's entry guide (`references/<topic>/<topic>.md`).
3. Load deeper sub-references **on demand** when the guide points to them — keep context lean.
