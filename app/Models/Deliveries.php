<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Deliveries extends Model
{
    protected $fillable = [
        'date',
        'user_id',
        'type',
        'product_id',
        'inventory_id',
        'delivery_beg',
        'delivery_qty',
        'delivery_end'
    ];

    /**
     * Get the user that owns the delivery.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the product if type is product.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the inventory if type is inventory.
     */
    public function inventory(): BelongsTo
    {
        return $this->belongsTo(Inventory::class);
    }
}
