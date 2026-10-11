# Rurinagi

Rurinagi is a private, offline-first Windows desktop app for choosing one meaningful task, focusing on it, taking a deliberate break, and reviewing the day.

## Development

```powershell
npm.cmd install
npm.cmd start
```

## Verification

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Create the Windows installer and portable ZIP:

```powershell
npm.cmd run make
```

Artifacts are written under `out/make/`.

## Website

The static product site lives in [`site/`](site/). Publishing a GitHub Release deploys the site with those exact versioned Windows downloads, while keeping application source private.

Project decisions and implementation documentation live in [`docs/`](docs/).

