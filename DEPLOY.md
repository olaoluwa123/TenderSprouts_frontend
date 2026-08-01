# Deploy setup (GitHub → Vercel)

Pushing to `main` on this repo runs `.github/workflows/deploy-vercel.yml`, which builds the Vite app and deploys it to Vercel.

## One-time Vercel link

From this `frontend` folder (with the Vercel CLI logged in):

```bash
npx vercel login
npx vercel link
```

That creates `.vercel/project.json` locally. Copy the IDs into GitHub secrets (do not commit `.vercel/`).

## GitHub secrets

In [TenderSprouts_frontend](https://github.com/olaoluwa123/TenderSprouts_frontend) → **Settings → Secrets and variables → Actions**:

| Secret | Where to get it |
| --- | --- |
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | `.vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` → `projectId` |

Optional repository **variable** (not a secret):

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Public API origin for the portal, e.g. `https://api.yourdomain.com` |

## Flow

1. Commit and push to `main` on GitHub.
2. GitHub Actions builds the site.
3. Vercel receives a production deploy (preview deploys run on pull requests).
