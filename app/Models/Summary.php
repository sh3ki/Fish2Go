<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Summary extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'total_gross_sales',
        'total_expenses',
        'total_net_sales',
        'total_cash',
        'total_gcash',
        'total_grabfood',
        'total_foodpanda',
        'total_register_cash',
        'total_deposited',
    ];
}