#!/usr/bin/env node
/**
 * Worktree inventory + health audit for iPix.
 *
 * Usage:
 *   node scripts/worktree-audit.mjs           # stdout markdown
 *   node scripts/worktree-audit.mjs --json    # machine-readable
 *   node scripts/worktree-audit.mjs --write   # update .@worktrees/worktrees.md
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkUnpushedCommits } from "./worktree-health.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const PARENT = path.dirname(REPO_ROOT);
const WRITE = process.argv.includes("--write");
const JSON_OUT = process.argv.includes("--json");
// "Keep only active worktrees" guidance from the worktrees skill — not a hard
// block (a legitimate burst of parallel work can exceed it briefly), just a
// visible nudge in the report so the count doesn't silently drift to 12+.
const TARGET_MAX_ACTIVE = 4;

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
  // git fetch -p already runs once in buildReport() before this is called per-worktree.
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

function aheadOfMainCount(wtPath) {
  const raw = run(`git -C "${wtPath}" rev-list --left-right --count HEAD...origin/main 2>/dev/null`, {
    allowFail: true,
  });
  const [ahead] = raw.split(/\s+/).map(Number);
  return ahead || 0;
}

function classify(entry, pr, tracking, age, isMain, dirty, unpushed) {
  if (isMain) return { status: "main", emoji: "🏠", safeToDelete: false, score: 100 };

  if ((pr?.state === "MERGED" || tracking.gone) && dirty === 0 && unpushed === 0) {
    return { status: "merged", emoji: "⚪", safeToDelete: true, score: 90 };
  }
  if ((pr?.state === "MERGED" || tracking.gone) && unpushed > 0) {
    // Working tree can be clean while the branch still holds commits no
    // remote has — the exact trap the worktrees skill's "quieter danger"
    // section warns about. Never mark this safe to delete.
    return { status: "merged-unpushed", emoji: "🔴", safeToDelete: false, score: 35 };
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
    const unpushed = isMain ? 0 : checkUnpushedCommits(entry.path, branch, aheadOfMainCount(entry.path));
    const cls = classify(entry, pr, tracking, age, isMain, dirty, unpushed);
    const notes = [
      tracking.gone ? "remote gone" : "",
      dirty ? `${dirty} uncommitted` : "",
      unpushed ? `${unpushed} unpushed commit(s)` : "",
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
      unpushed,
      lastActivity: age ? `${age.days}d ago` : "—",
      notes,
    };
  });

  const orphans = findOrphanDirs(entries.map((e) => e.path));
  const deletable = rows.filter((r) => r.safeToDelete && r.emoji !== "🏠");
  const activeCount = rows.filter((r) => r.emoji !== "🏠").length;
  const overCap = activeCount > TARGET_MAX_ACTIVE;
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
    activeCount,
    targetMaxActive: TARGET_MAX_ACTIVE,
    overCap,
  };
}

let gitCommonWorktreesDir = null;
function getGitCommonWorktreesDir() {
  // git rev-parse --git-common-dir returns the true shared .git dir whether REPO_ROOT
  // is the main checkout (.git is a directory) or itself a worktree (.git is a file).
  if (gitCommonWorktreesDir === null) {
    const common = run("git rev-parse --git-common-dir", { allowFail: true }) || ".git";
    gitCommonWorktreesDir = path.resolve(REPO_ROOT, common, "worktrees");
  }
  return gitCommonWorktreesDir;
}

function belongsToThisRepo(full) {
  const gitPath = path.join(full, ".git");
  try {
    const stat = fs.statSync(gitPath);
    if (stat.isDirectory()) return false; // a separate full clone, not a worktree of this repo
    const content = fs.readFileSync(gitPath, "utf8");
    const m = content.match(/^gitdir:\s*(.+)$/m);
    if (!m) return false;
    const gitDir = path.resolve(full, m[1].trim());
    return gitDir.startsWith(getGitCommonWorktreesDir() + path.sep);
  } catch {
    return false;
  }
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
      if (!belongsToThisRepo(full)) continue;
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

**Health score:** ${report.healthScore}/100 · **Active worktrees:** ${report.activeCount}/${report.targetMaxActive} target · **Orphans:** ${report.orphans.length}
`;

  if (report.overCap) {
    md += `\n⚠️ **Over the ${report.targetMaxActive}-worktree target** (${report.activeCount} active). Run the "Safe to delete now" list below before adding another — a worktree for merged/abandoned work is pure confusion risk for the next session.\n`;
  }

  md += `
## Lifecycle

Every worktree in this repo should pass through the same five stages. A row stuck outside "Work" for more than a few days is what the health/dirty/unpushed columns below are for catching.

1. **Create** — \`npm run worktree:add -- IPI-NNN slug\` (or \`EnterWorktree\`/\`claude --worktree\`). Always branches from a freshly fetched \`origin/main\`, never from a stale local ref.
2. **Work** — commit early, push often. An uncommitted worktree is one \`rm -rf\` away from losing everything; an unpushed one is one \`git branch -D\` away.
3. **Merge** — PR merges on GitHub. The worktree itself doesn't know this happened yet — its local branch still looks "ahead" until step 4.
4. **Sync** — \`npm run worktree:sync-main\` fast-forwards local \`main\`. Refuses instead of forcing if \`main\` ever has commits \`origin/main\` doesn't (a real divergence, not just staleness).
5. **Cleanup** — \`npm run worktree:pre-delete\` (or trust the "Safe to delete now" list below, which already runs the same check), then \`git worktree remove\` + \`git worktree prune\` + \`git branch -D\` (not \`-d\` — this repo squash-merges, so a merged branch's commit history is never a literal ancestor of \`main\`; \`-D\` is only safe here because \`deletable\` already verified the PR is MERGED, not because ancestry says so).

## Inventory

| Status | Worktree | Branch | Linear | PR | Size | Dirty | Unpushed | Last | Safe delete | Notes |
| :----: | -------- | ------ | ------ | -- | ---- | :---: | :------: | ---- | :---------: | ----- |
`;

  for (const r of report.rows) {
    md += `| ${r.emoji} | \`${shortPath(r.path)}\` | \`${r.branch}\` | ${r.linear || "—"} | ${r.pr} | ${r.size} | ${r.dirty} | ${r.unpushed ?? 0} | ${r.lastActivity} | ${r.safeToDelete ? "✅" : "❌"} | ${r.notes} |\n`;
  }

  if (report.orphans.length) {
    md += `\n## Orphan directories\n\nNot in \`git worktree list\` — usually leftover from manual \`rm -rf\`.\n\n`;
    md += `| Path | Size | Flag |\n| ---- | ---- | ---- |\n`;
    for (const o of report.orphans) {
      md += `| \`${o.path}\` | ${o.size} | ${o.label} |\n`;
    }
  }

  md += `\n## Safe to delete now\n\nMerged (or remote-gone) branch, clean working tree, zero unpushed commits — verified via the same check `;
  md += `\`worktree:pre-delete\` uses, so this list never recommends a removal that could lose work.\n\n`;
  if (report.deletable.length === 0) {
    md += `_None._\n`;
  } else {
    for (const r of report.deletable) {
      // -D not -d: this repo squash-merges, so a merged branch's own commits are
      // never literally an ancestor of main (only the one squashed commit on
      // main is) — `git branch -d`'s ancestry check fails on every squash-merged
      // branch even though it's genuinely merged. -D is safe here specifically
      // *because* `deletable` already required a MERGED PR or a gone remote.
      md += `- \`${shortPath(r.path)}\` · \`${r.branch}\` · ${r.pr}\n`;
      md += `  \`\`\`bash\n  git worktree remove "${r.path}" && git worktree prune && git branch -D "${r.branch}"\n  \`\`\`\n`;
    }
  }

  md += `
## Commands

\`\`\`bash
npm run worktree:audit -- --write      # refresh this file
npm run worktree:pre-delete            # re-verify a single worktree before removing it
npm run worktree:sync-main             # fast-forward local main to origin/main after a merge
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
  const outPath = path.join(REPO_ROOT, ".@worktrees/worktrees.md");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, toMarkdown(report));
  console.log(`Wrote ${outPath}`);
  console.log(
    `Health: ${report.healthScore}/100 · active: ${report.activeCount}/${report.targetMaxActive} · orphans: ${report.orphans.length}`,
  );
} else {
  console.log(toMarkdown(report));
}
