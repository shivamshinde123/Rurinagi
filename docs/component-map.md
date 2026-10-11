# Component map

## Desktop processes

- `src/main/main.ts`: Electron lifecycle, windows, global shortcut, notifications, and IPC registration.
- `src/main/storage.ts`: SQLite initialization, validation, persistence, import, export, backup, and timer recovery.
- `src/preload/preload.ts`: allowlisted bridge exposed to the renderer.

## Renderer

V1 keeps the connected screen components together in `src/renderer/app.tsx` because they share one small state boundary. Split them only when independent ownership or reuse appears.

- `App`: loads state, coordinates persistence, navigation, theme, and window mode.
- `Sidebar`: primary navigation and quick capture entry point.
- `Today`: priority selection, next task, daily tasks, summary, and quick note.
- `Tasks`: task creation, grouping, completion, ordering, and inspector editing.
- `Focus`: focus and break state machine controls, progress, and scratchpad.
- `History`: filtered chronological records, notes, and task reassociation.
- `SettingsScreen`: timer, appearance, behavior, and local-data controls.
- `QuickCapture`: focused, progressive task capture window.
- `ProgressRing`, `TaskRow`, `SessionRow`, and `Icon`: small shared presentation components in the same module.

