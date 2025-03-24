<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoginLog extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'logged_in_at', 'logged_out_at'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
