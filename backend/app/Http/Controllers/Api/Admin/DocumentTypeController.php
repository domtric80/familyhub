<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDocumentTypeRequest;
use App\Models\DocumentType;
use Illuminate\Http\JsonResponse;

class DocumentTypeController extends Controller
{
    private function serialize(DocumentType $documentType): DocumentType
    {
        return $documentType->load('documentScope')->makeHidden('scope');
    }

    public function index(): JsonResponse
    {
        return response()->json(
            DocumentType::query()
                ->with('documentScope')
                ->orderBy('scope')
                ->orderBy('name')
                ->get()
                ->each->makeHidden('scope')
        );
    }

    public function store(StoreDocumentTypeRequest $request): JsonResponse
    {
        $documentType = DocumentType::query()->create($request->validated());

        return response()->json($this->serialize($documentType), 201);
    }

    public function show(DocumentType $documentType): JsonResponse
    {
        return response()->json($this->serialize($documentType));
    }

    public function update(StoreDocumentTypeRequest $request, DocumentType $documentType): JsonResponse
    {
        $documentType->update($request->validated());

        return response()->json($this->serialize($documentType->fresh()));
    }

    public function destroy(DocumentType $documentType): JsonResponse
    {
        if ($documentType->attachments()->exists()) {
            return response()->json([
                'message' => 'Impossibile eliminare il tipo documento: esistono allegati collegati.',
            ], 409);
        }

        $documentType->delete();

        return response()->json(status: 204);
    }
}
