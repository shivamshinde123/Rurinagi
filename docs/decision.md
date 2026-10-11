# Decision record

## 2026-10-11 Choose Electron and web technologies for V1

Rurinagi V1 uses Electron, React, TypeScript, and Vite. Electron directly supports Windows windows, global shortcuts, notifications, and later tray integration while using the Node toolchain already installed on the development machine. React and CSS support the required high-fidelity, accessible interaction system.

Tauri would reduce binary size but requires a Rust toolchain that is not installed. WinUI 3 would provide the closest native Windows surface but requires a .NET and Visual Studio toolchain that is also absent and would not reuse the supplied web-oriented Apple interaction guidance as directly. Electron's larger packaged footprint is accepted for V1.

## 2026-10-11 Use built-in SQLite with a versioned state document

V1 stores one validated, versioned application-state document in SQLite using Electron's bundled `node:sqlite`. SQLite provides atomic durable writes, backup as one file, and a migration boundary without a native npm database dependency.

The aggregate document keeps V1 implementation small. Normalize tasks and sessions into relational tables before complex V3 analytics queries.

## 2026-10-11 Keep timer truth as timestamps

A running timer persists its end timestamp instead of writing once per second. The renderer derives display time, while startup recovery finalizes an elapsed focus session. This survives window closure and restart without write churn.

## 2026-10-11 Use restrained Apple-inspired behavior on Windows

The UI uses immediate press feedback, system typography, translucent navigation, solid content surfaces, symmetric panel motion, and reduced-motion alternatives. It retains Windows window controls and keyboard behavior instead of imitating macOS chrome.

## 2026-10-11 Publish compiled downloads without publishing source

The project website is a dependency-free static site deployed with GitHub Actions. Publishing a tagged GitHub Release triggers Pages to fetch those exact versioned assets and inject them into the public site artifact, so website downloads match the recorded checksums byte-for-byte. If the GitHub account plan does not support Pages from private repositories, a public site-only repository is the fallback; the application repository remains private.

## 2026-10-11 Gate tags on full release verification

Version tags are created only after TypeScript validation, domain tests, SQLite round-trip tests, packaged Electron end-to-end workflows, dependency audit, distributable creation, checksum generation, and website browser QA pass. The V1 audit replaced an unsupported browser prompt with an in-app project modal, honored the discard-confirmation setting, hardened imported-state validation, and removed inert controls.

## 2026-10-11 Define the focused V2 contract

V2 adds the previously deferred Windows tray lifecycle and resolves the user-reported visual issues without expanding into analytics, accounts, or integrations. The main window closes to the tray; its menu restores the app, opens Quick Capture, or exits explicitly. The UI adopts the website palette (`#315F4D` and `#17392D`) with lighter related greens in dark mode for contrast. Task project metadata uses an explicit layout gap, and shortcut settings translate `CommandOrControl+Shift+Space` to the readable `Ctrl + Shift + Space` presentation without breaking persisted accelerators.

## 2026-10-11 Separate archive, delete, create, and focus intent

Archive remains a non-destructive organizational state, while Delete permanently removes only the task after explicit confirmation and preserves existing session history. Delete is blocked for a running or paused timer to preserve timer integrity. Add task uses a direct label and soft-green creation treatment in the page header.

Native select popups cannot be consistently themed on Windows, so V2 uses one reusable in-app listbox control with keyboard navigation, selection state, focus handling, outside-click dismissal, and app-native surfaces. Destructive confirmations use reusable Rurinagi dialogs instead of operating-system browser prompts.

## 2026-10-11 Require a name before task creation

Add task opens an in-app dialog with a focused Task name field. Create task stays disabled for blank input, and cancellation creates no data. After submission, the named task is selected in the existing inspector for optional details; the app no longer inserts a `New task` placeholder that the user must rename.

## 2026-10-11 Make task inspection contextual and updates explicit

The Tasks screen does not reserve empty inspector space. Selecting or creating a task reveals a draft-backed inspector; Update task persists the draft and returns to the full-width list. Start focus saves the same draft before starting, while Archive carries draft edits into the archived record. This prevents an always-visible empty panel and distinguishes creating a task from updating one.

## 2026-10-11 Replace the native date picker with an app-rendered calendar

Windows renders `input[type="date"]` with operating-system chrome that conflicts with Rurinagi's visual language and cannot be styled reliably. Task Details and Quick Capture now share one dependency-free calendar control using the existing green palette, solid floating surfaces, explicit Today and Clear actions, and desktop keyboard navigation. Stored values remain local `YYYY-MM-DD` strings, so no data migration or persistence change is required.

## 2026-10-11 Derive V3 insights from local session history

V3 adds one pure `buildFocusInsights` function and one Insights screen. A rolling seven-day Focus Skyline, previous-period comparison, project distribution, completion rate, and streaks are calculated when session history changes. This keeps the schema at version 1, avoids a chart dependency and migration, and preserves the product's offline privacy boundary. Relational normalization remains unnecessary at the current data volume.

## 2026-10-11 Establish one scalable Rurinagi logo

The existing two-wave motif becomes the formal Rurinagi mark: two calm currents on the established green gradient. One SVG is the editable source, while a small script using the already-installed Playwright tooling produces a 512 px PNG and a seven-size Windows ICO. The same geometry now appears in the renderer, website favicon, application windows, tray, executable, and installer without adding a graphics dependency.

## 2026-10-11 Keep Squirrel installation and add first-run setup

Squirrel already installs Rurinagi as a normal Windows application, manages Start Menu and desktop shortcuts, and removes those shortcuts during uninstall. Replacing the packaging stack only to display a traditional installer wizard would add risk without improving the installed application. Rurinagi instead opens a two-step, app-owned setup experience on the first launch after installation.

The setup explains local storage and offers desktop notifications and Start with Windows as independent, default-off choices. Completion is stored in renderer-local storage rather than the exportable task database, so importing or clearing productivity data does not re-run installation setup. Privacy and Terms links cross the sandbox only through an exact policy-URL allowlist.

Code signing remains required for a trusted public installer but cannot be completed without a publisher certificate and protected signing credentials.

## 2026-10-11 Publish V3 unsigned for personal and trusted distribution

V3 is published without Windows code signing because its present audience is the project owner and other users who independently trust the project. The website, README, and release notes must disclose that Windows may show SmartScreen and an `Unknown publisher` identity, and must provide SHA-256 checksums for download verification.

This is an accepted distribution risk, not a claim that the installer has a verified publisher identity. Code signing remains deferred until the app is distributed broadly or commercially.

## 2026-10-11 Align Windows identity and make relaunch single-instance

V3.0.1 uses Squirrel's generated `com.squirrel.rurinagi.rurinagi` AppUserModelID so the running app and installed shortcuts share one Windows identity. Rurinagi also owns a single-instance lock: launching it while the tray process is active restores and focuses the existing window instead of starting a duplicate process tree.

Release verification now launches the hardened packaged `Rurinagi.exe` directly, hides it through the Windows close-window message, launches it again, and verifies that the original window returns. This closes the gap left by the earlier development-runtime-only restart test.

