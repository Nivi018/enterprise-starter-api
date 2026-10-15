#!/bin/sh
set -eu

echo "Applying database migrations..."
i=0
until npx prisma migrate deploy; do
  i=$((i + 1))
  if [ "$i" -gt 30 ]; then
    echo "Database migration failed after ${i} attempts"
    exit 1
  fi
  echo "Database is not ready (attempt ${i}). Retrying..."
  sleep 2
done

if [ "${SEED_ON_START:-false}" = "true" ]; then
  echo "Seeding demo data..."
  npx prisma db seed
fi

echo "Starting API on port ${PORT:-3001}..."
exec node dist/main.js
