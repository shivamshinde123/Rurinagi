# Coding conventions

## TypeScript

- Use strict TypeScript and explicit domain types.
- Keep platform access in `src/main` and `src/preload`; renderer code must not import Node or Electron modules.
- Prefer small pure functions for timer calculations and state changes.
- Use ISO 8601 UTC strings for stored timestamps and `YYYY-MM-DD` for planned dates.
- Validate data at IPC and import boundaries.
- Do not add an abstraction until at least two real call sites need it.

## React

- Use function components and semantic HTML.
- Keep interactive targets at least 44 by 44 CSS pixels.
- Pair color states with text or icons and preserve visible keyboard focus.
- Keep screen-specific UI in `src/renderer/screens` and shared UI in `src/renderer/components`.

## Styling

- Use the design tokens in `src/renderer/styles.css`.
- Animate only transform and opacity for ordinary transitions.
- Respect reduced motion, reduced transparency, increased contrast, and text scaling.
- Use the system font stack and tabular numerals for timers.

