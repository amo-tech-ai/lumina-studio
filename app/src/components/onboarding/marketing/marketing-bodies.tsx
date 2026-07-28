import Image from "next/image";

/**
 * IPI-833 — the seven marketing screen bodies.
 *
 * COMPONENTS.md suggests these could be one copy-driven component. They cannot:
 * they share the card, the heading and the subcopy, but the bodies are seven
 * genuinely different visuals (design comp lines 78, 126, 203, 253, 277, 297,
 * 323). Collapsing them produces either a giant conditional or a flow that no
 * longer matches the design.
 *
 * Each body carries its own data-testid so the component test can prove all
 * seven are distinct — a shared-shell refactor cannot silently flatten them.
 */

const photo = (n: number) => `/onboarding/${n}-fashionos.jpeg`;

/** Screen 1 — five-tile proof grid. */
export function ProofTilesBody() {
  return (
    <div data-testid="marketing-body-proof-tiles" className="mt-5 grid grid-cols-5 gap-2">
      {[5, 6, 7, 8, 9].map((n) => (
        <div key={n} className="relative aspect-square overflow-hidden rounded-[var(--radius-md)]">
          <Image src={photo(n)} alt="" fill sizes="80px" className="object-cover" />
        </div>
      ))}
    </div>
  );
}

/** Screen 3 — before/after identity score. */
export function ScoreComparisonBody() {
  return (
    <div
      data-testid="marketing-body-score-comparison"
      className="mt-6 flex items-end justify-center gap-3"
    >
      <div className="basis-[38%] text-center">
        <span className="inline-block rounded-[var(--radius-pill)] bg-[var(--onboarding-weak)] px-3 py-1 text-[0.7rem] font-bold text-[var(--onboarding-card)]">
          Before
        </span>
        <div className="mt-2 h-16 rounded-t-[var(--radius-md)] bg-[var(--onboarding-hair)]" />
        <p className="mt-1 text-xs font-bold">32</p>
      </div>
      <div className="basis-[38%] text-center">
        <span className="inline-block rounded-[var(--radius-pill)] bg-[var(--onboarding-accent)] px-3 py-1 text-[0.7rem] font-bold text-[var(--onboarding-on-accent)]">
          After
        </span>
        <div className="mt-2 h-32 rounded-t-[var(--radius-md)] bg-[var(--onboarding-accent)]" />
        <p className="mt-1 text-xs font-bold">88</p>
      </div>
    </div>
  );
}

/** Screen 6 — customer testimonial. */
export function TestimonialBody() {
  return (
    <div
      data-testid="marketing-body-testimonial"
      className="mt-4 rounded-[var(--radius-lg)] border border-[var(--onboarding-hair)] p-4"
    >
      <div className="flex items-center gap-3">
        <Image
          src={photo(20)}
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 rounded-full object-cover"
        />
        <div>
          <p className="m-0 text-sm font-bold">Amara O.</p>
          <p className="m-0 text-xs text-[var(--onboarding-muted)]">Independent label</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-snug text-[var(--onboarding-sub)]">
        &ldquo;We launched on a Thursday and the pieces sold out before the weekend.&rdquo;
      </p>
    </div>
  );
}

/** Screen 8 — AI-run ads, shown in a phone mock. */
export function PhoneAdBody() {
  return (
    <div data-testid="marketing-body-phone-ad" className="mx-auto mt-5 w-[200px]">
      <div className="relative aspect-[9/17] overflow-hidden rounded-[1.875rem] border-[6px] border-[var(--onboarding-cta)]">
        <Image src={photo(21)} alt="" fill sizes="200px" className="object-cover" />
      </div>
    </div>
  );
}

/** Screen 9 — monthly goals dashboard. */
export function GoalsDashboardBody() {
  const goals = [
    { label: "Revenue", value: "$450", target: "$5,000", percent: 9 },
    { label: "Orders", value: "12", target: "150", percent: 8 },
    { label: "Reach", value: "8.2k", target: "40k", percent: 21 },
  ];
  return (
    <div
      data-testid="marketing-body-goals-dashboard"
      className="mt-5 rounded-[var(--radius-lg)] border border-[var(--onboarding-hair)] p-4"
    >
      <div className="mb-4 flex items-baseline gap-2">
        <span className="text-sm font-bold">Monthly goals</span>
        <span className="text-[0.7rem] text-[var(--onboarding-muted)]">2 days left</span>
      </div>
      {goals.map((goal) => (
        <div key={goal.label} className="mb-3 last:mb-0">
          <div className="mb-1 flex justify-between text-xs font-semibold">
            <span>{goal.label}</span>
            <span>
              {goal.value} <span className="text-[var(--onboarding-muted)]">/ {goal.target}</span>
            </span>
          </div>
          <div className="h-1.5 rounded-[var(--radius-pill)] bg-[var(--onboarding-hair)]">
            <div
              style={{ width: `${goal.percent}%` }}
              className="h-full rounded-[var(--radius-pill)] bg-[var(--onboarding-accent)]"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Screen 10 — social platforms funnelling into orders. */
export function SocialFunnelBody() {
  return (
    <div
      data-testid="marketing-body-social-funnel"
      className="mt-7 flex items-center justify-between gap-2"
    >
      <div className="flex flex-col gap-3" aria-hidden="true">
        {["f", "◎", "♪"].map((glyph) => (
          <span
            key={glyph}
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--onboarding-cta)] text-lg font-extrabold text-[var(--onboarding-card)]"
          >
            {glyph}
          </span>
        ))}
      </div>
      <div className="flex-1 border-t-2 border-dashed border-[var(--onboarding-accent-line)]" />
      <div className="rounded-[var(--radius-lg)] bg-[var(--onboarding-accent-tint)] px-4 py-3 text-center">
        <p className="m-0 text-lg font-extrabold text-[var(--onboarding-accent-ink)]">10&times;</p>
        <p className="m-0 text-[0.7rem] font-semibold text-[var(--onboarding-accent-ink)]">
          orders
        </p>
      </div>
    </div>
  );
}

/** Screen 11 — one photo in, a content pack out. */
export function ContentPackBody() {
  return (
    <div data-testid="marketing-body-content-pack" className="mt-5 flex gap-2.5">
      <div className="flex basis-1/3 flex-col justify-center">
        <span className="mb-2 self-center rounded-[var(--radius-pill)] bg-[var(--onboarding-accent)] px-3 py-1 text-[0.7rem] font-bold text-[var(--onboarding-on-accent)]">
          Your photo
        </span>
        <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-md)]">
          <Image src={photo(22)} alt="" fill sizes="120px" className="object-cover" />
        </div>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-2">
        {[23, 24, 10, 11].map((n) => (
          <div key={n} className="relative aspect-square overflow-hidden rounded-[var(--radius-md)]">
            <Image src={photo(n)} alt="" fill sizes="90px" className="object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
