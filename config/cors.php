<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Laravel CORS Options
    |--------------------------------------------------------------------------
    |
    | The allowed_origins, allowed_headers and allowed_methods options are
    | used to specify which origins, headers and methods are allowed for
    | cross-origin requests. The supports_credentials option can be used
    | to specify whether or not the response to the request can be exposed
    | when the credentials flag is true.
    |
    */

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['http://192.168.1.10:8000'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];