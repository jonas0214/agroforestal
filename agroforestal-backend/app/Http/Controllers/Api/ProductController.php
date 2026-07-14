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
        $query = Product::with(['category', 'brand', 'images']);

        // Solo el admin puede ver productos inactivos (?include_inactive=1)
        $isAdmin = $request->user('sanctum')?->role === 'admin';
        if (!($isAdmin && $request->boolean('include_inactive'))) {
            $query->where('is_active', true);
        }

        if ($request->has('category')) {
            $query->whereHas('category', fn($q) => $q->where('slug', $request->category));
        }
        if ($request->has('brand')) {
            $query->whereHas('brand', fn($q) => $q->where('slug', $request->brand));
        }
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(fn($q) => $q
                ->where('name', 'like', '%' . $search . '%')
                ->orWhere('sku', 'like', '%' . $search . '%'));
        }
        if ($request->has('featured')) {
            $query->where('is_featured', true);
        }

        $perPage = min((int) $request->input('per_page', 12), 200);

        return response()->json($query->paginate($perPage));
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

        // SKU automático para auditorías si no se proporcionó uno (ej: AGRO-00001)
        if (empty($product->sku)) {
            $product->update(['sku' => 'AGRO-' . str_pad((string) $product->id, 5, '0', STR_PAD_LEFT)]);
        }

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
