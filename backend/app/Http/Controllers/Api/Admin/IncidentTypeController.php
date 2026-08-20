<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreIncidentTypeRequest;
use App\Models\IncidentType;
use Illuminate\Http\JsonResponse;

class IncidentTypeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(IncidentType::query()->withCount('incidents')->orderBy('sort_order')->orderBy('name')->get());
    }

    public function store(StoreIncidentTypeRequest $request): JsonResponse
    {
        $type = IncidentType::query()->create([...$request->validated(), 'sort_order' => $request->integer('sort_order', 0), 'is_active' => $request->boolean('is_active', true)]);
        return response()->json($type, 201);
    }

    public function update(StoreIncidentTypeRequest $request, IncidentType $incidentType): JsonResponse
    {
        $incidentType->update([...$request->validated(), 'sort_order' => $request->integer('sort_order', $incidentType->sort_order), 'is_active' => $request->boolean('is_active', $incidentType->is_active)]);
        return response()->json($incidentType->fresh()->loadCount('incidents'));
    }

    public function destroy(IncidentType $incidentType): JsonResponse
    {
        abort_if($incidentType->incidents()->exists(), 409, 'Tipologia già utilizzata: disattivarla invece di eliminarla.');
        $incidentType->delete();
        return response()->json(status: 204);
    }
}
