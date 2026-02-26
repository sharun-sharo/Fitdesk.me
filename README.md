# FitDesk – Multi-tenant Gym Management SaaS

Production-ready multi-tenant Gym Management SaaS with Next.js 14, TypeScript, TailwindCSS, ShadCN-style UI, PostgreSQL (Prisma), and JWT auth.

## Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, TailwindCSS, Radix UI, Recharts
- **Backend:** Next.js API routes
- **Database:** PostgreSQL (Railway) with Prisma ORM
- **Auth:** JWT in httpOnly cookies, role-based (Super Admin, Gym Owner)
- **Deploy:** Vercel (frontend) + Railway (PostgreSQL)

## Roles

1. **Super Admin** – Platform owner: manage gyms, subscription plans, reports
2. **Gym Owner** – Customer: dashboard, clients, AI insights, reports

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment

Copy `.env.example` to `.env` and set:

- `DATABASE_URL` – PostgreSQL connection string (e.g. from Railway)
- `JWT_SECRET` – Min 32 characters
- `NEXT_PUBLIC_APP_URL` – App URL (e.g. `http://localhost:3000`)

### 3. Database

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

### 4. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo logins (after seed)

- **Super Admin:** `admin@fitdesk.com` / `admin123`
- **Gym Owner:** `owner@gym.com` / `owner123`

## Project structure

```
src/
├── app/
│   ├── api/           # API routes (auth, dashboard, admin)
│   ├── dashboard/     # Gym owner panel (dashboard, clients, insights, reports)
│   ├── admin/         # Super admin panel
│   └── login/
├── components/        # UI components and layouts
├── lib/               # Prisma, auth, utils, export, AI insights
└── hooks/
prisma/
├── schema.prisma
└── seed.ts
```

## Scripts

- `npm run dev` – Dev server
- `npm run build` – Production build
- `npm run db:generate` – Prisma generate
- `npm run db:push` – Push schema (no migrations)
- `npm run db:seed` – Seed demo data
- `npm run db:studio` – Prisma Studio

See **DEPLOYMENT.md** for Vercel + Railway deployment.
# Fitdesk
