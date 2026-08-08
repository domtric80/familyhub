#!/bin/sh
set -eu

cd /var/www/html

until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" >/dev/null 2>&1; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

if [ ! -f .env ]; then
  cp .env.example .env
fi

composer install --no-interaction
php artisan storage:link || true
php artisan migrate --force
php artisan familyhub:ensure-bootstrap --seed-missing-only

if [ "${APP_ENV:-local}" = "local" ] && [ "${FAMILYHUB_ENSURE_LOCAL_ADMIN_PASSWORD:-true}" = "true" ]; then
  php artisan familyhub:reset-admin-access \
    "${FAMILYHUB_LOCAL_ADMIN_EMAIL:-admin@familyhub.local}" \
    --password="${FAMILYHUB_LOCAL_ADMIN_PASSWORD:-password}"
fi

echo "FamilyHub app initialized."
