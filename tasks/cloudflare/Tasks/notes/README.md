# notes/ — recovery status (2026-07-15)

This folder's `02`, `04`, `05`, and `06` files were lost when a concurrent process switched
branches in the shared `/home/sk/ipix` worktree while they were still untracked (never
committed). The rest of this folder's history:

- `07`, `09`, and `10` were recovered exactly from prior conversation history.
- `08` was recovered only through line 197 and is intentionally truncated — everything past
  that point is genuinely lost, not guessed at.
- `02`, `04`, `05`, and `06` were not recoverable and were not recreated. No paraphrased
  or reconstructed-from-memory replacement was written under those filenames, to avoid
  blurring the line between an exact recovery and a guess.
