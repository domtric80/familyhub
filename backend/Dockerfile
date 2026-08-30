FROM php:8.4-cli-alpine@sha256:2f389f933c3cc58cc622bd243bb4ecff7e6553e2de4387a239bca640c988be19

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

COPY --from=composer:2@sha256:4d71c3c2109c61d5415544264b59ad4087e4c5b7244481723664138fd36d5040 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

CMD ["php", "-v"]
