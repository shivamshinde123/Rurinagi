# System architecture

## Overview

Rurinagi is a local-only Electron desktop application with three security boundaries.

```text
React renderer
  -> typed preload bridge
    -> Electron main process
      -> local SQLite file
      -> Windows notifications, dialogs, shortcut, and windows
```

## Boundaries

- Renderer: unprivileged UI with no Node integration.
- Preload: context-isolated allowlist of specific operations.
- Main: validates IPC, owns storage and desktop capabilities.
- Persistence: one per-user SQLite file plus user-selected JSON exports and backups.

## Security and privacy

The app loads only packaged local content, applies a restrictive Content Security Policy, enables context isolation and renderer sandboxing, validates imported data, and never records keystrokes, screenshots, or continuous application activity.

## Availability

All core behavior works without a network. Running timer recovery is based on persisted timestamps and is performed before state reaches the renderer.

