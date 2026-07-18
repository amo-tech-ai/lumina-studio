The chat is working, but the agent can be much better at turning an anonymous visitor into a useful brand profile and qualified lead.

## What is working

The agent successfully:

* analyzed the brand;
* suggested three campaign ideas;
* selected a concept;
* turned it into a one-day schedule;
* continued the conversation naturally.

## Main problems

### 1. It asked for contact details twice

The final lead-capture message was duplicated:

> “Could I get your name and the best email address…”

That feels buggy and lowers trust.

### 2. It asks for email too early

The user asked for strategy, not sales contact. The agent should first provide value, then offer a clear next step.

A better flow is:

```text
brand analysis
→ campaign ideas
→ production plan
→ ask whether to save the work
→ sign up
→ create brand profile
→ capture contact details
```

### 3. The brand analysis is too generic

The analysis sounds plausible, but it does not show enough evidence from Maaji’s actual brand.

It should identify:

* product categories;
* visual style;
* color and print language;
* customer positioning;
* social content patterns;
* likely target audience;
* commercial opportunities;
* missing content gaps.

### 4. The shoot plan needs stronger production detail

The schedule is useful, but a real production planner should also include:

* crew roles;
* number of models;
* shot list;
* wardrobe changes;
* locations;
* deliverables;
* weather contingency;
* equipment;
* approvals;
* estimated output.

### 5. It should distinguish guest mode from account mode

The agent should not imply that work has been saved unless the user is signed in.

Use clear language:

```text
You are currently exploring as a guest.
Create a free profile to save this analysis and continue building the campaign.
```

# Recommended conversation flow

## Step 1 — Analyze the brand

The agent should return a structured summary:

```text
Brand identity
Audience
Visual language
Product focus
Content strengths
Content gaps
Campaign opportunities
```

## Step 2 — Suggest campaigns

Each concept should include:

* objective;
* visual direction;
* channels;
* deliverables;
* effort level;
* expected business value.

Example:

| Concept            | Goal                 | Best channels                    | Output             |
| ------------------ | -------------------- | -------------------------------- | ------------------ |
| Golden Hour Escape | Brand awareness      | Instagram, web hero, paid social | 15 photos, 6 reels |
| Studio Versatility | Ecommerce conversion | PDP, email, paid ads             | 40 product assets  |
| Candid Movement    | Engagement           | Reels, TikTok, Stories           | 12 short videos    |

## Step 3 — Build the production plan

The agent should ask only the minimum useful questions:

```text
Which country or city?
What launch date?
How many products?
Photo only, video only, or both?
What budget range?
```

Then generate the schedule.

## Step 4 — Offer to save the work

Instead of immediately asking for email:

```text
I can turn this into a saved Maaji brand profile with:
- brand summary
- audience
- campaign concepts
- production schedule
- recommended deliverables

Create a free profile to save it and continue editing.
```

Buttons:

```text
Create brand profile
Continue as guest
Edit campaign
```

## Step 5 — Sign-up and profile creation

After the user selects **Create brand profile**, ask for:

```text
Name
Work email
Company
Role
Brand website
Primary goal
```

Do not ask all questions in chat one by one. Use a compact signup/profile form.

# Suggested brand-profile structure

Create a profile with these sections:

```text
Brand name
Website
Industry
Target audience
Visual identity
Core products
Brand tone
Primary markets
Campaign objectives
Preferred channels
Current content gaps
Suggested shoots
Saved production plans
```

For Maaji, a first-pass profile could include:

```text
Brand: Maaji
Category: Swimwear and resort lifestyle
Visual direction: Colorful, tropical, expressive, energetic
Likely audience: Fashion-conscious women seeking playful premium swimwear
Core channels: Instagram, ecommerce, paid social, email
Content opportunity: Stronger campaign storytelling around travel, movement, versatility, and coordinated looks
```

This should be marked as:

```text
AI-generated draft — review before saving
```

# Agent behavior improvements

## Better lead capture rule

The agent should ask for contact details only when one of these is true:

* the user asks to save;
* the user wants a quote;
* the user wants to book a shoot;
* the user requests collaboration;
* the user has received substantial value and accepts a clear CTA.

## Better duplicate prevention

Add a state guard:

```text
lead_capture_requested = true
```

Once set, the agent must not repeat the same request.

Also deduplicate final text before sending.

## Better CTA language

Replace:

```text
Could I get your name and email?
```

With:

```text
Would you like to save this as a Maaji brand profile and continue building the campaign?
```

Then show:

```text
Create profile
Continue as guest
Book a planning call
```

## Better agent instructions

Use this prompt block:

```text
You are the iPix Brand and Production Planner.

Your job is to:
1. analyze a brand using available evidence;
2. identify its audience, visual identity, products, channels, and content gaps;
3. suggest practical campaign concepts;
4. turn selected concepts into production-ready plans;
5. invite the user to save the work only after delivering useful value.

Rules:
- Do not invent facts. Label assumptions clearly.
- Do not repeat questions or calls to action.
- Ask no more than one question at a time in chat.
- Prefer buttons or forms for signup and profile details.
- Do not ask for email immediately after the first answer.
- Never claim a profile is saved unless persistence succeeds.
- Clearly distinguish guest mode from signed-in mode.
- When suggesting shoots, include objective, channels, deliverables, crew, timing, risks, and contingency.
- When analyzing a website, explain which observations are evidence and which are inference.
- End with one clear next action.
```

# Recommended next task

**IPI-XXX · BRAND-AGENT-001 — Convert Guest Brand Analysis into Saved Brand Profile**

Acceptance criteria:

* brand analysis creates a structured draft;
* user can continue as guest;
* user can choose **Create brand profile**;
* signup appears only after consent;
* profile saves to Supabase;
* no duplicate lead-capture message;
* saved profile shows analysis, concepts and production schedule;
* clear success and failure states;
* Playwright covers guest → signup → saved profile;
* analytics tracks analysis completed, signup started and profile saved.

## Final assessment

| Area                           |  Score |
| ------------------------------ | -----: |
| Chat runtime                   | 98/100 |
| Conversation quality           | 78/100 |
| Brand analysis depth           | 70/100 |
| Production planning usefulness | 82/100 |
| Lead-capture experience        | 58/100 |
| Signup/profile opportunity     |   High |

The best immediate improvement is to replace the repeated email request with a **Create brand profile** action that saves the analysis only after the user explicitly agrees.
