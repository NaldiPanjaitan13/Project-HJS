<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class ProductController extends Controller
{
    public function index(Request $request)
    {   
        DB::enableQueryLog(); 
        $startTime = microtime(true);

        $query = Product::with('user');

        if ($request->has('status')) {
            if ($request->status === 'Tersedia') {
                $query->tersedia();
            } elseif ($request->status === 'Habis') {
                $query->habis();
            }
        }

        if ($request->has('stok_minimal') && $request->stok_minimal == true) {
            $query->stokMinimal();
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nama_barang', 'like', "%{$search}%")
                  ->orWhere('kode_barang', 'like', "%{$search}%")
                  ->orWhere('jenis_barang', 'like', "%{$search}%");
            });
        }
        
        if ($request->has('for_dropdown') && $request->for_dropdown == true) {
            $products = $query->orderBy('nama_barang', 'asc')->get();
            return response()->json([
                'success' => true,
                'data' => $products
            ]);
        }

        $products = $query->latest()->paginate($request->per_page ?? 5);
        $endTime = microtime(true);
        $executionTime = ($endTime - $startTime) * 1000; 
        
        $queries = DB::getQueryLog();
        
        Log::info('ProductController@index Debug:', [
            'execution_time_ms' => round($executionTime, 2),
            'total_queries' => count($queries),
            'queries' => $queries
        ]);

        return response()->json([
            'success' => true,
            'data' => $products,
            'debug' => [ 
                'execution_time_ms' => round($executionTime, 2),
                'total_queries' => count($queries),
                'queries' => $queries
            ]
        ]);
    }

    public function getForDropdown(Request $request)
    {
        try {
            $query = Product::select('product_id', 'kode_barang', 'nama_barang', 'jenis_barang', 'satuan', 'stok', 'harga_modal', 'harga_jual');
            
            if ($request->has('only_available') && $request->only_available == true) {
                $query->where('stok', '>', 0);
            }

            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('nama_barang', 'like', "%{$search}%")
                      ->orWhere('kode_barang', 'like', "%{$search}%");
                });
            }

            $products = $query->orderBy('nama_barang', 'asc')->get();
            
            Log::info('ProductController@getForDropdown:', [
                'total_products' => $products->count(),
                'only_available' => $request->only_available,
                'products' => $products->toArray()
            ]);

            return response()->json([
                'success' => true,
                'data' => $products
            ]);

        } catch (\Exception $e) {
            Log::error('Error getting products for dropdown: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get products',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $product = Product::with(['user', 'qrLogs', 'stockTransactions'])
            ->find($id);
    
        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $product
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'kode_barang' => 'required|string|max:50|unique:products,kode_barang',
            'nama_barang' => 'required|string|max:255',
            'jenis_barang' => 'nullable|string|max:255',
            'satuan' => 'required|string|max:50',
            'stok_minimal' => 'nullable|integer|min:0',
            'stok' => 'nullable|integer|min:0',
            'harga_modal' => 'required|numeric|min:0',
            'harga_jual' => 'required|numeric|min:0',
            'user_id' => 'nullable|exists:users,user_id',
        ]);

        if ($validator->fails()) {
            Log::error('Product validation failed:', [
                'errors' => $validator->errors()->toArray(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $product = Product::create($request->all());

            try {
                $qrCode = QrCode::size(300)->generate($product->uuid);
                $product->qr_code = $qrCode;
                $product->save();
            } catch (\Exception $e) {
                Log::error('QR Code generation failed: ' . $e->getMessage());
            }

            DB::commit();
            Cache::forget("product_{$product->product_id}");

            return response()->json([
                'success' => true,
                'message' => 'Product created successfully',
                'data' => $product->fresh()
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Product creation failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'kode_barang' => 'sometimes|string|max:50|unique:products,kode_barang,' . $id . ',product_id',
            'nama_barang' => 'sometimes|string|max:255',
            'jenis_barang' => 'nullable|string|max:255',
            'satuan' => 'sometimes|string|max:50',
            'stok_minimal' => 'nullable|integer|min:0',
            'stok' => 'nullable|integer|min:0',
            'harga_modal' => 'sometimes|numeric|min:0',
            'harga_jual' => 'sometimes|numeric|min:0',
            'user_id' => 'nullable|exists:users,user_id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $product->update($request->all());
        Cache::forget("product_{$id}");

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully',
            'data' => $product
        ]);
    }

    public function destroy($id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        }

        $product->delete();
        Cache::forget("product_{$id}");

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully'
        ]);
    }
 
    public function scanQrCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'qr_code' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'QR Code wajib diisi',
                'errors' => $validator->errors()
            ], 422);
        }

        try { 
            $product = Product::where('kode_barang', $request->qr_code)
                ->orWhere('uuid', $request->qr_code)
                ->orWhere('qr_code', $request->qr_code)
                ->first();

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Produk tidak ditemukan'
                ], 404);
            }
 
            if (class_exists('App\Models\ProductQrLog')) {
                try {
                    $scannedBy = 'Guest';
                     
                    if (Auth::check()) {
                        $scannedBy = Auth::user()->name;
                    }
                    
                    \App\Models\ProductQrLog::create([
                        'product_id' => $product->product_id,
                        'scanned_by' => $scannedBy,
                        'scanned_at' => now()
                    ]);
                } catch (\Exception $e) {
                    Log::warning('Failed to log QR scan: ' . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Produk ditemukan',
                'data' => $product
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Scan QR Error: ' . $e->getMessage(), [
                'qr_code' => $request->qr_code,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat memindai QR code',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}