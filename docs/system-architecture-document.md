# System architecture

## Overview

Rurinagi is a local-only Electron desktop application with three security boundaries.

```text
React renderer
  -> typed preload bridge
    -> Electron main process
      -> local SQLite file
      -> Windows notifications, dialogs, shortcut, windows, and system tray
      -> allowlisted Privacy and Terms URLs in the default browser
```

The public GitHub Pages site is a separate static delivery surface. Publishing a GitHub Release triggers its workflow to combine `site/` with the exact tagged Windows assets; application source and user data are never included in the Pages artifact.

## Boundaries

- Renderer: unprivileged UI with no Node integration.
- Preload: context-isolated allowlist of specific operations.
- Main: validates IPC, owns storage and desktop capabilities.
- Tray: remains process-owned and routes only to existing main-process window actions.
- Persistence: one per-user SQLite file plus user-selected JSON exports and backups.
- Insights: a pure in-process read model derived from persisted sessions; it adds no storage, IPC, or network boundary.
- First-run marker: a renderer-origin local value separate from task data; it records only whether setup has completed.

## Security and privacy

The app loads only packaged local content, applies a restrictive Content Security Policy, enables context isolation and renderer sandboxing, validates imported data, and never records keystrokes, screenshots, or continuous application activity. Focus insights stay on-device and are calculated only from explicit session records.

## Availability

All core behavior works without a network. Running timer recovery is based on persisted timestamps and is performed before state reaches the renderer.

Closing the main window hides it instead of ending the process. The tray restores the window or exits explicitly; shutdown releases the tray, global shortcut, windows, and SQLite connection.

The website and full linked policy pages require a network. The setup screen includes the essential local-storage disclosure, and the downloaded application's core planning and focus behavior remains fully offline-capable.

