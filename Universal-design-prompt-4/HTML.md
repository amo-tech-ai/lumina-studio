# iPix / FashionOS — HTML Prototype & Component Index

> Every `.dc.html` in the package: **screen prototypes** in [`Pages/`](Pages/) and **component primitives** in [`components/`](components/).
> Paths are relative to the package root. Status: 🟢 built + verified / implementation-ready · 🟡 prototype / design-complete, backend or wiring pending · ⚪ planned (no prototype) · 🔴 blocked · ⏸ future.
> Lifecycle (components): 🟢 Stable · 🟡 Experimental. Screen IDs per [docs/handoff/SCREEN-REGISTRY.md](docs/handoff/SCREEN-REGISTRY.md).
> See also: [index.md](index.md) (all docs) · [SITEMAP.md](SITEMAP.md) (app map) · [components/COMPONENTS.md](components/COMPONENTS.md) (contracts).

---

## Pages/ — screen prototypes

**32 `.dc.html`** = 26 screen files (covering 27 built SCR-IDs; SCR-21/22 reuse the shoot files) + 6 reference/demo. Plus [`Pages/INDEX.html`](Pages/INDEX.html) (gallery) + `Pages/support.js` (runtime). All reference images as `../images/…` and the runtime as `./support.js`.

### Operator platform
| File | SCR | Route | Status |
|---|:--:|---|:--:|
| [Command Center.v2.image-first.dc.html](Pages/Command%20Center.v2.image-first.dc.html) | 01 | `/app` | 🟢 |
| [Brand List.v2.image-first.dc.html](Pages/Brand%20List.v2.image-first.dc.html) | 02 | `/app/brand` | 🟢 |
| [Brand Detail.v2.image-first.dc.html](Pages/Brand%20Detail.v2.image-first.dc.html) | 03 | `/app/brand/[id]` | 🟢 |
| [Campaigns.v2.image-first.dc.html](Pages/Campaigns.v2.image-first.dc.html) | 07 | `/app/campaigns` | 🟢 |
| [Assets.v2.image-first.dc.html](Pages/Assets.v2.image-first.dc.html) | 08 | `/app/assets` | 🟢 |
| [Channel Preview.v2.image-first.dc.html](Pages/Channel%20Preview.v2.image-first.dc.html) | 10 | `/app/preview` | 🟢 |
| [SCR-15-Notification-Center.dc.html](Pages/SCR-15-Notification-Center.dc.html) | 15 | `/app/inbox` | 🟡 |
| [SCR-18-Collaboration-Audit.dc.html](Pages/SCR-18-Collaboration-Audit.dc.html) | 18 | `/app/activity` | 🟢 |

### Shoot lifecycle
| File | SCR | Route | Status |
|---|:--:|---|:--:|
| [Shoots List.v2.image-first.dc.html](Pages/Shoots%20List.v2.image-first.dc.html) | 04 | `/app/shoots` | 🟢 |
| [Shoot Detail.v2.image-first.dc.html](Pages/Shoot%20Detail.v2.image-first.dc.html) | 05 **+22** | `/app/shoots/[id]` · `?flow=booking`→`/app/bookings/[id]` | 🟢 |
| [Shoot Wizard.v2.image-first.dc.html](Pages/Shoot%20Wizard.v2.image-first.dc.html) | 06 **+21** | `/app/shoots/new` · `flow=booking`→booking wizard | 🟢 |

### Booking / talent
| File | SCR | Route | Status |
|---|:--:|---|:--:|
| [SCR-09-Matching-Talent.dc.html](Pages/SCR-09-Matching-Talent.dc.html) | 09 | `/app/matching` (Talent · Casting/Grid/List) | 🟢 |
| [Matching.v2.image-first.dc.html](Pages/Matching.v2.image-first.dc.html) | 09† | `/app/matching` (legacy brand↔creator discovery) | 🟢 |
| [SCR-20-Talent-Profile.dc.html](Pages/SCR-20-Talent-Profile.dc.html) | 20 | `/app/talent/profile` (`mode` operator·model) | 🟡 |
| [SCR-23-Availability-Editor.dc.html](Pages/SCR-23-Availability-Editor.dc.html) | 23 | talent-scoped | 🟡 |
| [SCR-24-Talent-Onboarding.dc.html](Pages/SCR-24-Talent-Onboarding.dc.html) | 24 | `/app/talent/profile` (URL-context) | 🟡 |
| [SCR-25-Role-Dashboards.dc.html](Pages/SCR-25-Role-Dashboards.dc.html) | 25 | `/app/model` · `/app/roster` (`role`) | 🟡 |

> † `Matching.v2` (legacy discovery) and `SCR-09-Matching-Talent` (talent/casting) are **distinct screens sharing a name stem** — do not merge or double-build (see SITEMAP §11, ADR-002).

### CRM / Relationships — 🟡 design-complete, backend-gated on IPI-362
| File | SCR | Route | Status |
|---|:--:|---|:--:|
| [SCR-26-CRM-Companies-List.dc.html](Pages/SCR-26-CRM-Companies-List.dc.html) | 26 | `/app/crm/companies` | 🟡 |
| [SCR-27-CRM-Company-Detail.dc.html](Pages/SCR-27-CRM-Company-Detail.dc.html) | 27 | `/app/crm/companies/[id]` | 🟡 |
| [SCR-28-CRM-Contacts-List.dc.html](Pages/SCR-28-CRM-Contacts-List.dc.html) | 28 | `/app/crm/contacts` | 🟡 |
| [SCR-29-CRM-Contact-Detail.dc.html](Pages/SCR-29-CRM-Contact-Detail.dc.html) | 29 | `/app/crm/contacts/[id]` | 🟡 |
| [SCR-30-CRM-Pipeline.dc.html](Pages/SCR-30-CRM-Pipeline.dc.html) | 30 | `/app/crm/pipeline` | 🟡 |
| [SCR-31-CRM-Deal-Detail.dc.html](Pages/SCR-31-CRM-Deal-Detail.dc.html) | 31 | `/app/crm/pipeline/[id]` | 🟡 |

