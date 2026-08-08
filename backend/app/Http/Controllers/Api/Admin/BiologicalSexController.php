<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBiologicalSexRequest;
use App\Models\BiologicalSex;
use Illuminate\Http\JsonResponse;

class BiologicalSexController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            BiologicalSex::query()
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
        );
    }

    public function store(StoreBiologicalSexRequest $request): JsonResponse
    {
        $biologicalSex = BiologicalSex::query()->create([
            ...$request->validated(),
            'sort_order' => $request->integer('sort_order', 0),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json($biologicalSex, 201);
    }

    public function show(BiologicalSex $biologicalSex): JsonResponse
    {
        return response()->json($biologicalSex);
    }

    public function update(StoreBiologicalSexRequest $request, BiologicalSex $biologicalSex): JsonResponse
    {
        $biologicalSex->update([
            ...$request->validated(),
            'sort_order' => $request->integer('sort_order', $biologicalSex->sort_order),
            'is_active' => $request->boolean('is_active', $biologicalSex->is_active),
        ]);

        return response()->json($biologicalSex->fresh());
    }

    public function destroy(BiologicalSex $biologicalSex): JsonResponse
    {
        if ($biologicalSex->minors()->exists()) {
            return response()->json([
                'message' => 'Impossibile eliminare il sesso biologico: esistono minori collegati.',
            ], 409);
        }

        $biologicalSex->delete();

        return response()->json(status: 204);
    }
}
