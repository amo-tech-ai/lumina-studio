#!/usr/bin/env python3
"""Recover Universal-design-prompt-new from git dangling blobs + (4) export."""
from __future__ import annotations

import re
import subprocess
import unicodedata
from pathlib import Path

REPO = Path("/home/sk/ipix")
SRC_EXPORT = REPO / "Universal design prompt (4)"
DEST = REPO / "Universal-design-prompt-new"
CANONICAL_LINK = REPO / "Universal design prompt"


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def blob_paths() -> list[str]:
    out = subprocess.check_output(
        ["git", "fsck", "--lost-found"],
        cwd=REPO,
        stderr=subprocess.STDOUT,
        text=True,
    )
    return [line.split()[-1] for line in out.splitlines() if "dangling blob" in line]


def blob_content(blob: str) -> str | None:
    raw = subprocess.check_output(
        ["git", "cat-file", "-p", blob],
        cwd=REPO,
    )
    if b"\x00" in raw[:8000] or raw[:4] in (b"\x89PNG", b"GIF8", b"\xff\xd8\xff"):
        return None
    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError:
        return None


def load_ssot_paths() -> dict[str, str]:
    """Map task IDs (RF-01, MOB-03, BE-D1, SCR-08) to relative paths from Linear CSV."""
    csv_path = REPO / "linear" / "ALL issues (3).csv"
    mapping: dict[str, str] = {}
    if not csv_path.is_file():
        return mapping
    text = csv_path.read_text(encoding="utf-8", errors="replace")
    for m in re.finditer(r"Universal-design-prompt-new/(tasks/[^\s`\"]+\.md)", text):
        rel = m.group(1)
        name = Path(rel).name
        for prefix in ("RF-", "MOB-", "BE-", "SCR-"):
            if name.startswith(prefix):
                task_id = name.split(".")[0]
                # SCR-01-command-center -> SCR-01
                parts = task_id.split("-")
                if prefix == "SCR-" and len(parts) >= 2:
                    key = f"{parts[0]}-{parts[1]}"
                else:
                    key = "-".join(parts[:2]) if prefix != "RF-" else parts[0]
                    if prefix == "RF-" and len(parts) >= 2 and parts[1][0].isalpha():
                        key = f"{parts[0]}-{parts[1]}"
                mapping[key] = rel
                break
    return mapping


SSOT_PATHS = load_ssot_paths()


def task_id_from_content(content: str) -> str | None:
    m = re.search(r"\*\*ID\*\* \| (RF-[A-Za-z0-9]+|MOB-[A-Za-z0-9]+|BE-[A-Za-z0-9]+|SCR-\d+)", content)
    return m.group(1) if m else None


