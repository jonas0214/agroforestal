<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaController extends Controller
{
    public function uploadLogo(Request $request)
    {
        $request->validate(['file' => 'required|image|max:2048']);
        $url = $this->storePublic($request->file('file'), 'branding');
        Setting::set('logo_url', $url);
        return response()->json(['url' => $url]);
    }

    public function uploadFavicon(Request $request)
    {
        $request->validate(['file' => 'required|image|mimes:png,ico|max:512']);
        $url = $this->storePublic($request->file('file'), 'branding');
        Setting::set('favicon_url', $url);
        return response()->json(['url' => $url]);
    }

    public function uploadStoryImage(Request $request)
    {
        $request->validate(['file' => 'required|image|max:5120']);
        $url = $this->storePublic($request->file('file'), 'branding');
        Setting::set('story_image', $url);
        return response()->json(['url' => $url]);
    }

    public function uploadMascotImage(Request $request)
    {
        $request->validate(['file' => 'required|image|max:5120']);
        $url = $this->storePublic($request->file('file'), 'branding');
        Setting::set('mascot_image', $url);
        return response()->json(['url' => $url]);
    }

    public function uploadHeroImage(Request $request)
    {
        $request->validate(['file' => 'required|image|max:5120']);
        $url = $this->storePublic($request->file('file'), 'hero');

        $raw    = Setting::get('hero_images', '[]');
        $images = json_decode($raw, true) ?: [];
        $images[] = $url;
        Setting::set('hero_images', json_encode($images));

        return response()->json(['url' => $url, 'images' => $images]);
    }

    public function deleteHeroImage(Request $request)
    {
        $request->validate(['url' => 'required|string']);

        // Eliminar archivo físico del disco
        $relative = ltrim(str_replace(url('/storage'), '', $request->url), '/');
        if ($relative && !str_starts_with($relative, 'http')) {
            Storage::disk('public')->delete($relative);
        }

        $raw    = Setting::get('hero_images', '[]');
        $images = array_values(array_filter(json_decode($raw, true) ?: [], fn($u) => $u !== $request->url));
        Setting::set('hero_images', json_encode($images));
        return response()->json(['images' => $images]);
    }

    public function uploadFeedImage(Request $request)
    {
        $request->validate(['file' => 'required|image|max:5120']);
        $url = $this->storePublic($request->file('file'), 'feed');

        $raw    = Setting::get('feed_images', '[]');
        $images = json_decode($raw, true) ?: [];
        $images[] = $url;
        Setting::set('feed_images', json_encode($images));

        return response()->json(['url' => $url, 'images' => $images]);
    }

    public function deleteFeedImage(Request $request)
    {
        $request->validate(['url' => 'required|string']);

        // Eliminar archivo físico del disco
        $relative = ltrim(str_replace(url('/storage'), '', $request->url), '/');
        if ($relative && !str_starts_with($relative, 'http')) {
            Storage::disk('public')->delete($relative);
        }

        $raw    = Setting::get('feed_images', '[]');
        $images = array_values(array_filter(json_decode($raw, true) ?: [], fn($u) => $u !== $request->url));
        Setting::set('feed_images', json_encode($images));
        return response()->json(['images' => $images]);
    }

    public function uploadProductImage(Request $request)
    {
        $request->validate(['file' => 'required|image|max:4096', 'product_id' => 'required|exists:products,id']);

        $url = $this->storePublic($request->file('file'), 'products');

        $image = \App\Models\ProductImage::create([
            'product_id' => $request->product_id,
            'path'       => $url,
            'alt'        => $request->alt ?? null,
            'order'      => $request->order ?? 0,
        ]);

        // Auto-set como cover_image si el producto no tiene una aún
        $product = \App\Models\Product::findOrFail($request->product_id);
        if (!$product->cover_image) {
            $product->update(['cover_image' => $url]);
        }

        return response()->json($image);
    }

    public function deleteProductImage(int $id)
    {
        $image    = \App\Models\ProductImage::findOrFail($id);
        $product  = \App\Models\Product::find($image->product_id);
        $wasCover = $product && $product->cover_image === $image->path;

        $relative = str_replace(url('/storage') . '/', '', $image->path);
        Storage::disk('public')->delete($relative);
        $image->delete();

        // Si borramos la portada, reasignamos a otra imagen restante (o null)
        if ($wasCover) {
            $next = \App\Models\ProductImage::where('product_id', $product->id)->orderBy('order')->first();
            $product->update(['cover_image' => $next?->path]);
        }

        return response()->json(['message' => 'deleted', 'cover_image' => $product?->fresh()->cover_image]);
    }

    public function setProductCover(int $id)
    {
        $image   = \App\Models\ProductImage::findOrFail($id);
        $product = \App\Models\Product::findOrFail($image->product_id);
        $product->update(['cover_image' => $image->path]);

        return response()->json(['cover_image' => $image->path]);
    }

    private function storePublic($file, string $folder): string
    {
        $name = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = Storage::disk('public')->putFileAs($folder, $file, $name);
        return url(Storage::disk('public')->url($path));
    }
}
