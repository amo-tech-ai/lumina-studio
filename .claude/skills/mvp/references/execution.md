# MVP Execution

> **Pipeline stage:** MVPAgent + Composer Group C | **Merged from:** mvp-builder, lean-sprints, traction

## When to Use

- Scoping and planning MVPs: defining minimum features, applying RICE scoring, using MVP Canvas
- Implementing Lean Sprint planning: 2-week cycles, sprint goals, retrospectives, 90-day macro-cycles
- Building traction features: metrics dashboards, OMTM tracking, Customer Factory analysis, PMF scoring
- Feature prioritization with RICE, Kano, or Build/Buy/Skip frameworks
- Designing experiment-driven development cycles
- Identifying growth bottlenecks and pivot/persevere decisions
- Triggers: "MVP", "minimum viable", "feature prioritization", "RICE score", "Kano model",
  "sprint", "2-week cycle", "retrospective", "90-day cycle", "traction", "metrics",
  "OMTM", "Customer Factory", "PMF", "cohort", "growth rate", "pivot"

---

## 1. MVP Canvas (7 Blocks)

Single-page planning tool -- articulate what you are building, for whom, and how you measure success before writing code.

```
+-------------------------------------------------------------+
|                    1. MVP PROPOSAL                           |
|               What's the proposal for this MVP?              |
+-----------------------------+-------------------------------+
|   2. SEGMENTED PERSONAS     |         4. FEATURES            |
|   Who is this MVP for?      |   What are we building?        |
+-----------------------------+-------------------------------+
|       3. JOURNEYS           |     5. EXPECTED RESULT         |
|   Which journeys improved?  |   What learning do we seek?    |
+-----------------------------+-------------------------------+
|          6. METRICS TO VALIDATE BUSINESS HYPOTHESES          |
+-------------------------------------------------------------+
|                   7. COST & SCHEDULE                         |
+-------------------------------------------------------------+
```

| Block | Key Questions | Output |
|-------|--------------|--------|
| **1. Proposal** | Riskiest assumption? Smallest thing to test it? | 1-2 sentence MVP thesis |
| **2. Personas** | Who has the problem most acutely? Fastest to reach? | 1 persona: demographics, pain severity (1-5), current alternatives |
| **3. Journeys** | Current workflow? Biggest friction? | As-is vs. to-be journey (3-5 steps) |
| **4. Features** | Minimum set to complete one journey? | 3-5 features, each tied to a hypothesis |
| **5. Expected Result** | What do we learn? What makes us pivot? | Hypothesis + falsification criteria |
| **6. Metrics** | How do we measure? What is the threshold? | 2-3 metrics with pass/fail thresholds |
| **7. Cost & Schedule** | How long? How much? Opportunity cost? | Timeline (weeks), budget, team allocation |

---

## 2. Feature Prioritization

### RICE Scoring

**Formula:** `RICE = (Reach x Impact x Confidence) / Effort`

| Dimension | Range | Description |
|-----------|-------|-------------|
| **Reach** | 0-100% | % of target users impacted in measurement period |
| **Impact** | 0.25, 0.5, 1, 2, 3 | 0.25=minimal, 0.5=low, 1=medium, 2=high, 3=massive |
| **Confidence** | 0-100% | 100%=data-backed, 80%=survey, 50%=intuition, 20%=speculation |
| **Effort** | 1-30 person-days | Total dev + design + QA time to ship |

**Interpretation:** RICE > 5.0 = strong MVP candidate | 2.0-5.0 = consider if core hypothesis | < 2.0 = defer post-MVP

### Kano Model

| Category | If Missing | If Present | MVP? |
|----------|-----------|------------|------|
| **Must-Have** | Angry, churns | Neutral (expected) | Yes |
| **Performance** | Disappointed | Proportionally happier | Maybe (min viable level) |
| **Delighter** | No reaction | Surprised, tells friends | No (post-PMF lever) |
| **Indifferent** | No reaction | No reaction | No |
| **Reverse** | Relieved | Annoyed, confused | Avoid |

**Kano Rule:** All Must-Haves + minimum viable level of 1-2 Performance features + zero Delighters.

### MVP Scoping Rules

1. **3-5 features maximum** -- if you have more, you are not being honest about your riskiest assumption
2. **ONE user journey** -- end-to-end completion of a single critical task
3. **Validate the hypothesis, not the technology** -- manual before automated
4. **Ugly but functional > polished but slow** -- time-to-learning is the only metric that matters
5. **Every feature maps to a measurable outcome** -- if you cannot measure it, do not build it

