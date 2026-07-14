# 04 — User Journeys

> Eight end-to-end flows, all verified working in the prototypes. Screens → [02](02-screen-map.md). Navigation → [07](07-navigation-map.md).

## J1 — Onboarding → Command Center
```mermaid
flowchart LR
  S1[13-screen funnel\nproof · build · URL · goals] --> S12[Analysis\nBrand DNA crawl]
  S12 --> S13[DNA ready · score 87]
  S13 -->|Open FashionOS| CC[Command Center]
```
Funnel collects build type, brand URL, channels, goals → analysis (progress) → DNA payoff → enters the app. Skip-for-now allowed on optional screens.

## J2 — Brand analysis (Brand List → Brand Detail)
```mermaid
flowchart LR
  BL[Brand List] -->|card/rail/Fix now| BD[Brand Detail ?id]
  BD -->|run analysis| AN[Analysing n/47]
  AN --> LO[Loaded · DNA pillars]
  AN -->|drop| ER[Error · Retry/Report/Go back]
  ER -->|Retry| AN
```
`brand-intelligence` is NOT durable → use determinate crawl + error/retry, never a resumable stream.

## J3 — Brand → Shoot (context carryover)
```mermaid
sequenceDiagram
  participant U as User
  participant BD as Brand Detail
  participant SW as Shoot Wizard
  participant AI as Production-Planner
  U->>BD: Plan a Shoot
  BD->>SW: ?brand=nike&campaign=spring-2026&season=SS26
  SW->>AI: hydrate (brand·DNA·campaign·season·products·moodboard·past shoots)
  AI-->>SW: greeting + draft brief (Step 2 fields locked, Change to edit)
  SW-->>U: no duplicate questions
```

## J4 — Shoot planning → create (Shoots List → Wizard → Shoot Detail)
```mermaid
flowchart LR
  SL[Shoots List] -->|New shoot| SW[Shoot Wizard 10 steps]
  SW --> RV[Review · Production Readiness]
  RV -->|Create| CFM[Confirm modal]
  CFM -->|Confirm| SD[Shoot Detail]
```
Wizard steps are AI-prefilled; Review scores react to user actions (props/savings/shot edits raise section + composite scores). Exit guard on unsaved changes.

## J5 — Shoot review (Shoots List → Open → Shoot Detail)
```mermaid
flowchart LR
  SL[Shoots List] -->|Open shoot ?id| SD[Shoot Detail · 9 tabs]
  SD -->|View in Assets| AS[Assets ?shoot filtered]
```

## J6 — Assets review
```mermaid
flowchart LR
  AS[Assets grid/table] -->|select card/row| RP[Right panel: preview·DNA·AI analysis·channel readiness·used-in]
  RP -->|Channel Preview| CP[Channel Preview]
  RP -->|Use in campaign/shoot · Replace · Download| TO[toast]
```

## J7 — Matching → shortlist → outreach
```mermaid
flowchart LR
  MA[Matching swipe/table] -->|Save| SV[toast + Shortlist n]
  MA -->|Invite| IV[toast + Invited]
  SV --> DR[Shortlist drawer]
  DR -->|Send invites to saved| INV[all saved → invited]
  DR -->|Remove| RM[removed]
```
State persists across swipe/table toggle.

## J8 — Channel Preview → publish
```mermaid
stateDiagram-v2
  [*] --> Preview
  Preview --> Confirm: Publish
  Confirm --> Publishing: Confirm (selected channels only)
  Confirm --> Preview: Cancel
  Publishing --> Success: per-channel ticks
  Success --> Dashboard: Return to dashboard
  Success --> Preview: Publish another
```
Confirm modal lets the user select/deselect channels; title + button update ("Publish 2 channels"); progress + success run only for selected.

## Journey cross-reference
| Journey | Screens | Agents | Key components |
|---|---|---|---|
| J1 | Onboarding→CC | brand-intelligence→production-planner | progress, DNA payoff |
| J2 | BL→BD | brand-intelligence | BrandCard, DNA pillars |
| J3 | BD→SW | brand-intelligence→production-planner | WizardStep, lock banner |
| J4 | SL→SW→SD | production-planner | WizardStep, confirm modal |
| J5 | SL→SD→AS | production-planner | tabs, AssetCard |
| J6 | AS | creative-director | AssetCard, right panel |
| J7 | MA | social-discovery | swipe/table, drawer |
| J8 | CP→CC | visual-identity→production-planner | phone frames, publish modal |
