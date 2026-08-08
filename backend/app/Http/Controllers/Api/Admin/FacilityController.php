<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreFacilityRequest;
use App\Models\Facility;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class FacilityController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Facility::query()
                ->with(['organization', 'city.province.region.country', 'statusLookup'])
                ->orderBy('name')
                ->get()
        );
    }

    public function show(Facility $facility): JsonResponse
    {
        return response()->json(
            $facility->load(['organization', 'city.province.region.country', 'statusLookup'])
        );
    }

    public function store(StoreFacilityRequest $request): JsonResponse
    {
        $facility = Facility::query()->create($request->validated());

        return response()->json(
            $facility->load(['organization', 'city.province.region.country', 'statusLookup']),
            201
        );
    }

    public function update(StoreFacilityRequest $request, Facility $facility): JsonResponse
    {
        $facility->update($request->validated());

        return response()->json(
            $facility->load(['organization', 'city.province.region.country', 'statusLookup'])
        );
    }

    public function destroy(Facility $facility): JsonResponse
    {
        if ($facility->userFacilityRoles()->exists()) {
            return response()->json([
                'message' => 'Impossibile eliminare la struttura: esistono assegnazioni utente collegate.',
            ], 409);
        }

        if ($facility->minors()->exists()) {
            return response()->json([
                'message' => 'Impossibile eliminare la struttura: esistono minori collegati.',
            ], 409);
        }

        if ($facility->staffMembers()->exists()) {
            return response()->json([
                'message' => 'Impossibile eliminare la struttura: esistono operatori collegati.',
            ], 409);
        }

        if ($facility->attachments()->exists()) {
            return response()->json([
                'message' => 'Impossibile eliminare la struttura: esistono allegati collegati.',
            ], 409);
        }

        if ($facility->auditLogs()->exists()) {
            return response()->json([
                'message' => 'Impossibile eliminare la struttura: esistono log di audit collegati.',
            ], 409);
        }

        $facility->delete();

        return response()->json([
            'message' => 'Struttura eliminata con successo.',
        ], Response::HTTP_OK);
    }
}