### Build / Buy / Skip Framework

For each candidate feature, classify using this decision tree:

| Decision | Criteria | Examples |
|----------|----------|---------|
| **Build** | Core differentiator; the reason users choose you over alternatives; source of defensible advantage | Proprietary algorithm, unique workflow, novel UX |
| **Buy** | Commodity capability; well-solved by existing tools; not a source of competitive advantage | Auth (Supabase/Auth0), payments (Stripe), email (SendGrid), analytics (Mixpanel) |
| **Skip** | Does not test the critical assumption; nice-to-have; can be validated separately or later | Admin dashboards, advanced settings, multi-language, custom branding |

**Decision Rule:** If a feature does not directly test your riskiest assumption AND is not a Must-Have for completing the core journey, Skip it. If it is a Must-Have but not your differentiator, Buy it. Only Build what makes your product uniquely valuable.

---

## 3. Sprint Execution

### 2-Week Lean Sprint

Self-contained learning cycle: hypothesis, experiment, execute, analyze.

```
WEEK 1: EXPOSE & DEFINE
  Day 1-2: Expose -- review data, align on blockers, update assumption stack
  Day 3-4: Define -- individual proposals (async), design experiment
  Day 5:   Shortlist -- rank by evidence, select 1 hypothesis, set success/kill criteria

WEEK 2: TEST & DECIDE
  Day 6-9: Test -- execute experiment, collect data daily, no scope changes
  Day 10:  Decide -- analyze vs. criteria, document learnings, plan next sprint
```

### 90-Day Macro-Cycles

Five 2-week sprints + retrospective + strategic decision.

```
Sprint 1 (Wk 1-2): Riskiest assumption
Sprint 2 (Wk 3-4): Second riskiest / follow-up
Sprint 3 (Wk 5-6): Emerging pattern
Sprint 4 (Wk 7-8): Converging signal
Sprint 5 (Wk 9-10): Confirmation / falsification
MACRO-RETRO (Wk 11-12): Pivot / Persevere / Kill
```

**Macro-Retro Questions:** Strongest validated learning? Core hypothesis survived? Retention/activation trends? Closer to or further from PMF?

### Sprint Goal Template

```
## Sprint [N] Goal

### Hypothesis
We believe that [target users] will [expected behavior]
when we [change/feature/experiment] because [rationale].

### Experiment
- Type: [Smoke Test | Concierge | Wizard of Oz | A/B Test | Interview]
- Duration: [X days]
- Sample size: [N users minimum]
- Data collection: [method]

### Success Criteria
- Primary: [metric] reaches [threshold] (e.g., 25% activation rate)
- Secondary: [qualitative signal] (e.g., 3+ users say "I'd pay for this")

### Kill Criteria
- If [metric] < [floor] after [N] days, abandon this direction

### Tasks
1. [ ] [Task with owner and due date]
2. [ ] [Task with owner and due date]
3. [ ] ...
```

### Retrospective Template

```
## Sprint [N] Retrospective

### 1. What We Learned
- [Key validated/invalidated assumption]
- [Surprising user behavior]
- [Data insight]

### 2. What Worked
- [Effective tactic]
- [Good process decision]

### 3. What Didn't Work
- [Failed experiment element]
- [Process friction]

### 4. Experiments Run
| Experiment | Hypothesis | Result | Confidence | Decision |
|------------|-----------|--------|------------|----------|
| [Name] | [H1] | [Pass/Fail] | [High/Med/Low] | [Continue/Pivot/Kill] |

### 5. Next Sprint Focus
- Primary hypothesis: [statement]
- Key metric: [OMTM for next sprint]
- Biggest risk: [what could go wrong]
```

### Experiment Templates

Choose the right experiment type based on what you need to validate:

| Experiment Type | What It Tests | How It Works | Key Metric | When to Use |
|----------------|---------------|-------------|------------|-------------|
| **Smoke Test** | Demand: do people want this? | Landing page with signup/waitlist CTA; drive traffic via ads or outreach | Signup conversion rate (target: >5%) | Earliest stage; before building anything |
| **Concierge** | Willingness to pay + value delivery | Manually deliver the service to 5-10 users; charge real money | Revenue per user, NPS, repeat purchase | After demand validated; testing WTP and workflow |
| **Wizard of Oz** | UX + workflow viability | User-facing product looks automated but human performs backend work | Task completion rate, time-on-task, user satisfaction | When UX is the riskiest assumption |
| **A/B Test** | Optimization of specific element | Two variants shown to statistically significant sample; measure conversion | Conversion rate delta (95% confidence interval) | Post-MVP; when you have enough traffic (100+ per variant) |
| **Customer Interview** | Problem existence + severity | 20-minute structured conversation; open-ended questions | Problem severity score (1-5), frequency, current spend | Any stage; especially pre-MVP and post-churn |

