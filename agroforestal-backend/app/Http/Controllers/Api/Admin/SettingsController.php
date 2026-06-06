<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index()
    {
        return response()->json(Setting::allAsMap());
    }

    public function update(Request $request)
    {
        $allowed = ['site_name', 'site_tagline', 'hero_images', 'feed_images', 'whatsapp', 'phone', 'address', 'instagram'];

        foreach ($request->only($allowed) as $key => $value) {
            Setting::set($key, is_array($value) ? json_encode($value) : $value);
        }

        return response()->json(Setting::allAsMap());
    }
}
