# Code flow

## Launch

1. Electron starts `src/main/main.ts`.
2. Storage opens SQLite, applies migrations, and creates initial state if needed.
3. Startup recovery finalizes an elapsed running focus timer or transitions an elapsed break to idle.
4. The main window loads the local renderer with context isolation and sandboxing enabled.
5. React calls `loadState` through the preload bridge.
6. A new profile sees first-run setup. Finishing it persists the selected notification and startup preferences, records local setup completion, and renders Today. Returning profiles render Today directly.

## Policy links

The renderer requests a published Privacy or Terms URL through the preload bridge. The main process checks it against the exact shared allowlist before asking Windows to open the default browser. Arbitrary renderer-provided URLs are rejected.

## State changes

1. A screen creates the next immutable `AppState`.
2. `App` sends it through `saveState`.
3. The main process validates the boundary payload and writes it in a SQLite transaction.
4. Other open windows receive `stateChanged` and reload.

## Focus session

1. Start records the task, duration, start time, and end timestamp.
2. Display time is derived from the end timestamp.
3. Pause converts the timestamp to a fixed remaining-seconds value.
4. Completion appends a session record and advances to the configured break.
5. Restart recovery uses the same completion rule if the end timestamp passed while closed.

## Quick capture

The global shortcut opens a small dedicated renderer window. Saving appends an inbox task, persists state, notifies the main window, and hides the capture window.

## Project deletion

1. Tasks opens the project manager and displays the current task count for every project.
2. Delete opens a destructive confirmation that states the cascade size.
3. `deleteProject` removes the selected project and every task whose `projectId` matches in one immutable state update.
4. Existing focus sessions remain available and render their missing association as “Deleted project.”
5. A project containing the running or paused focus task cannot be deleted until that session ends.

## Insights

1. The Insights screen passes current `AppState` to `buildFocusInsights` when session history changes.
2. The pure domain function groups sessions into the current and previous rolling seven-day windows, projects, outcomes, and focused calendar dates.
3. React renders summary metrics, the seven-column Focus Skyline, project shares, and current/longest streaks.
4. No derived insight value is persisted or sent outside the renderer.

## Tray lifecycle

The main process creates one tray instance after the main window is created. Closing the main window prevents destruction and hides it. Show Rurinagi restores and focuses that window; Quick capture reuses the existing capture-window path; Quit marks the process as quitting before normal window, shortcut, tray, and database cleanup.
