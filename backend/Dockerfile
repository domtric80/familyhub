FROM php:8.5-cli-alpine

RUN apk add --no-cache \
    bash \
    git \
    icu-libs \
    postgresql-client \
    unzip \
    zip \
    && apk add --no-cache --virtual .build-deps \
    $PHPIZE_DEPS \
    icu-dev \
    libpq-dev \
    linux-headers \
    oniguruma-dev \
    && docker-php-ext-install intl pcntl pdo_pgsql \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

CMD ["php", "-v"]
