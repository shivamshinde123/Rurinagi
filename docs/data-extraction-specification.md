# Data extraction specification

## V1 inputs

Rurinagi does not ingest third-party data in V1. User-entered tasks, projects, notes, settings, and timer events are accepted through local UI controls.

## Processing rules

- Trim task titles and require at least one visible character.
- Keep notes and descriptions as plain text; do not render them as HTML.
- Store dates as local calendar dates and timestamps as UTC ISO 8601 strings.
- Derive timer remaining time from a persisted end timestamp while running.
- On restart, convert an elapsed focus timer into a completed session before returning state.
- JSON imports must match the supported state version and validation limits.

## Deferred ingestion

Calendar, Spotify, weather, clipboard enrichment, and AI-provider ingestion are deferred beyond V1.

