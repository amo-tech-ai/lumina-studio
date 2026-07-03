---
name: claude-chrome
description: Browser automation with Claude in Chrome. Use this skill for web app testing, debugging with console logs, form automation, data extraction, multi-site workflows, and recording browser interactions as GIFs. Requires Chrome extension.
---

# Claude Chrome Browser Automation

Automate browser tasks, test web applications, debug with console logs, and interact with authenticated web apps directly from Claude Code.

## Prerequisites

Before using browser automation:
- Google Chrome browser running
- Claude in Chrome extension (v1.0.36+) installed
- Claude Code started with `--chrome` flag or `/chrome` enabled
- Run `/chrome` to verify connection status

## Core Capabilities

### 1. Tab Management
```
# Get current tabs
Use tabs_context_mcp first to see available tabs

# Create new tab for task
Use tabs_create_mcp to create fresh tab

# Navigate to URL
Use navigate tool with tabId
```

### 2. Page Interaction
```
# Read page content
- read_page: Get accessibility tree of elements
- find: Search for elements by natural language
- get_page_text: Extract raw text content

# Interact with elements
- computer (click, type, scroll): Mouse/keyboard actions
- form_input: Set form field values
- javascript_tool: Execute custom JS
```

### 3. Debugging
```
# Read console messages
read_console_messages with pattern filter

# Monitor network requests
read_network_requests with urlPattern filter
```

### 4. GIF Recording
```
# Start recording
gif_creator action="start_recording"

# Take screenshot (captures frame)
computer action="screenshot"

# Stop and export
gif_creator action="stop_recording"
gif_creator action="export" download=true
```

## Workflow Patterns

### Pattern 1: Test Local Web App
```
1. tabs_context_mcp → get tab context
2. navigate → go to localhost:PORT
3. read_page filter="interactive" → find form elements
4. form_input → fill form fields
5. computer action="left_click" → submit
6. read_console_messages → check for errors
7. read_page → verify success state
```

### Pattern 2: Debug with Console Logs
```
1. navigate → go to page
2. read_console_messages pattern="error|warn"
3. Analyze errors
4. Fix code in terminal
5. navigate → refresh page
6. Verify fix
```

### Pattern 3: Extract Data from Page
```
1. navigate → go to page
2. read_page → get DOM structure
3. javascript_tool → extract structured data
4. Save to local file
```

### Pattern 4: Multi-Site Workflow
```
1. tabs_create_mcp → create tab for site 1
2. navigate → go to site 1
3. Extract/read data
4. tabs_create_mcp → create tab for site 2
5. navigate → go to site 2
6. Use data from site 1
```

### Pattern 5: Record Demo GIF
```
1. gif_creator action="start_recording"
2. computer action="screenshot" (initial frame)
3. Perform actions (click, type, navigate)
4. computer action="screenshot" (between actions)
5. computer action="screenshot" (final frame)
6. gif_creator action="stop_recording"
7. gif_creator action="export" download=true filename="demo.gif"
```

## Tool Reference

| Tool | Purpose |
|------|---------|
| `tabs_context_mcp` | Get available tabs (call first!) |
| `tabs_create_mcp` | Create new empty tab |
| `navigate` | Go to URL or back/forward |
| `read_page` | Get accessibility tree |
| `find` | Find elements by description |
| `get_page_text` | Extract text content |
| `form_input` | Set form field values |
| `computer` | Click, type, scroll, screenshot |
| `javascript_tool` | Execute JS in page |
| `read_console_messages` | Read console output |
| `read_network_requests` | Monitor network |
| `resize_window` | Change window size |
| `gif_creator` | Record/export GIFs |
| `upload_image` | Upload images to forms |
| `shortcuts_list` | List saved workflows |
| `shortcuts_execute` | Run saved workflow |

## Important Rules

1. **Always call `tabs_context_mcp` first** - Required to get valid tab IDs
2. **Create new tabs for tasks** - Don't reuse tabs from previous sessions
3. **Wait after navigation** - Use `computer action="wait"` for page load
4. **Filter console output** - Always use `pattern` parameter
5. **Avoid modal dialogs** - Alerts/confirms block automation
6. **Take screenshots for frames** - GIF needs screenshot captures

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Tab not found | Call `tabs_context_mcp` to get fresh IDs |
| Actions not working | Check for modal dialogs, try new tab |
| Console empty | Refresh page after enabling tool |
| Extension not detected | Restart Chrome, run `/chrome` |

## Example: Test Form Validation

```
User: Test the signup form on localhost:8080

Claude:
1. Get tab context
2. Create new tab
3. Navigate to localhost:8080/signup
4. Wait 2 seconds
5. Find "email" input
6. Enter invalid email "notanemail"
7. Click submit button
8. Read page for error message
9. Report findings
```

## Security Notes

- Claude sees what you see - respects your login state
- Pauses for CAPTCHAs and login pages
- Cannot access other extensions' pages
- Site permissions managed in Chrome extension settings
