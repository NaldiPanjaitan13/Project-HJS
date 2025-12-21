<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory;

    protected $table = 'products';
    protected $primaryKey = 'product_id';

    protected $fillable = [
        'user_id',
        'kode_barang',
        'uuid',
        'nama_barang',
        'jenis_barang',
        'satuan',
        'stok_minimal',
        'stok',
        'harga_modal',
        'harga_jual',
        'qr_code',
    ];

    protected $casts = [
        'harga_modal' => 'decimal:2',
        'harga_jual' => 'decimal:2',
        'stok' => 'integer',
        'stok_minimal' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($product) {
            if (empty($product->uuid)) {
                $product->uuid = (string) Str::uuid();
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id')
            ->select('user_id', 'username', 'email');
    }

    public function qrLogs()
    {
        return $this->hasMany(ProductQrLog::class, 'product_id', 'product_id')
            ->select('qr_log_id', 'product_id', 'scanned_by', 'created_at');
    }

    public function stockTransactions()
    {
        return $this->hasMany(StockTransaction::class, 'product_id', 'product_id')
            ->select('transaction_id', 'product_id', 'jenis_transaksi', 'jumlah', 'catatan', 'penanggung_jawab', 'created_at');
    }

    public function getProfitAttribute()
    {
        return $this->harga_jual - $this->harga_modal;
    }

    public function getStatusAttribute()
    {
        return $this->stok > 0 ? 'Tersedia' : 'Habis';
    }

    public function scopeTersedia($query)
    {
        return $query->where('stok', '>', 0);
    }

    public function scopeHabis($query)
    {
        return $query->where('stok', '<=', 0);
    }

    public function scopeStokMinimal($query)
    {
        return $query->whereRaw('stok <= stok_minimal');
    }
}