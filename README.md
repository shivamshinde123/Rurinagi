# Rurinagi

Rurinagi is a private, offline-first Windows desktop app for planning tasks, choosing one meaningful next step, focusing on it, and reviewing progress without an account or cloud service.

- Website: [shivamshinde123.github.io/Rurinagi](https://shivamshinde123.github.io/Rurinagi/)
- Current release: [Rurinagi 3.1.0](https://github.com/shivamshinde123/Rurinagi/releases/tag/v3.1.0)
- Platform: Windows 10/11, 64-bit

## Features

- Today view with priorities, overdue work, focus time, and session totals.
- Task creation, editing, completion, archiving, permanent deletion, dates, notes, estimates, and Low/Normal/High priority labels.
- Project creation and confirmed project deletion that also removes every assigned task.
- Focus and break timers with pause, resume, restart recovery, optional notifications, and session notes.
- Local history and seven-day insights, including project distribution and focus streaks.
- Global Quick Capture shortcut, system tray controls, dark mode, compact density, and reduced-motion support.
- JSON export, validated import, SQLite backup, session deletion, and confirmed local-data clearing.

Project and task deletion keeps completed focus history. Records whose project no longer exists are labeled **Deleted project**.

## Install on Windows

### Installer

1. Download `Rurinagi-3.1.0-Setup.exe` from the [project website](https://shivamshinde123.github.io/Rurinagi/) or [GitHub Release](https://github.com/shivamshinde123/Rurinagi/releases/tag/v3.1.0).
2. Double-click the installer and complete setup.
3. Open Rurinagi from the Start menu or its installed shortcut.
4. Complete the two-step first-run setup. Notifications and Start with Windows are optional and default to off.

The current installer is not code-signed. Windows may show SmartScreen and **Unknown publisher**. Choose **More info → Run anyway** only if you trust this project, and verify the download against [`docs/release-checksums-v3.1.0.txt`](docs/release-checksums-v3.1.0.txt).

### Portable build

Download `Rurinagi-win32-x64-3.1.0.zip`, extract it, and launch `Rurinagi.exe`. The portable ZIP does not run the Windows installer or create installed shortcuts.

## Privacy and local data

Rurinagi has no account, telemetry, advertising, analytics, or cloud database. Tasks, notes, settings, and focus history are stored in `rurinagi.sqlite` inside Electron's Windows user-data directory.

Use **Settings → Data and privacy** to export readable JSON, create a database backup, restore validated data, or clear all local data. Uninstalling may leave the user-data directory behind; clear local data before uninstalling when removal is required.

See the published [Privacy Policy](https://shivamshinde123.github.io/Rurinagi/privacy.html) and [Terms of Service](https://shivamshinde123.github.io/Rurinagi/terms.html).

## Technology

- Electron 44 and Electron Forge
- React 19 with TypeScript
- Vite 7
- Electron's bundled `node:sqlite`
- Plain CSS design tokens and platform accessibility media queries
- Node test runner and Playwright

See [`docs/tech-stack.md`](docs/tech-stack.md) for the rationale and alternatives considered.

## Development setup

### Prerequisites

- Windows
- Node.js 22.18 (current verified toolchain)
- npm 10.9 (current verified toolchain)
- Git

No `.env` file, API key, account, database server, or other secret is required.

### Run locally

```powershell
git clone git@github.com:shivamshinde123/Rurinagi.git
cd Rurinagi
npm.cmd install
npm.cmd start
```

Use `npm.cmd` in PowerShell to avoid local script-execution policy conflicts with `npm.ps1`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm.cmd start` | Start Electron Forge in development mode. |
| `npm.cmd run lint` | Run TypeScript validation without emitting files. |
| `npm.cmd test` | Run domain and storage tests. |
| `npm.cmd run test:e2e` | Package the app and run the Electron/Windows workflows. |
| `npm.cmd run build` | Run lint, unit tests, and package the app. |
| `npm.cmd run package` | Create an unpacked application under `out/`. |
| `npm.cmd run make` | Create the Windows installer and portable ZIP under `out/make/`. |
| `npm.cmd run assets:logo` | Rebuild packaged logo assets from the source artwork; requires an installed Google Chrome. |
| `npm.cmd audit --audit-level=high` | Check dependencies for high-severity vulnerabilities. |

Run the release verification set with:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run test:e2e
npm.cmd audit --audit-level=high
npm.cmd run make
```

## Repository structure

```text
src/main/          Electron lifecycle, windows, tray, IPC, and SQLite storage
src/preload/       Narrow context-isolated renderer bridge
src/renderer/      React screens, controls, styles, and accessibility behavior
src/shared/        Shared state model and pure domain operations
tests/             Domain, storage, and packaged Electron tests
resources/         Source and packaged Rurinagi artwork
scripts/           Reproducible asset-generation scripts
site/              Static GitHub Pages website, policies, and release page
docs/              Product, architecture, implementation, compliance, and release records
```

Generated content under `out/`, `.vite/`, and `output/` is not committed.

## Website and releases

The website is a static GitHub Pages deployment from [`site/`](site/). Publishing a GitHub Release triggers [the Pages workflow](.github/workflows/pages.yml), which downloads that release's `.exe` and `.zip` assets into the deployed site. Do not commit release binaries into `site/`.

Windows package configuration lives in [`forge.config.ts`](forge.config.ts). Every public release should include matching versioned assets, SHA-256 checksums, updated website links, and the release-compliance review.

## Troubleshooting

### Windows shows SmartScreen or Unknown publisher

This is expected while code signing is intentionally deferred. Confirm the version and SHA-256 checksum before choosing **Run anyway**.

### Electron's welcome screen opens instead of Rurinagi

You are launching Electron's development executable rather than the application. For development, run `npm.cmd start` from the repository. For normal use, launch the installed **Rurinagi** shortcut or the packaged `Rurinagi.exe`.

### The old icon remains in Windows Settings

Install the current release, close and reopen Settings, and restart Explorer or sign out if Windows is still showing a cached icon.

### Reset or move local data

Use Rurinagi's Settings screen rather than editing `rurinagi.sqlite` manually. Export or back up the data first when it needs to be retained.

## Documentation

- [Product requirements](docs/product-requirements-document.md)
- [System architecture](docs/system-architecture-document.md)
- [Technical design](docs/technical-design-document.md)
- [Code flow](docs/flow.md)
- [Component map](docs/component-map.md)
- [Environment and configuration](docs/environment-config-reference.md)
- [UI and UX specification](docs/ui-ux-wireframes.md)
- [Release compliance review](docs/release-compliance.md)
- [Rurinagi 3 verification report](docs/v3-test-report.md)
- [Third-party notices](THIRD_PARTY_NOTICES.md)

