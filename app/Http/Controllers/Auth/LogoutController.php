<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\LoginLog;

class LogoutController extends Controller
{
    public function logout(Request $request)
    {
        $user = Auth::user();
    
        // Find the latest login record and update the logout time
        $log = LoginLog::where('user_id', $user->id)->latest()->first();
        if ($log) {
            $log->update(['logged_out_at' => now()]);
        }
    
        Auth::logout();
    
        return response()->json(['message' => 'Logged out successfully']);
    }
}
