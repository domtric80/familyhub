<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreStaffQualificationRequest;
use App\Models\StaffQualification;
use Illuminate\Http\JsonResponse;

class StaffQualificationController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            StaffQualification::query()
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
        );
    }

    public function store(StoreStaffQualificationRequest $request): JsonResponse
    {
        $qualification = StaffQualification::query()->create([
            ...$request->validated(),
            'is_active' => $request->boolean('is_active', true),
            'sort_order' => $request->integer('sort_order', 100),
        ]);

        return response()->json($qualification, 201);
    }

    public function show(StaffQualification $staffQualification): JsonResponse
    {
        return response()->json($staffQualification);
    }

    public function update(StoreStaffQualificationRequest $request, StaffQualification $staffQualification): JsonResponse
    {
        $staffQualification->update([
            ...$request->validated(),
            'is_active' => $request->boolean('is_active', $staffQualification->is_active),
            'sort_order' => $request->integer('sort_order', $staffQualification->sort_order),
        ]);

        return response()->json($staffQualification->fresh());
    }

    public function destroy(StaffQualification $staffQualification): JsonResponse
    {
        if ($staffQualification->staffMembers()->exists()) {
            return response()->json([
                'message' => 'Impossibile eliminare la qualifica: esistono operatori collegati.',
            ], 409);
        }

        $staffQualification->delete();

        return response()->json(status: 204);
    }
}
