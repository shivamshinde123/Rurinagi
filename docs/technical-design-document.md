# Rurinagi V1 technical design

## State model

`AppState` is a versioned document containing projects, tasks, sessions, timer state, settings, and the session scratchpad. All mutations produce a new state and persist immediately after user actions.

## Timer model

The timer is a small state machine: idle, running, and paused across focus, short-break, and long-break modes. Running state persists `endsAt`; paused state persists `remainingSeconds`. Completion creates a session only for focus mode. Ending early asks whether to save a partial session.

## Persistence

SQLite contains migrations plus the current state document. Writes use a transaction and imports pass the same validation as IPC. Export writes readable JSON. Backup copies the database after a checkpoint.

## Desktop integration

- Main and quick-capture windows are separate `BrowserWindow` instances.
- The global shortcut opens and focuses Quick Capture.
- Focus completion uses a local desktop notification when enabled.
- Start-with-Windows and tray behavior are represented in settings; OS startup registration is implemented, while tray controls remain V2.

## Error handling

Load failures surface an actionable full-screen error. Save failures retain UI state and show a toast. Import errors leave existing data untouched. Destructive clearing and partial-session discard require confirmation.

## Testing

Pure tests cover remaining-time calculation, timer start/pause/resume, focus completion, and startup recovery. Build and TypeScript checks cover process boundaries and renderer compilation.

