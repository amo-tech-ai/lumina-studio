# Soona Platform Review & Product Requirements Document

## Executive Summary

Soona is not just a photo studio booking platform.

It is an **end-to-end ecommerce content production operating system** for brands selling on:

* Amazon
* Shopify
* TikTok Shop
* Instagram
* Meta
* DTC websites

The platform combines:

1. Content Production
2. Talent Marketplace
3. UGC Marketplace
4. Product Catalog Management
5. Digital Asset Management
6. AI Content Creation
7. Ecommerce Analytics
8. Competitive Intelligence

---

# Overall Product Architecture

```text
Dashboard
│
├── Content Production
│   ├── Photo Shoots
│   ├── Video Shoots
│   ├── UGC Campaigns
│   └── AI Studio
│
├── Commerce Operations
│   ├── Product Catalog
│   ├── Gallery
│   ├── Assets
│   └── Content Library
│
├── Marketplace
│   ├── Talent Directory
│   ├── Models
│   ├── Creators
│   └── Stylists
│
├── Intelligence
│   ├── Listing Insights
│   ├── Competitive Analysis
│   └── Content Scoring
│
└── Billing
    ├── Membership
    ├── Packages
    └── Checkout
```

---

# Screen Review

---

## Screen 1 — Dashboard

### Purpose

Home command center.

### Features

* Build a Shoot
* Create UGC Brief
* Trending Packs
* Professional Services
* AI Studio
* Industry Inspiration

### User Story

As a brand owner,
I want a single dashboard,
so I can start content creation quickly.

### iPix Version

* AI Shoot Planner
* Brand Intelligence Dashboard
* Campaign Center

---

# Screen 2 — Studio Bookings

### Purpose

Manage shoots.

### Features

* Upcoming shoots
* Past shoots
* Drafts
* Suggestions

### User Story

As a marketing manager,
I want to manage all shoots,
so I know what is scheduled.

### Missing Opportunity

* Shoot ROI
* Revenue Attribution
* Campaign Performance

---

# Screen 3 — Gallery

### Purpose

Digital Asset Management

### Features

* Image library
* Video library
* Upload media
* Download assets

### User Story

As a content manager,
I need all assets in one place.

### iPix Opportunity

Add:

* AI Asset Search
* AI Tagging
* AI Brand Consistency Score

---

# Screen 4 — Products

### Purpose

Product Catalog

### Features

* Shopify Import
* Amazon Import
* Product Management
* Inventory View

### User Story

As a brand owner,
I want products synced,
so shoots stay connected to SKUs.

### Missing Features

* Product Performance
* Product Lifecycle
* Demand Forecasting

---

# Screen 5 — Talent Directory

### Purpose

Creator Marketplace

### Features

* Full body models
* Hand models
* Foot models
* Pet models
* UGC creators

### User Story

As a brand,
I want to find talent quickly.

### Advanced Opportunity

AI Matchmaking

Example:

"Find Latina fitness creators in Miami"

AI suggests best creators.

---

# Screen 6 — UGC Campaigns

### Purpose

Creator Management

### Features

* Campaigns
* Creators
* Shipments
* Messaging
* Content

### User Story

As a brand,
I want creators producing content.

### Missing Features

* Influencer ROI
* Affiliate Tracking
* Creator Performance Scoring

---

# Screen 7 — Discovery

### Purpose

Education + Inspiration

### Features

* Industry articles
* Guides
* Examples
* Templates

### User Story

As a beginner,
I need ideas for content.

---

# Screen 8 — AI Studio

### Purpose

AI-generated product photography

### Features

* Scene generation
* Product placement
* Background replacement

### User Story

As a brand,
I want content without booking a shoot.

---

# Screen 9 — Listing Insights

### Purpose

Content Scoring

### Features

* Amazon score
* Shopify score
* Listing grade

### User Story

As a seller,
I want to know why listings are underperforming.

### Score Factors

Likely:

* Image count
* Image quality
* Infographics
* Lifestyle images
* Videos

---

# Screen 10 — Competitive Analysis

### Purpose

Competitor Intelligence

### Features

* Competitor lookup
* Amazon URL analysis
* Visual benchmarking

### User Story

As a seller,
I want to outperform competitors.

---

# Core Booking Flow

---

## Step 1 — Select Service

Choices:

### Photos

* Product photography

### Videos

* Product videos

### UGC

* Creator content

---

## Step 2 — Quantity Selection

Examples:

| Photos | Duration |
| ------ | -------- |
| 1–5    | 1 hour   |
| 6–10   | 2 hours  |
| 11–15  | 3 hours  |
| 16–25  | 4 hours  |

