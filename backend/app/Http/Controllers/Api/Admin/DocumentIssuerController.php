<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDocumentIssuerRequest;
use App\Models\DocumentIssuer;
use Illuminate\Http\JsonResponse;

class DocumentIssuerController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            DocumentIssuer::query()
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
        );
    }

    public function store(StoreDocumentIssuerRequest $request): JsonResponse
    {
        $issuer = DocumentIssuer::query()->create([
            ...$request->validated(),
            'sort_order' => $request->integer('sort_order', 100),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json($issuer, 201);
    }

    public function show(DocumentIssuer $documentIssuer): JsonResponse
    {
        return response()->json($documentIssuer);
    }

    public function update(StoreDocumentIssuerRequest $request, DocumentIssuer $documentIssuer): JsonResponse
    {
        $documentIssuer->update([
            ...$request->validated(),
            'sort_order' => $request->integer('sort_order', $documentIssuer->sort_order),
            'is_active' => $request->boolean('is_active', $documentIssuer->is_active),
        ]);

        return response()->json($documentIssuer->fresh());
    }

    public function destroy(DocumentIssuer $documentIssuer): JsonResponse
    {
        if ($documentIssuer->minorDocuments()->exists()) {
            return response()->json([
                'message' => 'Impossibile eliminare l’ente rilascio: esistono documenti del minore collegati.',
            ], 409);
        }

        $documentIssuer->delete();

        return response()->json(status: 204);
    }
}
