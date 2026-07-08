Create a complete set of Claude Design prompts for the iPix/FashionOS CRM module.

This is a DESIGN phase only.

Do NOT generate React code.
Do NOT generate database migrations.
Do NOT implement anything.

First audit the CRM PRD and all existing platform design documents.

Reuse the existing design system.

Never redesign existing layouts if a reusable pattern already exists.

The CRM must use the existing AI-native 3-panel architecture:

- Navigation
- Main Workspace
- IntelligencePanel (read-only AI)
- Persistent CopilotKit chatbot at the bottom of every screen

No voice mode.

--------------------------------------------------
PHASE 1 — DESIGN AUDIT
--------------------------------------------------

Audit the CRM PRD.

Verify:

- missing screens
- missing workflows
- missing user journeys
- missing AI
- missing dashboards
- missing mobile variants
- missing tablet variants
- missing empty states
- missing loading states
- missing error states
- missing accessibility
- duplicate screens
- duplicate workflows
- duplicate components

Generate an audit report.

--------------------------------------------------
PHASE 2 — INFORMATION ARCHITECTURE
--------------------------------------------------

Create the complete CRM sitemap.

Include:

CRM Dashboard

Companies

Company Detail

Contacts

Contact Detail

Pipeline

Deal Detail

Tasks

Activities

Communications

Calendar

Meetings

Documents

Analytics

Notifications

Settings

AI Assistant

Relationship Intelligence

Search

Global Command

For every screen provide:

- purpose
- route
- entry points
- exit points
- dependencies
- reusable components
- AI context

--------------------------------------------------
PHASE 3 — USER JOURNEYS
--------------------------------------------------

Create complete user journeys.

Examples:

Lead
↓

Company
↓

Contact
↓

Meeting
↓

Proposal
↓

Deal
↓

Won
↓

Brand
↓

Campaign
↓

Shoot
↓

Assets

Also include:

Task management

Communications

Notifications

Relationship management

AI workflows

--------------------------------------------------
PHASE 4 — SCREEN DESIGN PROMPTS
--------------------------------------------------

Generate an individual Claude Design prompt for EVERY screen.

Each prompt must include:

Purpose

Goals

Users

Desktop layout

Tablet layout

Mobile layout

3-panel layout

Navigation

Content hierarchy

Cards

Tables

Lists

Forms

Filters

Search

Empty states

Loading

Error states

Accessibility

Animations

AI components

EvidenceBlock

StatusChip

ApprovalCard

Bottom chatbot

IntelligencePanel

Responsive behavior

Acceptance criteria

Verification checklist

--------------------------------------------------
PHASE 5 — AI DESIGN
--------------------------------------------------

Every screen must include:

Persistent IntelligencePanel

Persistent bottom CopilotKit chatbot

Context-aware assistant

Route-aware assistant

Proactive greeting

Action cards

EvidenceBlock

Conversation memory

Human-in-the-loop

No voice mode

Never merge Insights and Chat.

--------------------------------------------------
PHASE 6 — MOBILE
--------------------------------------------------

Generate mobile design prompts.

Every screen must include:

Bottom navigation

Persistent chatbot composer

Insights button

BottomSheet

Keyboard-aware layout

Safe areas

Touch targets

Responsive tables

Collapsed IntelligencePanel

--------------------------------------------------
PHASE 7 — CRM DASHBOARD
--------------------------------------------------

Design an AI-native CRM Dashboard.

Include:

Pipeline

Revenue

Tasks

Meetings

Communications

Recent companies

Recent contacts

Activity

AI Brief

Relationship Health

Next Best Actions

Notifications

Quick Actions

Analytics

--------------------------------------------------
PHASE 8 — SCHEMA REVIEW
--------------------------------------------------

Review the proposed Supabase schema.

Identify:

existing tables

new tables

relationships

indexes

RLS

RPCs

triggers

functions

edge functions

storage

realtime

Identify anything missing for the UI.

Do NOT redesign the schema.

--------------------------------------------------
PHASE 9 — WORKFLOWS
--------------------------------------------------

Generate diagrams for:

CRM lifecycle

AI lifecycle

Company lifecycle

Deal lifecycle

Task lifecycle

Communication lifecycle

Notification lifecycle

Brand conversion

Campaign integration

Shoot integration

--------------------------------------------------
PHASE 10 — DESIGN CHECKLISTS
--------------------------------------------------

Create implementation checklists for Claude Design.

Each checklist must contain:

☐ Screen complete

☐ Desktop complete

☐ Tablet complete

☐ Mobile complete

☐ Empty states

☐ Loading

☐ Errors

☐ Accessibility

☐ AI panel

☐ Chatbot

☐ User journeys

☐ Navigation

☐ Links verified

☐ Components reused

☐ No duplicate UI

☐ Acceptance criteria met

--------------------------------------------------
PHASE 11 — HANDOFF
--------------------------------------------------

Generate:

1. Master Design Plan

2. Screen Registry

3. Component Registry

4. User Journey Map

5. Navigation Map

6. AI Interaction Map

7. Mobile Design Plan

8. Verification Matrix

9. Design Review Checklist

10. Claude Code Handoff Checklist

--------------------------------------------------
FINAL REPORT
--------------------------------------------------

Provide:

- Missing screens
- Missing workflows
- Missing AI features
- Missing mobile support
- Missing CRM capabilities
- Missing schema items required by the UI
- Missing reusable components
- Missing dashboards
- Suggested improvements
- Risks
- Blockers
- Critical fixes
- Overall design readiness score (/100)

Finally, generate one Claude Design prompt per screen, ready to use, and order them by implementation priority.