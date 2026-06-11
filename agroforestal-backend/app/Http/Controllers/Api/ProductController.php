<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\GeneratesUniqueSlug;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    use GeneratesUniqueSlug;

    public function index(Request $request)
    {
        $query = Product::with(['category', 'brand', 'images'])
            ->where('is_active', true);

        if ($request->has('category')) {
            $query->whereHas('category', fn($q) => $q->where('slug', $request->category));
        }
        if ($request->has('brand')) {
            $query->whereHas('brand', fn($q) => $q->where('slug', $request->brand));
        }
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
        if ($request->has('featured')) {
            $query->where('is_featured', true);
        }

        return response()->json($query->paginate(12));
    }

    public function show(Product $product)
    {
        return response()->json($product->load(['category', 'brand', 'images']));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'details'     => 'nullable|string',
            'sku'         => 'nullable|string|unique:products',
            'price'       => 'nullable|numeric|min:0',
            'sale_price'  => 'nullable|numeric|min:0',
            'category_id' => 'nullable|exists:categories,id',
            'brand_id'    => 'nullable|exists:brands,id',
            'is_featured' => 'boolean',
            'is_active'   => 'boolean',
            'status'      => 'in:available,out_of_stock,discontinued',
        ]);

        $data['slug'] = $this->uniqueSlug(Product::class, $data['name']);

        $product = Product::create($data);

        return response()->json($product->load(['category', 'brand']), 201);
    }

    public function update(Request $request, Product $product)
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'details'     => 'nullable|string',
            'price'       => 'nullable|numeric|min:0',
            'sale_price'  => 'nullable|numeric|min:0',
            'category_id' => 'nullable|exists:categories,id',
            'brand_id'    => 'nullable|exists:brands,id',
            'is_featured' => 'boolean',
            'is_active'   => 'boolean',
            'status'      => 'in:available,out_of_stock,discontinued',
        ]);

        if (isset($data['name'])) {
            $data['slug'] = $this->uniqueSlug(Product::class, $data['name'], $product->id);
        }

        $product->update($data);

        return response()->json($product->load(['category', 'brand', 'images']));
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json(null, 204);
    }
}
