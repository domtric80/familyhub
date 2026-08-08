<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreApproachTypeRequest;
use App\Models\ApproachType;
use Illuminate\Http\JsonResponse;

class ApproachTypeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            ApproachType::query()->orderBy('sort_order')->orderBy('name')->get()
        );
    }

    public function store(StoreApproachTypeRequest $request): JsonResponse
    {
        $approachType = ApproachType::query()->create([
            ...$request->validated(),
            'sort_order' => $request->integer('sort_order', 0),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json($approachType, 201);
    }

    public function show(ApproachType $approachType): JsonResponse
    {
        return response()->json($approachType);
    }

    public function update(StoreApproachTypeRequest $request, ApproachType $approachType): JsonResponse
    {
        $approachType->update([
            ...$request->validated(),
            'sort_order' => $request->integer('sort_order', $approachType->sort_order),
            'is_active' => $request->boolean('is_active', $approachType->is_active),
        ]);

        return response()->json($approachType->fresh());
    }

    public function destroy(ApproachType $approachType): JsonResponse
    {
        $approachType->delete();

        return response()->json(status: 204);
    }
}
