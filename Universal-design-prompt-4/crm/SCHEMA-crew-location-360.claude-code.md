# Photographer / Crew / Location 360° — Backend Schema Handoff (for Claude Code)

> **Audience:** Claude Code (implementation). **Author:** Claude Design.
> **What this is:** the schema spec that unblocks the 🔴-gated tabs in `crm/PROFILE-360-template.md §4`
> (Photographer/Crew Availability·Rates·Reviews·Portfolio; Location Availability·Pricing·Permits·Images)
> and closes **Phase-2 todo 26**. Design has already built the *screens* on fixtures; this doc defines the
> *tables* they need so the fixtures can become live.
> **What this is NOT:** final migrations. Every table below is 🔴 **proposed** — Claude Code writes the real
> SQL, RLS, and triggers, and **verifies each assumption against the live Supabase project before building.**

**Companions:** `crm/PROFILE-360-template.md` (the UI these tables feed), `uploads/06-crm-supabase-design-reference.md` (the conventions this doc obeys), `RELATIONSHIP-HUB.strategy.md` (the reframe).

**Status legend:** 🟢 exists live · 🔴 proposed (not built) · ⚪ future/out of scope (no schema, do not build)

---

## 0. Verify FIRST — before writing a single migration

These assumptions drive every table below. Confirm each against the live DB (MCP `list_tables`/`execute_sql`/`list_migrations`) and adjust the spec if reality differs. **Do not build on a guessed answer.**

- [ ] **Is there already a `models` / `talent` table?** SCR-20 Model Profile is built — models exist as *some* record. Find it. If a general talent table exists, **extend it with a `discipline` column** instead of creating `production_people` (see §1, Decision A).
- [ ] **What is the `assets` / DAM table's shape?** Portfolio & Location Images must **link to existing assets**, never store image URLs of their own. Confirm the table name and its PK/owner columns.
- [ ] **How are crew currently attached to a `shoots` row?** SCR-06 Shoot Detail shows a crew list. Is there a `shoot_crew` join, a jsonb column, or nothing yet? The `Shoots`/`Past shoots` linked-list tabs depend on this edge existing.
- [ ] **Does model availability already have a table?** SCR-23 Availability Editor is built (models set available/blocked; tentative/booked read-only). If a `model_availability` (or similar) table exists, the unified `availability` table in §2 must **absorb/replace it**, not run parallel. Confirm before choosing.
- [ ] **`organizations` / `org_id` column name** — confirm the exact org-scoping column used by `crm_*` and `shoots` so RLS matches the rest of the platform.
- [ ] **`crm_companies.kind='agency'`** exists (from the Relationships reframe) — crew/model representation FKs point here. Confirm the `kind` column shipped.

Write the answers into a short "§0 findings" note at the top of the migration PR so reviewers see what was verified.

---

## 1. Design decisions (obey the reference's philosophy)

The Supabase reference's hard rule: **do not create N tables when one table + a type column does the job** (that's how `crm_activities` unified note/call/email/meeting/task). The same discipline applies here — three of the five gated concepts are **cross-entity** (a photographer, a location, and a model all have availability, reviews, and a portfolio), so they become **unified tables keyed by subject**, not per-entity duplicates.

| # | Decision | Rationale |
|---|---|---|
| **A** | **One `production_people` table with a `discipline` column** (`photographer`/`videographer`/`stylist`/`mua`/`hair`/`gaffer`/`producer`/`assistant`/`crew` …) — *unless* §0 finds an existing talent table to extend. | Photographer, stylist, gaffer are the *same shape* (bookable person: rate, availability, portfolio, reviews). Mirrors SCR-20's person model. One table = one 360° person config, per `PROFILE-360 §3`. |
| **B** | **`availability` is ONE unified table** keyed by `(subject_type, subject_id)`, covering models, crew, and locations. | SCR-23 already defines the exact state machine; a per-entity copy would triplicate it. `subject_type ∈ (model, crew, location)`. |
| **C** | **`reviews` is ONE unified table** keyed by `(subject_type, subject_id)`. | A rating on a photographer, a location, or a model is the same row shape (rating + body + author + shoot context). |
| **D** | **Portfolio/Images = a join to existing `assets`, never new image storage.** | The DAM already owns images. `portfolio_items(owner_type, owner_id, asset_id)` links; it does not duplicate. Same rule the reference sets for Brand assets. |
| **E** | **Rates = a column on the entity for MVP** (`day_rate`,`currency`); a tiered/seasonal `rate_cards` table is ⚪ Phase-3, not now. | SCR-20/gallery only show a single day rate. Don't build tiering no screen consumes. |
| **F** | **Permits & Contracts = deferred (⚪).** Locations show a *greyed* Permits tab. | No screen renders permit detail; the reference lists Contracts as 🔴/⚪. Keep the tab `gated:'schema'`. |

