# Database schema

## SQLite file

The database is stored under Electron's per-user application-data directory as `rurinagi.sqlite`.

## Tables

### schema_migrations

| Field | Type | Constraints |
| --- | --- | --- |
| `version` | INTEGER | Primary key |
| `applied_at` | TEXT | Required UTC timestamp |

### app_state

| Field | Type | Constraints |
| --- | --- | --- |
| `id` | INTEGER | Primary key; fixed value `1` |
| `version` | INTEGER | Required; current value `1` |
| `json` | TEXT | Required validated JSON |
| `updated_at` | TEXT | Required UTC timestamp |

## Logical entities inside the V1 state document

- Project: id, name, color.
- Task: id, title, description, project, priority, due date, estimate, status, order, and Today selection.
- Session: id, task/project association, planned and actual seconds, timestamps, outcome, and note.
- Timer: mode, status, task, duration, remaining time, timestamps, and cycle count.
- Settings: durations, break cadence, notifications, theme, motion, startup behavior, and shortcut.

Relational normalization for analytics is deferred until V3 query requirements are concrete.

