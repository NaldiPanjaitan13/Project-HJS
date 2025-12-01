<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->index('kode_barang');
            $table->index('nama_barang');
            $table->index('jenis_barang');
            $table->index('stok');
            $table->index(['stok', 'stok_minimal']); 
            $table->index('created_at');
        });

        Schema::table('stock_transactions', function (Blueprint $table) {
            $table->index('product_id');
            $table->index('jenis_transaksi');
            $table->index('created_at');
            $table->index(['product_id', 'jenis_transaksi']);
            $table->index(['jenis_transaksi', 'created_at']); 
            $table->index('penanggung_jawab');
        });

        Schema::table('stock_opnames', function (Blueprint $table) {
            $table->index('product_id');
            $table->index('tanggal_opname');
            $table->index('status_penyesuaian');
            $table->index(['tanggal_opname', 'status_penyesuaian']); 
            $table->index('created_at');
        });

        Schema::table('profit_reports', function (Blueprint $table) {
            $table->index('period_type');
            $table->index('period_start');
            $table->index('period_end');
            $table->index(['period_start', 'period_end']); 
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['kode_barang']);
            $table->dropIndex(['nama_barang']);
            $table->dropIndex(['jenis_barang']);
            $table->dropIndex(['stok']);
            $table->dropIndex(['stok', 'stok_minimal']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('stock_transactions', function (Blueprint $table) {
            $table->dropIndex(['product_id']);
            $table->dropIndex(['jenis_transaksi']);
            $table->dropIndex(['created_at']);
            $table->dropIndex(['product_id', 'jenis_transaksi']);
            $table->dropIndex(['jenis_transaksi', 'created_at']);
            $table->dropIndex(['penanggung_jawab']);
        });

        Schema::table('stock_opnames', function (Blueprint $table) {
            $table->dropIndex(['product_id']);
            $table->dropIndex(['tanggal_opname']);
            $table->dropIndex(['status_penyesuaian']);
            $table->dropIndex(['tanggal_opname', 'status_penyesuaian']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('profit_reports', function (Blueprint $table) {
            $table->dropIndex(['period_type']);
            $table->dropIndex(['period_start']);
            $table->dropIndex(['period_end']);
            $table->dropIndex(['period_start', 'period_end']);
            $table->dropIndex(['created_at']);
        });
    }
};