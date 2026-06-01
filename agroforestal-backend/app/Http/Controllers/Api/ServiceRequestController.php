<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ServiceRequest;
use Illuminate\Http\Request;

class ServiceRequestController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = ServiceRequest::query();

        if (!$user->isAdmin()) {
            $query->where('user_id', $user->id);
        }

        return response()->json($query->latest()->paginate(15));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'                => 'required|string|max:255',
            'email'               => 'required|email',
            'phone'               => 'nullable|string|max:20',
            'equipment_brand'     => 'nullable|string|max:100',
            'equipment_model'     => 'nullable|string|max:100',
            'problem_description' => 'required|string',
            'service_type'        => 'in:maintenance,repair,diagnosis,other',
        ]);

        if ($request->user()) {
            $data['user_id'] = $request->user()->id;
        }

        return response()->json(ServiceRequest::create($data), 201);
    }

    public function show(Request $request, ServiceRequest $serviceRequest)
    {
        $user = $request->user();
        if (!$user->isAdmin() && $serviceRequest->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        return response()->json($serviceRequest);
    }

    public function update(Request $request, ServiceRequest $serviceRequest)
    {
        $data = $request->validate([
            'status'      => 'in:pending,in_review,in_progress,completed,cancelled',
            'admin_notes' => 'nullable|string',
        ]);
        $serviceRequest->update($data);
        return response()->json($serviceRequest);
    }

    public function destroy(ServiceRequest $serviceRequest)
    {
        $serviceRequest->delete();
        return response()->json(null, 204);
    }
}
