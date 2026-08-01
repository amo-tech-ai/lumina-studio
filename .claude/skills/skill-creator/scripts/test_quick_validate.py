#!/usr/bin/env python3
"""Self-check for quick_validate.py — run: python3 test_quick_validate.py

Exists because this validator has twice rejected valid skills, and a false
positive here is expensive: PR #708 deleted deliberate `paths:` scoping from
three skills on the strength of one. Every case below is a rule the validator
must NOT invent, pinned against https://code.claude.com/docs/en/skills.
"""
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from quick_validate import validate_skill, SKILL_LISTING_BUDGET  # noqa: E402


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

# --- rules the spec does NOT define: must never fail a skill --------------
check("name: ok\ndescription: Trigger on >10 files, <2min builds.", valid=True,
      why="no angle-bracket rule exists; `lean` relies on '>10 files'")
check(f"name: ok\ndescription: {'x' * 1100}", valid=True,
      why="no 1024 cap exists; `architecture-brief` is 1,059 chars")
check(f"name: ok\ndescription: {'x' * (SKILL_LISTING_BUDGET + 100)}", valid=True,
      why=f"over {SKILL_LISTING_BUDGET} truncates the listing — warn, never fail")

print(f"all checks passed (listing budget = {SKILL_LISTING_BUDGET})")
