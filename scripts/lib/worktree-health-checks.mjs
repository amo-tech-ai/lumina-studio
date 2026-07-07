// Pure, dependency-free checks used by scripts/worktree-health.mjs.
// Kept separate from the CLI/git-shelling code so they're unit-testable
// without a real git repo or filesystem fixtures.

export const STALE_GROQ_IMPORT = /from\s+["']\.\.\/\.\.\/\.\.\/\.\.\/config\/groq-models\.json["']/;

export function hasStaleGroqImport(providerTsContent) {
  return STALE_GROQ_IMPORT.test(providerTsContent);
}

/**
 * Validates a --max-behind value. Returns { value, error }: value is always a
 * finite number (falls back to `fallback` only when no arg was given at all);
 * error is set when the user *did* pass something but it wasn't a valid
 * non-negative number — the caller should fail loudly on this, not silently
 * accept a threshold that disables the soft-block check (`behind > NaN` is
 * always false, so a typo'd flag would report every worktree as safe).
 *
 * @param {string | undefined} rawValue - the substring after "--max-behind=", or undefined if the flag wasn't passed
 * @param {number} fallback
 * @returns {{ value: number, error: string | null }}
 */
export function resolveMaxBehind(rawValue, fallback) {
  if (rawValue === undefined) return { value: fallback, error: null };
  // Number("") is 0, not NaN — an empty string (e.g. a trailing "--max-behind="
  // with nothing after it) would otherwise be silently accepted as a valid "0".
  const parsed = rawValue.trim() === "" ? NaN : Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return {
      value: fallback,
      error: `Invalid --max-behind value "${rawValue}" — expected a non-negative number. Refusing to silently fall back to a threshold that would disable the staleness check.`,
    };
  }
  return { value: parsed, error: null };
}

/**
 * Parses `git worktree list --porcelain` output into { path, branch } entries.
 * Pure string parsing — no git repo needed to test it against fixture output.
 *
 * @param {string} raw
 * @returns {Array<{ path: string, branch: string | null }>}
 */
export function parseWorktreeListPorcelain(raw) {
  const entries = [];
  let current = null;
  for (const line of raw.split("\n")) {
    if (line.startsWith("worktree ")) {
      if (current) entries.push(current);
      current = { path: line.slice("worktree ".length), branch: null };
    } else if (!current) {
      continue;
    } else if (line.startsWith("branch ")) {
      current.branch = line.slice("branch ".length).replace(/^refs\/heads\//, "");
    }
  }
  if (current) entries.push(current);
  return entries;
}

/**
 * @param {{ groqStaleImport: boolean, behind: number, maxBehind: number, unpushedCommits?: number, mode?: "start"|"delete", checkError?: string | null }} input
 * @returns {string[]} blocker messages; empty array means safe
 */
export function classifyBlockers({
  groqStaleImport,
  behind,
  maxBehind,
  unpushedCommits = 0,
  mode = "start",
  checkError = null,
}) {
  const blockers = [];
  // Checked first and unconditionally: if a check couldn't actually run, the
  // gate has no basis to call this worktree safe. A safety gate that reports
  // "safe" when it doesn't know is worse than one that fails loudly.
  if (checkError) {
    blockers.push(`UNKNOWN (treated as unsafe): ${checkError}`);
  }
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
