# FitDesk – Deployment (Vercel + Railway)

## Overview

- **Vercel:** Next.js app (frontend + API routes)
- **Railway:** PostgreSQL database

## 1. Railway – PostgreSQL

1. Go to [railway.app](https://railway.app) and sign in.
2. **New Project** → **Provision PostgreSQL**.
3. Open the PostgreSQL service → **Variables** or **Connect**.
4. Copy the **DATABASE_URL** (or construct it: `postgresql://user:password@host:port/railway?sslmode=require`).

Keep this for the next step.

## 2. Vercel – Next.js app

1. Push the repo to GitHub (if not already).
2. Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → import the repo.
3. **Framework Preset:** Next.js.
4. **Environment variables** (add these):

   | Name | Value |
   |------|--------|
   | `DATABASE_URL` | Your Railway PostgreSQL URL |
   | `JWT_SECRET` | A long random string (min 32 chars) |
   | `NEXT_PUBLIC_APP_URL` | Your Vercel URL, e.g. `https://your-app.vercel.app` |

5. Deploy. Vercel will run `npm run build` (and `prisma generate` if you add it to `postbuild`).

### Optional: Prisma in build

To run `prisma generate` during Vercel build, in **package.json**:

```json
"scripts": {
  "postinstall": "prisma generate",
  ...
}
```

Or in Vercel project settings → **Build & Development Settings** → **Build Command**:  
`npx prisma generate && next build`

## 3. Database migrations on production

After first deploy you need to create tables. Options:

**A) From your machine (recommended)**  
With `DATABASE_URL` in your local `.env` pointing to Railway:

```bash
npx prisma db push
npm run db:seed
```

**B) From Vercel (one-off)**  
Use Vercel’s “Run command” or a one-off script/API route that runs `prisma db push` and seed (be careful with secrets and access).

## 4. Post-deploy checklist

- [ ] `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL` set in Vercel.
- [ ] Schema applied: `npx prisma db push` (and optionally seed).
- [ ] Login works and redirects: Super Admin → `/admin`, Gym Owner → `/dashboard`.
- [ ] Cookie domain: if you use a custom domain, ensure cookies work (SameSite, secure, domain).

## 5. Custom domain (optional)

In Vercel: Project → **Settings** → **Domains** → add your domain.  
Update `NEXT_PUBLIC_APP_URL` to that domain.

## 6. Env summary

| Env | Where | Purpose |
|-----|--------|---------|
| `DATABASE_URL` | Vercel (and local) | PostgreSQL connection (Railway) |
| `JWT_SECRET` | Vercel (and local) | Signing JWTs |
| `NEXT_PUBLIC_APP_URL` | Vercel (and local) | App URL for redirects/cookies |

No separate “backend” server: Next.js API routes on Vercel talk to Railway PostgreSQL directly.
