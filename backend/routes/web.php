<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'FamilyHub API',
        'status' => 'ok',
        'docs' => '/up',
    ]);
});
