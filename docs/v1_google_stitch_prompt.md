Design a polished, high-fidelity Windows desktop application called “Rurinagi.”

PRODUCT IDENTITY
Rurinagi is a calm personal productivity application that helps one person answer: “What should I work on now?”

The name is Japanese-inspired and combines the imagery of a deep lapis-blue color with calmness and stillness. The product should feel like a quiet place where tasks become clear and focused work flows naturally.

The core experience is:

1. Plan the day.
2. Select one meaningful task.
3. Begin a focused work session.
4. Take a deliberate break.
5. Record the session.
6. Review the day.

PLATFORM AND CANVAS
Create a resizable Windows desktop interface, initially shown at 1440 × 900 pixels.

Use standard Windows minimize, maximize, and close controls in the top-right corner.
Make the layout work gracefully on smaller laptop displays.
Optimize interactions for mouse, keyboard, and trackpad.
Provide clear keyboard focus states, keyboard shortcuts, tooltips, and accessible controls.

VISUAL DIRECTION
Create a calm, premium visual style inspired by the clarity and refinement of Apple interfaces while maintaining a distinct identity appropriate for Windows.

The experience should feel:
- calm
- spacious
- focused
- precise
- premium
- approachable
- quietly confident

Use:
- generous negative space
- clear typographic hierarchy
- softly rounded rectangles
- subtle separators and borders
- restrained shadows
- layered neutral surfaces
- carefully controlled translucency in navigation, toolbars, menus, and overlays
- solid, highly legible content surfaces
- smooth and purposeful transitions
- consistent alignment
- comfortable information density

The interface should feel like a practical productivity application rather than a collection of independent dashboard widgets.

COLOR SYSTEM
Use a sophisticated light theme with subtle references to Rurinagi’s deep-blue identity.

Suggested palette:
- main background: warm off-white, approximately #F5F5F7
- primary surfaces: white or softly tinted white
- primary text: near black, approximately #1D1D1F
- secondary text: medium gray, approximately #6E6E73
- borders and separators: pale neutral gray
- primary accent: calm lapis blue, approximately #456FAE
- selected-state tint: very pale blue, approximately #EAF1FA
- success: restrained natural green
- paused state: soft amber
- destructive state: muted red

Use the lapis-blue accent for:
- primary buttons
- selected navigation
- timer progress
- focus indicators
- links
- active fields
- keyboard focus rings

Create a matching dark theme:
- deep blue-black application background
- elevated charcoal-blue surfaces
- soft white primary text
- muted blue-gray secondary text
- luminous but restrained lapis-blue accent
- strong text legibility throughout

TYPOGRAPHY
Use a clean system sans-serif similar to SF Pro, Inter, or Segoe UI.

Suggested scale:
- 30–32 px semibold page titles
- 20–22 px semibold major section titles
- 17–18 px semibold card headings
- 14–16 px body text
- 12–13 px secondary labels
- large tabular numerals for timer values

Use sentence case throughout.
Keep labels concise and conversational.
Create a clear difference between primary, secondary, and supporting information.

SHAPE AND SPACING SYSTEM
Use an 8-point spacing grid.
Use 20–24 px page padding.
Use 16–20 px spacing between related elements.
Use 24–32 px spacing between major sections.
Use 12–16 px corner radii for cards.
Use pill shapes for tags, compact filters, and short status indicators.
Use rounded rectangles for primary and secondary buttons.
Maintain interactive targets of at least 44 × 44 px.

APPLICATION SHELL
Create a narrow translucent left sidebar, approximately 220 px wide.

At the top:
- a minimal Rurinagi symbol
- the wordmark “Rurinagi”
- an abstract logo inspired by a calm blue horizon, a quiet ripple, or a single lapis-colored flowing line

Primary navigation:
- Today
- Tasks
- Focus
- History
- Settings

Use simple, consistent line icons.
Give the selected navigation item:
- a subtle blue-tinted rounded background
- a lapis-blue icon
- darker semibold text

Near the bottom:
- a compact “Quick capture” button
- a small status reading “Stored on this device”

Create a slim toolbar above the main content:
- current date on the left
- search or command button
- quick-add button
- overflow menu

SCREEN 1 — TODAY
Make Today the default home screen and the strongest expression of Rurinagi’s identity.

Header:
- greeting such as “Good morning”
- full date
- a short supportive sentence such as “Choose one meaningful thing to move forward.”

Use an asymmetric two-column layout.

LEFT COLUMN — PRIMARY WORK AREA

1. UP NEXT CARD
Create a prominent but calm focus card containing:
- selected task title
- project name with a small project-color indicator
- estimated duration
- optional short note
- prominent “Start focus” button
- secondary “Choose another task” action

Make this the most visually important card on the screen.

2. TODAY’S TASKS
Create a clean vertical task list containing:
- checkbox
- task title
- optional project label
- optional estimated duration
- subtle drag handle on hover
- context menu on hover
- gentle selected-task highlight
- collapsible completed section
- inline “Add task” row

Support clear states for:
- normal
- selected
- completed
- overdue
- keyboard focused

RIGHT COLUMN — SUPPORTING CONTEXT

1. TIMER CARD
Include:
- circular or semicircular progress indicator
- large time display such as 25:00
- current mode label: “Focus”
- selected task name
- primary Start button
- compact duration control

2. TODAY SUMMARY
Show three simple values:
- focused time
- completed sessions
- completed tasks

Use clear numbers and labels.

3. QUICK NOTE
Include:
- a lightweight text field
- placeholder: “Capture something before you forget…”
- save state
- keyboard shortcut hint

