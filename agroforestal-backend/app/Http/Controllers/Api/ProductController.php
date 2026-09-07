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

        // category y brand aceptan varios slugs separados por coma:
        // ?category=motosierras,guadanas&brand=stihl,honda
        $slugs = fn($v) => array_values(array_filter(array_map('trim', explode(',', (string) $v))));

        if ($request->filled('category')) {
            $cats = $slugs($request->category);
            $query->whereHas('category', fn($q) => $q->whereIn('slug', $cats));
        }
        if ($request->filled('brand')) {
            $brands = $slugs($request->brand);
            $query->whereHas('brand', fn($q) => $q->whereIn('slug', $brands));
        }
        if ($request->filled('status')) {
            $query->whereIn('status', $slugs($request->status));
        }
        if ($request->boolean('on_sale')) {
            $query->whereNotNull('sale_price');
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

        // Ordenamiento. Por defecto alfabético para que el catálogo sea predecible.
        // COALESCE: el precio de oferta manda sobre el precio de lista.
        match ($request->input('sort', 'name_asc')) {
            'name_desc'  => $query->orderBy('name', 'desc'),
            'price_asc'  => $query->orderByRaw('COALESCE(sale_price, price) IS NULL, COALESCE(sale_price, price) ASC'),
            'price_desc' => $query->orderByRaw('COALESCE(sale_price, price) IS NULL, COALESCE(sale_price, price) DESC'),
            'newest'     => $query->orderBy('created_at', 'desc'),
            default      => $query->orderBy('name', 'asc'),
        };

        $perPage = min((int) $request->input('per_page', 12), 300);

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
