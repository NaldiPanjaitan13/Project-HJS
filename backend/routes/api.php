<?php

use App\Models\User;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\StockTransactionController;
use App\Http\Controllers\StockOpnameController;
use App\Http\Controllers\ProfitReportController;
use App\Http\Controllers\ProductQrLogController;

// Authentication
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Email Verification
Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {
    Log::info('=== EMAIL VERIFICATION ATTEMPT ===', [
        'user_id' => $id,
        'hash' => $hash,
        'url' => $request->fullUrl()
    ]);

    try {
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

        if (!URL::hasValidSignature($request)) {
            Log::error('Invalid signature');
            return response()->json([
                'status' => 'error',
                'message' => 'Verification link has expired or is invalid'
            ], 400);
        }

        if ($user->hasVerifiedEmail()) {
            Log::info('Email already verified');
            return response()->json([
                'status' => 'success',
                'message' => 'Email already verified'
            ], 200);
        }

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
            'id' => $user->user_id,
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

Route::prefix('dev')->group(function () {
    // Products
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    Route::post('/products/scan-qr', [ProductController::class, 'scanQr']);


    // Stock Transactions
    Route::get('/stock-transactions', [StockTransactionController::class, 'index']);
    Route::get('/stock-transactions/{id}', [StockTransactionController::class, 'show']);
    Route::post('/stock-transactions', [StockTransactionController::class, 'store']);
    Route::get('/stock-transactions/product/{productId}', [StockTransactionController::class, 'getByProduct']);
    Route::get('/stock-transactions/summary/all', [StockTransactionController::class, 'summary']);
    Route::put('/stock-transactions/{id}', [StockTransactionController::class, 'update']);
    Route::delete('/stock-transactions/{id}', [StockTransactionController::class, 'destroy']);
    Route::get('/stock-transactions/kartu-stok/{productId}', [StockTransactionController::class, 'getKartuStok']);
    
    // Stock Opname Routes
    Route::get('/stock-opnames', [StockOpnameController::class, 'index']);
    Route::get('/stock-opnames/{id}', [StockOpnameController::class, 'show']);
    Route::post('/stock-opnames', [StockOpnameController::class, 'store']);
    Route::post('/stock-opnames/{id}/adjust', [StockOpnameController::class, 'adjustStock']);
    Route::delete('/stock-opnames/{id}', [StockOpnameController::class, 'destroy']);
    Route::get('/stock-opnames/summary/all', [StockOpnameController::class, 'summary']);
    
    // Profit Reports
    Route::get('/profit-reports', [ProfitReportController::class, 'index']);
    Route::get('/profit-reports/{id}', [ProfitReportController::class, 'show']);
    Route::post('/profit-reports/generate', [ProfitReportController::class, 'generate']);
    Route::post('/profit-reports/generate/daily', [ProfitReportController::class, 'generateDaily']);
    Route::post('/profit-reports/generate/weekly', [ProfitReportController::class, 'generateWeekly']);
    Route::post('/profit-reports/generate/monthly', [ProfitReportController::class, 'generateMonthly']);
    Route::get('/profit-reports/summary/all', [ProfitReportController::class, 'summary']);

    // QR Logs
    Route::get('/qr-logs', [ProductQrLogController::class, 'index']);
    Route::get('/qr-logs/{id}', [ProductQrLogController::class, 'show']);
    Route::get('/qr-logs/product/{productId}', [ProductQrLogController::class, 'getByProduct']);
    Route::get('/qr-logs/statistics/all', [ProductQrLogController::class, 'statistics']);
});

Route::middleware('auth:sanctum')->group(function () {
    
    // Auth Routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', fn(Request $request) => $request->user());

    // Products Routes
    Route::prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'index']);
        Route::get('/{id}', [ProductController::class, 'show']);
        Route::post('/', [ProductController::class, 'store']);
        Route::put('/{id}', [ProductController::class, 'update']);
        Route::delete('/{id}', [ProductController::class, 'destroy']);
        Route::post('/scan-qr', [ProductController::class, 'scanQr']);
    });

    // Stock Transactions Routes
    Route::prefix('stock-transactions')->group(function () {
        Route::get('/', [StockTransactionController::class, 'index']);
        Route::get('/{id}', [StockTransactionController::class, 'show']);
        Route::post('/', [StockTransactionController::class, 'store']);
        Route::get('/product/{productId}', [StockTransactionController::class, 'getByProduct']);
        Route::get('/summary/all', [StockTransactionController::class, 'summary']);
    });

    // Stock Opname Routes
    Route::prefix('stock-opnames')->group(function () {
        Route::get('/', [StockOpnameController::class, 'index']);
        Route::get('/{id}', [StockOpnameController::class, 'show']);
        Route::post('/', [StockOpnameController::class, 'store']);
        Route::post('/{id}/adjust', [StockOpnameController::class, 'adjustStock']);
        Route::delete('/{id}', [StockOpnameController::class, 'destroy']);
        Route::get('/summary/all', [StockOpnameController::class, 'summary']);
    });

    // Profit Reports Routes
    Route::prefix('profit-reports')->group(function () {
        Route::get('/', [ProfitReportController::class, 'index']);
        Route::get('/{id}', [ProfitReportController::class, 'show']);
        Route::delete('/{id}', [ProfitReportController::class, 'destroy']);
        Route::post('/generate', [ProfitReportController::class, 'generate']);
        Route::post('/generate/daily', [ProfitReportController::class, 'generateDaily']);
        Route::post('/generate/weekly', [ProfitReportController::class, 'generateWeekly']);
        Route::post('/generate/monthly', [ProfitReportController::class, 'generateMonthly']);
        Route::get('/summary/all', [ProfitReportController::class, 'summary']);
    });

    // QR Logs Routes
    Route::prefix('qr-logs')->group(function () {
        Route::get('/', [ProductQrLogController::class, 'index']);
        Route::get('/{id}', [ProductQrLogController::class, 'show']);
        Route::delete('/{id}', [ProductQrLogController::class, 'destroy']);
        Route::get('/product/{productId}', [ProductQrLogController::class, 'getByProduct']);
        Route::get('/statistics/all', [ProductQrLogController::class, 'statistics']);
    });

    // Admin Only Routes
    Route::middleware('admin')->group(function () {
        Route::get('/admin', fn() => response()->json(['message' => 'Admin access granted']));
    });
});