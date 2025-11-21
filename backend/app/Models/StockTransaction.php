<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockTransaction extends Model
{
    use HasFactory;

    protected $table = 'stock_transactions';
    protected $primaryKey = 'transaction_id';

    protected $fillable = [
        'product_id',
        'user_id',
        'jenis_transaksi',
        'jumlah',
        'catatan',
        'penanggung_jawab',
    ];

    protected $casts = [
        'jumlah' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function scopeIn($query)
    {
        return $query->where('jenis_transaksi', 'IN');
    }

    public function scopeOut($query)
    {
        return $query->where('jenis_transaksi', 'OUT');
    }

    public function scopeAdjust($query)
    {
        return $query->where('jenis_transaksi', 'ADJUST');
    }

    protected static function boot()
    {
        parent::boot();

        static::created(function ($transaction) {
            $product = Product::find($transaction->product_id);
            if ($product) {
                switch ($transaction->jenis_transaksi) {
                    case 'IN':
                        $product->stok += $transaction->jumlah;
                        break;
                    case 'OUT':
                        $product->stok -= $transaction->jumlah;
                        break;
                    case 'ADJUST':
                        $product->stok = $transaction->jumlah;
                        break;
                }
                $product->save();
            }
        });
    }
}