<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCityRequest;
use App\Models\City;
use Illuminate\Http\JsonResponse;

class CityController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            City::query()
                ->with('province.region.country')
                ->when(
                    request()->filled('province_id'),
                    fn ($query) => $query->where('province_id', request()->integer('province_id'))
                )
                ->orderBy('name')
                ->get()
        );
    }

    public function store(StoreCityRequest $request): JsonResponse
    {
        $city = City::query()->create($request->validated());

        return response()->json($city->load('province.region.country'), 201);
    }

    public function show(City $city): JsonResponse
    {
        return response()->json($city->load('province.region.country'));
    }

    public function update(StoreCityRequest $request, City $city): JsonResponse
    {
        $city->update($request->validated());

        return response()->json($city->fresh()->load('province.region.country'));
    }

    public function destroy(City $city): JsonResponse
    {
        if ($city->facilities()->exists()) {
            return response()->json(['message' => 'Impossibile eliminare la città: esistono strutture collegate.'], 409);
        }

        $city->delete();

        return response()->json(status: 204);
    }
}
