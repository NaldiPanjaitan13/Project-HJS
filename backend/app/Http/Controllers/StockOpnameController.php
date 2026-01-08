<?php

namespace App\Http\Controllers;

use App\Models\StockOpname;
use App\Models\Product;
use App\Models\StockTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;  // Add this import
use Illuminate\Support\Facades\Auth; // Add this import

class StockOpnameController extends Controller
{
    public function index(Request $request)
    {
        $query = StockOpname::select([
            'opname_id',
            'product_id',
            'user_id',
            'tanggal_opname',
            'stok_sistem',
            'stok_fisik',
            'selisih',
            'status_penyesuaian',
            'nama_petugas',
            'catatan',
            'created_at'
        ])->with([
            'product:product_id,kode_barang,nama_barang,satuan',
            'user:user_id,name'
        ]);

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
            $product = Product::lockForUpdate()->find($request->product_id);
            $stokSistem = $product->stok ?? 0;
            $stokFisik = $request->stok_fisik;
            $selisih = $stokFisik - $stokSistem;

            $userId = Auth::id(); // Get authenticated user ID
            
            $opname = StockOpname::create([
                'product_id' => $request->product_id,
                'user_id' => $userId,
                'tanggal_opname' => $request->tanggal_opname,
                'stok_sistem' => $stokSistem,
                'stok_fisik' => $stokFisik,
                'selisih' => $selisih,
                'nama_petugas' => $request->nama_petugas,
                'catatan' => $request->catatan,
                'status_penyesuaian' => $request->sesuaikan_stok ? 'Disesuaikan' : 'Belum Disesuaikan'
            ]);

            if ($request->sesuaikan_stok && $selisih != 0) {
                $jenisTransaksi = $selisih > 0 ? 'IN' : 'OUT';
                $jumlahAdjust = abs($selisih);
        
                StockTransaction::create([
                    'product_id' => $request->product_id,
                    'user_id' => $userId,
                    'jenis_transaksi' => $jenisTransaksi,  
                    'jumlah' => $jumlahAdjust, 
                    'catatan' => "Stok Opname - {$request->catatan} (Selisih: {$selisih})"
                ]);
            }

            DB::commit();
            Cache::forget("product_{$request->product_id}");

            return response()->json([
                'success' => true,
                'message' => 'Stock opname berhasil disimpan' . ($request->sesuaikan_stok ? ' dan disesuaikan' : ''),
                'data' => $opname->load(['product', 'user'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Stock opname creation failed: ' . $e->getMessage()); // Fixed
            
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
                    'user_id' => Auth::id() ?? null, // Fixed
                    'jenis_transaksi' => 'ADJUST',
                    'jumlah' => $opname->stok_fisik,
                    'catatan' => "Penyesuaian Stok Opname (Selisih: {$opname->selisih})"
                ]);
            }

            $opname->status_penyesuaian = 'Disesuaikan';
            $opname->save();

            DB::commit();
            Cache::forget("product_{$opname->product_id}");

            return response()->json([
                'success' => true,
                'message' => 'Stok berhasil disesuaikan',
                'data' => $opname->load(['product', 'user'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Stock adjustment failed: ' . $e->getMessage()); // Fixed
            
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

        $summary = $query->selectRaw('
            COUNT(*) as total_opname,
            SUM(CASE WHEN status_penyesuaian = "Disesuaikan" THEN 1 ELSE 0 END) as disesuaikan,
            SUM(CASE WHEN status_penyesuaian = "Belum Disesuaikan" THEN 1 ELSE 0 END) as belum_disesuaikan,
            SUM(CASE WHEN selisih > 0 THEN selisih ELSE 0 END) as total_selisih_positif,
            SUM(CASE WHEN selisih < 0 THEN selisih ELSE 0 END) as total_selisih_negatif
        ')->first();

        return response()->json([
            'success' => true,
            'data' => [
                'total_opname' => $summary->total_opname ?? 0,
                'disesuaikan' => $summary->disesuaikan ?? 0,
                'belum_disesuaikan' => $summary->belum_disesuaikan ?? 0,
                'total_selisih_positif' => $summary->total_selisih_positif ?? 0,
                'total_selisih_negatif' => $summary->total_selisih_negatif ?? 0,
            ]
        ]);
    }
}