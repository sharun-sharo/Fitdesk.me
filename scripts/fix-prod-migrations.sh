#!/bin/sh
# Run this ONCE against production to fix migration state and apply Client.profilePhoto.
# Usage: DATABASE_URL="postgresql://user:pass@host:port/railway" ./scripts/fix-prod-migrations.sh
# Get DATABASE_URL from Railway → Postgres service → Variables → DATABASE_URL

set -e
cd "$(dirname "$0")/.."

if [ -z "$DATABASE_URL" ]; then
  echo "Error: Set DATABASE_URL to your production database URL."
  echo "Example: DATABASE_URL=\"postgresql://postgres:PASSWORD@host:port/railway\" ./scripts/fix-prod-migrations.sh"
  exit 1
fi

echo "1. Clearing any failed migration state..."
npx prisma migrate resolve --rolled-back "20250225000000_trainer_attendance_structured" 2>/dev/null || true

echo "2. Marking initial migration as applied (if not already)..."
npx prisma migrate resolve --applied "20260226113334_add_trainers_and_attendance" 2>/dev/null || true

echo "3. Deploying pending migrations..."
npx prisma migrate deploy

echo "Done. Clients page should work now. If you still see errors, check Railway logs."