> If §0 finds an existing talent table (Decision A → extend), keep the same field names below as **added columns**; everything else in this doc is unchanged.

---

## 2. Proposed tables

Field-spec style matches `supabase-design-reference §2`. DDL sketches are **starting points** — Claude Code finalizes types, defaults, and constraints.

### `production_people` — 🔴 proposed  *(or: columns added to an existing talent table — see §0)*

| | |
|---|---|
| Purpose | A bookable production person who is **not** a model — photographer, videographer, stylist, MUA, hair, gaffer, producer, assistant, crew. The person side of the 360° hub beyond models. |
| Key fields for design | `full_name`, `discipline` (enum, see Decision A), `profile_id` (nullable — set only if they're also a platform user), `agency_id` (nullable → `crm_companies` where `kind='agency'`), `home_base`, `day_rate`, `currency`, `bio`, `status` (`active`/`inactive`) |
| Relationships | optional `profiles` (1); optional `crm_companies` agency (1); has many `availability`, `reviews`, `portfolio_items`; linked to `shoots` via the crew edge confirmed in §0 |
| Screens unblocked | Photographer/Crew 360° (`PROFILE-360 §4`, role=photographer\|crew): flips **Availability·Rates·Reviews·Portfolio** from 🔴 to live |
| States in UI | `status` chip (active/inactive); **discipline chip carries text** (never color-only) |
| Permissions | **Org-scoped** — same `org_id` RLS as `crm_*`/`shoots`; a person from another org never renders |
| Empty/loading/error | Empty: "No crew yet" + `[Add crew]`. Loading: skeleton. Error: inline banner + Retry |

```sql
-- SKETCH — Claude Code finalizes & verifies
create table production_people (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organizations(id),      -- confirm col name §0
  full_name    text not null,
  discipline   text not null,                                   -- enum via check or lookup
  profile_id   uuid references profiles(id),                    -- nullable
  agency_id    uuid references crm_companies(id),               -- nullable; kind='agency'
  home_base    text,
  day_rate     numeric,
  currency     text default 'GBP',
  bio          text,
  status       text not null default 'active',                  -- active|inactive
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
-- RLS: org-scoped select/insert/update; no cross-org read. See §5.
```

### `locations` — 🔴 proposed

| | |
|---|---|
| Purpose | A place a shoot happens — studio, outdoor spot, venue, residence. The "Place" entity in the 360° hub. |
| Key fields for design | `name`, `location_type` (`studio`/`outdoor`/`venue`/`residential`/`other`), `address`, `geo` (lat/lng, nullable), `capacity`, `day_rate`, `currency`, `owner_contact_id` (nullable → `crm_contacts`), `status` (`active`/`inactive`) |
| Relationships | has many `availability`, `reviews`, `portfolio_items` (images); linked to `shoots` via `shoots.location_id` (add if absent — confirm §0); optional owner `crm_contacts` |
| Screens unblocked | Location 360° (`PROFILE-360 §4`, entity=location): flips **Availability·Pricing·Images** to live; **Permits** stays ⚪ greyed |
| States in UI | `location_type` + `status` chips (text-labelled) |
| Permissions | Org-scoped |
| Empty/loading/error | Empty: "No locations yet" + `[Add location]`. Loading/Error mirror above |

```sql
-- SKETCH
create table locations (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references organizations(id),
  name           text not null,
  location_type  text not null,                 -- studio|outdoor|venue|residential|other
  address        text,
  geo            point,                          -- nullable
  capacity       int,
  day_rate       numeric,
  currency       text default 'GBP',
  owner_contact_id uuid references crm_contacts(id),  -- nullable
  status         text not null default 'active',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
-- Also: add `location_id uuid references locations(id)` to `shoots` (nullable) if absent.
```

### `availability` — 🔴 proposed  **(UNIFIED — Decision B)**

| | |
|---|---|
| Purpose | One calendar table for **models, crew, and locations**. The backing store for SCR-23 Availability Editor and every 360° Availability tab. |
| Key fields for design | `subject_type` (`model`/`crew`/`location`), `subject_id`, `date`, `status` (`available`/`blocked`/`tentative`/`booked`), `source` (`user`/`booking`), `booking_ref` (nullable → the booking/shoot that made it tentative/booked) |
| Design rule (from SCR-23) | **`available`/`blocked` are user-set; `tentative`/`booked` are system-derived from bookings and are read-only in the editor.** A UI must never let a user directly write `booked`. |
| Relationships | polymorphic to `production_people`/`locations`/model-table via `(subject_type, subject_id)`; `booking_ref` → shoots/bookings |
| Screens unblocked | SCR-23 (goes live); Availability tab on Model/Crew/Location 360° |
| States in UI | 4-state day cell (green/grey/amber/black **with legend text**) — exactly as built |
| Permissions | Org-scoped; write of `available`/`blocked` limited to the subject's owner/manager per §5 |
| Empty/loading/error | Empty month = all-available default grid; Loading: skeleton grid; Error: banner + Retry |

```sql
-- SKETCH
create table availability (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organizations(id),
  subject_type text not null,                    -- model|crew|location
  subject_id   uuid not null,                    -- polymorphic (no hard FK)
  date         date not null,
  status       text not null,                    -- available|blocked|tentative|booked
  source       text not null default 'user',     -- user|booking
  booking_ref  uuid,                             -- nullable; set when source='booking'
  created_at   timestamptz not null default now(),
  unique (subject_type, subject_id, date)
);
-- Guard: reject direct UPDATE to status in ('tentative','booked') from client role
-- (mirror crm_deals terminal-stage guard). Only the booking service writes those.
```

### `reviews` — 🔴 proposed  **(UNIFIED — Decision C)**

| | |
|---|---|
| Purpose | Ratings/feedback on a model, crew member, or location — one row shape for all three. |
| Key fields for design | `subject_type` (`model`/`crew`/`location`), `subject_id`, `rating` (1–5), `body`, `author_id` (→ profiles), `shoot_id` (nullable — the shoot it's about), `created_at` |
| Relationships | polymorphic subject; `author_id` → profiles; optional `shoots` context |
| Screens unblocked | Reviews tab on Model/Crew/Location 360° |
| States in UI | star rating + author + date; average shown in header key-facts |
| Permissions | Org-scoped read; author-only edit/delete |
| Empty/loading/error | Empty: "No reviews yet"; Loading: skeleton; Error: banner |

```sql
-- SKETCH
create table reviews (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organizations(id),
  subject_type text not null,                    -- model|crew|location
  subject_id   uuid not null,
  rating       int not null check (rating between 1 and 5),
  body         text,
  author_id    uuid not null references profiles(id),
  shoot_id     uuid references shoots(id),        -- nullable
  created_at   timestamptz not null default now()
);
```

### `portfolio_items` — 🔴 proposed  **(JOIN to existing assets — Decision D)**

| | |
|---|---|
| Purpose | Ordered link between a person/location and images that **already live in the DAM**. Backs the Portfolio (people) and Images (locations) tabs. |
| Key fields for design | `owner_type` (`crew`/`model`/`location`), `owner_id`, `asset_id` (→ existing assets table), `sort_order`, `caption` (nullable) |
| Design rule | **Never stores an image URL or file.** It references an `assets` row. If an image isn't in the DAM, it isn't in a portfolio. |
| Relationships | polymorphic owner; `asset_id` → existing `assets`/DAM table (name confirmed §0) |
| Screens unblocked | Portfolio tab (crew/model); Images tab (location) |
| States in UI | grid of asset thumbnails; drag to reorder writes `sort_order` |
| Permissions | Org-scoped; inherits asset visibility |
| Empty/loading/error | Empty: "No portfolio items yet" + `[Add from assets]`; the picker lists existing DAM assets only |

```sql
-- SKETCH
create table portfolio_items (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id),
  owner_type  text not null,                     -- crew|model|location
  owner_id    uuid not null,
  asset_id    uuid not null references assets(id),  -- confirm table name §0
  sort_order  int not null default 0,
  caption     text,
  created_at  timestamptz not null default now()
);
```

---

## 3. Reuse map — link to these, never duplicate

| 360° tab | Data it shows | Source | Rule |
|---|---|---|---|
| Shoots / Past shoots | shoots this person/location worked | **existing `shoots`** (via crew edge §0 / `shoots.location_id`) | linked-list → navigates to existing Shoot Detail; no re-implementation |
| Brands / Brands worked with | brands connected through shoots | **existing `brands`** | link out to existing Brand Detail |
| Agency (crew) / Roster | representation | **`crm_companies` where `kind='agency'`** | reuse the reframed org table |
| Portfolio / Images | photos | **existing `assets`/DAM** via `portfolio_items` | join, never store |
| Activity | timeline | **existing `crm_activities`** (add `crew_id`/`location_id` anchors, OR reuse the polymorphic anchor) | one timeline table, per reference §1 |
| AI Insights | summary/health | **`crm-assistant` tools** (computed, not stored) | never a stored "score" column |

**Do not** create: a crew-specific timeline, a location image store, a second brands/shoots table, or a per-entity availability copy. All exist or are unified above.

---

## 4. Lifecycle / derived states (design-safe)

| Concept | States | Source of truth |
|---|---|---|
| Person status | `active` · `inactive` | `production_people.status` (stored) |
| Location status | `active` · `inactive` | `locations.status` (stored) |
| Availability day | `available` · `blocked` (user-set) · `tentative` · `booked` (system, read-only) | `availability.status` + `source` |
| Review rating | 1–5 stars | `reviews.rating` |
| Relationship health / fit | **computed, never stored** | `crm-assistant` tool output + `EvidenceBlock` (same pattern as DNA/deal-health) |

---

## 5. RLS & permissions

- **Every table is org-scoped.** `org_id` RLS identical to `crm_*` and `shoots`; cross-org read must fail (add negative tests, §8).
- **Availability write split:** `available`/`blocked` writable by the subject's owner/manager; `tentative`/`booked` writable **only** by the booking service role — enforce with a DB guard trigger mirroring `crm_deals_guard_terminal_stage()`.
- **Reviews:** org read; author-only update/delete.
- **Portfolio:** inherits the linked asset's visibility; never widens it.
- **No new sharing model** — org membership is the only boundary, matching the reference.

---

## 6. What each table unblocks in `PROFILE-360-template.md §4`

Flip these from 🔴 gated to live once the table ships:

| PROFILE-360 entry | Was | Unblocked by |
|---|---|---|
| Person · Photographer/Crew → `Availability` | 🔴 | `availability` (subject_type=crew) |
| Person · Photographer/Crew → `Rates` | 🔴 | `production_people.day_rate` |
| Person · Photographer/Crew → `Reviews` | 🔴 | `reviews` (subject_type=crew) |
| Person · Photographer/Crew → `Portfolio` | 🔴 | `portfolio_items` (owner_type=crew) |
| Person · Photographer/Crew → `Shoots`/`Brands` | ♻️✅ already | existing `shoots`/`brands` (crew edge §0) |
| Place · Location → `Availability` | 🔴 | `availability` (subject_type=location) |
| Place · Location → `Pricing` | 🔴 | `locations.day_rate` |
| Place · Location → `Images` | 🔴 | `portfolio_items` (owner_type=location) |
| Place · Location → `Past shoots` | ♻️✅ already | existing `shoots.location_id` |
| Place · Location → `Permits` | ⚪ stays greyed | out of scope (§9) |

After migration, update `PROFILE-360-template.md §4` markers and the `SCREEN-REGISTRY` status for the affected 360° configs.

---

## 7. Migration build order (suggested Linear issues)

1. **Verify §0** and write findings note. *(blocker for all below)*
2. **`production_people`** + RLS + org-scope tests. *(or extend existing talent table)*
3. **`locations`** + `shoots.location_id` + RLS.
4. **`availability`** (unified) + terminal-status guard trigger + **migrate SCR-23's existing model availability into it** if a prior table exists.
5. **`reviews`** (unified) + author-edit RLS.
6. **`portfolio_items`** + asset-visibility RLS + the "add from DAM" picker RPC.
7. **Crew↔shoots edge** (if §0 finds none): `shoot_crew(shoot_id, crew_id, role)` join.
8. **`crm-assistant` context** extension: crew/location ids as chat/IntelligencePanel context (waves per IPI-368/369 pattern).

Each issue: schema + RLS + negative cross-org test, in one PR, reviewed by `rls-policy-auditor`.

---

## 8. Validations checklist (Claude Code must prove — mirrors reference §9)

- [ ] §0 findings documented; spec reconciled to live reality before build.
- [ ] No parallel availability table survives — SCR-23's model data lives in the unified `availability`.
- [ ] `availability` rejects client writes of `tentative`/`booked` (guard trigger tested).
- [ ] `portfolio_items.asset_id` FKs the **real** DAM/assets table; no image URLs stored anywhere in these tables.
- [ ] All 5 tables org-scoped; cross-org read returns zero rows (negative RLS tests pass).
- [ ] `production_people.agency_id` FKs `crm_companies` (kind agency), never a legacy table.
- [ ] `locations.location_id` added to `shoots` as nullable; no backfill breakage.
- [ ] Reviews author-only edit/delete enforced.
- [ ] Discipline & type values are constrained (check/lookup), not free text.
- [ ] `PROFILE-360-template.md §4` and `SCREEN-REGISTRY` updated after ship.

---

## 9. Explicitly OUT of scope (do NOT build — todo 27 + deferrals)

No schema, no tables, no design — per `RELATIONSHIP-HUB.strategy §8` and the Supabase reference §7:

- **Permits** (location) — greyed tab stays greyed.
- **Contracts** — 🔴/⚪ elsewhere; not here.
- **Rate cards / tiered/seasonal pricing** — single `day_rate` only for MVP.
- **Campaigns, Products, Events, Sponsors-as-entity, Invoices, Payments** — todo 27, no schema.
- **Live relationship-graph visualization** & **semantic cross-entity search** — todo 27.
- **External calendar sync, email/SMS send** — reference §7 Future.

If any of these is requested, it needs its own PRD + schema pass — it is not a fast-follow to this doc.

---

## 10. Open questions for Claude Code to resolve against live DB

1. Extend an existing talent table (Decision A) or create `production_people`? — depends on §0.
2. Is a models table already polymorphic-ready for the unified `availability`/`reviews`, or does it need a `subject_type` shim?
3. Does `crm_activities` already support a polymorphic anchor for crew/location, or add `crew_id`/`location_id` columns?
4. Exact `assets`/DAM table name + owner/visibility columns for `portfolio_items`.
5. Org column name (`org_id` vs `organization_id`) across `shoots` vs `crm_*` — normalize in RLS.

---

**Bottom line:** five tables (`production_people`, `locations`, + the three unified `availability`/`reviews`/`portfolio_items`), all org-scoped, all reusing shoots/brands/assets/agencies rather than duplicating them. Build them and the Photographer/Crew/Location 360° screens Design already shipped on fixtures become live — no new UI required, just the config-flip in `PROFILE-360-template.md §4`.
