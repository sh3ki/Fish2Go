<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Order extends Model
{
    use HasFactory;
    
    protected $table = 'orders';    

    protected $primaryKey = 'id';
    
    protected $fillable = [
        'order_id',
        'product_id',
        'order_quantity',
        'order_subtotal',
        'order_tax',
        'order_discount',
        'order_total',
        'order_payment',
        'order_change',
        'order_status',
        'order_payment_method',
    ];

    protected $casts = [
        'order_subtotal' => 'float',
        'order_tax' => 'float',
        'order_discount' => 'float',
        'order_total' => 'float',
        'order_payment' => 'float',
        'order_change' => 'float',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }

}