---

## Step 3 — Scene Selection

### Flat Backdrops

* White
* Color
* Textured

### Lifestyle

* Kitchen
* Bathroom
* Bedroom
* Living Room

---

## Step 4 — Model Selection

### Options

* Hand model
* Full body model
* Foot model
* Pet model

---

## Step 5 — Upgrades

### Services

* Styling
* Hair & Makeup
* BTS Video
* Grocery Shopping
* Mannequin Styling
* Steaming

---

## Step 6 — Membership

### Standard Plan

Benefits:

* Lower pricing
* Free edits
* Discounts

---

## Step 7 — Payment

### Checkout

* Stripe
* Credit Card
* Google Pay
* Bank Transfer

---

# Complete User Journey

## Ecommerce Brand Journey

```text
Signup
 ↓
Connect Shopify
 ↓
Import Products
 ↓
Create Shoot
 ↓
Select Product
 ↓
Choose Scene
 ↓
Choose Talent
 ↓
Add Upgrades
 ↓
Pay
 ↓
Ship Product
 ↓
Shoot Happens
 ↓
Assets Delivered
 ↓
Gallery
 ↓
Listing Insights
 ↓
Competitive Analysis
 ↓
Create Next Campaign
```

---

# Additional Features iPix Should Add

## AI Layer

### AI Brand Brain

Upload:

* Website
* Amazon Listing
* Shopify Store

AI learns:

* Brand voice
* Colors
* Audience
* Product positioning

---

## AI Shoot Planner

User:

"Create a launch campaign for my swimsuit collection."

AI generates:

* Shot list
* Models
* Locations
* Deliverables
* Budget

---

## AI Creative Director

Generates:

* Moodboards
* Styling suggestions
* Props
* Scenes

---

## AI Performance Engine

Learns:

* Best performing images
* Best performing videos
* Best performing models

Suggests future shoots.

---

## AI Competitor Scanner

Daily scans:

* Amazon
* Shopify
* TikTok Shop

Tracks:

* Competitor creatives
* New listings
* Price changes

---

## AI Content ROI

Shows:

```text
Photo #12
Revenue Generated:
$42,000

Video #4
CTR:
+38%

UGC #2
Conversion:
+21%
```

---

# Recommended iPix Architecture

## Phase 1 (MVP)

* Studio Booking
* Product Catalog
* Gallery
* Talent Marketplace
* Payments
* Shoot Builder

## Phase 2

* UGC Marketplace
* Creator Campaigns
* AI Studio
* Ecommerce Integrations

## Phase 3

* Listing Insights
* Competitor Intelligence
* AI Content Scoring

## Phase 4

* AI Brand Brain
* AI Creative Director
* AI Production Planner
* AI Revenue Attribution

# Final Assessment

| Area                     | Score  |
| ------------------------ | ------ |
| Booking Experience       | 95/100 |
| Ecommerce Focus          | 98/100 |
| UGC Marketplace          | 92/100 |
| Talent Marketplace       | 90/100 |
| AI Features              | 85/100 |
| Analytics                | 88/100 |
| Competitive Intelligence | 92/100 |
| User Experience          | 96/100 |
| Innovation               | 90/100 |

## Overall Score

**Soona: 93/100**

### Biggest Strength

Combines:

* Studio booking
* UGC
* Talent
* Asset management
* Ecommerce intelligence

into one workflow.

### Biggest Gap

It still focuses on **content production**.

The larger opportunity for iPix is becoming the **AI operating system before production begins**:

* Brand intelligence
* Creative strategy
* Production planning
* Talent matching
* Performance learning
* Revenue attribution
* Autonomous campaign generation

This positions iPix as the layer above Soona rather than competing only as another studio booking platform.
Add this section to the Soona research/competitive analysis document.

---

# Soona Booking & Creative Brief Workflow Analysis

## Overview

Soona uses a guided workflow that takes a customer from:

```text
1. Select Content Type
2. Select Package
3. Build Creative Brief
4. Add Products
5. Creator Preferences
6. Schedule Shoot
7. Checkout / Confirmation
```

This is one of Soona's biggest strengths.

Instead of asking users to complete a giant form, they progressively collect information.

---

# Phase 1 — Content Planning

## Step 1: Content Usage

Customer selects:

### Channels

* TikTok
* Instagram
* Facebook
* Amazon
* Other

### Content Types

* UGC Videos
* UGC Photos

### Duration

* Up to 15 seconds
* Up to 30 seconds
* Up to 60 seconds

### Why This Works

Most brands know:

> "I need TikTok videos"

but do NOT know:

