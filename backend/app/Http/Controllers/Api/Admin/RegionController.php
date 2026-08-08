<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreRegionRequest;
use App\Models\Region;
use Illuminate\Http\JsonResponse;

class RegionController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Region::query()
                ->with('country', 'provinces.cities')
                ->when(
                    request()->filled('country_id'),
                    fn ($query) => $query->where('country_id', request()->integer('country_id'))
                )
                ->orderBy('name')
                ->get()
        );
    }

    public function store(StoreRegionRequest $request): JsonResponse
    {
        $region = Region::query()->create($request->validated());

        return response()->json($region->load('country'), 201);
    }

    public function show(Region $region): JsonResponse
    {
        return response()->json($region->load('country', 'provinces.cities'));
    }

    public function update(StoreRegionRequest $request, Region $region): JsonResponse
    {
        $region->update($request->validated());

        return response()->json($region->fresh()->load('country'));
    }

    public function destroy(Region $region): JsonResponse
    {
        if ($region->provinces()->exists()) {
            return response()->json(['message' => 'Impossibile eliminare la regione: esistono province collegate.'], 409);
        }

        $region->delete();

        return response()->json(status: 204);
    }
}
