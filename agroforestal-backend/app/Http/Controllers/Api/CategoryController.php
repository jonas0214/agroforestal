<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\GeneratesUniqueSlug;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    use GeneratesUniqueSlug;

    public function index()
    {
        return response()->json(Category::where('is_active', true)->with('children')->whereNull('parent_id')->get());
    }

    public function show(Category $category)
    {
        return response()->json($category->load('children', 'parent'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'      => 'required|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
        ]);
        $data['slug'] = $this->uniqueSlug(Category::class, $data['name']);
        return response()->json(Category::create($data), 201);
    }

    public function update(Request $request, Category $category)
    {
        $data = $request->validate([
            'name'      => 'sometimes|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'is_active' => 'boolean',
        ]);
        if (isset($data['name'])) $data['slug'] = $this->uniqueSlug(Category::class, $data['name'], $category->id);
        $category->update($data);
        return response()->json($category);
    }

    public function destroy(Category $category)
    {
        $category->delete();
        return response()->json(null, 204);
    }
}
