# Technology stack

## Selected stack

| Layer | Technology | Rationale |
| --- | --- | --- |
| Desktop runtime | Electron | Direct Windows windows, global shortcuts, notifications, packaging, and Node integration in the privileged process. |
| UI | React with TypeScript | Predictable state-driven screens and accessible reusable components, including a dependency-free CSS Focus Skyline. |
| Build | Vite and Electron Forge | Fast renderer development and repeatable Windows packaging. Forge's Vite integration is currently experimental, so versions are locked and builds are verified in CI. |
| Persistence | Electron bundled `node:sqlite` | Durable local transactions without a native npm database dependency. |
| Styling | Plain CSS design tokens | Small dependency surface and direct control of motion, themes, contrast, and platform media queries. |
| Tests | Node test runner | Covers timer and state logic without adding a test framework. |

## Alternatives considered

- Tauri 2: smaller binaries and strong capability isolation, but the required Rust toolchain is not installed and would slow V1 delivery.
- WinUI 3 or WPF: strong native Windows integration, but the .NET SDK is not installed and the supplied design approach maps more directly to web UI.
- Electron with a native SQLite npm addon: mature, but adds ABI rebuild and packaging risk. Built-in SQLite is sufficient for V1.

## Future decisions

Code signing, auto-update distribution, integration providers, and AI runtime remain TBD. A chart library is intentionally unnecessary for the current seven-day visualization.