**Experiment Selection Rule:**
- No product yet: Smoke Test or Interview
- Product exists but < 100 users: Concierge or Wizard of Oz
- Product with 100+ active users: A/B Test

---

## 4. Traction & Growth

### Customer Factory Model

Models your startup as a system that manufactures customers (Ash Maurya). At any time, ONE stage is the bottleneck -- focus 80% of effort there.

```
ACQUISITION --> ACTIVATION --> RETENTION --> REVENUE --> REFERRAL
  Visitors       Engaged        Repeat       Paying     Advocates
```

### Bottleneck Detection

| Stage | Benchmark | Red Flag | Diagnosis |
|-------|-----------|----------|-----------|
| **Acquisition** | 5% | < 2% | Channel or messaging problem |
| **Activation** | 25% | < 10% | Onboarding or value delivery problem |
| **Retention** | 40% | < 20% | Product or habit loop problem |
| **Revenue** | 5% | < 2% | Pricing or value perception problem |
| **Referral** | 10% | < 3% | Satisfaction or mechanism problem |

**Rule:** Work top-down (Acquisition before Activation, etc.). Exception: if Retention < 10%, fix it first -- you are destroying demand.

### OMTM by Stage

One Metric That Matters -- the single number the entire team rallies around.

| Stage | OMTM | Why This Metric | Target |
|-------|------|----------------|--------|
| **Idea** | Interviews completed | Validates problem existence | 20+ interviews |
| **Pre-seed** | Signup / waitlist rate | Validates demand before building | 100+ signups or 5% landing page conversion |
| **MVP** | Activation rate | Validates core value delivery | 25%+ signup-to-active |
| **Traction** | Week 1 retention | Validates product stickiness | 40%+ return in 7 days |
| **Scale** | MRR growth rate | Validates business model | 10%+ month-over-month |

**OMTM Rules:**
1. Only ONE metric at a time -- if everything is important, nothing is
2. The OMTM changes as you graduate stages
3. Report it daily, review it weekly, decide on it per sprint
4. Secondary metrics exist for diagnosis, not for goal-setting

### PMF Assessment

Sean Ellis test: "How would you feel if you could no longer use this product?"

| Response | Threshold | Action |
|----------|-----------|--------|
| **Very disappointed** | >= 40% = PMF achieved | Double down on what they love; ready to scale |
| **Somewhat disappointed** | 25-39% = PMF-adjacent | Improve activation and habit formation |
| **Not disappointed** | < 25% = No PMF | Major pivot or kill; return to problem-solution fit |

**When to Run:** After 40+ active users who have used the product 3+ times over 2+ weeks. Too early = false negatives.

### Cohort Analysis Framework

Compare user groups by join period to see if the product is improving.

```
         Wk 0   Wk 1   Wk 2   Wk 3   Wk 4
Cohort A  100%   35%    22%    18%    15%    -- baseline
Cohort B  100%   38%    25%    20%    17%    -- improving
Cohort C  100%   42%    30%    24%    21%    -- improving further
```

**Key Signals:**
- Curve flattening = retained core (PMF signal)
- Newer cohorts outperforming older = product improving
- All cohorts dropping to zero = no PMF, fix product before growing
- Revenue cohorts expanding = negative churn (best-case)

**Benchmarks -- B2B SaaS:** Month 1: 80%+ | Month 3: 60%+ | Month 12: 40%+ | Logo churn < 5%/mo | NRR > 100%

**Benchmarks -- B2C:** Day 1: 40%+ | Day 7: 20%+ | Day 30: 10%+

---

## 5. Traction Roadmap

```
NOW (+90 days)              NEXT (+180 days)            LATER (+360 days)
Users:    100 --> 1K        Users:    1K --> 5K          Users:    5K --> 50K
Revenue:  $1K --> $10K MRR  Revenue:  $10K --> $50K MRR  Revenue:  $50K --> $500K MRR
PMF:      40%+ Sean Ellis   Team:     Hire #1-3          Team:     10-15 people
Channels: 1-2 validated     Channels: 3-4 channels       Funding:  Series A
Focus:    Find PMF          Focus:    Optimize & grow    Focus:    Scale & defend
```

