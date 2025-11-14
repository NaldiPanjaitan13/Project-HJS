<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\Request;

Route::get('/', function () {
    return view('welcome');
});
Route::get('/login', function () {
    return response()->json(['message' => 'Login via API only']);
})->name('login');
