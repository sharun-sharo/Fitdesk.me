#!/bin/sh
# Run against PRODUCTION only. Baselines the DB then applies pending migrations.
# Usage: DATABASE_URL="postgresql://..." ./scripts/baseline-and-deploy.sh
# Or:    export DATABASE_URL="postgresql://..."; ./scripts/baseline-and-deploy.sh
#
# If the trainer migration keeps failing (P3018), use:
#   DATABASE_URL="..." SKIP_TRAINER_MIGRATION=1 ./scripts/baseline-and-deploy.sh
# to mark it applied and only run the client profile photo migration.

set -e
cd "$(dirname "$0")/.."

if [ -z "$DATABASE_URL" ]; then
  echo "Error: Set DATABASE_URL to your production database URL."
  exit 1
fi

echo "Baseline: marking initial migration as already applied..."
npx prisma migrate resolve --applied "20260226113334_add_trainers_and_attendance" 2>/dev/null || true

if [ -n "$SKIP_TRAINER_MIGRATION" ]; then
  echo "Skipping trainer migration (marking as applied)..."
  npx prisma migrate resolve --rolled-back "20250225000000_trainer_attendance_structured" 2>/dev/null || true
  npx prisma migrate resolve --applied "20250225000000_trainer_attendance_structured" 2>/dev/null || true
fi

echo "Deploying pending migrations..."
npx prisma migrate deploy

echo "Done."
