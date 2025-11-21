<?php

namespace App\Http\Controllers;

use App\Models\StockTransaction;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class StockTransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = StockTransaction::with(['product', 'user']);

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

        $transactions = $query->latest()->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }

    public function show($id)
    {
        $transaction = StockTransaction::with(['product', 'user'])->find($id);

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
            $product = Product::find($request->product_id);
            if ($product->stok < $request->jumlah) {
                return response()->json([
                    'success' => false,
                    'message' => 'Stok tidak mencukupi. Stok tersedia: ' . $product->stok
                ], 422);
            }
        }

        $transaction = StockTransaction::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Transaction created successfully',
            'data' => $transaction->load(['product', 'user'])
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
            $product = Product::find($transaction->product_id);
            if ($product) {
                $difference = $newJumlah - $oldJumlah;
                
                if ($transaction->jenis_transaksi === 'IN') {
                    $product->stok += $difference;
                } elseif ($transaction->jenis_transaksi === 'OUT') {
                    $product->stok -= $difference;
                }
                
                $product->save();
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Transaction updated successfully',
            'data' => $transaction->load(['product', 'user'])
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

        // Kembalikan stok sebelum delete
        $product = Product::find($transaction->product_id);
        if ($product) {
            if ($transaction->jenis_transaksi === 'IN') {
                $product->stok -= $transaction->jumlah;
            } elseif ($transaction->jenis_transaksi === 'OUT') {
                $product->stok += $transaction->jumlah;
            }
            $product->save();
        }

        $transaction->delete();

        return response()->json([
            'success' => true,
            'message' => 'Transaction deleted successfully'
        ]);
    }

    public function getByProduct($productId)
    {
        $product = Product::find($productId);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        }

        $transactions = StockTransaction::with('user')
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

    public function summary(Request $request)
    {
        $query = StockTransaction::query();

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
        }

        $summary = [
            'total_in' => $query->clone()->where('jenis_transaksi', 'IN')->sum('jumlah'),
            'total_out' => $query->clone()->where('jenis_transaksi', 'OUT')->sum('jumlah'),
            'total_adjust' => $query->clone()->where('jenis_transaksi', 'ADJUST')->count(),
            'total_transactions' => $query->count()
        ];

        return response()->json([
            'success' => true,
            'data' => $summary
        ]);
    }
}