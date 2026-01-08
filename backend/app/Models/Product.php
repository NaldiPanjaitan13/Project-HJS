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
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = true;

    protected $fillable = [
        'kode_barang',
        'nama_barang',
        'jenis_barang',
        'satuan',
        'stok_minimal',
        'stok',
        'harga_modal',
        'harga_jual',
        'qr_code',
        'uuid',
        'user_id'
    ];

    protected $casts = [
        'stok' => 'integer',
        'stok_minimal' => 'integer',
        'harga_modal' => 'decimal:2',
        'harga_jual' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    protected $hidden = [];

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
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
    
    public function qrLogs()
    {
        return $this->hasMany(ProductQrLog::class, 'product_id', 'product_id')
                    ->orderBy('scanned_at', 'desc');
    }
    
    public function stockTransactions()
    {
        return $this->hasMany(StockTransaction::class, 'product_id', 'product_id')
                    ->orderBy('created_at', 'desc');
    }

    
    public function scopeTersedia($query)
    {
        return $query->where('stok', '>', 0);
    }

    public function scopeHabis($query)
    {
        return $query->where('stok', '=', 0);
    }

    public function scopeStokMinimal($query)
    {
        return $query->whereColumn('stok', '<=', 'stok_minimal')
                     ->where('stok_minimal', '>', 0);
    }
    
    public function getStatusStokAttribute()
    {
        if ($this->stok == 0) {
            return 'Habis';
        } elseif ($this->stok_minimal && $this->stok <= $this->stok_minimal) {
            return 'Stok Minimal';
        }
        return 'Tersedia';
    }

    public function getMarginAttribute()
    {
        if ($this->harga_modal > 0) {
            return $this->harga_jual - $this->harga_modal;
        }
        return 0;
    }

    public function getPercentageMarginAttribute()
    {
        if ($this->harga_modal > 0) {
            return (($this->harga_jual - $this->harga_modal) / $this->harga_modal) * 100;
        }
        return 0;
    }
}