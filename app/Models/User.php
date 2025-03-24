<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Cache;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'usertype',
        'logged_in_at',
        'logged_out_at',
    ];

    /**
     * The attributes that should have default values.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'usertype' => 'staff',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function updateLoginTimestamp()
    {
        $this->logged_in_at = now();
        $this->save();

        Userlog::create([
            'user_id' => $this->id,
            'logged_in_at' => now(),
        ]);

        Cache::forget('staff_users'); // Clear cache to update data
    }

    public function updateLogoutTimestamp()
    {
        $this->logged_out_at = now();
        $this->save();

        Userlog::where('user_id', $this->id)
            ->whereNull('logged_out_at')
            ->latest()
            ->first()
            ->update(['logged_out_at' => now()]);

        Cache::forget('staff_users'); // Clear cache to update data
    }
}
