# Design Principles

> The non-negotiables for FashionOS / iPix design decisions. When in doubt, these win. See `DESIGN.md` for the visual system, `AI-UX.md` for AI behaviour.

1. **Image-first.** Every content object (brand, shoot, campaign, asset, creator) leads with editorial photography at its correct ratio. Galleries are masonry/justified grids, never icon tables.
2. **AI-first, human-approved (HITL).** AI drafts; the human reviews and approves. Wizards arrive pre-filled. AI never writes without a visible Approve / Edit / Discard path.
3. **Evidence before approval.** Every AI score or write shows confidence + drill-downable evidence. No black-box numbers.
4. **Progressive disclosure.** Show the next decision, not everything. Detail lives in the workspace and right panel/sheet — never crammed into one view.
5. **Minimal clicks.** Carry context across screens (deep links); pre-fill from what we already know; one primary action per surface.
6. **Calm & editorial.** Hairlines over shadows, generous whitespace, mono numerals. No gradients, no orange chrome, no emoji.
7. **One system, no duplication.** Reuse shared components and tokens; new needs extend existing components (variants), never fork them. Zero hardcoded hex.
8. **Every screen complete.** 3-panel desktop / tab+sheet mobile, a context-aware AI dock, and all 8 states (populated/loading/empty/error/approval + analysing/publishing/success where relevant).
9. **Honest states.** Skeletons not spinners; determinate progress not fake resumable streams; never present stale data as live; never a dead end (always a next action).
10. **Accessible by default.** Status = dot + label; ≥44px targets; visible focus; keyboard + screen-reader operable; respect reduced-motion. (See `ACCESSIBILITY.md`.)

**Tie-breakers:** clarity > cleverness · reuse > novelty · evidence > assertion · fewer steps > more features.
