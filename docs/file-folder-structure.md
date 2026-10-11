# File and folder structure

```text
Rurinagi/
  docs/                    Project specifications and decisions
  src/
    main/                  Privileged Electron process and storage
    preload/               Narrow renderer bridge
    renderer/
      app.tsx               State coordinator, V1 screens, and small shared components
      styles.css            Tokens, layout, states, and accessibility
      main.tsx              React entry point
    shared/
      domain.ts             Shared V1 domain model and timer logic
  tests/                   Pure domain behavior tests
    e2e/                   Packaged Electron workflow coverage
  site/                    Static GitHub Pages product site
  .github/workflows/       Verified release and Pages automation
  forge.config.ts          Desktop packaging configuration
  vite.*.config.ts         Process-specific Vite configuration
```

Generated output belongs in `dist/` or `out/` and is not committed. The Pages workflow injects compiled downloads into a temporary `site/downloads/` directory during deployment.

