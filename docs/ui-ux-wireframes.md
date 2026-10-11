# UI and UX wireframes

## Application shell

```text
+----------------------+---------------------------------------------------+
| Rurinagi             | Date                         Search  Add  More     |
|                      +---------------------------------------------------+
| Today                |                                                   |
| Tasks                | Main screen                                       |
| Focus                |                                                   |
| History              |                                                   |
| Settings             |                                                   |
|                      |                                                   |
| Quick capture        |                                                   |
| Stored on device     |                                                   |
+----------------------+---------------------------------------------------+
```

The sidebar is a translucent structural layer. Content cards stay solid for legibility. On narrow windows, navigation becomes a bottom bar and secondary columns stack.

## Today

```text
Greeting and supportive prompt
+----------------------------------+  +----------------------+
| Up next                         |  | Timer                |
| Task and Start focus            |  | progress and Start   |
+----------------------------------+  +----------------------+
| Today's tasks                   |  | Today summary        |
| [ ] task                        |  +----------------------+
| [x] completed task              |  | Quick note           |
+----------------------------------+  +----------------------+
```

## Tasks

Grouped task list occupies the main area. Selecting a task opens a right-side inspector from the same edge in both directions. Empty groups use concise, actionable text.

## Focus

A centered task title and large tabular timer dominate. Pause is primary while running; resume is primary while paused. Ending early opens a modal with save, discard, and continue actions.

## Quick capture

A compact floating window opens with the title field focused. Project, date, and estimate remain secondary. Enter saves; Escape closes.

## History

A compact summary precedes a chronological, keyboard-readable session list. Status uses text plus color.

## Settings

Settings use labeled rows grouped under Timer, Appearance, Behavior, Data and privacy, and About. Destructive data clearing sits last and requires confirmation.

## Motion and accessibility

- Press feedback begins on pointer down.
- Panels and dialogs use symmetric 180 ms transform and opacity transitions.
- Timer progress is continuous but not decorative.
- `prefers-reduced-motion` and the in-app setting remove transforms and animated progress.
- Focus rings use the lapis accent and are never removed.
- Light, dark, increased-contrast, and reduced-transparency modes preserve readable surfaces.

