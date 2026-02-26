# FitDesk – Database setup

Login fails until the app can connect to PostgreSQL. Do **one** of the following.

---

## Option A: Local PostgreSQL

1. **Install PostgreSQL** (if needed):
   - **macOS:** `brew install postgresql@16` then `brew services start postgresql@16`
   - **Windows:** [PostgreSQL installer](https://www.postgresql.org/download/windows/)
   - **Linux:** `sudo apt install postgresql postgresql-contrib` (or your distro’s package)

2. **Create the database:**
   ```bash
   createdb fitdesk
   ```
   (Or in `psql`: `CREATE DATABASE fitdesk;`)

3. **Use this in `.env`:**
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fitdesk"
   ```
   Change `postgres:postgres` if your local user/password are different.

4. **Apply schema and seed:**
   ```bash
   npx prisma db push
   npm run db:seed
   ```

---

## Option B: Free cloud PostgreSQL (no local install)

1. **Get a free Postgres URL:**
   - [Neon](https://neon.tech) – sign up, create a project, copy the connection string.
   - [Supabase](https://supabase.com) – new project → Settings → Database → connection string (URI).
   - [Railway](https://railway.app) – new project → Add PostgreSQL → connect → copy `DATABASE_URL`.

2. **Put it in `.env`:**
   ```env
   DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
   ```

3. **Apply schema and seed:**
   ```bash
   npx prisma db push
   npm run db:seed
   ```

---

## After DB is set up

- Restart the dev server: `npm run dev`
- Log in with:
  - **Admin:** `admin@fitdesk.com` / `admin123`
  - **Gym owner:** `owner@gym.com` / `owner123`
