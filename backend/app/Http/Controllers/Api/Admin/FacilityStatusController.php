<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreFacilityStatusRequest;
use App\Models\FacilityStatus;
use Illuminate\Http\JsonResponse;

class FacilityStatusController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            FacilityStatus::query()
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
        );
    }

    public function store(StoreFacilityStatusRequest $request): JsonResponse
    {
        $status = FacilityStatus::query()->create([
            ...$request->validated(),
            'is_active' => $request->boolean('is_active', true),
            'sort_order' => $request->integer('sort_order', 100),
        ]);

        return response()->json($status, 201);
    }

    public function show(FacilityStatus $facilityStatus): JsonResponse
    {
        return response()->json($facilityStatus);
    }

    public function update(StoreFacilityStatusRequest $request, FacilityStatus $facilityStatus): JsonResponse
    {
        $facilityStatus->update([
            ...$request->validated(),
            'is_active' => $request->boolean('is_active', $facilityStatus->is_active),
            'sort_order' => $request->integer('sort_order', $facilityStatus->sort_order),
        ]);

        return response()->json($facilityStatus->fresh());
    }

    public function destroy(FacilityStatus $facilityStatus): JsonResponse
    {
        if ($facilityStatus->facilities()->exists()) {
            return response()->json([
                'message' => 'Impossibile eliminare lo stato struttura: esistono strutture collegate.',
            ], 409);
        }

        $facilityStatus->delete();

        return response()->json(status: 204);
    }
}
