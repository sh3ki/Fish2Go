<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Userlog;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class UserlogController extends Controller
{
    public function logIn()
    {
        Userlog::create([
            'user_id' => Auth::id(),
            'logged_in_at' => now(),
        ]);

        // Debugging
        \Log::info('Userlog created for login: ' . Auth::id());
    }

    public function logOut()
    {
        $userlog = Userlog::where('user_id', Auth::id())->latest()->first();
        if ($userlog) {
            $userlog->update(['logged_out_at' => now()]);

            // Debugging
            \Log::info('Userlog updated for logout: ' . Auth::id());
        }
    }

    public function index()
    {
        $userlogs = Userlog::with('user')->get();
        $users = User::all();

        $userLogsData = $users->map(function ($user) use ($userlogs) {
            $userLog = $userlogs->where('user_id', $user->id)->last();
            return [
                'id' => $user->id,
                'name' => $user->name,
                'logged_in_at' => $userLog ? $userLog->logged_in_at : null,
                'logged_out_at' => $userLog ? $userLog->logged_out_at : null,
                'created_at' => $user->created_at,
            ];
        });

        return response()->json($userLogsData);
    }
}
