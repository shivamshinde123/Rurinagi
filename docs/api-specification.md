# API specification

## Scope

Rurinagi V1 has no network API. A sandboxed Electron renderer communicates with the privileged main process through a narrow, typed preload bridge.

## Renderer bridge

| Method | Request | Response | Purpose |
| --- | --- | --- | --- |
| `loadState` | none | `AppState` | Load and recover local application state. |
| `saveState` | `AppState` | `AppState` | Validate and atomically persist state. |
| `exportData` | none | `{ canceled, path? }` | Save a JSON export chosen by the user. |
| `importData` | none | `{ canceled, state? }` | Select, validate, and import a JSON export. |
| `backupData` | none | `{ canceled, path? }` | Copy the SQLite database to a chosen location. |
| `clearData` | none | `AppState` | Replace local data with an empty initial state after UI confirmation. |
| `completeCapture` | none | void | Close the quick-capture window after saving. |
| `onStateChanged` | callback | unsubscribe function | Refresh another window after a state mutation. |

## Trust boundary

The preload exposes named methods, never raw `ipcRenderer`. Main-process handlers validate the state version, collection shapes, record identifiers, and bounded string sizes before writing. Remote content is not loaded.

