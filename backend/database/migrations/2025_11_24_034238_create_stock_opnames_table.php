<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_opnames', function (Blueprint $table) {
            $table->id('opname_id');
            
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('user_id')->nullable();
            
            $table->date('tanggal_opname');
            $table->integer('stok_sistem'); 
            $table->integer('stok_fisik'); 
            $table->integer('selisih'); 
            $table->string('nama_petugas', 100)->nullable(); 
            $table->text('catatan')->nullable();
            $table->enum('status_penyesuaian', ['Belum Disesuaikan', 'Disesuaikan'])->default('Belum Disesuaikan');
            
            $table->timestamps();
            
            $table->foreign('product_id')
                  ->references('product_id')->on('products')
                  ->cascadeOnDelete();
                  
            $table->foreign('user_id')
                  ->references('user_id')->on('users')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_opnames');
    }
};