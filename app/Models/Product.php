<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\ProductNotification;

class Product extends Model {
    use HasFactory;

    protected $fillable = [
        'product_name',
        'product_price',
        'product_quantity',
        'product_category',
        'product_image',
    ];

    public function productNotifications() {
        return $this->hasMany(ProductNotification::class);
    }

    public function setProductQuantity($quantity) {
        $this->product_quantity = $quantity;
        $this->save();

        if ($this->product_quantity < 9) {
            ProductNotification::updateOrCreate(
                ['product_id' => $this->id],
                ['message' => "Low stock alert for {$this->product_name} ({$this->product_quantity} left)", 'status' => 'unread']
            );
        }
    }
}
