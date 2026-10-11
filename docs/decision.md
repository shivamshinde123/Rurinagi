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

