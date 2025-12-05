<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
        \Log::info('ProductController@getForDropdown:', [
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
        \Log::error('Product validation failed:', [
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
            \DB::beginTransaction();

            $product = Product::create($request->all());

            try {
                $qrCode = QrCode::size(300)->generate($product->uuid);
                $product->qr_code = $qrCode;
                $product->save();
            } catch (\Exception $e) {
                \Log::error('QR Code generation failed: ' . $e->getMessage());
            }

            \DB::commit();
            Cache::forget("product_{$product->product_id}");

            return response()->json([
                'success' => true,
                'message' => 'Product created successfully',
                'data' => $product->fresh()
            ], 201);

        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('Product creation failed: ' . $e->getMessage());
            
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

    public function scanQr(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'uuid' => 'required|string|exists:products,uuid',
            'scanned_by' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $product = Product::where('uuid', $request->uuid)->first();

        $product->qrLogs()->create([
            'scanned_by' => $request->scanned_by
        ]);

        return response()->json([
            'success' => true,
            'message' => 'QR Code scanned successfully',
            'data' => $product
        ]);
    }
}