The Today screen should make the next action immediately obvious and remain comfortable to keep open throughout the day.

SCREEN 2 — TASKS
Create a practical task-management screen.

Header:
- title “Tasks”
- search field
- primary “New task” button

Filter and project area:
- Inbox
- Today
- Upcoming
- Completed
- project list
- “New project” action

Main task list:
- group tasks by Today, Tomorrow, and Later
- checkbox
- task title
- project label
- estimated duration
- optional due date
- restrained priority indicator
- drag-and-drop ordering
- hover actions
- context menu

Selecting a task opens a right-side inspector.

TASK INSPECTOR
Include:
- editable task title
- project selector
- notes
- planned date
- estimated focus sessions
- status
- “Start focus” action
- save feedback
- delete action positioned quietly at the bottom

Create thoughtful empty states such as:
- “You’re clear for today.”
- “Add a task when something needs your attention.”

SCREEN 3 — FOCUS
Create a distraction-free focus screen with a spacious centered composition.

Show:
- mode label: “Focus session”
- selected task title
- project name
- large countdown timer
- thin circular progress ring or minimal horizontal progress indicator
- prominent Pause button
- secondary End session button
- small “Add session note” action
- upcoming break information, such as “Break: 5 minutes”

Keep navigation visually quiet while retaining a subtle way to return.

FOCUS STATES

Active:
- timer moving
- task clearly visible
- progress indicator using the lapis-blue accent

Paused:
- clear “Paused” label
- amber supporting indicator
- Resume as the primary action

Completed:
- gentle checkmark animation
- “Focus session complete”
- focused duration
- task title
- “Start break”
- “Continue focusing”
- “Mark task complete”

Early-ending confirmation:
- ask whether to save the partial session
- “Save session”
- “Discard”
- “Continue focusing”

BREAK STATE
Use a slightly warmer and softer visual treatment.

Show:
- “Take a breath”
- break countdown
- small suggestions such as stretch, drink water, or look away from the screen
- “Skip break”
- “Start focus early”

SCREEN 4 — QUICK CAPTURE
Design Quick Capture as a small floating command window opened through a global shortcut.

Include:
- one large task-title input
- placeholder: “What needs your attention?”
- project selector
- optional date
- optional estimate
- Save button
- “Enter to save” keyboard hint

Give the title field immediate keyboard focus.
Present the essential input first and reveal supporting fields progressively.
The interaction should feel instantaneous.

SCREEN 5 — HISTORY
Create a clean session-history screen.

Header:
- title “History”
- date filter
- project filter
- session-status filter

Top summary:
- focused today
- focused this week
- completed sessions

Below, create a chronological session list grouped by date.

Each session row includes:
- start and end time
- task
- project
- focus duration
- completed, interrupted, or partial status
- optional session-note indicator

Selecting a session opens a compact detail inspector.
Allow the user to:
- read session details
- edit the session note
- correct the task association
- delete an incorrect record with confirmation

Use a clear list or table that remains easy to scan.

SCREEN 6 — SETTINGS
Create a simple settings screen with clearly grouped sections.

TIMER
- default focus duration
- short-break duration
- long-break duration
- number of sessions before a long break
- automatic break behavior
- notification sound
- desktop-notification toggle

APPEARANCE
- Light
- Dark
- Follow system
- reduced-motion toggle
- compact-density toggle
- accent-color preview

BEHAVIOR
- start with Windows
- minimize to system tray
- confirm before discarding a session
- restore an active timer after restart
- global quick-capture shortcut

DATA AND PRIVACY
Display:
“Your tasks and focus history are stored locally on this device.”

Include:
- export data
- import data
- backup location
- clear all data with a confirmation step

ABOUT
- Rurinagi logo and wordmark
- short product description
- application version
- keyboard shortcuts
- privacy information

INTERACTIONS AND MOTION
Use purposeful motion to explain state changes:
- 150–220 ms fades and position transitions
- soft hover elevation for clickable cards
- smooth timer progress
- gentle task-completion transition
- short inspector and modal transitions
- one-time focus-completion checkmark animation
- calm notification toasts
- complete reduced-motion behavior

ACCESSIBILITY
Provide:
- strong text contrast
- highly legible text on translucent surfaces
- visible keyboard focus rings
- tooltips for icon-only buttons
- icons and text alongside status colors
- complete keyboard navigation
- layouts that accommodate increased text size
- written timer-state labels
- comfortable click targets
- clear error and confirmation messages

REUSABLE COMPONENTS
Keep these components consistent throughout the application:
- sidebar navigation item
- primary button
- secondary button
- icon button
- task row
- project label
- timer
- progress ring
- settings row
- text field
- dropdown
- date picker
- confirmation dialog
- empty state
- notification toast
- right-side inspector
- keyboard-shortcut badge
- status indicator

SAMPLE CONTENT
Use realistic personal content related to:
- job searching
- sending applications
- contacting recruiters
- preparing for interviews
- coding projects
- learning technical topics
- personal errands

Example tasks:
- Tailor résumé for frontend engineer role
- Message two recruiters
- Review Python project architecture
- Build the task-detail panel
- Practice behavioral interview answers
- Submit portfolio update

OUTPUT REQUEST
Generate a coherent multi-screen desktop design system and all six application screens.

Keep the following consistent across every screen:
- navigation
- spacing
- typography
- colors
- corner radii
- shadows
- icon style
- interaction patterns
- task states
- timer states

Prioritize the Today and Focus screens as the defining experiences.

The finished result should feel like a premium, calm personal workspace that helps the user move naturally from planning into focused action.