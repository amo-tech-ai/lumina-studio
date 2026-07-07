// Pure, dependency-free checks used by scripts/worktree-health.mjs.
// Kept separate from the CLI/git-shelling code so they're unit-testable
// without a real git repo or filesystem fixtures.

export const STALE_GROQ_IMPORT = /from\s+["']\.\.\/\.\.\/\.\.\/\.\.\/config\/groq-models\.json["']/;

export function hasStaleGroqImport(providerTsContent) {
  return STALE_GROQ_IMPORT.test(providerTsContent);
}

/**
 * @param {{ groqStaleImport: boolean, behind: number, maxBehind: number }} input
 * @returns {string[]} blocker messages; empty array means safe
 */
export function classifyBlockers({ groqStaleImport, behind, maxBehind }) {
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
  return blockers;
}
