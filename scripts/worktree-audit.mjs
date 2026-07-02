#!/usr/bin/env node
/**
 * Worktree inventory + health audit for iPix.
 *
 * Usage:
 *   node scripts/worktree-audit.mjs           # stdout markdown
 *   node scripts/worktree-audit.mjs --json    # machine-readable
 *   node scripts/worktree-audit.mjs --write   # update docs/development/worktree-tracker.md
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const PARENT = path.dirname(REPO_ROOT);
const WRITE = process.argv.includes("--write");
const JSON_OUT = process.argv.includes("--json");

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      ...opts,
    }).trim();
  } catch {
    if (opts.allowFail) return "";
    throw new Error(`Command failed: ${cmd}`);
  }
}

function runJson(cmd) {
  const out = run(`${cmd} 2>/dev/null`, { allowFail: true });
  if (!out) return null;
  try {
    return JSON.parse(out);
  } catch {
    return null;
  }
}

function parseWorktreeList() {
  const raw = run("git worktree list --porcelain", { allowFail: true });
  if (!raw) return [];

  const entries = [];
  let current = null;

  for (const line of raw.split("\n")) {
    if (line.startsWith("worktree ")) {
      if (current) entries.push(current);
      current = { path: line.slice(9), branch: null, head: null };
    } else if (!current) continue;
    else if (line.startsWith("HEAD ")) current.head = line.slice(5);
    else if (line.startsWith("branch ")) current.branch = line.slice(7).replace(/^refs\/heads\//, "");
  }
  if (current) entries.push(current);
  return entries;
}

function dirSizeHuman(dir) {
  return run(`du -sh "${dir}" 2>/dev/null | cut -f1`, { allowFail: true }) || "?";
}

function branchTracking(branch) {
  if (!branch) return { gone: false };
  run("git fetch -p 2>/dev/null", { allowFail: true });
  const vv = run(`git branch -vv --list "${branch}" 2>/dev/null`, { allowFail: true });
  return { gone: /\[gone\]/.test(vv) };
}

function prForBranch(branch, prLookup) {
  if (!branch) return null;
  return prLookup?.get(branch) ?? null;
}

function lastCommitAge(wtPath) {
  const iso = run(`git -C "${wtPath}" log -1 --format=%cI 2>/dev/null`, { allowFail: true });
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return { days };
}

function dirtyCount(wtPath) {
  const status = run(`git -C "${wtPath}" status --porcelain 2>/dev/null`, { allowFail: true });
  return status ? status.split("\n").filter(Boolean).length : 0;
}

function classify(entry, pr, tracking, age, isMain, dirty) {
  if (isMain) return { status: "main", emoji: "🏠", safeToDelete: false, score: 100 };

  if (pr?.state === "MERGED" || (tracking.gone && dirty === 0)) {
    return { status: "merged", emoji: "⚪", safeToDelete: true, score: 90 };
  }
  if (tracking.gone && dirty > 0) {
    return { status: "stale-dirty", emoji: "🔴", safeToDelete: false, score: 30 };
  }
  if (tracking.gone) {
    return { status: "stale", emoji: "🔴", safeToDelete: true, score: 40 };
  }
  if (pr?.state === "OPEN" && pr.isDraft) {
    return { status: "waiting", emoji: "🟡", safeToDelete: false, score: 70 };
  }
  if (pr?.state === "OPEN") {
    return { status: "active-pr", emoji: "🟢", safeToDelete: false, score: 85 };
  }
  if (age && age.days > 14 && dirty === 0) {
    return { status: "idle", emoji: "🟡", safeToDelete: false, score: 55 };
  }
  return { status: "active", emoji: "🟢", safeToDelete: false, score: dirty ? 80 : 75 };
}

function repoFromGitRemote() {
  const url = run("git remote get-url origin", { allowFail: true });
  const m = url.match(/[:/]([^/]+\/[^/]+?)(\.git)?$/);
  return m ? m[1] : "";
}

function buildReport() {
  run("git fetch -p 2>/dev/null", { allowFail: true });
  const repoName =
    run("gh repo view --json nameWithOwner --jq .nameWithOwner 2>/dev/null", { allowFail: true }) ||
    repoFromGitRemote() ||
    "amo-tech-ai/lumina-studio";
  const allPrs = runJson(`gh pr list --repo "${repoName}" --limit 100 --state all --json number,state,url,isDraft,headRefName`) || [];
  const prLookup = new Map(allPrs.filter(Boolean).map((p) => [p.headRefName, p]));
  const entries = parseWorktreeList();
  const mainPath = path.resolve(REPO_ROOT);

  const rows = entries.map((entry) => {
    const isMain = path.resolve(entry.path) === mainPath;
    const branch = entry.branch;
    const tracking = branchTracking(branch);
    const pr = prForBranch(branch, prLookup);
    const age = lastCommitAge(entry.path);
    const dirty = dirtyCount(entry.path);
    const cls = classify(entry, pr, tracking, age, isMain, dirty);
    const notes = [
      tracking.gone ? "remote gone" : "",
      dirty ? `${dirty} uncommitted` : "",
    ]
      .filter(Boolean)
      .join("; ");

    return {
      path: entry.path,
      branch: branch || "(detached)",
      head: entry.head?.slice(0, 7) || "",
      linear: linearFromBranch(branch),
      pr: pr ? `#${pr.number} ${pr.state}${pr.isDraft ? " draft" : ""}` : "—",
      prUrl: pr?.url || "",
      status: cls.status,
      emoji: cls.emoji,
      safeToDelete: cls.safeToDelete,
      score: cls.score,
      size: dirSizeHuman(entry.path),
      dirty,
      lastActivity: age ? `${age.days}d ago` : "—",
      notes,
    };
  });

  const orphans = findOrphanDirs(entries.map((e) => e.path));
  const deletable = rows.filter((r) => r.safeToDelete && r.emoji !== "🏠");
  const healthScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(rows.reduce((s, r) => s + r.score, 0) / Math.max(rows.length, 1)) -
        orphans.length * 5,
    ),
  );

  return {
    generatedAt: new Date().toISOString(),
    repoRoot: REPO_ROOT,
    healthScore,
    rows,
    orphans,
    deletable,
  };
}

function findOrphanDirs(registeredPaths) {
  const registered = new Set(registeredPaths.map((p) => path.resolve(p)));
  const orphans = [];

  const scanDir = (base, label) => {
    let names;
    try {
      names = fs.readdirSync(base);
    } catch {
      return;
    }
    for (const name of names) {
      if (!/^wt(-ipi)?-/i.test(name)) continue;
      const full = path.join(base, name);
      try {
        if (!fs.statSync(full).isDirectory()) continue;
      } catch {
        continue;
      }
      if (registered.has(path.resolve(full))) continue;
      orphans.push({
        path: full,
        size: dirSizeHuman(full),
        label: label === "nested" ? "NESTED — move/delete" : "orphan",
      });
    }
  };

  scanDir(PARENT, "sibling");
  scanDir(REPO_ROOT, "nested");
  return orphans;
}

function linearFromBranch(branch) {
  if (!branch) return "";
  const m = branch.match(/ipi\/(\d+)/i) || branch.match(/(\d+)/);
  return m ? `IPI-${m[1]}` : "";
}

function shortPath(full) {
  if (full.startsWith(PARENT)) return ".." + full.slice(PARENT.length);
  if (full.startsWith(REPO_ROOT)) return "." + full.slice(REPO_ROOT.length);
  return full;
}

function toMarkdown(report) {
  let md = `# Worktree tracker

> Auto-generated by \`npm run worktree:audit -- --write\` · ${report.generatedAt.slice(0, 19)}Z

**Health score:** ${report.healthScore}/100 · **Worktrees:** ${report.rows.length} · **Orphans:** ${report.orphans.length}

## Inventory

| Status | Worktree | Branch | Linear | PR | Size | Dirty | Last | Safe delete | Notes |
| :----: | -------- | ------ | ------ | -- | ---- | :---: | ---- | :---------: | ----- |
`;

  for (const r of report.rows) {
    md += `| ${r.emoji} | \`${shortPath(r.path)}\` | \`${r.branch}\` | ${r.linear || "—"} | ${r.pr} | ${r.size} | ${r.dirty} | ${r.lastActivity} | ${r.safeToDelete ? "✅" : "❌"} | ${r.notes} |\n`;
  }

  if (report.orphans.length) {
    md += `\n## Orphan directories\n\nNot in \`git worktree list\` — usually leftover from manual \`rm -rf\`.\n\n`;
    md += `| Path | Size | Flag |\n| ---- | ---- | ---- |\n`;
    for (const o of report.orphans) {
      md += `| \`${o.path}\` | ${o.size} | ${o.label} |\n`;
    }
  }

  md += `\n## Safe to delete now\n\n`;
  if (report.deletable.length === 0) {
    md += `_None._\n`;
  } else {
    for (const r of report.deletable) {
      md += `- \`${shortPath(r.path)}\` · \`${r.branch}\` · ${r.pr}\n`;
      md += `  \`\`\`bash\n  git worktree remove "${r.path}"\n  \`\`\`\n`;
    }
  }

  md += `
## Commands

\`\`\`bash
npm run worktree:audit -- --write
npm run worktree:add -- IPI-286 route-aware-sections
/worktree audit | clean | add IPI-286 slug
\`\`\`
`;

  return md;
}

const report = buildReport();

if (JSON_OUT) {
  console.log(JSON.stringify(report, null, 2));
} else if (WRITE) {
  const outDir = path.join(REPO_ROOT, "docs/development");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "worktree-tracker.md");
  fs.writeFileSync(outPath, toMarkdown(report));
  console.log(`Wrote ${outPath}`);
  console.log(`Health: ${report.healthScore}/100 · worktrees: ${report.rows.length} · orphans: ${report.orphans.length}`);
} else {
  console.log(toMarkdown(report));
}
