<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PostController extends Controller
{
    public function index(Request $request)
    {
        $query = Post::with('author:id,name,avatar');

        // Solo el admin puede ver borradores (?include_drafts=1)
        $isAdmin = $request->user('sanctum')?->role === 'admin';
        if ($isAdmin && $request->boolean('include_drafts')) {
            $query->orderByDesc('created_at');
        } else {
            $query->where('status', 'published')->orderByDesc('published_at');
        }

        $perPage = min((int) $request->input('per_page', 9), 200);

        return response()->json($query->paginate($perPage));
    }

    public function show(Post $post)
    {
        return response()->json($post->load('author:id,name,avatar'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'   => 'required|string|max:255',
            'excerpt' => 'nullable|string',
            'body'    => 'required|string',
            'status'  => 'in:draft,published',
        ]);
        $data['slug']      = Str::slug($data['title']);
        $data['author_id'] = $request->user()->id;
        if (($data['status'] ?? 'draft') === 'published') {
            $data['published_at'] = now();
        }
        return response()->json(Post::create($data), 201);
    }

    public function update(Request $request, Post $post)
    {
        $data = $request->validate([
            'title'   => 'sometimes|string|max:255',
            'excerpt' => 'nullable|string',
            'body'    => 'sometimes|string',
            'status'  => 'in:draft,published',
        ]);
        if (isset($data['title'])) $data['slug'] = Str::slug($data['title']);
        if (($data['status'] ?? null) === 'published' && $post->status === 'draft') {
            $data['published_at'] = now();
        }
        $post->update($data);
        return response()->json($post);
    }

    public function destroy(Post $post)
    {
        $post->delete();
        return response()->json(null, 204);
    }
}
