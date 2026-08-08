<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreStaffDocumentStatusRequest;
use App\Models\StaffDocumentStatus;
use Illuminate\Http\JsonResponse;

class StaffDocumentStatusController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            StaffDocumentStatus::query()
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
        );
    }

    public function store(StoreStaffDocumentStatusRequest $request): JsonResponse
    {
        $status = StaffDocumentStatus::query()->create([
            ...$request->validated(),
            'is_active' => $request->boolean('is_active', true),
            'sort_order' => $request->integer('sort_order', 100),
        ]);

        return response()->json($status, 201);
    }

    public function show(StaffDocumentStatus $staffDocumentStatus): JsonResponse
    {
        return response()->json($staffDocumentStatus);
    }

    public function update(StoreStaffDocumentStatusRequest $request, StaffDocumentStatus $staffDocumentStatus): JsonResponse
    {
        $staffDocumentStatus->update([
            ...$request->validated(),
            'is_active' => $request->boolean('is_active', $staffDocumentStatus->is_active),
            'sort_order' => $request->integer('sort_order', $staffDocumentStatus->sort_order),
        ]);

        return response()->json($staffDocumentStatus->fresh());
    }

    public function destroy(StaffDocumentStatus $staffDocumentStatus): JsonResponse
    {
        if ($staffDocumentStatus->staffDocuments()->exists()) {
            return response()->json([
                'message' => 'Impossibile eliminare lo stato documento staff: esistono documenti collegati.',
            ], 409);
        }

        $staffDocumentStatus->delete();

        return response()->json(status: 204);
    }
}
