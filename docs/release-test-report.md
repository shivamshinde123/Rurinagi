# Rurinagi V1 release test report

## Candidate

- Version: `1.0.0`
- Platform: Windows x64
- Status: verified for release on 2026-10-11; every gate below passed before tagging.

## Automated coverage

### Domain behavior

- Focus start, pause, resume, completion, partial completion, and discard.
- Short- and long-break selection.
- Elapsed timer recovery after restart without duplicate sessions.
- Local-day focus totals and duration formatting.

### Persistence and trust boundaries

- SQLite create, save, load, clear, backup, JSON export, and validated JSON restore.
- Nested task, session, timer, settings, identifier, date, enum, boolean, and numeric validation.
- Import failures leave the supplied object unchanged.

### Packaged Electron journey

- Navigation across all five primary screens.
- Task creation, editing, project assignment, search, ordering, Today priority, archive, and clear.
- In-app project creation and Quick Capture in its real secondary window.
- Focus pause/resume, scratchpad, confirmation, partial save, completion, break controls, and automatic breaks.
- History filtering, detail editing, reassignment, and deletion.
- Timer, appearance, accessibility, startup, discard, notification, sound, and shortcut settings.
- Global shortcut registration through Electron.
- Export, import, SQLite backup, and destructive data clearing through the preload bridge.
- Active timer persistence across a full Electron process restart.
- Renderer console and page-error monitoring.

## Distribution and website gates

- Installer and portable ZIP build successfully.
- SHA-256 checksums are recorded with the release.
- Website download targets resolve to versioned artifacts.
- Browser QA covers desktop, compact desktop, and mobile widths, keyboard focus, reduced motion, and console errors.

## Manual boundaries

- Windows SmartScreen cannot be cleared without a trusted code-signing certificate.
- Notification appearance and audio loudness depend on Windows settings and hardware.
