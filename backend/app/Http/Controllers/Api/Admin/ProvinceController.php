<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProvinceRequest;
use App\Models\Province;
use Illuminate\Http\JsonResponse;

class ProvinceController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Province::query()
                ->with('region.country')
                ->withCount('cities')
                ->when(
                    request()->filled('region_id'),
                    fn ($query) => $query->where('region_id', request()->integer('region_id'))
                )
                ->orderByDesc('cities_count')
                ->orderBy('name')
                ->get()
        );
    }

    public function store(StoreProvinceRequest $request): JsonResponse
    {
        $province = Province::query()->create($request->validated());

        return response()->json($province->load('region.country'), 201);
    }

    public function show(Province $province): JsonResponse
    {
        return response()->json($province->load('region.country', 'cities'));
    }

    public function update(StoreProvinceRequest $request, Province $province): JsonResponse
    {
        $province->update($request->validated());

        return response()->json($province->fresh()->load('region.country'));
    }

    public function destroy(Province $province): JsonResponse
    {
        if ($province->cities()->exists()) {
            return response()->json(['message' => 'Impossibile eliminare la provincia: esistono città collegate.'], 409);
        }

        $province->delete();

        return response()->json(status: 204);
    }
}
