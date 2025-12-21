<?php

namespace App\Http\Controllers;

use App\Models\StockTransaction;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StockTransactionController extends Controller
{
    public function index(Request $request)
    {
        DB::enableQueryLog();
        $startTime = microtime(true);

        $query = StockTransaction::select([
            'transaction_id',
            'product_id',
            'user_id',
            'jenis_transaksi',
            'jumlah',
            'catatan',
            'penanggung_jawab',
            'created_at'
        ])->with([
            'product:product_id,kode_barang,nama_barang,stok,satuan', 
            'user:user_id,username'
        ]);

        if ($request->has('jenis_transaksi')) {
            $query->where('jenis_transaksi', $request->jenis_transaksi);
        }

        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
        }

        if ($request->has('penanggung_jawab') && $request->penanggung_jawab) {
            $query->where('penanggung_jawab', 'like', '%' . $request->penanggung_jawab . '%');
        }

        $transactions = $query->latest()->paginate($request->per_page ?? 5);

        $endTime = microtime(true);
        $executionTime = ($endTime - $startTime) * 1000;
        
        $queries = DB::getQueryLog();
        
        Log::info('StockTransactionController@index Debug:', [
            'execution_time_ms' => round($executionTime, 2),
            'total_queries' => count($queries)
        ]);

        return response()->json([
            'success' => true,
            'data' => $transactions,
            'debug' => [
                'execution_time_ms' => round($executionTime, 2),
                'total_queries' => count($queries)
            ]
        ]);
    }

    public function show($id)
    {
        $transaction = StockTransaction::with([
            'product:product_id,kode_barang,nama_barang,stok,satuan',
            'user:user_id,username'
        ])->find($id);

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $transaction
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,product_id',
            'user_id' => 'nullable|exists:users,user_id',
            'jenis_transaksi' => 'required|in:IN,OUT,ADJUST',
            'jumlah' => 'required|integer|min:1',
            'catatan' => 'nullable|string',
            'penanggung_jawab' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        if ($request->jenis_transaksi === 'OUT') {
            $product = Product::select('product_id', 'stok', 'nama_barang')
                ->find($request->product_id);
                
            if ($product->stok < $request->jumlah) {
                return response()->json([
                    'success' => false,
                    'message' => 'Stok tidak mencukupi. Stok tersedia: ' . $product->stok
                ], 422);
            }
        }

        $transaction = StockTransaction::create($request->all());

        Cache::forget("product_{$request->product_id}");

        return response()->json([
            'success' => true,
            'message' => 'Transaction created successfully',
            'data' => $transaction->load([
                'product:product_id,kode_barang,nama_barang,stok',
                'user:user_id,username'
            ])
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $transaction = StockTransaction::find($id);

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'jumlah' => 'sometimes|integer|min:1',
            'catatan' => 'nullable|string',
            'penanggung_jawab' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $oldJumlah = $transaction->jumlah;
        $newJumlah = $request->jumlah ?? $oldJumlah;

        $transaction->update($request->only(['jumlah', 'catatan', 'penanggung_jawab']));

        if ($oldJumlah != $newJumlah) {
            $difference = $newJumlah - $oldJumlah;
            
            Product::where('product_id', $transaction->product_id)
                ->update([
                    'stok' => DB::raw("stok + ({$difference} * " . 
                        ($transaction->jenis_transaksi === 'IN' ? 1 : -1) . ")")
                ]);

            Cache::forget("product_{$transaction->product_id}");
        }

        return response()->json([
            'success' => true,
            'message' => 'Transaction updated successfully',
            'data' => $transaction->load([
                'product:product_id,kode_barang,nama_barang,stok',
                'user:user_id,username'
            ])
        ]);
    }

    public function destroy($id)
    {
        $transaction = StockTransaction::find($id);

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found'
            ], 404);
        }

        $multiplier = $transaction->jenis_transaksi === 'IN' ? -1 : 1;
        
        Product::where('product_id', $transaction->product_id)
            ->update([
                'stok' => DB::raw("stok + ({$transaction->jumlah} * {$multiplier})")
            ]);

        Cache::forget("product_{$transaction->product_id}");
        
        $transaction->delete();

        return response()->json([
            'success' => true,
            'message' => 'Transaction deleted successfully'
        ]);
    }

    public function getByProduct($productId)
    {
        $product = Product::select('product_id', 'kode_barang', 'nama_barang', 'stok')
            ->find($productId);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        }

        $transactions = StockTransaction::select([
                'transaction_id',
                'jenis_transaksi',
                'jumlah',
                'catatan',
                'penanggung_jawab',
                'user_id',
                'created_at'
            ])
            ->with('user:user_id,username')
            ->where('product_id', $productId)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'product' => $product,
                'transactions' => $transactions
            ]
        ]);
    }

    public function getKartuStok($productId)
    {
        $product = Product::select('product_id', 'kode_barang', 'nama_barang', 'stok')
            ->find($productId);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        }

        $transactions = StockTransaction::select([
                'transaction_id',
                'jenis_transaksi',
                'jumlah',
                'catatan',
                'penanggung_jawab',
                'user_id',
                'created_at'
            ])
            ->with('user:user_id,username')
            ->where('product_id', $productId)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'product' => $product,
                'transactions' => $transactions
            ]
        ]);
    }

    public function summary(Request $request)
    {
        DB::enableQueryLog();
        $startTime = microtime(true);

        $query = StockTransaction::query();

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
        }

        $summary = $query->selectRaw("
            SUM(CASE WHEN jenis_transaksi = 'IN' THEN jumlah ELSE 0 END) as total_in,
            SUM(CASE WHEN jenis_transaksi = 'OUT' THEN jumlah ELSE 0 END) as total_out,
            COUNT(CASE WHEN jenis_transaksi = 'ADJUST' THEN 1 END) as total_adjust,
            COUNT(*) as total_transactions
        ")->first();

        $endTime = microtime(true);
        $executionTime = ($endTime - $startTime) * 1000;
        
        $queries = DB::getQueryLog();
        
        Log::info('StockTransactionController@summary Debug:', [
            'execution_time_ms' => round($executionTime, 2),
            'total_queries' => count($queries)
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'total_in' => (int) $summary->total_in,
                'total_out' => (int) $summary->total_out,
                'total_adjust' => (int) $summary->total_adjust,
                'total_transactions' => (int) $summary->total_transactions
            ],
            'debug' => [
                'execution_time_ms' => round($executionTime, 2),
                'total_queries' => count($queries)
            ]
        ]);
    }
}