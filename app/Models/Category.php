<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Category extends Model
{
    use HasFactory;

    protected $table = 'categories';

    protected $primaryKey = 'category_id';

    public $incrementing = true;

    protected $fillable = [
        'category_name',
        'category_color',
    ];

    protected $keyType = 'int';

    public $timestamps = true;
}
