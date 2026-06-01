<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quote;
use Illuminate\Http\Request;

class QuoteController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Quote::query();
        if (!$user->isAdmin()) {
            $query->where('user_id', $user->id);
        }
        return response()->json($query->latest()->paginate(15));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'  => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'nullable|string|max:20',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        if ($request->user()) {
            $data['user_id'] = $request->user()->id;
        }

        return response()->json(Quote::create($data), 201);
    }

    public function show(Request $request, Quote $quote)
    {
        $user = $request->user();
        if (!$user->isAdmin() && $quote->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        return response()->json($quote);
    }

    public function update(Request $request, Quote $quote)
    {
        $data = $request->validate([
            'status' => 'in:pending,reviewed,sent,accepted,rejected',
        ]);
        $quote->update($data);
        return response()->json($quote);
    }

    public function destroy(Quote $quote)
    {
        $quote->delete();
        return response()->json(null, 204);
    }
}
