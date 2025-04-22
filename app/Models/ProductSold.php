<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductSold extends Model
{
    protected $table = 'product_sold';
    protected $primaryKey = 'product_sold_id';
    
    protected $fillable = [
        'date',
        'product_id',
        'product_qty',
        'product_sold'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }
}
