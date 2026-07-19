A stronger system should not analyze only the homepage. It should build a **multi-source brand intelligence profile** from the website, social channels, marketplaces, reviews, press, and visual content, then separate confirmed evidence from AI inference.

# Recommended analysis workflow

## 1. Discover the brand’s full digital footprint

Start with the website, then find related profiles using verified links, brand names, usernames, domains, and company details.

Search for:

* official website and regional sites;
* Instagram, TikTok, Facebook, Pinterest, YouTube and LinkedIn;
* marketplaces and retail partners;
* Google Business profiles;
* press coverage and interviews;
* customer reviews;
* influencer and creator mentions;
* competitor brands;
* advertising libraries where available.

Each source should receive a confidence level:

| Confidence | Meaning                                        |
| ---------- | ---------------------------------------------- |
| High       | Linked directly from the official website      |
| Medium     | Matching name, logo, domain or contact details |
| Low        | Possible match requiring user confirmation     |

Never merge a profile into the brand analysis only because the name is similar.

---

## 2. Crawl the website beyond the homepage

Analyze a controlled set of high-value pages:

* homepage;
* about page;
* product or service categories;
* best sellers or featured collections;
* campaign and lookbook pages;
* blog or editorial content;
* contact and store pages;
* shipping, returns and policy pages;
* careers or team pages;
* metadata, structured data and sitemap.

For ecommerce brands, sample:

* 5–10 product pages;
* 2–3 category pages;
* current promotions;
* recent campaign pages.

This gives a much more accurate view than a homepage-only summary.

---

## 3. Extract structured brand evidence

The system should convert observations into a consistent schema.

### Brand identity

* brand name;
* category;
* location;
* positioning;
* value proposition;
* mission;
* tone of voice;
* price positioning;
* brand maturity.

### Product intelligence

* main product categories;
* hero products;
* pricing range;
* seasonal products;
* materials;
* product differentiators;
* bundles and upsells;
* availability and merchandising patterns.

### Visual identity

* dominant colors;
* typography;
* photography style;
* image composition;
* model diversity;
* locations;
* styling;
* recurring patterns;
* video style;
* visual consistency.

### Audience intelligence

* likely customer segments;
* age range;
* interests;
* geography;
* purchasing motivations;
* lifestyle signals;
* objections;
* aspirational identity.

### Marketing intelligence

* active channels;
* content formats;
* posting frequency;
* recurring topics;
* calls to action;
* promotions;
* influencer usage;
* user-generated content;
* email capture;
* conversion paths.

---

# 4. Separate evidence from inference

Every insight should be labeled.

Example:

```text
Confirmed:
Maaji sells swimwear, resortwear and activewear on its official website.

Observed:
The website uses colorful tropical photography and pattern-heavy products.

Inferred:
The likely target audience values expressive, premium vacation fashion.

Confidence:
High for product categories, medium for audience interpretation.
```

This prevents the agent from presenting guesses as facts.

Use a field such as:

```json
{
  "claim": "The brand targets fashion-conscious travelers",
  "type": "inference",
  "confidence": 0.74,
  "sources": ["homepage", "Instagram", "product catalog"]
}
```

---

# 5. Analyze social profiles independently

Do not treat social platforms as copies of the website. Each channel reveals different information.

## Instagram

Analyze:

* visual consistency;
* campaign themes;
* product tagging;
* reels versus static content;
* engagement;
* creator collaborations;
* comments and customer language;
* posting frequency.

## TikTok

Analyze:

* entertainment value;
* trends;
* creator-led content;
* product demonstrations;
* audience reactions;
* video retention signals where available.

## Pinterest

Analyze:

* visual search positioning;
* evergreen content;
* seasonal boards;
* product discovery potential.

## LinkedIn

Analyze:

* company positioning;
* growth;
* hiring;
* partnerships;
* leadership;
* B2B activity.

## Reviews

Analyze:

* repeated praise;
* recurring complaints;
* fit and quality concerns;
* shipping experience;
* customer vocabulary;
* unmet expectations.

---

# 6. Add competitor benchmarking

The system should compare the user’s brand with three to five relevant competitors.

Compare:

| Area                    | Brand | Competitor average |
| ----------------------- | ----: | -----------------: |
| Visual consistency      |    86 |                 79 |
| Website clarity         |    72 |                 81 |
| Social engagement       |    68 |                 75 |
| Product differentiation |    89 |                 77 |
| Conversion readiness    |    64 |                 82 |

Competitors should be selected using:

* similar category;
* similar price range;
* similar geography;
* similar audience;
* similar business model.

Do not compare a small local label directly with a global luxury company unless the user requests an aspirational comparison.

---

# 7. Use a clear scoring model

Scores should be explainable, not arbitrary.

## Suggested scorecard

