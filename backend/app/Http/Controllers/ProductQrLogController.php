<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductQrLog extends Model
{
    protected $table = 'product_qr_logs';
    protected $primaryKey = 'log_id';  
    public $incrementing = true;
     
    public $timestamps = true; 
    
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';
    
    protected $fillable = [
        'product_id',
        'scanned_by',
        'scanned_at'
    ];

    protected $casts = [
        'scanned_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
 
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }
 
    public function scopeByScanner($query, $scannedBy)
    {
        return $query->where('scanned_by', $scannedBy);
    }
 
    public function scopeToday($query)
    {
        return $query->whereDate('scanned_at', today());
    }
     
    public function scopeScannedBetween($query, $startDate, $endDate)
    {
        return $query->whereBetween('scanned_at', [$startDate, $endDate]);
    }
}