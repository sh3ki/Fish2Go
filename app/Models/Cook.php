<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cook extends Model
{
    use HasFactory;

    protected $primaryKey = 'cook_id';
    protected $fillable = ['product_id', 'cook_available', 'cook_leftover'];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