| Category             | Weight |
| -------------------- | -----: |
| Brand clarity        |    15% |
| Visual identity      |    15% |
| Website experience   |    15% |
| Product positioning  |    15% |
| Content strategy     |    10% |
| Social presence      |    10% |
| Audience alignment   |    10% |
| Conversion readiness |    10% |

Each category receives:

* a score from 0–100;
* a letter grade;
* evidence;
* confidence;
* strengths;
* weaknesses;
* recommended actions.

## Grade scale

| Score    | Grade | Meaning                      |
| -------- | ----- | ---------------------------- |
| 90–100   | A     | Leading                      |
| 80–89    | B     | Strong                       |
| 70–79    | C     | Competitive but inconsistent |
| 60–69    | D     | Important gaps               |
| Below 60 | F     | Major improvement required   |

Do not produce a single score without showing how it was calculated.

---

# 8. Add opportunity and risk scores

Alongside the overall grade, calculate:

### Brand opportunity score

Measures potential improvement from:

* content gaps;
* missing channels;
* weak conversion paths;
* underused products;
* campaign opportunities.

### Brand consistency score

Measures alignment across:

* website;
* social;
* messaging;
* visuals;
* pricing;
* customer experience.

### Evidence confidence score

Measures whether conclusions are based on:

* verified official sources;
* sufficient page coverage;
* recent content;
* consistent signals across platforms.

Example:

```text
Overall brand score: 82/100 — B
Opportunity score: 91/100 — High potential
Consistency score: 76/100 — Needs alignment
Evidence confidence: 87/100 — Strong
```

---

# 9. Make the answer brand-aware

The response should use the brand’s actual language, products, visual style and commercial context.

Avoid generic output such as:

> “Create engaging content and use social media.”

Use output such as:

> “Maaji’s strongest asset is its distinctive print language. The campaign should make prints recognizable before the logo appears. Use close-up textile shots, coordinated family looks and motion-based reels to reinforce that visual signature.”

A strong answer should reference:

* specific product groups;
* real visual patterns;
* real campaign themes;
* real customer language;
* current content gaps;
* appropriate channels.

---

# 10. Recommended response structure

The agent should return results in this order:

## Brand snapshot

A five-sentence executive summary.

## Evidence reviewed

List the website pages and profiles analyzed.

## Brand scorecard

Scores, grades and confidence.

## What the brand does well

Three to five evidence-backed strengths.

## Main gaps

Three to five prioritized weaknesses.

## Audience profile

Confirmed signals and inferred segments.

## Competitor position

Where the brand leads and falls behind.

## Campaign opportunities

Three concepts tied to business objectives.

## Recommended next actions

Ranked by impact and effort.

## Save profile CTA

Only after the analysis:

```text
This is an AI-generated draft based on the sources reviewed.

Create a free brand profile to save the analysis, correct assumptions and continue building your campaign.
```

---

# Suggested agent instructions

```text
You are the iPix Brand Intelligence and Production Planner.

Analyze a brand using multiple verified sources, not only its homepage.

For every analysis:

1. Discover the official website, social profiles, retail listings, reviews and relevant press.
2. Verify profile ownership before using a source.
3. Analyze important website pages, product categories and recent campaigns.
4. Separate confirmed facts, observations and inferences.
5. Attach sources and confidence scores to important claims.
6. Compare the brand with three to five relevant competitors.
7. Score brand clarity, visual identity, website experience, product positioning, content, social presence, audience alignment and conversion readiness.
8. Explain every score using evidence.
9. Identify strengths, risks, content gaps and commercial opportunities.
10. Generate recommendations that reference the brand's actual products, visual style, audience and channels.

Rules:

- Never invent facts.
- Label uncertain conclusions as assumptions.
- Do not treat similarly named social profiles as official without verification.
- Prefer recent content.
- Do not produce generic recommendations.
- Do not ask for contact information before delivering the analysis.
- Ask the user to confirm uncertain profiles or assumptions.
- End with one clear next action.
```

# Recommended implementation task

**IPI-XXX · BRAND-INTEL-001 — Multi-Source Brand Intelligence and Scoring**

Acceptance criteria:

* discovers and verifies official brand profiles;
* analyzes multiple website pages;
* extracts structured brand data;
* separates facts from inference;
* assigns source confidence;
* benchmarks competitors;
* generates explainable scores and grades;
* provides evidence-backed recommendations;
* stores source URLs and timestamps;
* lets the user correct assumptions;
* saves an AI-generated draft only after consent;
* Playwright verifies website analysis → profile review → save workflow.

## Best technical architecture

```text
Website and profile discovery
→ controlled crawler
→ content extraction
→ source verification
→ structured Mastra workflow
→ brand intelligence schema
→ scoring engine
→ pgvector retrieval
→ CopilotKit review interface
→ Supabase brand profile
```

Use pgvector for comparing the current brand with previous approved brand profiles, campaigns and production plans—not as a substitute for verified web evidence.
