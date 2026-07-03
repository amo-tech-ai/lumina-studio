# Code Generation Workflow

**When to read:** after implementation plan is approved and it's time to write production code.

**Order:** Phase A (reuse) → Phase B (extend) → Phase C (port from DC library or build new).

**Design system:** v3 Zeely Editorial — [`zeely-v3-dc-library.md`](zeely-v3-dc-library.md).

---

## Pre-generation checklist

- [ ] Design analysis doc exists (or screen DC read in full)
- [ ] `components/COMPONENTS.md` consulted if porting from Claude Design export
- [ ] Component mapping complete (`component-mapping.md`)
- [ ] Phase A/B/C defined in implementation plan
- [ ] Trackers checked — not rebuilding ✅ prototype / Recently done surfaces
- [ ] `app/DESIGN.md` + `tokens.css` open
- [ ] Agent durability pattern confirmed for screen's agent

---

## File naming conventions

| Type | Pattern | Example |
|------|---------|---------|
| Page | `app/src/app/(operator)/app/[route]/page.tsx` | `app/brand/[id]/page.tsx` |
| Component | `app/src/components/operator/[name].tsx` | `brand-card.tsx` |
| Domain component | `app/src/components/[domain]/[name].tsx` | `brand-hub/approval-card.tsx` |
| Hook | `app/src/hooks/use-[name].ts` | `use-brand-dna.ts` |
| Test | `app/src/components/operator/__tests__/[name].test.tsx` | |

When porting from DC: match prop names from `COMPONENTS.md` where practical.

---

## Component generation rules

### Shell pattern

```typescript
"use client"; // only if needed

type Props = { ... };

export function ComponentName({ ... }: Props) {
  return (
    <div data-testid="component-name">
      {/* content */}
    </div>
  );
}
```

### Required attributes

```typescript
data-testid="[component]-[action]"
```

### Color tokens (never hardcode)

```typescript
// ✅ v3 Zeely — semantic tokens
className="bg-[--color-action] text-[--color-action-text]"
className="bg-[--color-bg-page]"
className="border border-[--color-border]"

// ❌ Wrong — v2 retired + hardcoded
className="bg-orange-500"
className="bg-[#E87C4D]"
className="bg-[#FBF8F5]"
```

Primary CTAs: **black** (`--color-action`). Secondary: white + hairline border.

### Typography

```typescript
// ✅ Inter is default via app font stack; explicit when needed:
className="font-sans"

// ✅ Numbers/data — Geist Mono
<span className="font-mono tabular-nums">{dnaScore}%</span>

// ❌ Wrong — Geist Sans as body (retired for UI)
```

### HITL / ApprovalCard

```typescript
// White card + amber hairline — not amber fill background
// Approve button: black (--color-action)
<ApprovalCard
  title={...}
  confidence={...}
  evidenceSource={...}
  before={...}
  after={...}
  onApprove={...}
  onEdit={...}
  onDiscard={...}
/>
```

### CopilotKit (always /v2)

```typescript
import { useCopilotAction } from "@copilotkit/react-core/v2";
```

### brand-intelligence screens

Use error + retry UI — **not** resumable stream reconnect (agent not durable).

---

## 3-panel shell pattern

```typescript
export default function OperatorPage() {
  return (
    <div className="grid min-h-screen [grid-template-columns:auto_minmax(0,1fr)_auto] bg-[--color-bg-page]">
      <NavSidebar />
      <main className="min-w-0 flex flex-col">
        <PageHeader ... />
        {/* workspace content */}
        <PersistentChatDock agentId="..." greeting="..." />
      </main>
      <IntelligencePanel ... />
    </div>
  );
}
```

Mobile: hide nav → BottomNavigation; intel → Sheet; dock above tabs (see MOBILE-PLAN.md).

---

## Five states pattern

```typescript
{isLoading && <ScreenSkeleton />}
{error && <ScreenError onRetry={...} onGoBack={...} />}
{isEmpty && <EmptyState ctaLabel="..." aiSuggestion="..." onAction={...} />}
{data && <ScreenPopulated data={data} />}
{pendingApproval && <ApprovalCard {...pendingApproval} />}
```

---

## Port from Claude Design library (Phase C)

1. Read `components/[Name].dc.html` + `COMPONENTS.md` section
2. List all props / variants / states
3. Implement React equivalent with same visual tokens
4. Add Vitest tests for variants used on target screen
5. Do **not** copy inline styles verbatim — map to `tokens.css` + Tailwind

**Start new operator screens from:** `OperatorShell` React port, not legacy inline DC markup.

---

## Never generate code that

- Uses warm off-white `#FBF8F5` or orange `#E87C4D` as primary chrome
- Uses Geist Sans for body (use Inter)
- Uses hardcoded hex or primitive tokens (`--primitive-orange-500`) in components
- Bypasses 3-panel shell on operator screens
- Puts detail workspace content in IntelligencePanel (context only)
- Uses spinners for initial content load (use Skeleton)
- Creates dark mode, gradients, or heavy drop shadows
- Inline approve/reject outside ApprovalCard
- Shows stream-reconnect UI on `brand-intelligence` routes
- Duplicates a component already in `components/` DC library or `app/src/components/`

---

## Test generation

```typescript
describe("ApprovalCard", () => {
  it("renders confidence and evidence", () => {
    render(<ApprovalCard confidence={85} evidenceSource="Brand crawl" ... />);
    expect(screen.getByText(/85%/)).toBeInTheDocument();
  });

  it("uses black approve button", () => {
    render(<ApprovalCard ... />);
    expect(screen.getByTestId("approval-approve-btn")).toHaveClass(/* --color-action */);
  });
});
```

---

## Verification

```bash
cd app && npm run lint && npm run typecheck && npm test
```

For Supabase-touching routes: `infisical run -- npm run supabase:verify-rls`

---

## Generation prompts

**Component (from DC library):**
> Port `Universal design prompt/components/[Name].dc.html` to React at `app/src/components/operator/[name].tsx`. Match props and variants in COMPONENTS.md. v3 Zeely: Inter UI, black primary, white page, amber HITL hairline only. Semantic tokens from tokens.css. data-testid on interactives.

**Screen:**
> Implement `[Screen]` at `[route]` from `[Screen].v2.image-first.dc.html`. Trace all dc-imports. All 5 states. Mobile ≤1024px per MOBILE-PLAN.md. Agent: `[agentId]`. Reuse Phase A/B before Phase C.
