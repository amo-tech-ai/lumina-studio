#!/usr/bin/env python3
"""Create CF-MIG epic + 5 lean issues in Linear. Run: infisical run -- python3 scripts/linear-create-cf-mig-issues.py"""

import json
import os
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
ISSUES_DIR = ROOT / "linear" / "issues"

API = "https://api.linear.app/graphql"
TEAM_ID = "9443f427-96d8-4b6a-a1e1-3b8e4f239d46"
PROJECT_ID = "a91ff388-772a-4b0a-b252-0068d6a1297c"

KEY = os.environ.get("LINEAR_API_KEY", "")
if not KEY:
    raise SystemExit("LINEAR_API_KEY not set")


def gql(query: str, variables: dict | None = None) -> dict:
    body = {"query": query}
    if variables:
        body["variables"] = variables
    req = urllib.request.Request(
        API,
        data=json.dumps(body).encode(),
        headers={"Authorization": KEY, "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        out = json.load(resp)
    if "errors" in out:
        raise RuntimeError(json.dumps(out["errors"], indent=2))
    return out["data"]


def create_issue(title: str, description: str, priority: int, parent_id: str | None = None, project_id: str | None = PROJECT_ID) -> dict:
    inp = {
        "teamId": TEAM_ID,
        "title": title,
        "description": description,
        "priority": priority,
    }
    if project_id:
        inp["projectId"] = project_id
    if parent_id:
        inp["parentId"] = parent_id
    data = gql(
        """
        mutation($input: IssueCreateInput!) {
          issueCreate(input: $input) {
            issue { id identifier title url }
          }
        }
        """,
        {"input": inp},
    )
    return data["issueCreate"]["issue"]


def add_blocked_by(issue_id: str, blocker_id: str) -> None:
    gql(
        """
        mutation($input: IssueRelationCreateInput!) {
          issueRelationCreate(input: $input) { success }
        }
        """,
        {"input": {"issueId": issue_id, "relatedIssueId": blocker_id, "type": "blocked"}},
    )


EPIC_DESC = """## CF-MIG · Vercel → Cloudflare Workers

**SSOT:** `tasks/cloudflare/migration/plan-migrate.md`

Lean hosting migration: OpenNext + 3 runtime fixes + 1 smoke gate before DNS.

**New issues:** CF-MIG-110, 111, 210, 220, 810

**Reuse (no duplicates):** IPI-454, IPI-461, IPI-463, IPI-468, IPI-472

**Not in scope:** 33-task breakdown (see notes-1.md archived section). AI Gateway wiring is P1 parallel."""

ISSUES = [
    (
        "CF-MIG-110 · OpenNext foundation — scaffold, scripts, env matrix",
        (ISSUES_DIR / "IPI-CF-MIG-110-opennext-foundation.md").read_text(),
        1,
    ),
    (
        "CF-MIG-111 · CI OpenNext build — extend deployment pipeline",
        (ISSUES_DIR / "IPI-CF-MIG-111-ci-opennext-build.md").read_text(),
        1,
    ),
    (
        "CF-MIG-210 · Runtime compatibility — Hono, Groq JSON, OAuth, bundle gate",
        (ISSUES_DIR / "IPI-CF-MIG-210-runtime-compat.md").read_text(),
        1,
    ),
    (
        "CF-MIG-220 · Preview smoke gate — Mastra, CopilotKit SSE, Cloudinary, APIs",
        (ISSUES_DIR / "IPI-CF-MIG-220-preview-smoke-gate.md").read_text(),
        1,
    ),
    (
        "CF-MIG-810 · Production cutover — DNS, rollback, Vercel decommission",
        (ISSUES_DIR / "IPI-CF-MIG-810-production-cutover.md").read_text(),
        2,
    ),
]

def main():
    epic = create_issue("CF-MIG · Vercel → Cloudflare Workers (Epic)", EPIC_DESC, 1)
    print(f"Epic: {epic['identifier']} {epic['url']}")

    created = []
    for title, desc, pri in ISSUES:
        issue = create_issue(title, desc, pri, parent_id=epic["id"])
        created.append(issue)
        print(f"  {issue['identifier']} {issue['url']}")

    # blockedBy chain: 110 -> 111, 210 -> 220 -> 810; 111 also blocks 220
    by_num = {i["identifier"].split("-")[1]: i for i in created if i["identifier"].startswith("IPI-")}

    def find(prefix):
        for i in created:
            if prefix in i["title"]:
                return i
        return None

    i110 = find("CF-MIG-110")
    i111 = find("CF-MIG-111")
    i210 = find("CF-MIG-210")
    i220 = find("CF-MIG-220")
    i810 = find("CF-MIG-810")

    if i110 and i111:
        add_blocker(i111["id"], i110["id"])
    if i110 and i210:
        add_blocker(i210["id"], i110["id"])
    if i210 and i220:
        add_blocker(i220["id"], i210["id"])
    if i111 and i220:
        add_blocker(i220["id"], i111["id"])
    if i220 and i810:
        add_blocker(i810["id"], i220["id"])

    print("Blockers linked.")


if __name__ == "__main__":
    main()
