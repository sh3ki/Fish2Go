<?php

namespace App\Http\Controllers;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\User;

class StaffMessagesController extends Controller
{
    public function index(Request $request)
    {
        $currentUser = $request->user();
        $users = User::select('id', 'name', 'usertype')->where('id', '!=', $currentUser->id)->get();
        return Inertia::render('staff_messages', [
            'currentUser' => $currentUser,
            'users' => $users,
        ]);
    }
}
