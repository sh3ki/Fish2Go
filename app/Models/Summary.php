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
        'total_walk_in',
        'total_gcash',
        'total_grabfood',
        'total_foodpanda',
        'total_register_cash',
        'total_deposited',
    ];
    
    /**
     * The primary key used by the firstOrNew method
     */
    protected $primaryKey = 'date';
    
    /**
     * Indicates if the model's primary key is an incrementing integer.
     *
     * @var bool
     */
    public $incrementing = false;
    
    /**
     * The data type of the primary key.
     *
     * @var string
     */
    protected $keyType = 'string';
}