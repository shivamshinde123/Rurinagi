# System architecture

## Overview

Rurinagi is a local-only Electron desktop application with three security boundaries.

```text
React renderer
  -> typed preload bridge
    -> Electron main process
      -> local SQLite file
      -> Windows notifications, dialogs, shortcut, windows, and system tray
```

The public GitHub Pages site is a separate static delivery surface. Publishing a GitHub Release triggers its workflow to combine `site/` with the exact tagged Windows assets; application source and user data are never included in the Pages artifact.

## Boundaries

- Renderer: unprivileged UI with no Node integration.
- Preload: context-isolated allowlist of specific operations.
- Main: validates IPC, owns storage and desktop capabilities.
- Tray: remains process-owned and routes only to existing main-process window actions.
- Persistence: one per-user SQLite file plus user-selected JSON exports and backups.

## Security and privacy

The app loads only packaged local content, applies a restrictive Content Security Policy, enables context isolation and renderer sandboxing, validates imported data, and never records keystrokes, screenshots, or continuous application activity.

## Availability

All core behavior works without a network. Running timer recovery is based on persisted timestamps and is performed before state reaches the renderer.

Closing the main window hides it instead of ending the process. The tray restores the window or exits explicitly; shutdown releases the tray, global shortcut, windows, and SQLite connection.

The website requires a network only for distribution. A downloaded application remains fully offline-capable.

