#!/bin/sh
set -eu

cd /var/www/html

rm -f /usr/local/etc/php/conf.d/docker-php-ext-zip.ini

until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" >/dev/null 2>&1; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

until [ -f vendor/autoload.php ]; do
  echo "Waiting for application dependencies..."
  sleep 2
done

php artisan schedule:work --verbose --no-interaction
