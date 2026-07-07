// Pure, dependency-free checks used by scripts/worktree-health.mjs.
// Kept separate from the CLI/git-shelling code so they're unit-testable
// without a real git repo or filesystem fixtures.

export const STALE_GROQ_IMPORT = /from\s+["']\.\.\/\.\.\/\.\.\/\.\.\/config\/groq-models\.json["']/;

export function hasStaleGroqImport(providerTsContent) {
  return STALE_GROQ_IMPORT.test(providerTsContent);
}

/**
 * @param {{ groqStaleImport: boolean, behind: number, maxBehind: number, unpushedCommits?: number, mode?: "start"|"delete" }} input
 * @returns {string[]} blocker messages; empty array means safe
 */
export function classifyBlockers({ groqStaleImport, behind, maxBehind, unpushedCommits = 0, mode = "start" }) {
  const blockers = [];
  if (groqStaleImport) {
    blockers.push(
      "HARD BLOCK: app/src/lib/ai/provider.ts still has the pre-IPI-428 static JSON import " +
        '("../../../../config/groq-models.json"). This breaks next build/next dev. ' +
        "Fix: rebase onto origin/main (already fixed there) — do not re-patch locally.",
    );
  }
  if (behind > maxBehind) {
    blockers.push(
      `SOFT BLOCK: ${behind} commits behind origin/main (threshold ${maxBehind}). ` +
        "Run: git fetch origin && git rebase origin/main",
    );
  }
  // Only relevant to worktree *removal*, not "can I start working here" — a plain
  // `git worktree remove` (no --force) succeeds even with unpushed commits, since
  // the working tree itself is clean. The commits aren't gone (the branch ref
  // survives removal), but they become invisible/forgettable and are truly lost
  // if the branch is later deleted too (e.g. a "clean up after merge" ritual).
  if (mode === "delete" && unpushedCommits > 0) {
    blockers.push(
      `HARD BLOCK (pre-delete): ${unpushedCommits} commit(s) on this branch have never been pushed ` +
        "to any remote. `git worktree remove` will succeed anyway (working tree is clean) and the " +
        "branch will look safe to delete next — but those commits (docs, notes, fixes) are only one " +
        "`git branch -D` away from being unrecoverable. Push the branch, or back it up " +
        "(`git diff <remote>..HEAD > backup.patch`), before removing.",
    );
  }
  return blockers;
}
