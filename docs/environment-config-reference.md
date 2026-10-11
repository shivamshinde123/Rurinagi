# Environment and configuration reference

Rurinagi V3 requires no secrets and no runtime network configuration. Insights use only the locally stored session history.

| Setting | Default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | supplied by build tooling | Select development or production behavior. |
| `VITE_DEV_SERVER_URL` | set by Electron Forge | Renderer development server URL. |

User preferences are stored inside the local application state, not environment variables. Never put secrets or private user content in `.env` files or commit local SQLite files.

