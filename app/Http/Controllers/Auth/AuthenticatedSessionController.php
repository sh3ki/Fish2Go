<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\LoginLog;


class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();
    
        $user = Auth::user(); // Get the authenticated user
        
        // Store login time in LoginLog
        LoginLog::create([
            'user_id' => $user->id,
            'logged_in_at' => now(),
        ]);
    
        \Log::info('User logged in with type: ' . $user->usertype);

        if ($user->usertype === 'admin') {
            \Log::info('Redirecting admin to: ' . route('admin.dashboard'));
            return redirect()->intended(route('admin.dashboard'));
        } elseif ($user->usertype === 'staff') {
            \Log::info('Redirecting staff to: ' . route('staff.pos'));
            return redirect()->intended(route('staff.pos'));
        }
    
        \Log::info('Redirecting other user to home');
        return redirect()->intended(route('home')); 
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
