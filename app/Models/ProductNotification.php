<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductNotification extends Model {
    use HasFactory;

    protected $fillable = [
        'product_id', 
        'message', 
        'status'
    ];

    public function product() {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
