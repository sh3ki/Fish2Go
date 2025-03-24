<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\UserlogController;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');

        if (Auth::attempt($credentials)) {
            // Trigger the login log
            app(UserlogController::class)->logIn();

            // Debugging
            \Log::info('User logged in: ' . Auth::id());

            // ...existing code...
        }

        // ...existing code...
    }

    public function logout(Request $request)
    {
        // Trigger the logout log
        app(UserlogController::class)->logOut();

        // Debugging
        \Log::info('User logged out: ' . Auth::id());

        // ...existing logout logic...
        Auth::logout();

        // ...existing code...
    }
}