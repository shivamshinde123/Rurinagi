# Component map

## V2 desktop shell

- Main window: hosts the full planning and focus experience; close hides it to the tray.
- Quick Capture window: captures a task without restoring the full application.
- Tray: owns Show Rurinagi, Quick capture, and Quit commands for the running process.
- Settings shortcut input: translates readable Windows notation to the persisted Electron accelerator.

## Desktop processes

- `src/main/main.ts`: Electron lifecycle, windows, global shortcut, notifications, and IPC registration.
- `src/main/storage.ts`: SQLite initialization, validation, persistence, import, export, backup, and timer recovery.
- `src/preload/preload.ts`: allowlisted bridge exposed to the renderer.

## Renderer

V2 keeps the connected screen components together in `src/renderer/app.tsx` because they share one small state boundary. Split them only when independent ownership or reuse appears.

- `App`: loads state, coordinates persistence, navigation, theme, and window mode.
- `Sidebar`: primary navigation and quick capture entry point.
- `Today`: priority selection, next task, daily tasks, summary, and quick note.
- `Tasks`: validated named-task creation, grouping, completion, ordering, contextual draft-backed inspector editing, non-destructive archive, and confirmed permanent deletion that preserves session history.
- `Focus`: focus and break state machine controls, progress, and scratchpad.
- `History`: filtered chronological records, notes, and task reassociation.
- `SettingsScreen`: timer, appearance, behavior, and local-data controls.
- `QuickCapture`: focused, progressive task capture window.
- `ProgressRing`, `TaskRow`, `SessionRow`, and `Icon`: small shared presentation components in the same module.
- `SelectControl`: reusable themed listbox used by task editing, Quick Capture, History filters, session reassignment, and Settings.
- `ConfirmModal`: reusable in-app confirmation surface for archive and destructive actions.

