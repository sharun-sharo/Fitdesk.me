# FitDesk – Production deploy checklist

## Pre-deploy (done)

- [x] `npm run build` passes
- [x] Viewport moved to separate export (no build warnings)
- [x] Prisma schema and migrations in place

## Before first deploy

1. **Environment variables** (e.g. Railway → Fitdesk service → Variables)

   Set these from `.env.example`:

   - `DATABASE_URL` – PostgreSQL URL (Railway Postgres provides this)
   - `JWT_SECRET` – Strong secret, at least 32 characters (e.g. `openssl rand -base64 32`)
   - `NEXT_PUBLIC_APP_URL` – Your production URL (e.g. `https://your-app.up.railway.app`)

   Optional:

   - `OPENAI_API_KEY` – For AI Insights
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` – For WhatsApp reminders

2. **Database**

   - Link the **Postgres** service to the **Fitdesk** service so `DATABASE_URL` is set.
   - Run migrations on the production DB (one-time, or as part of deploy):
     ```bash
     npx prisma migrate deploy
     ```
   - **One-time fix for production (recommended):** Run this with your production `DATABASE_URL` (from Railway → Postgres → Variables):
     ```bash
     DATABASE_URL="postgresql://..." ./scripts/fix-prod-migrations.sh
     ```
   - **If you get "P3005: The database schema is not empty"**, baseline then deploy:
     ```bash
     DATABASE_URL="postgresql://..." ./scripts/baseline-and-deploy.sh
     ```
   - **If you get "P3018: A migration failed to apply"**, run:
     ```bash
     npx prisma migrate resolve --rolled-back "20250225000000_trainer_attendance_structured"
     npx prisma migrate deploy
     ```
     (with production `DATABASE_URL` set)
   - Optional: seed admin/sample data (if you have a seed script):
     ```bash
     npm run db:seed
     ```

3. **Build command** (Railway)

   Use:

   ```bash
   npm run build
   ```

   (This already runs `prisma generate` before `next build`.)

4. **Start command**

   Use:

   ```bash
   npm start
   ```

   (Runs `next start`.)

## After deploy

- Open `NEXT_PUBLIC_APP_URL` and log in (create a gym owner if needed).
- Check `/api/health` if you use it for monitoring.

## Client profile photos (uploads)

- Photos are stored under `public/uploads/clients/`. On Railway, the filesystem is ephemeral, so uploads will be lost on redeploy unless you use a volume or external storage (e.g. S3). For a quick MVP, this is fine; for production persistence, add object storage later.
