# Rurinagi V3 verification report

Date: 2026-10-11  
Version: `3.0.1`

## Automated verification

- TypeScript: `npm run lint` passed.
- Domain and storage: 15 tests passed, including privacy-sensitive defaults, the policy URL allowlist, rolling-week totals, previous-period comparison, project distribution, completion rate, streak calculation, timer recovery, import validation, and SQLite round trips.
- Packaged Electron workflow: passed across first-run setup, setup persistence after restart, Today, Tasks, Focus, History, Insights, Settings, Quick Capture, task/project editing, themed controls, confirmations, timer and break behavior, tray hiding, restart recovery, export, import, backup, archive, deletion, and clear-data behavior.
- Packaged Windows relaunch: passed by launching `Rurinagi.exe`, closing its window to the tray, launching the executable again, and verifying the existing Rurinagi window was restored while the redundant process exited.
- Dependency audit: `npm audit --audit-level=high` reported 0 vulnerabilities.
- Diff hygiene: `git diff --check` passed.

## Visual and accessibility verification

- The packaged Insights screen was captured at `output/playwright/v3-insights.png` and inspected at its native viewport.
- Both first-run steps were captured at `output/playwright/first-run-setup.png` and `output/playwright/first-run-preferences.png` and visually inspected at their native viewport.
- Privacy and Terms were rendered in installed Microsoft Edge through a local static server with zero browser console errors; the Privacy page was visually inspected at its full-page viewport.
- Focus Skyline exposes seven labeled list items with duration and session-count text for assistive technology.
- Project breakdown, current streak, longest streak, empty states, responsive layout, dark theme variables, increased contrast, reduced transparency, and reduced motion have explicit styles.
- Sub-minute positive focus is shown as `<1m`, avoiding a misleading zero-duration label.
- Icons extracted from the packaged application and installer match the Rurinagi two-current mark.

## Distributables

- `Rurinagi-3.0.1-Setup.exe` — 154,308,608 bytes
- `Rurinagi-win32-x64-3.0.1.zip` — 158,736,267 bytes

SHA-256 values are stored in `docs/release-checksums-v3.0.1.txt`.

The artifacts include the Rurinagi logo and third-party notices. The installer is intentionally unsigned for this personal and trusted-user release. SmartScreen and `Unknown publisher` behavior are disclosed on the website, in the README, and in the release notes; code signing remains a follow-up before broad or commercial distribution.