def target_path(first_line: str, content: str) -> str | None:
    fixed = {
        "iPix / FashionOS — HTML Prototype & Component Index": "HTML.md",
        "Design implementation tracker": "tasks/todo.md",
        "Refactor tasks — shared primitives (HTML → React extraction)": "tasks/refactor/README.md",
        "Screen tasks — HTML → React (one file per SCR)": "tasks/screens/README.md",
        "Screen task matrix — HTML → React": "tasks/screens/MATRIX.md",
        "SCR-XX — Screen task template (designtoreact + design-to-production)": "tasks/screens/SCR-TEMPLATE.md",
        "Screen wireframes — ASCII layout (matches `Pages/`)": "tasks/screens/wireframes/README.md",
        "Implementation checklists": "tasks/checklists.md",
    }
    for key, path in fixed.items():
        if key in first_line:
            return path

    if first_line.startswith("#!/usr/bin/env python3") and "_generate-layout-assets" in content:
        return "tasks/screens/_generate-layout-assets.py"

    m = re.match(r"^# (SCR-\d+) wireframe — (.+)$", first_line)
    if m:
        num = int(m.group(1).replace("SCR-", ""))
        return f"tasks/screens/wireframes/SCR-{num:02d}-{slugify(m.group(2))}.md"

    m = re.match(r"^# (SCR-\d+) diagrams — (.+)$", first_line)
    if m:
        num = int(m.group(1).replace("SCR-", ""))
        return f"tasks/screens/diagrams/SCR-{num:02d}-{slugify(m.group(2))}.md"

    m = re.match(r"^# (SCR-\d+) — (.+)$", first_line)
    if m:
        num = int(m.group(1).replace("SCR-", ""))
        return f"tasks/screens/SCR-{num:02d}-{slugify(m.group(2))}.md"

    m = re.match(r"^# (SCR-\d+) (.+?) — Plan$", first_line)
    if m:
        num = int(m.group(1).replace("SCR-", ""))
        return f"tasks/screens/SCR-{num:02d}-{slugify(m.group(2))}-plan.md"

    m = re.match(r"^# (RF-[A-Za-z0-9]+) — (.+)$", first_line)
    if m:
        tid = m.group(1)
        if tid in SSOT_PATHS:
            return SSOT_PATHS[tid]
        return f"tasks/refactor/{tid}-{slugify(m.group(2))}.md"

    m = re.match(r"^# (MOB-[A-Za-z0-9]+) — (.+)$", first_line)
    if m:
        tid = m.group(1)
        if tid in SSOT_PATHS:
            return SSOT_PATHS[tid]
        return f"tasks/mobile/{tid}-{slugify(m.group(2))}.md"

    m = re.match(r"^# (BE-[A-Za-z0-9]+) — (.+)$", first_line)
    if m:
        tid = m.group(1)
        if tid in SSOT_PATHS:
            return SSOT_PATHS[tid]
        return f"tasks/backend/{tid}-{slugify(m.group(2))}.md"

    tid = task_id_from_content(content)
    if tid and tid in SSOT_PATHS and first_line.startswith("#"):
        return SSOT_PATHS[tid]

    return None


def main() -> None:
    if not SRC_EXPORT.is_dir():
        raise SystemExit(f"Missing export folder: {SRC_EXPORT}")

    if DEST.exists():
        import shutil

        shutil.rmtree(DEST)
    import shutil

    shutil.copytree(SRC_EXPORT, DEST)

    recovered: dict[str, tuple[int, str, str]] = {}
    skipped = 0

    for blob in blob_paths():
        try:
            content = blob_content(blob)
        except subprocess.CalledProcessError:
            continue
        if not content or not content.strip():
            continue
        first = content.splitlines()[0].lstrip("# ").strip()
        first_line = content.splitlines()[0]
        rel = target_path(first_line, content)
        if not rel:
            skipped += 1
            continue
        size = len(content)
        prev = recovered.get(rel)
        if prev is None or size > prev[0]:
            recovered[rel] = (size, content, blob)

    for rel, (_, content, _) in sorted(recovered.items()):
        out = DEST / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(content, encoding="utf-8")

    # Canonical symlink for design.md references
    if CANONICAL_LINK.exists() or CANONICAL_LINK.is_symlink():
        CANONICAL_LINK.unlink()
    CANONICAL_LINK.symlink_to("Universal-design-prompt-new")

    print(f"Base copied from: {SRC_EXPORT.name}")
    print(f"Restored to: {DEST}")
    print(f"Recovered files: {len(recovered)}")
    print(f"Skipped blobs (no mapping): {skipped}")
    print(f"Symlink: {CANONICAL_LINK.name} -> Universal-design-prompt-new")

    key_files = [
        "HTML.md",
        "tasks/todo.md",
        "tasks/refactor/README.md",
        "tasks/screens/MATRIX.md",
        "tasks/screens/SCR-01-command-center.md",
    ]
    print("\nKey file check:")
    for k in key_files:
        p = DEST / k
        print(f"  {'✅' if p.is_file() else '❌'} {k}")


if __name__ == "__main__":
    main()
