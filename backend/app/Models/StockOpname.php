<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockOpname extends Model
{
    use HasFactory;

    protected $table = 'stock_opnames';
    protected $primaryKey = 'opname_id';

    protected $fillable = [
        'product_id',
        'user_id',
        'tanggal_opname',
        'stok_sistem',
        'stok_fisik',
        'selisih',
        'nama_petugas',
        'catatan',
        'status_penyesuaian',
    ];

    protected $casts = [
        'tanggal_opname' => 'date',
        'stok_sistem' => 'integer',
        'stok_fisik' => 'integer',
        'selisih' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
    public function scopeDisesuaikan($query)
    {
        return $query->where('status_penyesuaian', 'Disesuaikan');
    }
    public function scopeBelumDisesuaikan($query)
    {
        return $query->where('status_penyesuaian', 'Belum Disesuaikan');
    }
}