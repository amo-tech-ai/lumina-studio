#!/usr/bin/env python3
"""Self-check for quick_validate.py — run: python3 test_quick_validate.py

Exists because this validator has rejected valid skills before, and a false
positive here is expensive: PR #708 deleted deliberate `paths:` scoping from
three skills on the strength of one.

Pinned against BOTH sources, which define different things:
  * https://agentskills.io/specification — the Agent Skills standard Claude Code
    implements. Owns `name`, `description` (max 1024), `license`,
    `compatibility`, `metadata`, `allowed-tools`.
  * https://code.claude.com/docs/en/skills — Claude Code's own extensions
    (`paths`, `context`, `background`, `model`, `effort`, …) and the 1,536-char
    listing budget.

Rules in neither document must never fail a skill.
"""
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from quick_validate import (  # noqa: E402
    validate_skill, SKILL_LISTING_BUDGET, DESCRIPTION_MAX,
)


def check(frontmatter, *, valid, why):
    d = Path(tempfile.mkdtemp()) / 'skill'
    d.mkdir()
    (d / 'SKILL.md').write_text(f"---\n{frontmatter}\n---\n\n# skill\n")
    ok, msg = validate_skill(str(d))
    assert ok is valid, f"{why}\n  expected valid={valid}, got {ok}: {msg}"


# --- rules the spec DOES define -------------------------------------------
check("name: ok\ndescription: A normal skill.", valid=True, why="baseline")
check("description: No name key.", valid=False, why="`name` is required")
check("name: ok", valid=False, why="`description` is required")
check("name: Not_Kebab\ndescription: x.", valid=False, why="name must be kebab-case")
check(f"name: {'a' * 65}\ndescription: x.", valid=False, why="name caps at 64 chars")
check("name: ok\ndescription: x.\nbogus-key: 1", valid=False, why="unknown keys rejected")

# --- documented fields that must be ACCEPTED ------------------------------
for field in ('paths: "src/**"', 'context: fork', 'background: false',
              'when_to_use: When x.', 'model: inherit', 'effort: low',
              'user-invocable: false', 'disable-model-invocation: true',
              'allowed-tools: Read', 'disallowed-tools: Bash',
              'argument-hint: "[pr]"', 'agent: general-purpose', 'shell: bash'):
    check(f"name: ok\ndescription: x.\n{field}", valid=True,
          why=f"`{field.split(':')[0]}` is documented and must be accepted")

# --- the description cap IS in the spec: enforce it -----------------------
check(f"name: ok\ndescription: {'x' * DESCRIPTION_MAX}", valid=True,
      why=f"exactly {DESCRIPTION_MAX} is allowed — the cap is inclusive")
check(f"name: ok\ndescription: {'x' * (DESCRIPTION_MAX + 1)}", valid=False,
      why=f"over {DESCRIPTION_MAX} violates the Agent Skills spec")

# --- rules in NEITHER spec: must never fail a skill -----------------------
check("name: ok\ndescription: Trigger on >10 files, <2min builds.", valid=True,
      why="no angle-bracket rule exists anywhere; `lean` relies on '>10 files'")
check(f"name: ok\ndescription: {'x' * 900}\nwhen_to_use: {'y' * 800}", valid=True,
      why=f"description is legal and the {SKILL_LISTING_BUDGET} listing budget only "
          f"truncates — it must warn, never fail")

print(f"all checks passed (description max {DESCRIPTION_MAX}, "
      f"listing budget {SKILL_LISTING_BUDGET})")
