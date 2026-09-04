<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityResource;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ActivityController extends Controller
{
    /**
     * List recent activities.
     */
    public function index(Request $request): JsonResponse
    {
        $limit = (int) $request->query('limit', 50);
        $activities = ActivityLog::orderBy('timestamp', 'desc')
            ->limit(min($limit, 100))
            ->get();

        return response()->json([
            'success' => true,
            'data' => ActivityResource::collection($activities),
        ]);
    }

    /**
     * Record a new activity log.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string'],
            'actionTitle' => ['required', 'string'],
            'description' => ['required', 'string'],
            'targetName' => ['required', 'string'],
            'targetId' => ['nullable', 'string'],
            'employeeName' => ['nullable', 'string'],
        ]);

        $user = $request->user();
        $id = 'act-' . time() . '-' . Str::random(5);

        $activity = ActivityLog::create([
            'id' => $id,
            'user_id' => $user ? $user->id : ($request->input('userId') ?? 'user-001'),
            'user_name' => $user ? $user->name : ($request->input('userName') ?? 'Admin'),
            'user_role' => $user ? $user->role : ($request->input('userRole') ?? 'admin'),
            'type' => $validated['type'],
            'action_title' => $validated['actionTitle'],
            'description' => $validated['description'],
            'target_name' => $validated['targetName'],
            'target_id' => $validated['targetId'] ?? null,
            'employee_name' => $validated['employeeName'] ?? null,
            'timestamp' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => new ActivityResource($activity),
        ], 201);
    }
}
