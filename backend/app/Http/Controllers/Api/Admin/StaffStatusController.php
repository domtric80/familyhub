<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreStaffStatusRequest;
use App\Models\StaffStatus;
use Illuminate\Http\JsonResponse;

class StaffStatusController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            StaffStatus::query()
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
        );
    }

    public function store(StoreStaffStatusRequest $request): JsonResponse
    {
        $status = StaffStatus::query()->create([
            ...$request->validated(),
            'is_active' => $request->boolean('is_active', true),
            'sort_order' => $request->integer('sort_order', 100),
        ]);

        return response()->json($status, 201);
    }

    public function show(StaffStatus $staffStatus): JsonResponse
    {
        return response()->json($staffStatus);
    }

    public function update(StoreStaffStatusRequest $request, StaffStatus $staffStatus): JsonResponse
    {
        $staffStatus->update([
            ...$request->validated(),
            'is_active' => $request->boolean('is_active', $staffStatus->is_active),
            'sort_order' => $request->integer('sort_order', $staffStatus->sort_order),
        ]);

        return response()->json($staffStatus->fresh());
    }

    public function destroy(StaffStatus $staffStatus): JsonResponse
    {
        if ($staffStatus->staffMembers()->exists()) {
            return response()->json([
                'message' => 'Impossibile eliminare lo stato operatore: esistono operatori collegati.',
            ], 409);
        }

        $staffStatus->delete();

        return response()->json(status: 204);
    }
}
