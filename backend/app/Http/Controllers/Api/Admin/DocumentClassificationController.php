<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDocumentClassificationRequest;
use App\Models\DocumentClassification;
use Illuminate\Http\JsonResponse;

class DocumentClassificationController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            DocumentClassification::query()
                ->orderBy('name')
                ->get()
                ->map(fn (DocumentClassification $classification): array => $this->serialize($classification))
        );
    }

    public function store(StoreDocumentClassificationRequest $request): JsonResponse
    {
        $allowedRoleCodes = $request->input('allowed_role_codes', []);
        $allowedDownloadRoleCodes = array_values(array_intersect(
            $request->input('allowed_download_role_codes', []),
            $allowedRoleCodes,
        ));

        $classification = DocumentClassification::query()->create([
            ...$request->validated(),
            'allowed_role_codes' => $allowedRoleCodes,
            'allowed_download_role_codes' => $allowedDownloadRoleCodes,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json($this->serialize($classification), 201);
    }

    public function show(DocumentClassification $documentClassification): JsonResponse
    {
        return response()->json($this->serialize($documentClassification));
    }

    public function update(StoreDocumentClassificationRequest $request, DocumentClassification $documentClassification): JsonResponse
    {
        $allowedRoleCodes = $request->input('allowed_role_codes', []);
        $allowedDownloadRoleCodes = array_values(array_intersect(
            $request->input('allowed_download_role_codes', []),
            $allowedRoleCodes,
        ));

        $documentClassification->update([
            ...$request->validated(),
            'allowed_role_codes' => $allowedRoleCodes,
            'allowed_download_role_codes' => $allowedDownloadRoleCodes,
            'is_active' => $request->boolean('is_active', $documentClassification->is_active),
        ]);

        return response()->json($this->serialize($documentClassification->fresh()));
    }

    public function destroy(DocumentClassification $documentClassification): JsonResponse
    {
        $documentClassification->delete();

        return response()->json(status: 204);
    }

    private function serialize(DocumentClassification $classification): array
    {
        return [
            'id' => $classification->id,
            'code' => $classification->code,
            'name' => $classification->name,
            'description' => $classification->description,
            'allowed_role_codes' => $classification->allowed_role_codes ?? [],
            'allowed_roles' => $classification->allowed_role_codes ?? [],
            'allowed_download_role_codes' => $classification->allowed_download_role_codes ?? [],
            'allowed_download_roles' => $classification->allowed_download_role_codes ?? [],
            'is_active' => $classification->is_active,
        ];
    }
}
