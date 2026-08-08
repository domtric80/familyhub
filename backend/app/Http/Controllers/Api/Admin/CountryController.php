<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCountryRequest;
use App\Models\Country;
use Illuminate\Http\JsonResponse;

class CountryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Country::query()->with('regions.provinces.cities')->orderBy('name')->get()
        );
    }

    public function store(StoreCountryRequest $request): JsonResponse
    {
        $country = Country::query()->create($request->validated());

        return response()->json($country, 201);
    }

    public function show(Country $country): JsonResponse
    {
        return response()->json($country->load('regions.provinces.cities'));
    }

    public function update(StoreCountryRequest $request, Country $country): JsonResponse
    {
        $country->update($request->validated());

        return response()->json($country->fresh());
    }

    public function destroy(Country $country): JsonResponse
    {
        if ($country->regions()->exists()) {
            return response()->json(['message' => 'Impossibile eliminare la nazione: esistono regioni collegate.'], 409);
        }

        $country->delete();

        return response()->json(status: 204);
    }
}
