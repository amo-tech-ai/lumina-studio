#!/usr/bin/env python3
"""
Quick validation script for skills - minimal version
"""

import sys
import os
import re
import yaml
from pathlib import Path

# https://code.claude.com/docs/en/skills — `description` + `when_to_use` are truncated
# at this length in the skill listing. A budget to warn on, NOT a hard limit to fail on.
SKILL_LISTING_BUDGET = 1536


def validate_skill(skill_path):
    """Basic validation of a skill"""
    skill_path = Path(skill_path)

    # Check SKILL.md exists
    skill_md = skill_path / 'SKILL.md'
    if not skill_md.exists():
        return False, "SKILL.md not found"

    # Read and validate frontmatter
    content = skill_md.read_text()
    if not content.startswith('---'):
        return False, "No YAML frontmatter found"

    # Extract frontmatter
    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return False, "Invalid frontmatter format"

    frontmatter_text = match.group(1)

    # Parse YAML frontmatter
    try:
        frontmatter = yaml.safe_load(frontmatter_text)
        if not isinstance(frontmatter, dict):
            return False, "Frontmatter must be a YAML dictionary"
    except yaml.YAMLError as e:
        return False, f"Invalid YAML in frontmatter: {e}"

    # Allowed properties — mirrors the frontmatter reference table in the LIVE docs at
    # https://code.claude.com/docs/en/skills, not the bundled snapshot under
    # .claude/skills/archive/claude-code-docs/ (that copy is a point-in-time capture and
    # is what let this list fall behind in the first place). Keep in sync with the live
    # table; an out-of-date list here reports false positives on valid skills — it once
    # flagged the supported `paths` key as unknown, which sent PR #708 chasing a bug
    # that did not exist.
    ALLOWED_PROPERTIES = {
        'name', 'description', 'when_to_use', 'argument-hint', 'arguments',
        'disable-model-invocation', 'user-invocable', 'allowed-tools',
        'disallowed-tools', 'model', 'effort', 'context', 'agent', 'hooks',
        # `background` pairs with `context: fork` (Claude Code >= 2.1.218).
        'background',
        'paths', 'shell', 'license', 'metadata', 'compatibility',
        # Not in the docs table, but used by 14 skills here and ignored by the
        # runtime. Kept as an accepted repo-local convention rather than churning
        # every SKILL.md.
        'version',
    }

    # Check for unexpected properties (excluding nested keys under metadata)
    unexpected_keys = set(frontmatter.keys()) - ALLOWED_PROPERTIES
    if unexpected_keys:
        return False, (
            f"Unexpected key(s) in SKILL.md frontmatter: {', '.join(sorted(unexpected_keys))}. "
            f"Allowed properties are: {', '.join(sorted(ALLOWED_PROPERTIES))}"
        )

    # Check required fields
    if 'name' not in frontmatter:
        return False, "Missing 'name' in frontmatter"
    if 'description' not in frontmatter:
        return False, "Missing 'description' in frontmatter"

    # Extract name for validation
    name = frontmatter.get('name', '')
    if not isinstance(name, str):
        return False, f"Name must be a string, got {type(name).__name__}"
    name = name.strip()
    if name:
        # Check naming convention (kebab-case: lowercase with hyphens)
        if not re.match(r'^[a-z0-9-]+$', name):
            return False, f"Name '{name}' should be kebab-case (lowercase letters, digits, and hyphens only)"
        if name.startswith('-') or name.endswith('-') or '--' in name:
            return False, f"Name '{name}' cannot start/end with hyphen or contain consecutive hyphens"
        # Check name length (max 64 characters per spec)
        if len(name) > 64:
            return False, f"Name is too long ({len(name)} characters). Maximum is 64 characters."

    # Extract and validate description
    description = frontmatter.get('description', '')
    if not isinstance(description, str):
        return False, f"Description must be a string, got {type(description).__name__}"
    description = description.strip()
    if description:
        # No angle-bracket rule and no hard length cap exist in the spec — both were
        # invented here and both rejected valid skills (`lean` legitimately uses
        # ">10 files", ">2min", ">60s" as trigger phrases; `architecture-brief` runs
        # 1,059 chars). What the docs DO specify is a listing budget:
        # https://code.claude.com/docs/en/skills — "the combined `description` and
        # `when_to_use` text is truncated at 1,536 characters in the skill listing".
        # That is truncation, not rejection: the skill still loads, the tail just
        # stops influencing when Claude picks it. So warn, never fail.
        listing_len = len(description) + len(str(frontmatter.get('when_to_use', '') or ''))
        if listing_len > SKILL_LISTING_BUDGET:
            print(
                f"warning: description + when_to_use is {listing_len} characters; "
                f"the skill listing truncates at {SKILL_LISTING_BUDGET}, so the tail "
                f"will not affect when this skill is selected"
            )

    # Validate compatibility field if present (optional)
    compatibility = frontmatter.get('compatibility', '')
    if compatibility:
        if not isinstance(compatibility, str):
            return False, f"Compatibility must be a string, got {type(compatibility).__name__}"
        if len(compatibility) > 500:
            return False, f"Compatibility is too long ({len(compatibility)} characters). Maximum is 500 characters."

    return True, "Skill is valid!"

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python quick_validate.py <skill_directory>")
        sys.exit(1)
    
    valid, message = validate_skill(sys.argv[1])
    print(message)
    sys.exit(0 if valid else 1)