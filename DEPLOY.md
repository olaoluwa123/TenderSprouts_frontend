# Deploy frontend (static build)

This repo no longer deploys to Vercel. Build the Vite app and serve `dist/` from cPanel, nginx, or Docker.

```text
Browser → tendersprouts.com.ng (this frontend)
       → Spring Boot API at VITE_API_BASE_URL
```

## Build

```bash
npm ci
VITE_API_BASE_URL=https://<api-host>/api npm run build
```

Include the `/api` suffix. Vite inlines `VITE_*` at **build** time, so rebuild after changing it.

Upload or copy `dist/` to the web root (cPanel `public_html`, or the image built from `Dockerfile` + `nginx.conf`).

## CORS on the API

On the backend, set:

| Variable | Value |
| --- | --- |
| `FRONTEND_ORIGIN` | Exact browser origin, e.g. `https://tendersprouts.com.ng` |

No trailing slash. Must match the browser origin exactly.

## Checklist

1. API is up (for example `/actuator/health`).
2. `VITE_API_BASE_URL` ends with `/api`.
3. Backend `FRONTEND_ORIGIN` equals the live frontend origin.
4. Frontend was rebuilt after setting `VITE_API_BASE_URL`.
5. Portal login Network tab shows requests to the API host, not `localhost:8080`.
