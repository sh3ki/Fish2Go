<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('products', function () {
    return true;
});
