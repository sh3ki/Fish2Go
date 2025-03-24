<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Summary extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'total_sales',
        'total_income',
        'total_expense',
        'total_cash',
        'total_gcash',
        'total_grabfood',
        'total_foodpanda',
        'total_deposited',
    ];
}