**NOW:** 5 lean sprints, validate 1-2 channels (< $10 CAC), 40%+ PMF, referral loop v1, weekly metrics cadence

**NEXT:** Optimize activation (40%+), paid acquisition at scale, net negative churn, sales playbook

**LATER:** Multi-channel growth, expansion (vertical/international), platform strategy, fundraising with traction proof

---

## 6. Pivot / Persevere Framework

At each 90-day macro-cycle boundary, make a deliberate strategic decision based on accumulated evidence. Require 3+ experiments with consistent signal before any strategic change. One failure is noise; three in the same direction is a pattern.

### Decision Matrix

| Signal | Evidence Required | Decision |
|--------|------------------|----------|
| OMTM trending up for 3+ sprints | Quantitative trend | **Persevere** -- double down |
| Retention improving cohort-over-cohort | Cohort analysis | **Persevere** -- product improving |
| Qualitative "pull" from users (inbound interest, feature requests, emotional language) | 5+ user signals | **Persevere** -- demand exists |
| OMTM flat for 90 days despite 3+ experiments | Quantitative plateau | **Pivot** -- current approach exhausted |
| No retention after 3 sprints of effort | Cohort analysis | **Pivot** -- product not sticky |
| No willingness to pay after Concierge test | Revenue experiment | **Pivot** -- value not perceived |
| 90 days with < 25% PMF score | Sean Ellis survey | **Pivot or Kill** -- no product-market fit |

### Pivot Types

When pivoting, be specific about what changes and what stays:

| Pivot Type | What Changes | What Stays | Example |
|-----------|-------------|------------|---------|
| **Customer Pivot** | Target segment | Problem + solution | B2B enterprise to B2B SMB |
| **Problem Pivot** | Problem being solved | Target customer | From "find events" to "manage speakers" |
| **Solution Pivot** | Product approach | Customer + problem | From marketplace to SaaS tool |
| **Channel Pivot** | Go-to-market strategy | Product + customer | From direct sales to product-led growth |
| **Revenue Pivot** | Business model | Product + customer | From subscription to usage-based pricing |

### Persevere Signals (need 2+ to persevere)

- Retention curve flattening (users stick around)
- OMTM trending upward sprint-over-sprint
- Users expressing emotional language ("I love this", "I'd be lost without it")
- Inbound interest without paid acquisition
- Users building workflows around your product
- Willingness to pay demonstrated (not just stated)

### Kill Signals (need 2+ to kill)

- 90 days of flat OMTM with no improvement despite focused effort
- Zero retention after 3 full sprint cycles
- No willingness to pay after Concierge or direct sales attempts
- Team has lost conviction and cannot articulate why this matters
- Market window has closed or well-funded competitor has shipped identical solution
- CAC exceeds 3x LTV with no path to improvement

### Post-Decision Actions

**If Persevere:** Update the traction roadmap, increase sprint velocity, begin optimizing (not exploring). Shift from "does this work?" to "how do we make this work better?"

**If Pivot:** Run a 1-week pivot sprint: redefine hypothesis, update MVP Canvas Block 1 (Proposal) and Block 5 (Expected Result), identify new riskiest assumption, design first experiment for new direction. Preserve validated learnings.

**If Kill:** Document all learnings. Archive experiment data. Decide whether to return the remaining capital to investors or redirect to a new venture. A clean kill is better than a slow death.

---

## 7. TypeScript Implementations

Reusable types and functions for MVP scoring, traction analysis, and growth diagnostics. Use these in edge functions, frontend hooks, or pipeline agents.

### RICE Scoring

```typescript
interface RICEScore {
  reach: number;      // Users impacted (0-100%)
  impact: number;     // Effect on UX (0.25, 0.5, 1, 2, 3)
  confidence: number; // Certainty (0-100%)
  effort: number;     // Dev days (1-30)
}

function calculateRICE(feature: RICEScore): number {
  return (feature.reach * feature.impact * feature.confidence) / feature.effort;
}

// Interpretation:
// > 5.0 = strong MVP candidate
// 2.0-5.0 = consider if core hypothesis
// < 2.0 = defer post-MVP
```

### Kano Classification

