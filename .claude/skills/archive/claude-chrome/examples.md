# Claude Chrome Examples

Real-world examples for browser automation tasks.

## Example 1: Test Authentication Flow

**Task:** Test Google OAuth login flow on onboarding page

```typescript
// Step 1: Get tab context
mcp__claude-in-chrome__tabs_context_mcp({ createIfEmpty: true })

// Step 2: Create new tab
mcp__claude-in-chrome__tabs_create_mcp()

// Step 3: Navigate to onboarding
mcp__claude-in-chrome__navigate({
  url: "http://localhost:8080/onboarding",
  tabId: TAB_ID
})

// Step 4: Wait for page load
mcp__claude-in-chrome__computer({
  action: "wait",
  duration: 2,
  tabId: TAB_ID
})

// Step 5: Find Google sign-in button
mcp__claude-in-chrome__find({
  query: "Continue with Google button",
  tabId: TAB_ID
})

// Step 6: Take screenshot to verify state
mcp__claude-in-chrome__computer({
  action: "screenshot",
  tabId: TAB_ID
})

// Step 7: Click the button
mcp__claude-in-chrome__computer({
  action: "left_click",
  ref: "ref_X",  // from find result
  tabId: TAB_ID
})
```

## Example 2: Debug Console Errors

**Task:** Find and report JavaScript errors

```typescript
// Navigate to page
mcp__claude-in-chrome__navigate({
  url: "http://localhost:8080/dashboard",
  tabId: TAB_ID
})

// Wait for page to load and scripts to run
mcp__claude-in-chrome__computer({
  action: "wait",
  duration: 3,
  tabId: TAB_ID
})

// Read console errors only
mcp__claude-in-chrome__read_console_messages({
  tabId: TAB_ID,
  onlyErrors: true,
  pattern: "error|Error|ERROR"
})

// Read network failures
mcp__claude-in-chrome__read_network_requests({
  tabId: TAB_ID,
  urlPattern: "/api/"
})
```

## Example 3: Fill Contact Form

**Task:** Automate form filling with test data

```typescript
// Navigate to form
mcp__claude-in-chrome__navigate({
  url: "http://localhost:8080/contact",
  tabId: TAB_ID
})

// Read interactive elements
mcp__claude-in-chrome__read_page({
  tabId: TAB_ID,
  filter: "interactive"
})

// Fill each field
mcp__claude-in-chrome__form_input({
  ref: "ref_name",
  value: "John Doe",
  tabId: TAB_ID
})

mcp__claude-in-chrome__form_input({
  ref: "ref_email",
  value: "john@example.com",
  tabId: TAB_ID
})

mcp__claude-in-chrome__form_input({
  ref: "ref_message",
  value: "This is a test message from Claude",
  tabId: TAB_ID
})

// Click submit
mcp__claude-in-chrome__computer({
  action: "left_click",
  ref: "ref_submit",
  tabId: TAB_ID
})
```

## Example 4: Record Workflow GIF

**Task:** Create demo recording of feature

```typescript
// Start recording
mcp__claude-in-chrome__gif_creator({
  action: "start_recording",
  tabId: TAB_ID
})

// Capture initial state
mcp__claude-in-chrome__computer({
  action: "screenshot",
  tabId: TAB_ID
})

// Perform actions...
mcp__claude-in-chrome__navigate({
  url: "http://localhost:8080/feature",
  tabId: TAB_ID
})

mcp__claude-in-chrome__computer({
  action: "wait",
  duration: 1,
  tabId: TAB_ID
})

mcp__claude-in-chrome__computer({
  action: "screenshot",
  tabId: TAB_ID
})

// Click a button
mcp__claude-in-chrome__computer({
  action: "left_click",
  coordinate: [500, 300],
  tabId: TAB_ID
})

mcp__claude-in-chrome__computer({
  action: "wait",
  duration: 1,
  tabId: TAB_ID
})

mcp__claude-in-chrome__computer({
  action: "screenshot",
  tabId: TAB_ID
})

// Stop and export
mcp__claude-in-chrome__gif_creator({
  action: "stop_recording",
  tabId: TAB_ID
})

mcp__claude-in-chrome__gif_creator({
  action: "export",
  tabId: TAB_ID,
  download: true,
  filename: "feature-demo.gif",
  options: {
    showClickIndicators: true,
    showActionLabels: true,
    showProgressBar: true
  }
})
```

## Example 5: Extract Data from Table

**Task:** Scrape product data from page

```typescript
// Navigate to products page
mcp__claude-in-chrome__navigate({
  url: "https://example.com/products",
  tabId: TAB_ID
})

// Wait for data to load
mcp__claude-in-chrome__computer({
  action: "wait",
  duration: 2,
  tabId: TAB_ID
})

// Extract with JavaScript
mcp__claude-in-chrome__javascript_tool({
  action: "javascript_exec",
  tabId: TAB_ID,
  text: `
    Array.from(document.querySelectorAll('.product-card')).map(card => ({
      name: card.querySelector('.product-name')?.textContent?.trim(),
      price: card.querySelector('.product-price')?.textContent?.trim(),
      inStock: card.querySelector('.in-stock') !== null
    }))
  `
})
```

## Example 6: Multi-Tab Workflow

**Task:** Compare data between two sites

```typescript
// Get context
const context = await mcp__claude-in-chrome__tabs_context_mcp({ createIfEmpty: true })

// Create first tab
const tab1 = await mcp__claude-in-chrome__tabs_create_mcp()

// Navigate tab 1 to first site
mcp__claude-in-chrome__navigate({
  url: "https://site1.com/data",
  tabId: tab1.tabId
})

// Extract data from site 1
const data1 = await mcp__claude-in-chrome__javascript_tool({
  action: "javascript_exec",
  tabId: tab1.tabId,
  text: "document.querySelector('.data').textContent"
})

// Create second tab
const tab2 = await mcp__claude-in-chrome__tabs_create_mcp()

// Navigate tab 2 to second site
mcp__claude-in-chrome__navigate({
  url: "https://site2.com/compare",
  tabId: tab2.tabId
})

// Use data from site 1 in site 2
mcp__claude-in-chrome__form_input({
  ref: "ref_comparison_field",
  value: data1,
  tabId: tab2.tabId
})
```

## Example 7: Responsive Design Testing

**Task:** Test UI at different screen sizes

```typescript
const sizes = [
  { name: "Mobile", width: 375, height: 667 },
  { name: "Tablet", width: 768, height: 1024 },
  { name: "Desktop", width: 1920, height: 1080 }
]

for (const size of sizes) {
  // Resize window
  mcp__claude-in-chrome__resize_window({
    width: size.width,
    height: size.height,
    tabId: TAB_ID
  })

  // Wait for reflow
  mcp__claude-in-chrome__computer({
    action: "wait",
    duration: 1,
    tabId: TAB_ID
  })

  // Screenshot at this size
  mcp__claude-in-chrome__computer({
    action: "screenshot",
    tabId: TAB_ID
  })

  // Report observations for this breakpoint
}
```

## Tips for Success

1. **Always get fresh tab IDs** - Call `tabs_context_mcp` at start
2. **Wait after navigation** - Pages need time to load
3. **Use ref IDs from read_page** - More reliable than coordinates
4. **Filter console output** - Prevents overwhelming results
5. **Take screenshots before clicks** - For debugging and GIFs
6. **Handle auth manually** - Claude pauses for login screens
