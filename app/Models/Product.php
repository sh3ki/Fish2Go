<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model {
    use HasFactory;

    protected $fillable = [
        'product_name',
        'product_price',
        'product_quantity',
        'product_category',
        'product_image',
        'notification_status',
    ];

    public function updateStockAndNotification($quantity) {
        $this->product_quantity = $quantity;
        $this->save();

        if ($this->product_quantity < 9 && $this->notification_status !== 'unread') {
            $this->notification_status = 'unread';
            $this->save();
        } elseif ($this->product_quantity >= 9) {
            $this->notification_status = 'read';
            $this->save();
        }
    }
}
