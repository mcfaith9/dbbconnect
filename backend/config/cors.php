<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    | Configured for DBB Connect: Vue frontend to Laravel Sanctum REST API.
    | In development: allows localhost, LAN (192.168.x.x), and Tailscale (100.x.x.x).
    | In production: strictly restricted to FRONTEND_URL from environment.
    | Authentication uses stateless Bearer tokens (supports_credentials => false).
    */

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter(explode(',', (string) env(
        'FRONTEND_URL',
        'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000,http://192.168.1.38:5173,http://100.87.162.99:5173'
    ))),

    // In production, disable regex patterns and strictly enforce allowed_origins
    'allowed_origins_patterns' => env('APP_ENV') === 'production' ? [] : [
        '#^http://localhost(:\d+)?$#',
        '#^http://127\.0\.0\.1(:\d+)?$#',
        '#^http://100\.\d+\.\d+\.\d+(:\d+)?$#',
        '#^http://192\.168\.\d+\.\d+(:\d+)?$#',
        '#^http://10\.\d+\.\d+\.\d+(:\d+)?$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['Authorization'],

    'max_age' => 0,

    // Set to false for stateless Bearer token authentication (no session cookies needed)
    'supports_credentials' => false,
];

