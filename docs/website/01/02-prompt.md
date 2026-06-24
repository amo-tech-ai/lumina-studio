FashionOS: Marketing Pages & Dashboard Structure - Natural Language Guide

## Context

You are building the **FashionOS** marketing pages and dashboard structure. This guide assumes you've completed the initial project setup (Vite scaffolded, React, TypeScript, Tailwind CSS v3, React Router v7 configured). Now you need to create the page structure, layouts, and placeholders following Vite + React best practices.

**Tech Stack:**
- React 19.2.3 + TypeScript 5.x
- Vite 7.3.0
- Tailwind CSS v3.4.17
- React Router v7.10.1 (RouterProvider pattern with createBrowserRouter)
- Server-side Gemini 3 integration

**Architecture Principles:**
- Marketing pages are public-facing and don't require authentication
- Dashboard pages are protected and require authentication (implement auth later)
- Use separate layouts for marketing vs dashboard experiences
- Create clean, production-ready placeholders that can be enhanced with real content
- Follow FashionOS design system: serif fonts for headings, sans-serif for UI, black/white/gray palette

---

## Step 1: Create Layout Components

**Purpose:** Layouts provide consistent structure (headers, footers, navigation, sidebars) across related pages. Marketing and dashboard need completely different layouts.

**What to do:**

First, create the marketing layout. This should include a header with navigation links to Features, Pricing, Login, and Signup. The header should have the FashionOS logo on the left and navigation items on the right. Include a footer with multiple columns showing Product links, Company links, Legal links, and copyright information. The layout should use the Outlet component from React Router to render child pages. Use Tailwind classes for styling, following the FashionOS design system with serif fonts for the logo and sans-serif for navigation text.

Next, create the dashboard layout. This needs a fixed sidebar on the left with navigation links to Dashboard, Events, Brands, Venues, and Settings. The sidebar should have the FashionOS logo at the top, navigation items in the middle, and a logout button at the bottom. The main content area should have a top bar with user information and notifications (placeholder for now). The layout should use Outlet to render dashboard pages. The sidebar should be fixed width (around 256px) and the main content should have left padding to account for the sidebar.

**File locations:**
- Marketing layout: `src/layouts/MarketingLayout.tsx`
- Dashboard layout: `src/layouts/DashboardLayout.tsx`

**Action:** Create both layout components with proper structure, navigation, and Outlet placement.

---

## Step 2: Create Marketing Pages

**Purpose:** Marketing pages drive user acquisition and provide information about FashionOS. These are public-facing and should be visually appealing and professional.

**What to do:**

Start with the home page. Create a hero section with a large headline using serif font, a compelling tagline, and call-to-action buttons for "Get Started" and "Learn More". Below the hero, add a features preview section with three columns showing Event Management, Brand Discovery, and Venue Matching. Each feature should have a heading and brief description. End with a call-to-action section that encourages signup.

Create a features page that lists all FashionOS features in a grid layout. Include features like Event Planning, Brand Management, Venue Discovery, AI-Powered Insights, Real-Time Collaboration, and Analytics & Reporting. Each feature card should have a title and description, with hover effects for interactivity.

Create a pricing page with three pricing tiers: Starter, Professional, and Enterprise. Each tier should show the price, list of features, and a call-to-action button. Mark the Professional tier as "Popular" with visual distinction. Use a clean card-based layout.

Create an about page with a heading and placeholder content about FashionOS. This should be ready for real content later.

Create a contact page with a form including fields for name, email, and message. Include proper labels, input styling, and a submit button. The form should follow FashionOS design patterns.

Create privacy and terms pages as placeholders. These should have headings and note that full content will be added later.

**File locations:**
- Home: `src/pages/HomePage.tsx`
- Features: `src/pages/FeaturesPage.tsx`
- Pricing: `src/pages/PricingPage.tsx`
- About: `src/pages/AboutPage.tsx`
- Contact: `src/pages/ContactPage.tsx`
- Privacy: `src/pages/PrivacyPage.tsx`
- Terms: `src/pages/TermsPage.tsx`

**Action:** Create all marketing pages with clean structure, proper styling, and placeholder content ready for enhancement.

---

## Step 3: Create Authentication Pages

**Purpose:** Login and signup pages are entry points to the dashboard. Keep them focused and user-friendly.

**What to do:**

Create a login page with a centered form layout. Include a heading "Welcome Back" and subtitle. The form should have email and password fields with proper labels, a "Remember me" checkbox, and a "Forgot password" link. Include a submit button styled with FashionOS black button style. Add a link at the bottom to navigate to signup. The form should use React state to manage input values and handle form submission (placeholder logic for now).

