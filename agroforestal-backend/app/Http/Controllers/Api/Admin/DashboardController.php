<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ServiceRequest;
use App\Models\Quote;
use App\Models\User;
use App\Models\Post;

class DashboardController extends Controller
{
    public function index()
    {
        return response()->json([
            'products'         => Product::count(),
            'users'            => User::where('role', 'client')->count(),
            'service_requests' => ServiceRequest::where('status', 'pending')->count(),
            'quotes'           => Quote::where('status', 'pending')->count(),
            'posts'            => Post::count(),
            'recent_requests'  => ServiceRequest::latest()->take(5)->get(),
            'recent_quotes'    => Quote::latest()->take(5)->get(),
        ]);
    }
}
