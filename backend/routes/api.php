<?php

use App\Models\User;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {
    Log::info('=== EMAIL VERIFICATION ATTEMPT ===', [
        'user_id' => $id,
        'hash' => $hash,
        'url' => $request->fullUrl()
    ]);

    try {
        // Cari user berdasarkan user_id
        $user = User::where('user_id', $id)->first();

        if (!$user) {
            Log::error('User not found', ['user_id' => $id]);
            return response()->json([
                'status' => 'error',
                'message' => 'User not found'
            ], 404);
        }

        Log::info('User found', [
            'user_id' => $user->user_id,
            'email' => $user->email,
            'verified' => $user->hasVerifiedEmail()
        ]);

        // Validasi hash
        $expectedHash = sha1($user->getEmailForVerification());
        if (!hash_equals($expectedHash, (string) $hash)) {
            Log::error('Invalid hash', [
                'expected' => $expectedHash,
                'received' => $hash
            ]);
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid verification link'
            ], 400);
        }

        // Validasi signature
        if (!URL::hasValidSignature($request)) {
            Log::error('Invalid signature');
            return response()->json([
                'status' => 'error',
                'message' => 'Verification link has expired or is invalid'
            ], 400);
        }

        // Cek jika sudah verified
        if ($user->hasVerifiedEmail()) {
            Log::info('Email already verified');
            return response()->json([
                'status' => 'success',
                'message' => 'Email already verified'
            ], 200);
        }

        // Mark sebagai verified
        $user->markEmailAsVerified();
        Log::info('Email verified successfully', ['user_id' => $user->user_id]);

        return response()->json([
            'status' => 'success',
            'message' => 'Email verified successfully!'
        ], 200);

    } catch (\Exception $e) {
        Log::error('Email verification error', [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]);

        return response()->json([
            'status' => 'error',
            'message' => 'Verification failed: ' . $e->getMessage()
        ], 500);
    }
})->name('verification.verify');

// Resend Verification Email
Route::post('/email/resend', function (Request $request) {
    $request->validate(['email' => 'required|email']);

    $user = User::where('email', $request->email)->first();

    if (!$user) {
        return response()->json([
            'status' => 'error',
            'message' => 'User not found'
        ], 404);
    }

    if ($user->hasVerifiedEmail()) {
        return response()->json([
            'status' => 'error',
            'message' => 'Email already verified'
        ], 400);
    }

    $verificationUrl = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        [
            'id' => $user->user_id, // ← Pakai user_id
            'hash' => sha1($user->email),
        ]
    );

    Log::info('Resending verification email', [
        'user_id' => $user->user_id,
        'email' => $user->email,
        'url' => $verificationUrl
    ]);

    Mail::to($user->email)->send(new \App\Mail\VerifyEmail($verificationUrl));

    return response()->json([
        'status' => 'success',
        'message' => 'Verification link resent!'
    ], 200);
});

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', fn(Request $request) => $request->user());

    Route::middleware('admin')->group(function () {
        Route::get('/admin', fn() => response()->json(['message' => 'Admin access granted']));
    });
});