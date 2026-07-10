#!/usr/bin/env python3
"""Apply Mastra × Cloudflare audit corrections to Linear issues.

Run: source .env.local && python3 scripts/linear-apply-mastra-audit.py
SSOT: tasks/cloudflare/mastra/mastra-audit.md
"""

from __future__ import annotations

import json
import os
import urllib.request
from pathlib import Path

API = "https://api.linear.app/graphql"
ROOT = Path(__file__).resolve().parents[1]
ISSUES_DIR = ROOT / "linear" / "issues"
TEAM_ID = "27520111-8f88-4b9c-9c68-915a7046ecbf"
PROJECT_AI = "a91ff388-772a-4b0a-b252-0068d6a1297c"

STATE_IN_PROGRESS = "b66f516b-81b8-4036-a6a7-3b097c4e6c58"
STATE_IN_REVIEW = "bb324f92-f70d-4925-8ded-bd6569b5f059"
STATE_BACKLOG = "6725d93d-df17-4573-8816-d72ea6eef22e"

KEY = os.environ.get("LINEAR_API_KEY", "")
if not KEY:
    raise SystemExit("LINEAR_API_KEY not set (source .env.local)")


def gql(query: str, variables: dict | None = None) -> dict:
    body: dict = {"query": query}
    if variables:
        body["variables"] = variables
    req = urllib.request.Request(
        API,
        data=json.dumps(body).encode(),
        headers={"Authorization": KEY, "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=90) as resp:
        out = json.load(resp)
    if "errors" in out:
        raise RuntimeError(json.dumps(out["errors"], indent=2))
    return out["data"]


def get_issue(identifier: str) -> dict:
    data = gql(
        """
        query($id: String!) {
          issue(id: $id) {
            id identifier title description state { id name }
          }
        }
        """,
        {"id": identifier},
    )
    issue = data.get("issue")
    if not issue:
        raise RuntimeError(f"Issue not found: {identifier}")
    return issue


def update_issue(issue_id: str, **fields) -> dict:
    data = gql(
        """
        mutation($id: String!, $input: IssueUpdateInput!) {
          issueUpdate(id: $id, input: $input) {
            issue { identifier title state { name } url }
          }
        }
        """,
        {"id": issue_id, "input": fields},
    )
    return data["issueUpdate"]["issue"]


def comment(issue_id: str, body: str) -> None:
    gql(
        """
        mutation($input: CommentCreateInput!) {
          commentCreate(input: $input) { success }
        }
        """,
        {"input": {"issueId": issue_id, "body": body}},
    )


def prepend_block(description: str | None, block: str, marker: str) -> str:
    desc = description or ""
    if marker in desc:
        return desc
    return f"{block.rstrip()}\n\n---\n\n{desc}".strip()


PROVIDER_BLOCK = """## Provider model (2026-07-09 · Mastra × Cloudflare audit)

**SSOT:** `tasks/cloudflare/mastra/mastra-audit.md`

- Use **`resolveModel(tier)`** from `app/src/mastra/models.ts` → `app/src/lib/ai/provider.ts` — not direct Gemini/Groq SDK imports in agents/tools.
- Target path: **Cloudflare AI Gateway** OpenAI-compat (`AI_GATEWAY_URL`) via IPI-454 AC-F — not direct `GEMINI_API_KEY` long-term.
- **Gemini** = vision + structured fallback only until Workers AI eval (IPI-462).
- **Workers AI** default flip blocked until IPI-462 sign-off.
- Mastra stays **in-process** in OpenNext Worker — do **not** use standalone `CloudflareDeployer` (see `opennext-inprocess.md`)."""

DEFER_BLOCK = """## Defer (2026-07-09 audit)

**Status:** Correctly deferred — do not start until dependencies below are green.

**SSOT:** `tasks/cloudflare/mastra/mastra-audit.md`"""


def main() -> None:
    results: list[str] = []

    # --- IPI-461: retract fake Complete ---
    i461 = get_issue("IPI-461")
    desc461 = (ISSUES_DIR / "IPI-461-cf-ai-004-provider-adapter.md").read_text()
    u = update_issue(
        i461["id"],
        stateId=STATE_IN_PROGRESS,
        description=desc461,
    )
    results.append(f"✅ {u['identifier']} → {u['state']['name']} (description replaced)")

    # --- IPI-457: retract fake Complete ---
    i457 = get_issue("IPI-457")
    desc457 = (ISSUES_DIR / "IPI-457-cf-ai-005-unified-types-registry.md").read_text()
    u = update_issue(
        i457["id"],
        stateId=STATE_IN_PROGRESS,
        description=desc457,
    )
    results.append(f"✅ {u['identifier']} → {u['state']['name']} (description replaced)")

    # --- IPI-454: append audit note if missing ---
    i454 = get_issue("IPI-454")
    block454 = """## Next AC (post-audit 2026-07-09)

- [ ] **AC-F** — Wire Mastra `resolveModel()` → `@ai-sdk/openai-compatible` → `AI_GATEWAY_URL` (blocks MASTRA-CF-001)
- [ ] **AC-G** — KV model registry (optional P1)
- [ ] **AC-I** — Prod gateway deploy (IPI-472)

**Merged:** AC-C Workers AI URL — PR #279 ✅"""
    desc454 = prepend_block(i454["description"], block454, "post-audit 2026-07-09")
    if desc454 != (i454["description"] or ""):
        update_issue(i454["id"], description=desc454)
        results.append("✅ IPI-454 description appended audit next-AC block")

    # --- IPI-240: rename + provider-agnostic ---
    i240 = get_issue("IPI-240")
    desc240 = (ISSUES_DIR / "IPI-240-provider-options-alignment.md").read_text()
    u = update_issue(
        i240["id"],
        title="FIX · Provider options alignment across Mastra tools (gateway-era)",
        description=desc240,
    )
    results.append(f"✅ {u['identifier']} title + description updated")

    # --- IPI-470: scope clarification ---
    i470 = get_issue("IPI-470")
    block470 = """## Scope clarification (2026-07-09)

- **Cloudflare Workflows** = durable **cross-system** orchestration (webhooks, approvals, >30s external waits, retries) — [CF Workflows docs](https://developers.cloudflare.com/workflows/).
- **Mastra workflows** (`app/src/mastra/workflows/`) = in-process agent steps inside OpenNext — keep for brand/shoot HITL.
- Do **not** replace Mastra with CF Workflows; use CF Workflows when leaving the Next Worker or needing long wall-clock waits."""
    desc470 = prepend_block(i470["description"], block470, "Scope clarification (2026-07-09)")
    if desc470 != (i470["description"] or ""):
        update_issue(i470["id"], description=desc470)
        results.append("✅ IPI-470 scope block added")

    # --- Agent wiring tasks: provider block ---
    for ident in ("IPI-156", "IPI-259", "IPI-261", "IPI-262", "IPI-263", "IPI-369"):
        issue = get_issue(ident)
        new_desc = prepend_block(issue["description"], PROVIDER_BLOCK, "Provider model (2026-07-09")
        if new_desc != (issue["description"] or ""):
            update_issue(issue["id"], description=new_desc)
            results.append(f"✅ {ident} provider block prepended")

    # --- Defer tasks ---
    defer_notes = {
        "IPI-141": "Blocked by: pgvector pipeline + content ingestion stable.",
        "IPI-279": "Defer unless Workers preview stream replay fails without Postgres cache.",
        "IPI-333": "Defer — add tools to existing agents before new agent shells.",
    }
    for ident, note in defer_notes.items():
        issue = get_issue(ident)
        block = f"{DEFER_BLOCK}\n\n{note}"
        new_desc = prepend_block(issue["description"], block, "Defer (2026-07-09 audit)")
        if new_desc != (issue["description"] or ""):
            update_issue(issue["id"], description=new_desc)
            results.append(f"✅ {ident} defer block added")

    # --- MASTRA-CF-001: create if missing ---
    search = gql(
        """
        query($filter: IssueFilter) {
          issues(filter: $filter, first: 5) {
            nodes { identifier title }
          }
        }
        """,
        {
            "filter": {
                "title": {"containsIgnoreCase": "MASTRA-CF-001"},
            }
        },
    )
    existing = search["issues"]["nodes"]
    if existing:
        results.append(f"⏭ MASTRA-CF-001 exists: {existing[0]['identifier']}")
    else:
        desc_new = (ISSUES_DIR / "IPI-MASTRA-CF-001-provider-gateway-cutover.md").read_text()
        created = gql(
            """
            mutation($input: IssueCreateInput!) {
              issueCreate(input: $input) {
                issue { id identifier title url }
              }
            }
            """,
            {
                "input": {
                    "teamId": TEAM_ID,
                    "projectId": PROJECT_AI,
                    "title": "MASTRA-CF-001 · Mastra provider gateway cutover",
                    "description": desc_new,
                    "priority": 1,
                }
            },
        )["issueCreate"]["issue"]
        created_id = created["id"]
        # blocked by IPI-457 + IPI-454
        for blocker_ident in ("IPI-457", "IPI-454"):
            blocker = get_issue(blocker_ident)
            gql(
                """
                mutation($input: IssueRelationCreateInput!) {
                  issueRelationCreate(input: $input) { success }
                }
                """,
                {
                    "input": {
                        "issueId": blocker["id"],
                        "relatedIssueId": created_id,
                        "type": "blocks",
                    }
                },
            )
        results.append(f"✅ Created {created['identifier']} {created['url']}")

    print("\n".join(results))


if __name__ == "__main__":
    main()