Create a signup page similar to login but with additional fields for full name and password confirmation. Include proper form validation structure (you'll implement actual validation later). Style it consistently with the login page. Add a link to navigate back to login.

Both pages should be full-screen centered layouts with white form cards on gray backgrounds, following FashionOS design patterns.

**File locations:**
- Login: `src/pages/LoginPage.tsx`
- Signup: `src/pages/SignupPage.tsx`

**Action:** Create authentication pages with proper form structure, state management, and navigation links.

---

## Step 4: Create Dashboard Pages

**Purpose:** Dashboard pages are the core of the application where users manage events, brands, and venues. Create clean placeholders that follow the dashboard layout structure.

**What to do:**

Create a dashboard home page that displays key statistics in a grid. Include stat cards showing Total Events, Active Brands, Venues, and Revenue with values and change indicators. Below the stats, add a "Recent Activity" section as a placeholder. Use clean card-based layouts with proper spacing.

Create an events page with a header containing the page title and a "Create Event" button. Display events in a table format with columns for Event Name, Date, Venue, Status, and Actions. Include sample event data as placeholders. Make event names clickable links. Style the table with proper borders and hover effects following FashionOS design patterns.

Create a brands page with a similar header and "Add Brand" button. Display brands in a card grid layout showing brand name, category, and status. Make each card clickable. Use a responsive grid that adapts to screen size.

Create a venues page following the same pattern as brands. Display venues in cards showing venue name, location, capacity, and type (indoor/outdoor). Include an "Add Venue" button in the header.

Create a settings page with sections for Profile and Preferences. Include form fields for name and email in the Profile section with a save button. Add a Preferences section as a placeholder for future settings. Use card-based layouts with proper form styling.

**File locations:**
- Dashboard home: `src/pages/dashboard/DashboardHomePage.tsx`
- Events: `src/pages/dashboard/EventsPage.tsx`
- Brands: `src/pages/dashboard/BrandsPage.tsx`
- Venues: `src/pages/dashboard/VenuesPage.tsx`
- Settings: `src/pages/dashboard/SettingsPage.tsx`

**Action:** Create all dashboard pages with proper structure, placeholder data, and consistent styling that works with the dashboard layout.

---

## Step 5: Update Router Configuration

**Purpose:** Connect all pages to routes with proper layouts. Marketing pages should use MarketingLayout, dashboard pages should use DashboardLayout.

**What to do:**

Update your router configuration file to include all the pages you've created. Use nested routes so that marketing pages are children of the MarketingLayout route, and dashboard pages are children of the DashboardLayout route.

Set up the root route with MarketingLayout as the element and include errorElement for handling 404s and errors. Add child routes for all marketing pages: home (index route), features, pricing, about, contact, privacy, terms, login, and signup.

Create a separate route group for dashboard pages with DashboardLayout as the element. Add child routes for dashboard home (index), events, brands, venues, and settings.

Use the createBrowserRouter function from React Router v7 and export the router configuration. Import all page components and layout components using the @ alias for clean imports.

**File location:**
- Router: `src/routes/router.tsx`

**Action:** Update the router configuration to include all routes with proper nesting, layouts, and error handling.

---

## Step 6: Create Type Definitions

**Purpose:** TypeScript types ensure type safety and provide better developer experience with autocomplete and error checking.

**What to do:**

Create a types file that defines interfaces for the main data structures used in FashionOS. Include a User interface with id, email, name, and createdAt fields. Create an Event interface with id, name, description, date, venueId, brandId, status (using a union type for status values), and timestamps. Create a Brand interface with id, name, description, category, status, and timestamps. Create a Venue interface with id, name, address, city, country, capacity, type (using union type), and timestamps.

Use proper TypeScript types: strings for text fields, numbers for capacity, union types for status and type fields. Export all interfaces so they can be imported throughout the application.

**File location:**
- Types: `src/types/index.ts`

**Action:** Create type definitions for User, Event, Brand, and Venue with proper TypeScript types and exports.

---

## Step 7: Verify Everything Works

**Purpose:** Ensure all pages render correctly, routes work, and there are no errors.

**What to do:**

Start the development server and navigate through all pages. Verify that marketing pages display with the marketing layout (header and footer visible). Check that dashboard pages display with the dashboard layout (sidebar and top bar visible). Test all navigation links to ensure they route correctly.

Verify that the home page shows the hero section and features. Check that the features page displays all feature cards. Confirm the pricing page shows all three tiers correctly. Test that login and signup pages render properly with forms.

Navigate to dashboard pages and verify they display within the dashboard layout. Check that the sidebar navigation works. Verify that all dashboard pages show their placeholder content correctly.

Run TypeScript type checking to ensure there are no type errors. Check the browser console for any JavaScript errors. Verify that Tailwind classes are applying correctly and the design matches FashionOS style guidelines.

Test responsive design by resizing the browser window. Marketing pages should adapt to mobile, tablet, and desktop sizes. Dashboard sidebar should collapse or adapt appropriately on smaller screens.

**Action:** Run through all pages, test navigation, verify layouts, check for errors, and ensure responsive design works.

---

## Step 8: Directory Structure Verification

**Purpose:** Ensure the project follows Vite + React best practices with proper organization.

**What to verify:**

Check that all application code is within the `src/` directory. Verify that layouts are in `src/layouts/`, pages are in `src/pages/` (with dashboard pages in `src/pages/dashboard/`), routes are in `src/routes/`, and types are in `src/types/`.

Confirm that configuration files (vite.config.ts, tailwind.config.cjs, postcss.config.cjs, tsconfig.json) are at the project root, not inside `src/`. Verify that `index.html` is at the project root.

Check that all imports use the `@` alias for clean imports (e.g., `@/components/Button` instead of relative paths). Verify that no application code exists outside the `src/` directory.

**Action:** Review the directory structure and ensure it matches Vite + React best practices.

---

## Summary

You've now created a complete page structure for FashionOS with:

- Marketing layout with header, footer, and navigation
- Dashboard layout with sidebar, top bar, and navigation
- Complete marketing page structure (Home, Features, Pricing, About, Contact, Privacy, Terms)
- Authentication pages (Login, Signup) with form structure
- Dashboard pages (Home, Events, Brands, Venues, Settings) with placeholder content
- Router configuration with nested routes and proper layouts
- TypeScript type definitions for core data structures
- Clean, production-ready placeholders ready for content and functionality

**Next steps:** Add authentication logic, connect to Supabase for data, implement form submissions, and populate pages with real data from your backend.

---

**Remember:** These are structural placeholders. Replace TODO comments, add real authentication logic, connect to your Supabase backend, and enhance pages with actual functionality as you build out features. Follow FashionOS design system consistently across all pages.

