<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\GeneratesUniqueSlug;
use App\Models\Brand;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    use GeneratesUniqueSlug;

    public function index()
    {
        return response()->json(Brand::where('is_active', true)->get());
    }

    public function show(Brand $brand)
    {
        return response()->json($brand);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'    => 'required|string|max:255',
            'website' => 'nullable|url',
        ]);
        $data['slug'] = $this->uniqueSlug(Brand::class, $data['name']);
        return response()->json(Brand::create($data), 201);
    }

    public function update(Request $request, Brand $brand)
    {
        $data = $request->validate([
            'name'      => 'sometimes|string|max:255',
            'website'   => 'nullable|url',
            'is_active' => 'boolean',
        ]);
        if (isset($data['name'])) $data['slug'] = $this->uniqueSlug(Brand::class, $data['name'], $brand->id);
        $brand->update($data);
        return response()->json($brand);
    }

    public function destroy(Brand $brand)
    {
        $brand->delete();
        return response()->json(null, 204);
    }
}
