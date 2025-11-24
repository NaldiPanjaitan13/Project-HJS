<?php

namespace App\Http\Controllers;

use App\Models\StockOpname;
use App\Models\Product;
use App\Models\StockTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class StockOpnameController extends Controller
{
    public function index(Request $request)
    {
        $query = StockOpname::with(['product', 'user']);
        if ($request->has('status_penyesuaian')) {
            $query->where('status_penyesuaian', $request->status_penyesuaian);
        }
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('tanggal_opname', [$request->start_date, $request->end_date]);
        }
        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('product', function($q) use ($search) {
                $q->where('nama_barang', 'like', "%{$search}%")
                  ->orWhere('kode_barang', 'like', "%{$search}%");
            });
        }

        $opnames = $query->latest('tanggal_opname')->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $opnames
        ]);
    }

    public function show($id)
    {
        $opname = StockOpname::with(['product', 'user'])->find($id);

        if (!$opname) {
            return response()->json([
                'success' => false,
                'message' => 'Stock opname not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $opname
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,product_id',
            'tanggal_opname' => 'required|date',
            'stok_fisik' => 'required|integer|min:0',
            'nama_petugas' => 'nullable|string|max:100',
            'catatan' => 'nullable|string',
            'sesuaikan_stok' => 'required|boolean', 
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();
            $product = Product::find($request->product_id);
            $stokSistem = $product->stok ?? 0;
            $stokFisik = $request->stok_fisik;
            $selisih = $stokFisik - $stokSistem;
            $opname = StockOpname::create([
                'product_id' => $request->product_id,
                'user_id' => $request->user_id ?? null,
                'tanggal_opname' => $request->tanggal_opname,
                'stok_sistem' => $stokSistem,
                'stok_fisik' => $stokFisik,
                'selisih' => $selisih,
                'nama_petugas' => $request->nama_petugas,
                'catatan' => $request->catatan,
                'status_penyesuaian' => $request->sesuaikan_stok ? 'Disesuaikan' : 'Belum Disesuaikan'
            ]);
            if ($request->sesuaikan_stok && $selisih != 0) {
                StockTransaction::create([
                    'product_id' => $request->product_id,
                    'user_id' => $request->user_id ?? null,
                    'jenis_transaksi' => 'ADJUST',
                    'jumlah' => $stokFisik, 
                    'catatan' => "Stok Opname - Penyesuaian (Selisih: {$selisih}). {$request->catatan}"
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Stock opname berhasil disimpan' . ($request->sesuaikan_stok ? ' dan disesuaikan' : ''),
                'data' => $opname->load(['product', 'user'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Stock opname creation failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create stock opname',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function adjustStock($id)
    {
        $opname = StockOpname::find($id);

        if (!$opname) {
            return response()->json([
                'success' => false,
                'message' => 'Stock opname not found'
            ], 404);
        }

        if ($opname->status_penyesuaian === 'Disesuaikan') {
            return response()->json([
                'success' => false,
                'message' => 'Stok sudah disesuaikan sebelumnya'
            ], 400);
        }

        try {
            DB::beginTransaction();

            if ($opname->selisih != 0) {
                StockTransaction::create([
                    'product_id' => $opname->product_id,
                    'user_id' => auth()->id() ?? null,
                    'jenis_transaksi' => 'ADJUST',
                    'jumlah' => $opname->stok_fisik,
                    'catatan' => "Penyesuaian Stok Opname (Selisih: {$opname->selisih})"
                ]);
            }

            $opname->status_penyesuaian = 'Disesuaikan';
            $opname->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Stok berhasil disesuaikan',
                'data' => $opname->load(['product', 'user'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Stock adjustment failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to adjust stock',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $opname = StockOpname::find($id);

        if (!$opname) {
            return response()->json([
                'success' => false,
                'message' => 'Stock opname not found'
            ], 404);
        }

        if ($opname->status_penyesuaian === 'Disesuaikan') {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat menghapus opname yang sudah disesuaikan'
            ], 400);
        }

        $opname->delete();

        return response()->json([
            'success' => true,
            'message' => 'Stock opname deleted successfully'
        ]);
    }

    public function summary(Request $request)
    {
        $query = StockOpname::query();

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('tanggal_opname', [$request->start_date, $request->end_date]);
        }

        $summary = [
            'total_opname' => $query->count(),
            'disesuaikan' => $query->clone()->where('status_penyesuaian', 'Disesuaikan')->count(),
            'belum_disesuaikan' => $query->clone()->where('status_penyesuaian', 'Belum Disesuaikan')->count(),
            'total_selisih_positif' => $query->clone()->where('selisih', '>', 0)->sum('selisih'),
            'total_selisih_negatif' => $query->clone()->where('selisih', '<', 0)->sum('selisih'),
        ];

        return response()->json([
            'success' => true,
            'data' => $summary
        ]);
    }
}