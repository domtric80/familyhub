<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDocumentScopeRequest;
use App\Models\DocumentScope;
use Illuminate\Http\JsonResponse;

class DocumentScopeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(DocumentScope::query()->orderBy('name')->get());
    }

    public function store(StoreDocumentScopeRequest $request): JsonResponse
    {
        $scope = DocumentScope::query()->create([
            ...$request->validated(),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json($scope, 201);
    }

    public function show(DocumentScope $documentScope): JsonResponse
    {
        return response()->json($documentScope);
    }

    public function update(StoreDocumentScopeRequest $request, DocumentScope $documentScope): JsonResponse
    {
        $documentScope->update([
            ...$request->validated(),
            'is_active' => $request->boolean('is_active', $documentScope->is_active),
        ]);

        return response()->json($documentScope->fresh());
    }

    public function destroy(DocumentScope $documentScope): JsonResponse
    {
        if ($documentScope->documentTypes()->exists()) {
            return response()->json([
                'message' => 'Impossibile eliminare lo scope documento: esistono tipi documento collegati.',
            ], 409);
        }

        $documentScope->delete();

        return response()->json(status: 204);
    }
}
