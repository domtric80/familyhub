<?php

return [
    'token_absolute_ttl_minutes' => (int) env('AUTH_TOKEN_TTL_MINUTES', 480),
    'token_idle_timeout_minutes' => (int) env('AUTH_TOKEN_IDLE_TIMEOUT_MINUTES', 60),
    'login_context_ttl_minutes' => (int) env('AUTH_LOGIN_CONTEXT_TTL_MINUTES', 10),
];
