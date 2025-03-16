<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Order extends Model
{
    use HasFactory;
    
    protected $table = 'orders';    
    
    protected $fillable = [
        'items', 'subtotal', 'tax', 'discount', 'total', 'payment', 'change', 'status',
    ];

    protected $casts = [
        'items' => 'array',
    ];
}