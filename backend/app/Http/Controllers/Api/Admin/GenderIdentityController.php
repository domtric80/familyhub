<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreGenderIdentityRequest;
use App\Models\GenderIdentity;
use Illuminate\Http\JsonResponse;

class GenderIdentityController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            GenderIdentity::query()
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
        );
    }

    public function store(StoreGenderIdentityRequest $request): JsonResponse
    {
        $genderIdentity = GenderIdentity::query()->create([
            ...$request->validated(),
            'sort_order' => $request->integer('sort_order', 0),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json($genderIdentity, 201);
    }

    public function show(GenderIdentity $genderIdentity): JsonResponse
    {
        return response()->json($genderIdentity);
    }

    public function update(StoreGenderIdentityRequest $request, GenderIdentity $genderIdentity): JsonResponse
    {
        $genderIdentity->update([
            ...$request->validated(),
            'sort_order' => $request->integer('sort_order', $genderIdentity->sort_order),
            'is_active' => $request->boolean('is_active', $genderIdentity->is_active),
        ]);

        return response()->json($genderIdentity->fresh());
    }

    public function destroy(GenderIdentity $genderIdentity): JsonResponse
    {
        if ($genderIdentity->minors()->exists()) {
            return response()->json([
                'message' => 'Impossibile eliminare il genere: esistono minori collegati.',
            ], 409);
        }

        $genderIdentity->delete();

        return response()->json(status: 204);
    }
}
