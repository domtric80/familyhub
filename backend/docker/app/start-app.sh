#!/bin/sh
set -eu

cd /var/www/html

rm -f /usr/local/etc/php/conf.d/docker-php-ext-zip.ini

until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" >/dev/null 2>&1; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

if [ ! -f .env ]; then
  cp .env.example .env
fi

if [ ! -f vendor/autoload.php ]; then
  composer install --no-interaction
fi

php artisan storage:link || true
php artisan migrate --force
php artisan familyhub:ensure-bootstrap --seed-missing-only

if [ "${APP_ENV:-local}" = "local" ] && [ "${FAMILYHUB_ENSURE_LOCAL_ADMIN_PASSWORD:-false}" = "true" ]; then
  php artisan familyhub:reset-admin-access \
    "${FAMILYHUB_LOCAL_ADMIN_EMAIL:-admin@familyhub.local}" \
    --password="${FAMILYHUB_LOCAL_ADMIN_PASSWORD:-password}"
fi

cd public
exec php -S 0.0.0.0:8000 ../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php
