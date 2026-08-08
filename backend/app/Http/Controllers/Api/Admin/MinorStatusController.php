<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreMinorStatusRequest;
use App\Models\MinorStatus;
use Illuminate\Http\JsonResponse;

class MinorStatusController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            MinorStatus::query()
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
        );
    }

    public function store(StoreMinorStatusRequest $request): JsonResponse
    {
        $minorStatus = MinorStatus::query()->create([
            ...$request->validated(),
            'sort_order' => $request->integer('sort_order', 0),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json($minorStatus, 201);
    }

    public function show(MinorStatus $minorStatus): JsonResponse
    {
        return response()->json($minorStatus);
    }

    public function update(StoreMinorStatusRequest $request, MinorStatus $minorStatus): JsonResponse
    {
        $minorStatus->update([
            ...$request->validated(),
            'sort_order' => $request->integer('sort_order', $minorStatus->sort_order),
            'is_active' => $request->boolean('is_active', $minorStatus->is_active),
        ]);

        return response()->json($minorStatus->fresh());
    }

    public function destroy(MinorStatus $minorStatus): JsonResponse
    {
        if ($minorStatus->minors()->exists()) {
            return response()->json([
                'message' => 'Impossibile eliminare lo stato minore: esistono minori collegati.',
            ], 409);
        }

        $minorStatus->delete();

        return response()->json(status: 204);
    }
}
