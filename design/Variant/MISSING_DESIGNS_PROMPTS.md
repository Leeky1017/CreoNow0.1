# CreoNow Missing Designs Prompts

> Status: Ready for Generation
> Created: 2026-02-01
> Total: 25 Design Specs

---

## Design System Constants

All designs must adhere to these foundational specifications:

**Color Palette**

- Base background: #080808
- Panel background: #0f0f0f
- Hover state: #1a1a1a
- Selected state: #222222
- Border: rgba(255, 255, 255, 0.06)
- Primary text: #ffffff
- Secondary text: #888888
- Tertiary text: #444444
- Accent: #ffffff (dark theme) / #1a1a1a (light theme)
- Info blue: #3b82f6
- Error: #ef4444
- Success: #22c55e
- Warning: #f59e0b

**Typography**

- UI font: Inter, system-ui, sans-serif
- Code font: JetBrains Mono, monospace
- Body/serif: Newsreader, Georgia, serif

**Spacing Grid**

- Base unit: 4px
- Common values: 4, 8, 12, 16, 24, 32, 48px

**Border Radius**

- Small: 4px (inputs, small buttons)
- Medium: 8px (cards, dropdowns)
- Large: 12px (modals, dialogs)

**Visual Effects**

- Glass panels: backdrop-filter blur 12px with semi-transparent background
- Gradient glow: subtle white/cool-gray radial gradients in background
- Noise texture overlay at 5% opacity
- Shadows: rgba(0,0,0,0.5) with varying blur radius

---

## Section 1: Functional Panels (7 Designs)

---

### 01. Memory Panel

**Purpose**
Right-side panel for managing user memories. Allows CRUD operations on memory entries, toggling injection settings, and previewing what memories will be injected into AI context.

**Layout**

- Width: 320px, matching the existing right panel dimensions
- Header: 48px height with tabs for Memory and Settings sub-views
- Body: scrollable list of memory entries
- Footer: input area for adding new memories

**Content Structure**

Panel Header:

- Tab bar with two tabs: Memories (active) and Settings
- Icon button for collapse panel on the right
- Pill counter showing total memory count

Memory List:

- Each memory card displays:
  - Category icon on the left (preferences, facts, style, context)
  - Memory text content (truncated to 2 lines)
  - Timestamp in tertiary text
  - Three-dot menu button on hover for edit/delete
- Selected memory has left border accent line (2px white, using --color-accent)
- Hover state with background color shift

Empty State:

- Centered illustration placeholder
- Text: No memories yet
- Subtext: Add your first memory to help AI understand you better
- Primary button: Add Memory

Settings Sub-view:

- Toggle switches for:
  - Enable memory injection (with description text)
  - Auto-learn from conversations
  - Include project-specific memories
- Each toggle row: 48px height, label on left, switch on right

Add Memory Input:

- Textarea with placeholder: What should the AI remember about you?
- Category selector dropdown (small, inline)
- Send button on the right

**Interactions**

- Hover on memory card: show delete and edit icons
- Click memory: expand to show full text
- Drag to reorder memories (optional visual)

---

### 02. Skills Picker

**Purpose**
Popup or panel for selecting and managing AI skills. Displays available skills with enable/disable toggles, skill descriptions, and scope indicators.

**Layout**

- Modal popup: 480px width, centered
- Or inline panel: 320px width in right sidebar

**Content Structure**

Header:

- Title: Skills
- Close button (X icon) on the right
- Search input below title

Skill Categories:

- Section headers: Builtin, Global, Project
- Each section collapsible with chevron

Skill Card:

- 64px height per skill row
- Left: colored dot indicator (active/inactive)
- Skill name in primary text
- Brief description in secondary text below name
- Right side: toggle switch for enable/disable
- Chevron for expand to show full description

Expanded Skill View:

- Full description text
- Author and version info in tertiary text
- Tags as small pills
- Button: View Details or Configure

Empty State (for Project section):

- Text: No project skills configured
- Button: Browse Skills

Footer:

- Secondary button: Manage Skills
- Primary button: Done

