<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        // Log request yang masuk
        Log::info('=== REGISTER REQUEST RECEIVED ===');
        Log::info('Request Data:', $request->all());

        try {
            // Validasi
            $validated = $request->validate([
                'username' => 'required|string|max:255|unique:users',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => [
                    'required',
                    'confirmed',  
                    Password::min(8)->letters()->mixedCase()->numbers()
                ],
            ]);

            Log::info('Validation passed:', $validated);

            // Cek koneksi database
            Log::info('Database:', [
                'connection' => DB::connection()->getDatabaseName(),
                'driver' => DB::connection()->getDriverName()
            ]);

            // Buat user dengan transaction
            DB::beginTransaction();
            
            $user = User::create([
                'username' => $validated['username'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'user',
            ]);

            Log::info('User created:', [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email
            ]);

            // Commit transaction
            DB::commit();

            // Trigger email verification
            try {
                event(new Registered($user));
                Log::info('Registered event fired for user: ' . $user->id);
            } catch (\Exception $emailError) {
                Log::error('Email sending failed: ' . $emailError->getMessage());
                // Lanjutkan meskipun email gagal
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Registrasi berhasil! Silakan cek email Anda untuk verifikasi.',
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed:', $e->errors());
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Registration failed:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Registrasi gagal: ' . $e->getMessage()
            ], 500);
        }
    }
 
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($credentials)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Email atau password salah.',
            ], 401);
        }

        $user = Auth::user();
        
        if (!$user->hasVerifiedEmail()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Silakan verifikasi email Anda terlebih dahulu.',
                'email_verified' => false,
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Login berhasil',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role ?? 'user',
                'email_verified_at' => $user->email_verified_at,
            ]
        ], 200);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Logout berhasil.',
        ], 200);
    }
}
