<?php

namespace App\Http\Controllers;

use App\Models\ProfitReport;
use App\Models\StockTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ProfitReportController extends Controller
{
    public function index(Request $request)
    {
        $query = ProfitReport::select([
            'report_id',
            'period_type',
            'period_start',
            'period_end',
            'total_modal',
            'total_penjualan',
            'total_profit',
            'created_at'
        ]);

        if ($request->has('period_type')) {
            $query->where('period_type', $request->period_type);
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->byPeriod($request->start_date, $request->end_date);
        }

        $reports = $query->latest('period_start')->paginate($request->per_page ?? 5);

        return response()->json([
            'success' => true,
            'data' => $reports
        ]);
    }

    public function show($id)
    {
        $report = ProfitReport::find($id);

        if (!$report) {
            return response()->json([
                'success' => false,
                'message' => 'Report not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $report
        ]);
    }

    public function generate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'period_type' => 'required|in:DAILY,WEEKLY,MONTHLY',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $result = StockTransaction::join('products', 'stock_transactions.product_id', '=', 'products.product_id')
            ->where('stock_transactions.jenis_transaksi', 'OUT')
            ->whereBetween('stock_transactions.created_at', [$request->period_start, $request->period_end])
            ->selectRaw('
                SUM(products.harga_modal * stock_transactions.jumlah) as total_modal,
                SUM(products.harga_jual * stock_transactions.jumlah) as total_penjualan
            ')
            ->first();

        $totalModal = $result->total_modal ?? 0;
        $totalPenjualan = $result->total_penjualan ?? 0;
        $totalProfit = $totalPenjualan - $totalModal;

        $report = ProfitReport::create([
            'period_type' => $request->period_type,
            'period_start' => $request->period_start,
            'period_end' => $request->period_end,
            'total_modal' => $totalModal,
            'total_penjualan' => $totalPenjualan,
            'total_profit' => $totalProfit
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Report generated successfully',
            'data' => $report
        ], 201);
    }

    public function generateDaily(Request $request)
    {
        $date = $request->date ?? Carbon::today()->toDateString();

        return $this->generate(new Request([
            'period_type' => 'DAILY',
            'period_start' => $date,
            'period_end' => $date
        ]));
    }

    public function generateWeekly(Request $request)
    {
        $startOfWeek = Carbon::parse($request->date ?? Carbon::today())->startOfWeek();
        $endOfWeek = Carbon::parse($request->date ?? Carbon::today())->endOfWeek();

        return $this->generate(new Request([
            'period_type' => 'WEEKLY',
            'period_start' => $startOfWeek->toDateString(),
            'period_end' => $endOfWeek->toDateString()
        ]));
    }

    public function generateMonthly(Request $request)
    {
        $startOfMonth = Carbon::parse($request->date ?? Carbon::today())->startOfMonth();
        $endOfMonth = Carbon::parse($request->date ?? Carbon::today())->endOfMonth();

        return $this->generate(new Request([
            'period_type' => 'MONTHLY',
            'period_start' => $startOfMonth->toDateString(),
            'period_end' => $endOfMonth->toDateString()
        ]));
    }

    public function summary(Request $request)
    {
        $query = ProfitReport::query();

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->byPeriod($request->start_date, $request->end_date);
        }

        $summary = $query->selectRaw('
            SUM(total_modal) as total_modal,
            SUM(total_penjualan) as total_penjualan,
            SUM(total_profit) as total_profit,
            COUNT(*) as total_reports
        ')->first();

        return response()->json([
            'success' => true,
            'data' => [
                'total_modal' => $summary->total_modal ?? 0,
                'total_penjualan' => $summary->total_penjualan ?? 0,
                'total_profit' => $summary->total_profit ?? 0,
                'total_reports' => $summary->total_reports ?? 0
            ]
        ]);
    }

    public function destroy($id)
    {
        $report = ProfitReport::find($id);

        if (!$report) {
            return response()->json([
                'success' => false,
                'message' => 'Report not found'
            ], 404);
        }

        $report->delete();

        return response()->json([
            'success' => true,
            'message' => 'Report deleted successfully'
        ]);
    }
}