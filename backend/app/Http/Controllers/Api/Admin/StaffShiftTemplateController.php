<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shifts\StoreStaffShiftTemplateRequest;
use App\Models\StaffShiftTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class StaffShiftTemplateController extends Controller
{
    public function index(): JsonResponse
    {
        $query = StaffShiftTemplate::query()
            ->with('facility.organization')
            ->orderBy('facility_id')
            ->orderBy('sort_order')
            ->orderBy('name');

        if (request()->filled('facility_id')) {
            $query->where('facility_id', request()->integer('facility_id'));
        }

        if (request()->has('is_active')) {
            $query->where('is_active', request()->boolean('is_active'));
        }

        return response()->json($query->get());
    }

    public function store(StoreStaffShiftTemplateRequest $request): JsonResponse
    {
        $template = StaffShiftTemplate::query()->create([
            ...$request->validated(),
            'sort_order' => $request->integer('sort_order', 0),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json($template->load('facility.organization'), 201);
    }

    public function show(StaffShiftTemplate $shiftTemplate): JsonResponse
    {
        return response()->json($shiftTemplate->load('facility.organization'));
    }

    public function update(StoreStaffShiftTemplateRequest $request, StaffShiftTemplate $shiftTemplate): JsonResponse
    {
        $shiftTemplate->update([
            ...$request->validated(),
            'sort_order' => $request->integer('sort_order', $shiftTemplate->sort_order),
            'is_active' => $request->boolean('is_active', $shiftTemplate->is_active),
        ]);

        return response()->json($shiftTemplate->fresh()->load('facility.organization'));
    }

    public function destroy(StaffShiftTemplate $shiftTemplate): JsonResponse
    {
        if ($shiftTemplate->assignments()->exists()) {
            return response()->json([
                'message' => 'Impossibile eliminare il turno: esistono assegnazioni collegate.',
            ], 409);
        }

        $shiftTemplate->delete();

        return response()->json([
            'message' => 'Turno di struttura eliminato.',
        ], Response::HTTP_OK);
    }
}
