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

