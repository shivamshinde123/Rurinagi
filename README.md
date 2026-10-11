# Rurinagi

Rurinagi is a private, offline-first Windows desktop app for choosing one meaningful task, focusing on it, taking a deliberate break, and reviewing the day.

## Install on Windows

1. Download `Rurinagi-3.1.0-Setup.exe` from the GitHub Release or project website.
2. Double-click the installer.
3. This release is not code-signed. If Windows SmartScreen appears, choose **More info**, verify the app name is Rurinagi, then choose **Run anyway** only if you trust this project.
4. Complete Rurinagi's two-step first-run setup.

Windows may show the publisher as **Unknown publisher**. Verify the download's SHA-256 value against [`docs/release-checksums-v3.1.0.txt`](docs/release-checksums-v3.1.0.txt) before running it.

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

