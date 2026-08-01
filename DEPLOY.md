# Deploy frontend (Vercel) and link to Railway API

Pushing to `main` on this repo runs `.github/workflows/deploy-vercel.yml`, which builds the Vite app and deploys it to Vercel.

The Spring Boot API is **not** on Vercel. Deploy it on Railway first (see the backend repo [`DEPLOY.md`](https://github.com/olaoluwa123/TenderSprouts_backend/blob/main/DEPLOY.md)), then wire the two with env vars below.

```text
Browser → Vercel (this frontend)
       → Railway https://<api-host>/api/*
```

## One-time Vercel link

From this `frontend` folder (with the Vercel CLI logged in):

```bash
npx vercel login
npx vercel link
```

That creates `.vercel/project.json` locally. Copy the IDs into GitHub secrets (do not commit `.vercel/`).

## GitHub secrets (Actions → Vercel deploy)

In [TenderSprouts_frontend](https://github.com/olaoluwa123/TenderSprouts_frontend) → **Settings → Secrets and variables → Actions**:

| Secret | Where to get it |
| --- | --- |
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | `.vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` → `projectId` |

## Link to the Railway API (required for portal login)

Repository **variable** (Settings → Secrets and variables → Actions → Variables), and/or the same name in the Vercel project Environment Variables:

| Variable | Value |
| --- | --- |
| `VITE_API_BASE_URL` | `https://<your-railway-host>/api` |

Include the `/api` suffix. Example: `https://tendersprouts-api.up.railway.app/api`.

Vite inlines `VITE_*` at **build** time. After changing this variable, redeploy the frontend (push to `main` or re-run the workflow / Vercel redeploy).

### Matching CORS on Railway

On the Railway service, set:

| Variable | Value |
| --- | --- |
| `FRONTEND_ORIGIN` | Your Vercel URL, e.g. `https://your-app.vercel.app` |

No trailing slash. Must match the browser origin exactly (including custom domains if you add one later).

## CORS / link checklist

1. Railway API is up: `https://<railway-host>/actuator/health`.
2. `VITE_API_BASE_URL` ends with `/api`.
3. Railway `FRONTEND_ORIGIN` equals the live frontend origin.
4. Frontend was rebuilt after setting `VITE_API_BASE_URL`.
5. Portal login Network tab shows requests to Railway, not `localhost:8080`.

## Flow

1. Deploy backend on Railway and set `FRONTEND_ORIGIN` + `JWT_SECRET` (see backend `DEPLOY.md`).
2. Set `VITE_API_BASE_URL` on GitHub Actions / Vercel.
3. Commit and push frontend to `main` (or trigger deploy).
4. Open the Vercel site → Portal login → confirm API calls succeed.
