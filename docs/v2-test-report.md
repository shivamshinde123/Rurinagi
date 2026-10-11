# Rurinagi V2 verification report

## Candidate

- Version: `2.0.0`
- Platform: Windows x64
- Verification date: 2026-10-11
- Status: verified for release; every gate below passed before tagging.

## Automated evidence

- TypeScript: `npm.cmd run lint` passed.
- Domain and storage: all 11 tests passed, including legacy blue-to-green default-project migration.
- Packaged Electron: the complete V2 workflow passed with zero renderer console or page errors.
- Production dependencies: `npm.cmd audit --omit=dev` reported zero vulnerabilities.
- Distribution: Electron Forge created the Windows installer, portable ZIP, and Squirrel package.

The packaged workflow covers navigation, validated named-task creation, contextual draft-backed task inspection, explicit updates, task and project management, confirmed task deletion, app-rendered dropdown and calendar controls, calendar dismissal and date selection in Task Details and Quick Capture, focus-managed confirmation dialogs, Quick Capture, timer and break states, session history, settings, global shortcut registration, readable shortcut normalization, green theme tokens, measured task metadata spacing, import/export/backup, destructive actions, restart recovery, and close-to-tray restoration.

Visual QA confirmed that the Task Details calendar opens upward without clipping and the compact Quick Capture calendar stays within its 560 x 390 window. Both use opaque surfaces for legibility over form content.

## Distribution artifacts

- `Rurinagi-2.0.0-Setup.exe` — 153,989,632 bytes
- `Rurinagi-win32-x64-2.0.0.zip` — 158,591,017 bytes

SHA-256 values are stored in `docs/release-checksums-v2.0.0.txt`.

## Manual boundaries

- Windows SmartScreen reputation cannot be established without a trusted code-signing certificate.
- Tray placement, notification appearance, and completion-sound loudness depend on local Windows settings and hardware.
