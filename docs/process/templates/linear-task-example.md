# Example — filled Linear task (illustrative)

Use as a quality bar when creating real issues. Not a live Linear ID.

```markdown
# IPI-000 · DNA-UX-001 — Show DNA chip status before asset publish

**Role:** iPix engineer. One concern per PR. Research before custom code.

**Plain English:** On Assets, the Operator sees Approved / Review / Blocked DNA status before they try to use an asset in a shoot.

| Field | Value |
|-------|--------|
| **MVP stage** | Core |
| **Parallel** | OK with copy-only Asset list tasks; wait on DNA score API if missing |
| **Blocked by** | — |
| **Unblocks** | Clearer shoot asset picks |
| **Track** | DNA · UI |
| **Skills** | `ipix-task-lifecycle` · `nextjs-developer` · `frontend-design` · `worktrees` · `pr-workflow` |
| **Agents / hooks / commands** | `/task` · `/verify-task` · Stop typecheck hook |
| **Stack** | Next.js `app/` · existing DNA fields (no new vendor) |

**Quality scores (1–5):** P5 · C2 · R2 · UV5 · LV5

## 1. Purpose
Surface DNA compliance on the Assets grid so Operators do not pick Blocked assets for shoots.

## 2. Real-world iPix example
- **Persona:** Operator  
- **Surface:** Assets (`/app/.../assets`)  
- **Today:** Status buried; Blocked assets still look usable  
- **After:** DNA chip visible per row; Blocked is obvious

## 3. User journey impact
| Before | During | After |
|--------|--------|-------|
| Opens Assets, guesses compliance | Scans chips | Picks Approved assets for shoot |

## 4. Business value
Fewer bad assets in shoot plans; less rework; DNA product promise visible.

## 5. Quality checks
- [x] Required for operators  
- [x] Moves Core MVP  
- [x] Not duplicate  
- [x] Reuse existing chip/token styles — no new design system  
- [x] Parallel OK  

**Verdict:** Ship — reuse existing DNA status + chip patterns

## 6–7. Research / platform-first
Dashboard N/A · Existing: DNA status on asset rows + design tokens · Custom: wire chip in list cell only

## 8. Steps (abbrev)
A1 Confirm status field in types — proof: typecheck  
B1 Render chip on Assets row — proof: vitest + screenshot  
D1 Unit test chip states — proof: vitest  
E2 Local :3002 Assets with QA user — proof: notes  

## 9. AC
- **A:** Each asset row shows Approved / Review / Blocked chip  
- **B:** Missing status → Review styling + accessible label  
- **E:** Asset open/detail still works unchanged  

## 12. PR evidence
One UI concern · screenshots of three states · CI green
```
