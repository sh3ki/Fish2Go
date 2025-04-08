<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryUsed extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'inventory_used';
    
    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'inventory_used_id';
    
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'date',
        'inventory_id',
        'inventory_used'
    ];
    
    /**
     * Get the inventory item associated with this usage record.
     */
    public function inventory()
    {
        return $this->belongsTo(Inventory::class, 'inventory_id');
    }
}
