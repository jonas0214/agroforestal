<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\ServiceRequestController;
use App\Http\Controllers\Api\QuoteController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\SettingsController;
use App\Http\Controllers\Api\Admin\MediaController;
use Illuminate\Support\Facades\Route;

// Public settings (logo, hero images)
Route::get('/settings', [SettingsController::class, 'index']);

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

Route::get('/products',        [ProductController::class, 'index']);
Route::get('/products/{product}', [ProductController::class, 'show']);
Route::get('/categories',      [CategoryController::class, 'index']);
Route::get('/categories/{category}', [CategoryController::class, 'show']);
Route::get('/brands',          [BrandController::class, 'index']);
Route::get('/posts',           [PostController::class, 'index']);
Route::get('/posts/{post}',    [PostController::class, 'show']);

// Public service request (guest or auth)
Route::post('/service-requests', [ServiceRequestController::class, 'store']);
Route::post('/quotes',           [QuoteController::class, 'store']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout',         [AuthController::class, 'logout']);
    Route::get('/me',              [AuthController::class, 'me']);
    Route::patch('/me',            [AuthController::class, 'updateProfile']);

    Route::get('/service-requests',          [ServiceRequestController::class, 'index']);
    Route::get('/service-requests/{serviceRequest}', [ServiceRequestController::class, 'show']);
    Route::get('/quotes',                    [QuoteController::class, 'index']);
    Route::get('/quotes/{quote}',            [QuoteController::class, 'show']);

    // Admin-only routes
    Route::middleware('admin')->group(function () {
        Route::get('/admin/dashboard', [DashboardController::class, 'index']);

        Route::apiResource('admin/products',         ProductController::class)->except(['index', 'show']);
        Route::apiResource('admin/categories',       CategoryController::class)->except(['index', 'show']);
        Route::apiResource('admin/brands',           BrandController::class)->except(['index', 'show']);
        Route::apiResource('admin/posts',            PostController::class)->except(['index', 'show']);

        Route::patch('/admin/service-requests/{serviceRequest}', [ServiceRequestController::class, 'update']);
        Route::delete('/admin/service-requests/{serviceRequest}', [ServiceRequestController::class, 'destroy']);
        Route::patch('/admin/quotes/{quote}',        [QuoteController::class, 'update']);
        Route::delete('/admin/quotes/{quote}',       [QuoteController::class, 'destroy']);

        // Settings & Media
        Route::patch('/admin/settings',              [SettingsController::class, 'update']);
        Route::post('/admin/media/logo',             [MediaController::class, 'uploadLogo']);
        Route::post('/admin/media/favicon',          [MediaController::class, 'uploadFavicon']);
        Route::post('/admin/media/hero',             [MediaController::class, 'uploadHeroImage']);
        Route::delete('/admin/media/hero',           [MediaController::class, 'deleteHeroImage']);
        Route::post('/admin/media/product-image',    [MediaController::class, 'uploadProductImage']);
        Route::delete('/admin/media/product-image/{id}', [MediaController::class, 'deleteProductImage']);
    });
});
