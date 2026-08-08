<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreExitTypeRequest;
use App\Models\ExitType;
use Illuminate\Http\JsonResponse;

class ExitTypeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            ExitType::query()
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
        );
    }

    public function store(StoreExitTypeRequest $request): JsonResponse
    {
        $exitType = ExitType::query()->create([
            ...$request->validated(),
            'sort_order' => $request->integer('sort_order', 0),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json($exitType, 201);
    }

    public function show(ExitType $exitType): JsonResponse
    {
        return response()->json($exitType);
    }

    public function update(StoreExitTypeRequest $request, ExitType $exitType): JsonResponse
    {
        $exitType->update([
            ...$request->validated(),
            'sort_order' => $request->integer('sort_order', $exitType->sort_order),
            'is_active' => $request->boolean('is_active', $exitType->is_active),
        ]);

        return response()->json($exitType->fresh());
    }

    public function destroy(ExitType $exitType): JsonResponse
    {
        if ($exitType->exits()->exists()) {
            return response()->json([
                'message' => 'Impossibile eliminare il tipo uscita: esistono uscite collegate.',
            ], 409);
        }

        $exitType->delete();

        return response()->json(status: 204);
    }
}