**Interactions**

- Toggle switch animates between states
- Search filters list in real-time
- Clicking skill row expands details

---

### 03. Context Viewer

**Purpose**
Debug and transparency panel showing what context is being sent to AI. Displays layered context with token counts, redaction indicators, and source attribution.

**Layout**

- Right panel or modal: 400px width
- Full height with internal scroll

**Content Structure**

Header:

- Title: Context Viewer
- Subtitle: Debug view of AI context
- Total token count badge
- Close button

Context Layers Section:

- Accordion-style expandable sections for each layer:
  - System Rules (token count badge)
  - Project Settings (token count badge)
  - Retrieved Context (token count badge)
  - Immediate Context (token count badge)

Layer Content:

- Monospace text display
- Syntax highlighting for markdown/code
- Redacted content shown as: [REDACTED: api_key] in orange/warning color
- Source file paths in tertiary text

Token Budget Bar:

- Horizontal progress bar showing usage
- Segments colored by layer type
- Labels: Used X / Budget Y tokens

Redaction Summary:

- Count of redacted items
- Expandable list showing what was redacted and why

Footer:

- Checkbox: Show raw prompt
- Button: Copy to Clipboard
- Button: Export as JSON

**Visual Details**

- Each layer has a distinct left border color
- Redacted items pulse subtly to draw attention
- Monospace font for all context content

---

### 04. Version History Panel

**Purpose**
Sidebar panel showing document version history. Lists snapshots with timestamps, actor attribution, and restore/diff actions.

**Layout**

- Right panel: 320px width
- Or modal for focused view: 600px width

**Content Structure**

Header:

- Title: Version History
- Document name in secondary text
- Close button

Timeline List:

- Chronological list of versions, newest first
- Each version entry:
  - Timestamp (relative: 2 hours ago, or absolute for older)
  - Actor badge: User (white), Auto (gray), AI (accent)
  - Preview text: first 50 chars of changes
  - Word count delta: +24 words or -12 words

Version Entry States:

- Default: standard row
- Hover: background highlight, show action buttons
- Selected: left accent border, expanded view

Action Buttons (on hover):

- Restore: revert to this version
- Compare: open diff view with current
- Preview: read-only view of this version

Current Version Indicator:

- Top of list with Current label
- Distinct styling (no restore button)

Empty State:

- Text: No version history
- Subtext: Save your document to create the first version

Footer:

- Auto-save indicator with last save time
- Link: Configure auto-save settings

---

### 05. Diff View

**Purpose**
Split or unified view comparing two document versions. Shows additions, deletions, and unchanged text with clear visual distinction.

**Layout**

- Full editor area or modal: 800px minimum width
- Two modes: Split (side-by-side) and Unified (inline)

**Content Structure**

Header Bar:

- Left version selector dropdown: Version from 2 hours ago
- Right version selector dropdown: Current version
- Toggle: Split | Unified view
- Close button

Split View Layout:

- Left pane: older version (labeled Before)
- Right pane: newer version (labeled After)
- Synchronized scrolling
- Line numbers on both sides

Diff Highlighting:

