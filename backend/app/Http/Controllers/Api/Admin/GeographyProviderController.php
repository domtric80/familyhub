<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreGeographyProviderRequest;
use App\Models\GeographyProvider;
use Illuminate\Http\JsonResponse;

class GeographyProviderController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            GeographyProvider::query()
                ->withCount('countries')
                ->orderBy('priority')
                ->orderBy('name')
                ->get()
        );
    }

    public function store(StoreGeographyProviderRequest $request): JsonResponse
    {
        $provider = GeographyProvider::query()->create([
            ...$request->validated(),
            'priority' => $request->integer('priority', 100),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json($provider, 201);
    }

    public function show(GeographyProvider $provider): JsonResponse
    {
        return response()->json($provider->load('countries'));
    }

    public function update(StoreGeographyProviderRequest $request, GeographyProvider $provider): JsonResponse
    {
        $provider->update([
            ...$request->validated(),
            'priority' => $request->integer('priority', $provider->priority),
            'is_active' => $request->boolean('is_active', $provider->is_active),
        ]);

        return response()->json($provider->fresh()->load('countries'));
    }

    public function destroy(GeographyProvider $provider): JsonResponse
    {
        if ($provider->countries()->exists()) {
            return response()->json([
                'message' => 'Impossibile eliminare il provider: esistono nazioni associate.',
            ], 409);
        }

        $provider->delete();

        return response()->json(status: 204);
    }
}
