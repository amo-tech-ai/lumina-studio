---
name: accessibility
description: Use when building UI components, creating pages, or before launch for WCAG 2.1 AA compliance. Triggers on "accessibility", "a11y", "screen reader", "keyboard nav", "WCAG", "ARIA", "contrast".
---

# Accessibility

## Overview

WCAG 2.1 AA compliance for React + shadcn/ui — keyboard navigation, screen readers, color contrast, semantic HTML.

## When to Use

- Building any new UI component or page
- Before production launch
- When accessibility audit fails
- When adding forms, modals, or interactive elements

## Workflow

### Phase 1: Semantic HTML

1. Correct heading hierarchy (h1 > h2 > h3, one h1/page)
2. Landmarks: `<nav>`, `<main>`, `<aside>`, `<section>`
3. `<button>` for actions, `<a>` for navigation (never `<div onClick>`)
4. `<label>` for all form inputs

### Phase 2: Keyboard

1. All interactive elements focusable via Tab
2. Visible focus indicators (shadcn `focus-visible` ring)
3. Escape closes modals/dropdowns
4. Arrow keys in menus/tabs
5. Test: navigate entire page with keyboard only

### Phase 3: Screen Readers

1. `aria-label` on icon-only buttons:
   ```tsx
   <Button variant="ghost" size="icon" aria-label="Close dialog">
     <X className="h-4 w-4" />
   </Button>
   ```
2. `aria-live="polite"` on dynamic regions (toasts, loading)
3. `role="alert"` on error messages
4. `aria-hidden="true"` on decorative elements

### Phase 4: Color & Contrast

1. Text contrast: 4.5:1 minimum (AA)
2. Large text (18px+): 3:1 minimum
3. Never color alone to convey meaning (add icons/text)
4. Test: DevTools > Rendering > Emulate vision deficiencies

### Phase 5: Forms

1. Visible labels on every input
2. `aria-required="true"` on required fields
3. Errors linked with `aria-describedby` + `aria-invalid="true"`

### Phase 6: Audit

1. Lighthouse Accessibility > 90
2. axe DevTools extension
3. Keyboard-only walkthrough
4. 200% zoom — layout intact

## Checklist

- [ ] Semantic landmarks and heading hierarchy
- [ ] All elements keyboard-accessible
- [ ] Visible focus indicators
- [ ] `aria-label` on icon buttons
- [ ] `aria-live` on dynamic content
- [ ] 4.5:1 contrast ratios
- [ ] Color not sole indicator
- [ ] Form labels and error linking
- [ ] Lighthouse Accessibility > 90
- [ ] Tested keyboard-only + 200% zoom
