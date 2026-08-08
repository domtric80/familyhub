<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreActivityTypeRequest;
use App\Models\ActivityType;
use Illuminate\Http\JsonResponse;

class ActivityTypeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            ActivityType::query()->orderBy('sort_order')->orderBy('name')->get()
        );
    }

    public function store(StoreActivityTypeRequest $request): JsonResponse
    {
        $activityType = ActivityType::query()->create([
            ...$request->validated(),
            'sort_order' => $request->integer('sort_order', 0),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json($activityType, 201);
    }

    public function show(ActivityType $activityType): JsonResponse
    {
        return response()->json($activityType);
    }

    public function update(StoreActivityTypeRequest $request, ActivityType $activityType): JsonResponse
    {
        $activityType->update([
            ...$request->validated(),
            'sort_order' => $request->integer('sort_order', $activityType->sort_order),
            'is_active' => $request->boolean('is_active', $activityType->is_active),
        ]);

        return response()->json($activityType->fresh());
    }

    public function destroy(ActivityType $activityType): JsonResponse
    {
        $activityType->delete();

        return response()->json(status: 204);
    }
}
