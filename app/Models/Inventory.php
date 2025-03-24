<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    use HasFactory;

    protected $table = 'inventory';

    protected $primaryKey = 'inventory_id';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'inventory_name',
        'inventory_qty',
        'inventory_image',
        'inventory_price',
    ];

    public $timestamps = true;
}
