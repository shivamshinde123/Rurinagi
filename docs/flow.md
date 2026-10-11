# Code flow

## Launch

1. Electron starts `src/main/main.ts`.
2. Storage opens SQLite, applies migrations, and creates initial state if needed.
3. Startup recovery finalizes an elapsed running focus timer or transitions an elapsed break to idle.
4. The main window loads the local renderer with context isolation and sandboxing enabled.
5. React calls `loadState` through the preload bridge and renders Today.

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

