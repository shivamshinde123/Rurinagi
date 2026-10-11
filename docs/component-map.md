# Component map

## V3 desktop shell

- Main window: hosts the full planning and focus experience, uses the packaged Rurinagi icon, and hides to the tray on close.
- Quick Capture window: captures a task without restoring the full application.
- Tray: uses the Rurinagi mark and owns Show Rurinagi, Quick capture, and Quit commands for the running process.
- Settings shortcut input: translates readable Windows notation to the persisted Electron accelerator.

## Desktop processes

- `src/main/main.ts`: Electron lifecycle, windows, global shortcut, notifications, and IPC registration.
- `src/main/storage.ts`: SQLite initialization, validation, persistence, import, export, backup, and timer recovery.
- `src/preload/preload.ts`: allowlisted bridge exposed to the renderer.

## Renderer

V3 keeps the connected screen components together in `src/renderer/app.tsx` because they share one small state boundary. Split them only when independent ownership or reuse appears.

- `App`: loads state, coordinates persistence, navigation, theme, and window mode.
- `FirstRunSetup`: two-step local-privacy explanation and explicit notification/startup preferences shown once per Windows profile.
- `Sidebar`: primary navigation and quick capture entry point.
- `Today`: priority selection, next task, daily tasks, summary, and quick note.
- `Tasks`: validated named-task creation, grouping, completion, ordering, contextual draft-backed inspector editing, non-destructive archive, and confirmed permanent deletion that preserves session history.
- `Focus`: focus and break state machine controls, progress, and scratchpad.
- `History`: filtered chronological records, notes, and task reassociation.
- `Insights`: seven-day focus summary, weekly comparison, project distribution, and current/longest streaks.
- `FocusSkyline`: dependency-free, accessible seven-column visualization derived from `FocusDay` values.
- `SettingsScreen`: timer, appearance, behavior, and local-data controls.
- `policyUrls` / `isAllowedPolicyUrl`: shared exact allowlist used by the renderer and main process for external Privacy and Terms navigation.
- `QuickCapture`: focused, progressive task capture window.
- `ProgressRing`, `TaskRow`, `SessionRow`, and `Icon`: small shared presentation components in the same module.
- `SelectControl`: reusable themed listbox used by task editing, Quick Capture, History filters, session reassignment, and Settings.
- `CalendarControl`: reusable themed planned-date picker used by task editing and Quick Capture while preserving local `YYYY-MM-DD` values.
- `ConfirmModal`: reusable in-app confirmation surface for archive and destructive actions.
- `Logo`: shared two-current Rurinagi mark used by the sidebar, loading/error states, Quick Capture, and About.

## Shared domain

- `buildFocusInsights`: pure aggregation boundary for all V3 insight values; it reads sessions but does not mutate or persist state.