- Deleted text: red background (#ef4444 at 10% opacity), strikethrough
- Added text: green background (#22c55e at 10% opacity)
- Modified lines: yellow left border indicator
- Unchanged text: normal styling

Unified View Layout:

- Single column with inline diff
- Deleted lines prefixed with minus, red background
- Added lines prefixed with plus, green background
- Context lines in normal styling

Navigation:

- Jump to next change button
- Jump to previous change button
- Change counter: Change 3 of 12

Footer:

- Summary: +42 words, -18 words, 3 paragraphs modified
- Button: Restore Before Version
- Button: Close

---

### 06. Search Panel

**Purpose**
Unified search panel for full-text and semantic search across documents, memories, and knowledge graph entities.

**Layout**

- Left sidebar panel: 320px width
- Or Command Palette style modal: 600px width

**Content Structure**

Search Header:

- Large search input with icon
- Placeholder: Search documents, memories, knowledge...
- Clear button when input has value

Filter Row:

- Pill toggles: All | Documents | Memories | Knowledge
- Active filter has filled background

Search Options (collapsible):

- Toggle: Include semantic search
- Toggle: Search in archived
- Scope selector: Current Project | All Projects

Results List:

- Grouped by type with section headers
- Each result shows:
  - Type icon (document, memory, entity)
  - Title or primary text
  - Match preview with highlighted terms
  - Location path in tertiary text
  - Relevance score indicator (optional)

Result States:

- Hover: background change, show preview button
- Click: navigate to item

No Results State:

- Illustration placeholder
- Text: No results found
- Suggestions: Try different keywords or broaden filters

Recent Searches:

- Shown when input is empty
- List of recent search terms
- Clear all link

Footer:

- Result count: 24 results
- Keyboard hints: arrows to navigate, enter to open

---

### 07. Constraints Panel

**Purpose**
Quality gate configuration panel. Shows active constraints, validation status, and allows toggling constraint checks.

**Layout**

- Right panel or settings sub-panel: 320px width

**Content Structure**

Header:

- Title: Quality Gates
- Status badge: All Passing (green) or 2 Issues (red)
- Refresh button

Constraint Categories:

- Sections: Style, Consistency, Completeness
- Each section with item count

Constraint Row:

- Checkbox for enable/disable
- Constraint name
- Status icon: check (green), warning (yellow), error (red)
- Chevron for expand

Expanded Constraint:

- Description text
- Current status with details
- Last checked timestamp
- Button: Run Check

Issues List (when issues exist):

- Warning/error items with description
- Location link to navigate to issue
- Button: Fix or Ignore

Settings Section:

- Toggle: Run checks on save
- Toggle: Block save on errors
- Dropdown: Check frequency

Footer:

- Button: Run All Checks
- Last full check timestamp

---

## Section 2: State Designs (7 Designs)

---

### 08. Empty State: Project

**Purpose**
Displayed when user has no projects or opens app for first time.

**Layout**

- Centered in main content area
- Maximum width: 400px

**Content Structure**

Illustration:

- Abstract geometric shape or document stack icon
- Subtle gradient or glow effect
- Size: 120px square area

Heading:

- Text: Start Your Creative Journey
- Large, bold, primary text color

Description:

- Text: Create your first project to begin writing with AI assistance
- Secondary text color, centered

Primary Action:

- Button: Create New Project
- Full width or auto width centered
- Primary style (white background, dark text)

Secondary Action:

- Link text: Import existing project
- Tertiary text color

Optional:

- Recent templates carousel below
- Quick start tips in muted text

---

### 09. Empty State: FileTree

**Purpose**
Displayed in sidebar when current project has no documents.

**Layout**

- Contained within sidebar content area
- Centered vertically in available space

**Content Structure**

Icon:

- Document with plus icon
- Size: 48px
- Muted color with subtle opacity

Heading:

- Text: No documents yet
- Small bold text

Description:

- Text: Create your first document to start writing
- Very small, tertiary text

Action Button:

- Button: New Document
- Small size, secondary style
- Icon: plus

Alternative:

- Or drop text below for drag-drop hint
- Text: or drag files here

---

### 10. Empty State: Search

**Purpose**
Displayed when search returns no matching results.

**Layout**

- Centered in search results area
- Compact vertical layout

**Content Structure**

Icon:

- Magnifying glass with question mark or empty state
- Size: 64px
- Muted styling

Heading:

- Text: No results found
- Medium weight, primary text

Search Term Echo:

- Text: for [search term]
- Italicized, secondary text

Suggestions:

- Bulleted list:
  - Check your spelling
  - Try different keywords
  - Broaden your search filters
- Tertiary text, small size

Action:

- Link: Clear search
- Secondary button: Search in all projects

---

### 11. Loading States

**Purpose**
Collection of loading indicators for different contexts.

**Layout**

- Multiple examples on single design sheet

**Content Variants**

Top Progress Bar:

- Full width, 2px height
- Positioned at window top edge
- Animated gradient sliding left to right
- Indeterminate animation style

Content Skeleton:

- Sidebar skeleton: animated pulse rectangles for file tree
- Editor skeleton: heading placeholder, paragraph lines
- Card skeleton: image area, title bar, description lines
- Use #1a1a1a for skeleton shapes, animated opacity pulse

Button Loading:

- Spinner icon replaces button text
- Button disabled state
- Spinner: 16px, spinning animation

Panel Loading:

- Centered spinner with loading text below
- Spinner: 24px
- Text: Loading...

Inline Loading:

- Three dots bouncing animation
- Used in chat/AI responses
- Small, 8px dots

Full Page Loading:

- Centered large spinner: 48px
- App logo above (optional)
- Text: Starting CreoNow...

---

### 12. Error Dialog

**Purpose**
Modal dialog for displaying error messages requiring user acknowledgment.

**Layout**

- Centered modal: 400px width
- Scrim overlay behind

**Content Structure**

Header:

- Error icon (circle with exclamation) in red
- Title: Something went wrong
- Optional: error code in monospace

Body:

- Error message description
- Technical details in collapsible section
- Monospace text for stack traces or codes

Actions:

- Primary button: Try Again or OK
- Secondary button: Report Issue (optional)
- Link: View Details

Visual Style:

- Modal has standard dark background
- Error icon has red color with subtle glow
- Border top or accent in error red

---

### 13. Template Picker Dialog

**Purpose**
Modal for selecting document or project templates when creating new items.

**Layout**

- Centered modal: 640px width
- Grid layout for template cards

**Content Structure**

Header:

- Title: Choose a Template
- Subtitle: Start with a pre-configured structure
- Close button

Search/Filter:

- Search input for filtering templates
- Category pills: All | Novel | Article | Script | Custom

Template Grid:

- 2-column grid of template cards
- Each card: 180px height
  - Preview thumbnail or icon
  - Template name
  - Brief description (1 line)
  - Badge: Popular or New (optional)

Card States:

- Hover: border highlight, slight scale
- Selected: accent border, checkmark overlay

Blank Template Option:

- First card always: Blank Document
- Plus icon, minimal styling

Footer:

- Selected template name display
- Button: Cancel (secondary)
- Button: Create (primary)

---

### 14. Export Dialog

**Purpose**
Modal for configuring and initiating document export.

**Layout**

- Centered modal: 480px width

**Content Structure**

Header:

- Title: Export Document
- Document name in secondary text
- Close button

Format Selection:

- Radio group with format options:
  - Markdown (.md)
  - PDF (.pdf)
  - Word Document (.docx)
  - Plain Text (.txt)
- Each option with icon and brief description

Options Section:

- Checkbox: Include metadata
- Checkbox: Include version history
- Checkbox: Embed images (for PDF)
- Dropdown: Page size (for PDF)

Preview:

- Small preview area showing export sample
- Text: Preview of exported content

Progress (during export):

- Progress bar with percentage
- Current step text: Generating PDF...

Footer:

- File size estimate
- Button: Cancel
- Button: Export

---

## Section 3: Interaction Details (4 Designs)

---

### 15. Zen Mode

**Purpose**
Distraction-free writing mode with minimal UI. Full-screen focus on content.

**Layout**

- Full viewport coverage
- Centered content column: 720px maximum width

**Content Structure**

Background:

- Pure dark: #050505
- Optional: very subtle gradient glow in center
- No visible UI chrome

Content Area:

- Generous vertical padding: 120px top and bottom
- Horizontal padding: 80px minimum
- Content centered in viewport

Editor:

- Title in large serif font
- Body text in comfortable reading size
- Cursor and selection visible
- No toolbar visible

Minimal Controls (appears on mouse movement):

- Fade in from top: exit button (X or Esc hint)
- Fade in from bottom: word count, save status
- Auto-hide after 2 seconds of no movement

Transition:

- Smooth fade in when entering zen mode
- Panels slide out, content expands

Exit Hint:

- Small text in corner: Press Esc or F11 to exit
- Very low opacity, disappears after first few seconds

---

### 16. Selection Toolbar

**Purpose**
Floating toolbar appearing when user selects text in editor.

**Layout**

- Floating bar positioned above selection
- Auto-positions to stay within viewport
- Height: 36px

**Content Structure**

Toolbar Container:

- Dark background with slight transparency
- Rounded corners: 8px
- Subtle shadow for elevation
- Border: standard panel border

Formatting Buttons:

- Bold (B)
- Italic (I)
- Underline (U)
- Strikethrough (S)
- Link icon
- Separator line
- Highlight/color icon

AI Actions:

- Sparkle icon button: AI Actions
- Clicking opens submenu

AI Submenu (dropdown below toolbar):

- Options: Improve, Expand, Shorten, Rephrase, Explain
- Each with icon and keyboard shortcut hint

Button States:

- Default: icon in muted color
- Hover: icon brightens, background highlight
- Active (format applied): accent color

Arrow Pointer:

- Small triangle pointing down to selection
- Centered on toolbar

---

### 17. Resizer Indicator

**Purpose**
Visual feedback for panel width adjustment via drag handle.

**Layout**

- Vertical line between resizable panels
- Multiple states shown

**Content Structure**

Default State:

- 1px vertical line using border color
- Cursor area: 8px wide (invisible hit area)

Hover State:

- Line becomes 2px wide
- Color brightens to #444444
- Cursor changes to col-resize

Dragging State:

- Line becomes 2px wide
- Color becomes accent blue
- Optional: width tooltip appears
- Tooltip shows: 320px (current width)

Width Tooltip:

- Small pill above or beside cursor
- Dark background, white text
- Updates in real-time during drag

Snap Indicators (optional):

- When approaching default width, line pulses
- Visual snap feedback at preset widths

Constraints Visual:

- At minimum width: line turns warning orange
- At maximum width: line turns warning orange
- Prevents further movement

---

### 18. Context Menus

**Purpose**
Right-click context menus for various UI elements.

**Layout**

- Floating menu positioned at click location
- Adjusts to stay within viewport

**Content Variants**

File Tree Context Menu:

- New File
- New Folder
- Separator
- Rename (with F2 shortcut)
- Duplicate
- Move to...
- Separator
- Cut, Copy, Paste
- Separator
- Delete (in red/warning color)

Editor Context Menu:

- Cut, Copy, Paste
- Separator
- AI Actions submenu arrow
- Separator
- Find in Document
- Add to Memories
- Separator
- Format submenu arrow

AI Panel Context Menu (on message):

- Copy
- Copy as Markdown
- Separator
- Regenerate
- Edit and Resend
- Separator
- Delete Message

**Visual Style**

- Menu container: #0f0f0f background
- Border: standard panel border
- Rounded corners: 8px
- Shadow: elevation shadow
- Item height: 32px
- Item hover: #1a1a1a background
- Separator: 1px line with margin
- Shortcut text: right-aligned, tertiary color
- Danger items: red text color
- Submenu arrow: chevron right icon

---

## Section 4: AI Related (4 Designs)

---

### 19. AI Streaming States

**Purpose**
Visual states during AI response streaming, including cancel and timeout handling.

**Layout**

- Within AI Panel message area
- Multiple states on single design

**Content Variants**

Streaming Active:

- AI message bubble with growing content
- Blinking cursor at end of text
- Thinking text above: Generating response...
- Cancel button visible below message

Cancel Button:

- Position: below streaming message
- Text: Stop Generating
- Icon: square (stop) icon
- Secondary button style
- Hover state visible

Cancellation Feedback:

- Message ends with: [Generation stopped]
- Muted italic text
- No error styling

Timeout State:

- Message shows: Response timed out
- Warning icon
- Retry button: Try Again
- Link: Report Issue

Thinking Indicator:

- Before first content arrives
- Three bouncing dots animation
- Text: AI is thinking...
- Model name badge

Progress Hint (for long operations):

- Subtle progress bar under message
- Indeterminate animation
- Text: Processing large context...

---

### 20. AI Apply Confirmation

**Purpose**
UI flow for reviewing and accepting/rejecting AI-suggested document changes.

**Layout**

- Inline in editor or modal overlay
- Diff-style presentation

**Content Structure**

Inline Suggestion:

- Changed text highlighted with accent background
- Gutter icon indicating AI change
- Floating action bar attached to change

Floating Action Bar:

- Accept button (checkmark, green tint)
- Reject button (X, red tint)
- View Diff button
- Positioned above or below changed text

Diff Modal (for larger changes):

- Split view: Before | After
- Standard diff coloring
- Summary: This will modify 3 paragraphs
- Buttons: Apply Changes, Reject, Edit Manually

Multiple Changes:

- Navigation: Change 1 of 4
- Previous/Next arrows
- Accept All button
- Reject All button

Change Types:

- Addition: green background, plus indicator
- Deletion: red background, minus indicator
- Modification: yellow border

Undo Available:

- Toast after accepting: Changes applied
- Action button: Undo
- Timeout: 5 seconds

---

### 21. AI Error States

**Purpose**
Error displays for AI-related failures: network, timeout, quota, upstream errors.

**Layout**

- Within AI Panel message area
- Multiple error types

**Content Variants**

Network Error:

- Icon: wifi-off or cloud-off
- Title: Connection Failed
- Description: Unable to reach AI service. Check your internet connection.
- Button: Retry

Timeout Error:

- Icon: clock
- Title: Request Timed Out
- Description: The AI service took too long to respond.
- Button: Try Again

Rate Limit Error:

- Icon: speedometer or clock
- Title: Too Many Requests
- Description: Please wait a moment before sending another message.
- Countdown: Try again in 30 seconds

Quota Exceeded:

- Icon: alert-triangle
- Title: Usage Limit Reached
- Description: You have reached your monthly AI usage limit.
- Button: Upgrade Plan
- Link: View Usage

Upstream Error:

- Icon: server
- Title: AI Service Error
- Description: The AI provider is experiencing issues. This is not your fault.
- Error code in monospace: upstream_error_503
- Button: Retry
- Link: Check Status

**Visual Style**

- Error container: subtle red tint background
- Icon: warning/error colors
- Clearly not user-caused tone in messaging
- Always provide actionable next step

---

### 22. Confirm/Alert Dialog

**Purpose**
General-purpose confirmation and alert dialogs.

**Layout**

- Centered modal: 400px width
- Scrim overlay

**Content Variants**

Delete Confirmation:

- Icon: trash in red
- Title: Delete Document?
- Description: This action cannot be undone. The document and its version history will be permanently deleted.
- Secondary button: Cancel
- Danger button: Delete (red styling)

Unsaved Changes Alert:

- Icon: alert-triangle in warning color
- Title: Unsaved Changes
- Description: You have unsaved changes. Do you want to save before leaving?
- Three buttons: Discard, Cancel, Save

Success Confirmation:

- Icon: checkmark in green
- Title: Export Complete
- Description: Your document has been exported successfully.
- File location path
- Button: Open File
- Button: Done

Information Alert:

- Icon: info circle in blue
- Title: About Memories
- Description: Informational text explaining a feature.
- Single button: Got It

**Visual Style**

- Danger actions: red button background or red text
- Confirm actions: standard primary button
- Icon colors match intent: red (danger), yellow (warning), green (success), blue (info)
- Modal has subtle shadow and border

---

## Section 5: Component Primitives (3 Designs)

---

### 23. Toast Collection

**Purpose**
Notification toasts for various feedback types.

**Layout**

- Position: top-right corner of viewport
- Stack vertically with 8px gap
- Each toast: 320px width

**Content Variants**

Info Toast:

- Left border accent: blue
- Icon: info circle
- Message: Document saved successfully
- Auto-dismiss: 3 seconds

Success Toast:

- Left border accent: green
- Icon: checkmark circle
- Message: Export complete
- Optional action: View File

Warning Toast:

- Left border accent: yellow/orange
- Icon: alert-triangle
- Message: Large document may slow performance
- Dismiss button (X)

Error Toast:

- Left border accent: red
- Icon: X circle
- Message: Failed to save document
- Action button: Retry
- Does not auto-dismiss

Toast with Progress:

- Standard toast container
- Progress bar below message
- Text: Exporting... 45%

**Visual Style**

- Background: #0f0f0f with slight transparency
- Border: standard panel border
- Left accent border: 3px width
- Shadow: elevation shadow for floating effect
- Entry animation: slide in from right
- Exit animation: fade out and slide right

---

### 24. Tooltip and Popover

**Purpose**
Tooltip hints and popover content containers.

**Layout**

- Multiple examples on design sheet

**Content Variants**

Simple Tooltip:

- Small text container
- Maximum width: 200px
- Arrow pointing to trigger element
- Text: Descriptive text for the element
- Background: #1a1a1a
- Border: subtle panel border
- Delay before show: 300ms

Tooltip with Shortcut:

- Text: Save Document
- Shortcut badge: Cmd+S (styled like keyboard key)

Rich Tooltip:

- Title in bold
- Description paragraph
- Learn more link
- Maximum width: 280px

Popover:

- Larger container: 320px width
- Header with title and close button
- Body content with padding
- Optional footer with actions
- Arrow pointing to trigger

Popover Example (Profile):

- User avatar and name
- Email address
- Separator
- Menu items: Settings, Help, Sign Out
- Arrow positioning based on trigger location

**Visual Style**

- Tooltip: compact, no border or subtle border
- Popover: full panel styling with border
- Both: shadow for elevation
- Arrow: matches background color, proper rotation
- Animations: fade in with slight scale

---

### 25. Settings Details

**Purpose**
Detailed settings panel layout with various control types.

**Layout**

- Full panel or page: 600px content width
- Sectioned layout with scroll

**Content Structure**

Settings Header:

- Title: Settings
- Close or back button
- Search settings input

Navigation Sidebar (optional):

- List of setting categories
- Active item highlighted
- Categories: General, Editor, AI, Appearance, Keyboard

Settings Section:

- Section title with description
- Grouped related settings

Control Types:

Toggle Setting:

- Label on left
- Description below label
- Toggle switch on right
- Row height: 56px

Dropdown Setting:

- Label on left
- Description below
- Dropdown on right showing current value

Input Setting:

- Label above
- Description below label
- Full-width input field

Slider Setting:

- Label with current value
- Full-width slider
- Min/max labels at ends

Radio Group:

- Label and description
- Vertical list of radio options
- Each option with label and description

Button Setting:

- Label and description
- Action button on right
- Example: Reset to Defaults

**Visual Grouping**

- Sections separated by 32px spacing
- Section titles: 10px uppercase, tertiary color
- Subtle separator lines between sections
- Hover on row: subtle background highlight

Footer:

- Save status indicator
- Changes saved automatically text
- Or Save/Cancel buttons if manual save

---

## Appendix: Naming Convention

Generated HTML files should follow this naming pattern:

```
20-memory-panel.html
21-skills-picker.html
22-context-viewer.html
23-version-history.html
24-diff-view.html
25-search-panel.html
26-constraints-panel.html
27-empty-state-project.html
28-empty-state-filetree.html
29-empty-state-search.html
30-loading-states.html
31-error-dialog.html
32-template-picker.html
33-export-dialog.html
34-zen-mode.html
35-selection-toolbar.html
36-resizer-indicator.html
37-context-menus.html
38-ai-streaming-states.html
39-ai-apply-confirmation.html
40-ai-error-states.html
41-confirm-dialog.html
42-toast-collection.html
43-tooltip-popover.html
44-settings-details.html
```

---

## Generation Notes

- Each design should be a standalone HTML file using Tailwind CSS CDN
- Include all interactive states in a single design where applicable
- Use the same font imports as existing designs: Inter, JetBrains Mono, Newsreader
- Maintain visual consistency with the 19 existing design files
- Include realistic placeholder content, not lorem ipsum
- All designs are for dark theme only