```typescript
type KanoCategory = 'must-have' | 'performance' | 'delighter' | 'indifferent' | 'reverse';

interface KanoFeature {
  name: string;
  category: KanoCategory;
  functional_answer: string;   // "How would you feel if feature X was present?"
  dysfunctional_answer: string; // "How would you feel if feature X was absent?"
}

// MVP inclusion rule:
// must-have => always include
// performance => include at minimum viable level (1-2 max)
// delighter => exclude (post-PMF lever)
// indifferent => exclude
// reverse => avoid
```

### PMF Assessment

```typescript
interface PMFScore {
  very_disappointed: number;     // Target: >= 40%
  somewhat_disappointed: number;
  not_disappointed: number;
}

interface PMFResult {
  achieved: boolean;
  close?: boolean;
  ready_to_scale?: boolean;
  focus?: string;
}

function assessPMF(survey: PMFScore): PMFResult {
  if (survey.very_disappointed >= 40) {
    return { achieved: true, ready_to_scale: true };
  }
  if (survey.very_disappointed >= 25) {
    return { achieved: false, close: true, focus: 'activation' };
  }
  return { achieved: false, close: false, focus: 'product' };
}
```

### OMTM by Stage

```typescript
enum StartupStage {
  IDEA = 'idea',
  PSF = 'psf',
  MVP = 'mvp',
  TRACTION = 'traction',
  SCALE = 'scale',
}

const OMTM_BY_STAGE: Record<StartupStage, string> = {
  [StartupStage.IDEA]: 'interviews_completed',
  [StartupStage.PSF]: 'signup_rate',
  [StartupStage.MVP]: 'activation_rate',
  [StartupStage.TRACTION]: 'week1_retention',
  [StartupStage.SCALE]: 'mrr_growth_rate',
};
```

### Bottleneck Detection

```typescript
interface FunnelMetrics {
  acquisition: number;  // visitor-to-signup rate
  activation: number;   // signup-to-activated rate
  retention: number;    // week 1 retention rate
  revenue: number;      // activated-to-paid rate
  referral: number;     // paid-to-referrer rate
}

function findBottleneck(funnel: FunnelMetrics): string {
  const stages = ['acquisition', 'activation', 'retention', 'revenue', 'referral'] as const;
  const benchmarks: FunnelMetrics = {
    acquisition: 0.05,  // 5% visitor to signup
    activation: 0.25,   // 25% signup to activated
    retention: 0.40,    // 40% week 1 retention
    revenue: 0.05,      // 5% to paid
    referral: 0.10,     // 10% refer others
  };

  for (const stage of stages) {
    if (funnel[stage] < benchmarks[stage]) {
      return stage;
    }
  }
  return 'none'; // All stages healthy
}
```

---

## 8. Edge Functions & AI Models

### Edge Function: `mvp-scoper`

Handles MVP planning actions via the pipeline or direct invocation.

```typescript
// Actions:
// - 'complete_canvas':   Guide MVP Canvas completion (7-block walkthrough)
// - 'score_features':    Apply RICE scoring to a feature list
// - 'classify_kano':     Categorize features into Kano buckets
// - 'recommend_scope':   Suggest minimum feature set for MVP
```

### Edge Function: `traction-analyst`

Handles growth diagnostics and traction analysis.

```typescript
// Actions:
// - 'analyze_funnel':    Identify bottleneck in Customer Factory
// - 'recommend_omtm':    Suggest OMTM for current startup stage
// - 'score_pmf':         Run PMF assessment from survey data
// - 'project_growth':    Forecast metrics based on current rates
```

### AI Model Selection

| Task | Model | Rationale |
|------|-------|-----------|
| Canvas completion | `gemini-3-flash-preview` | Structured fill-in, low latency |
| Feature scoring (RICE) | `gemini-3-flash-preview` | Numeric calculation, fast |
| Kano classification | `gemini-3-flash-preview` | Pattern matching, fast |
| Scope recommendations | `gemini-3-pro-preview` | Needs strategic reasoning |
| Metric analysis | `gemini-3-flash-preview` | Numeric, formulaic |
| Bottleneck identification | `gemini-3-pro-preview` | Needs holistic funnel reasoning |
| Growth projection | `gemini-3-pro-preview` | Multi-variable forecasting |
| Strategy recommendations | `claude-sonnet-4-5` | Complex pivot/persevere reasoning |

### References

- PRD Section 5B: MVP Canvas System
- PRD Section 12: Dashboards & Analytics
- Diagram D-07: MVP Planning
- Diagram D-14: PMF Assessment
- `/tasks/guides/07-mvp-canavas.md`
- `/tasks/guides/08-startup-metrics.md`