### Analytics & onboarding
| File | SCR | Route | Status |
|---|:--:|---|:--:|
| [Analytics.v2.image-first.dc.html](Pages/Analytics.v2.image-first.dc.html) | 16 | `/app/analytics` | 🟢 |
| [Campaign Performance.v2.image-first.dc.html](Pages/Campaign%20Performance.v2.image-first.dc.html) | 17 | `/app/analytics/campaigns` | 🟢 |
| [Onboarding.v2.zeely.dc.html](Pages/Onboarding.v2.zeely.dc.html) | 11 | `/onboarding` | 🟢 |

### Reference & demo (not production routes)
| File | Kind | Purpose |
|---|---|---|
| [Component Library.dc.html](Pages/Component%20Library.dc.html) | catalog | Design-system catalog — the canonical source for the atoms in `components/` |
| [DEMO-360-Agency.dc.html](Pages/DEMO-360-Agency.dc.html) | template demo | 360° profile template, Agency config (reference for `Profile360`) |
| [SCR-MOBILE-Gallery.dc.html](Pages/SCR-MOBILE-Gallery.dc.html) | mobile preview | 28 operator/booking frames @390 |
| [SCR-MOBILE-CRM-Gallery.dc.html](Pages/SCR-MOBILE-CRM-Gallery.dc.html) | mobile preview | 6 CRM frames @390 (incl. kanban→stage-accordion) |
| [SCR-MOBILE-Booking-Shell.dc.html](Pages/SCR-MOBILE-Booking-Shell.dc.html) | mobile ref shell | tab bar · persistent composer · Insights sheet |
| [SCR-MOBILE-BottomSheet.dc.html](Pages/SCR-MOBILE-BottomSheet.dc.html) | mobile primitive | Insights / filters / expanded-chat sheet |

### Unbuilt (no prototype file yet)
SCR-12 Product Catalog ⚪ · SCR-13 Collections ⚪ · SCR-14 Asset→PDP crops ⚪ · SCR-19 Event Management ⏸

---

## components/ — component primitives

**20 `.dc.html`** + [COMPONENTS.md](components/COMPONENTS.md) (contracts, lifecycle, tokens) + `support.js`. Realize these in React (handoff §4); ownership + build phase in [docs/claude-handoff.md §13](docs/claude-handoff.md).

### Shell & layout
| Component | Lifecycle | Used on |
|---|:--:|---|
| [OperatorShell.dc.html](components/OperatorShell.dc.html) | 🟢 Stable | all panel screens (3-pane grid) |
| [NavSidebar.dc.html](components/NavSidebar.dc.html) | 🟢 Stable | all panel screens |
| [IntelligencePanel.dc.html](components/IntelligencePanel.dc.html) | 🟢 Stable | all panel screens (right pane) |
| [PersistentChatDock.dc.html](components/PersistentChatDock.dc.html) | 🟡 Experimental | all (→ CopilotKit runtime) |
| [PageHeader.dc.html](components/PageHeader.dc.html) | 🟢 Stable | list / detail screens |

### Image-first cards
| Component | Lifecycle | Used on |
|---|:--:|---|
| [BrandCard.dc.html](components/BrandCard.dc.html) | 🟢 Stable | Brand List, Command Center |
| [ShootCard.dc.html](components/ShootCard.dc.html) | 🟢 Stable | Shoots List |
| [CampaignCard.dc.html](components/CampaignCard.dc.html) | 🟢 Stable | Campaigns |
| [AssetCard.dc.html](components/AssetCard.dc.html) | 🟢 Stable | Assets, Brand Detail |

### AI & HITL
| Component | Lifecycle | Used on |
|---|:--:|---|
| [EvidenceBlock.dc.html](components/EvidenceBlock.dc.html) | 🟢 Stable (frozen) | Brand Detail, Assets, Matching, Campaigns, Channel Preview, Analytics |
| [ApprovalCard.dc.html](components/ApprovalCard.dc.html) | 🟢 Stable | every screen with AI writes |
| [AgentStatusIndicator.dc.html](components/AgentStatusIndicator.dc.html) | 🟡 Experimental | chat dock, IntelligencePanel |

### Inputs & filters
| Component | Lifecycle | Used on |
|---|:--:|---|
| [SearchBar.dc.html](components/SearchBar.dc.html) | 🟢 Stable | list screens |
| [FilterBar.dc.html](components/FilterBar.dc.html) | 🟢 Stable | Shoots, Assets, Brand List |
| [WizardStep.dc.html](components/WizardStep.dc.html) | 🟢 Stable | Shoot Wizard, Onboarding |

### Feedback & states
| Component | Lifecycle | Used on |
|---|:--:|---|
| [StatusChip.dc.html](components/StatusChip.dc.html) | 🟢 Stable (Tier-0) | every card |
| [SkeletonLoader.dc.html](components/SkeletonLoader.dc.html) | 🟢 Stable (Tier-0) | every loading state |
| [EmptyState.dc.html](components/EmptyState.dc.html) | 🟢 Stable (Tier-0) | every empty state |

### Mobile
| Component | Lifecycle | Used on |
|---|:--:|---|
| [BottomNavigation.dc.html](components/BottomNavigation.dc.html) | 🟢 Stable | all panel screens ≤1024px |
| [BottomSheet.dc.html](components/BottomSheet.dc.html) | 🟢 Stable | intel panel / More / filters ≤1024px |
