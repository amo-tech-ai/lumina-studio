import { bench, describe } from "vitest";
import {
  classifyBlockers,
  parseWorktreeListPorcelain,
  resolveMaxBehind,
} from "../scripts/lib/worktree-health-checks.mjs";

// Emulates `git worktree list --porcelain` output for a repo with many worktrees.
function makePorcelain(count) {
  const lines = [];
  for (let i = 0; i < count; i++) {
    lines.push(`worktree /home/dev/wt/feature-${i}`);
    lines.push(`HEAD ${"a".repeat(40)}`);
    lines.push(`branch refs/heads/feature/branch-${i}`);
    lines.push("");
  }
  return lines.join("\n");
}

const porcelainSmall = makePorcelain(20);
const porcelainLarge = makePorcelain(500);

describe("worktree health checks", () => {
  bench("parseWorktreeListPorcelain (20 worktrees)", () => {
    parseWorktreeListPorcelain(porcelainSmall);
  });

  bench("parseWorktreeListPorcelain (500 worktrees)", () => {
    parseWorktreeListPorcelain(porcelainLarge);
  });

  bench("resolveMaxBehind (valid + invalid + default)", () => {
    resolveMaxBehind("5", 10);
    resolveMaxBehind("not-a-number", 10);
    resolveMaxBehind(undefined, 10);
    resolveMaxBehind("", 10);
  });

  bench("classifyBlockers over common scenarios", () => {
    classifyBlockers({ groqStaleImport: false, behind: 0, maxBehind: 20 });
    classifyBlockers({ groqStaleImport: true, behind: 30, maxBehind: 20 });
    classifyBlockers({
      groqStaleImport: false,
      behind: 5,
      maxBehind: 20,
      unpushedCommits: 3,
      mode: "delete",
    });
    classifyBlockers({
      groqStaleImport: false,
      behind: 0,
      maxBehind: 20,
      checkError: "git call failed",
    });
  });
});