> camera angle
> creator style
> editing style

Soona starts with business goals first.

---

## iPix Improvement

Instead of manual selection:

### AI Recommendation Engine

User enters:

```text
Brand URL
Product URL
Goal
```

AI recommends:

* Instagram Reels
* TikTok UGC
* Amazon A+
* PDP Images
* Meta Ads

based on brand analysis.

---

# Phase 2 — Package Marketplace

## Discounted Packs

Examples:

### Amazon A+ Premium Pack

Price:

```text
$999
```

Includes:

* 6 photos
* 1 video
* 4 infographics
* 1 creator/model

### Benefits

Bundles simplify buying decisions.

Instead of:

```text
Photo = $39
Video = $93
```

Customer buys outcome.

---

## Marketplace Pattern

### Categories

| Category            | Example           |
| ------------------- | ----------------- |
| Product Photography | Ecommerce photos  |
| UGC                 | Creator content   |
| Amazon              | Amazon A+         |
| Social Ads          | TikTok & Meta     |
| Website             | Hero images       |
| Lookbook            | Fashion campaigns |

---

## iPix Opportunity

Create:

### AI Package Builder

User goal:

```text
Launch swimwear collection
```

AI generates:

```text
Recommended Pack

8 Product Photos
3 Reels
2 UGC Videos
1 Hero Banner

Estimated Budget:
$1,250
```

---

# Phase 3 — Product Intake

## Step 2 of 4

Question:

```text
What products will this content feature?
```

Customer adds:

* Product Name
* Product Value
* Product URL
* Description
* Industry
* Product Images

---

## Current Soona Process

Manual entry.

Customer fills everything.

---

## iPix Improvement

### AI Product Import

User pastes:

```text
Shopify URL
Amazon URL
Website URL
```

System automatically extracts:

* Name
* Description
* Price
* Images
* Variants
* Materials
* Category

and creates product records automatically.

---

# Product Schema

```sql
products
├── id
├── brand_id
├── name
├── description
├── category
├── price
├── product_url
├── image_url
├── industry
├── created_at
```

---

# Phase 4 — Creator Preferences

## Creator Brief Wizard

Soona uses:

```text
Step 1: Content Usage
Step 2: Products
Step 3: Creative Direction
Step 4: Creator Preferences
```

Purpose:

Match creators to the brand.

---

## Inputs

Potential fields:

* Age range
* Gender
* Style
* Location
* Language
* Diversity preferences
* Experience level

---

## iPix Enhancement

AI Creator Matching.

Match score based on:

* Brand DNA
* Audience
* Product category
* Campaign goal
* Historical performance

---

# Phase 5 — Scheduling

## Scheduling Flow

User books:

* Date
* Time
* Timezone

Example:

```text
20 minute onboarding call
```

Customer enters:

* First name
* Last name
* Email

Then confirms booking.

---

## What Soona Does Well

### Strengths

| Feature                | Value                      |
| ---------------------- | -------------------------- |
| Wizard Flow            | Reduces overwhelm          |
| Progressive Disclosure | One step at a time         |
| Product Intake         | Structured data collection |
| Package Marketplace    | Easier buying              |
| UGC Workflow           | Modern content creation    |
| Scheduling             | Built-in onboarding        |
| Creator Matching       | Better content quality     |

---

# iPix Competitive Opportunity

## Soona = Production Platform

Focus:

```text
Book Shoot
Create Content
Deliver Assets
```

---

## iPix = Intelligence Layer

Focus:

```text
Analyze Brand
Generate Strategy
Create Brief
Recommend Content
Match Creators
Track Performance
Learn From Results
```

As identified in the PRD, iPix should partner with studios like Soona rather than compete directly with production execution. iPix owns planning, intelligence, and creative strategy while studios execute the shoot. 

---

# Features Worth Copying

Score /100

| Feature             | Score |
| ------------------- | ----- |
| Guided Wizard       | 95    |
| Package Marketplace | 92    |
| Product Intake      | 90    |
| Creator Workflow    | 94    |
| Scheduling System   | 88    |
| Progressive Forms   | 95    |
| UGC Builder         | 93    |
| Customer Onboarding | 90    |

## Highest Priority for iPix

1. AI-Powered Brief Wizard
2. Product Import Engine
3. Content Package Marketplace
4. Creator Matching System
5. Shoot Scheduling
6. Brand Intelligence Layer
7. Performance Feedback Loop
8. Amazon + Shopify Content Planning

These screenshots validate that the Soona workflow is much closer to a "content production operating system" than a simple booking form, making it an excellent reference model for the iPix Shoot Planning and Creative Services Marketplace modules.
