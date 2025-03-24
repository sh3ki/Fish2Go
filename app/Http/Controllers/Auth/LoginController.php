<?php

namespace App\Http\Controllers\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\LoginLog;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);
    
        if (Auth::attempt($credentials)) {
            $user = Auth::user();
    
            // Store login time
            LoginLog::create([
                'user_id' => $user->id,
                'logged_in_at' => now(),
            ]);
    
            return response()->json(['message' => 'Logged in successfully']);
        }
    
        return response()->json(['error' => 'Unauthorized'], 401);
    }
}