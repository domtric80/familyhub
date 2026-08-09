<?php

namespace App\Http\Requests\Admin;

use App\Models\DocumentClassification;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SyncRoleDocumentPolicyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $classificationCodes = DocumentClassification::query()
            ->orderBy('code')
            ->pluck('code')
            ->all();

        return [
            'classification_codes' => ['required', 'array'],
            'classification_codes.*' => ['string', Rule::in($classificationCodes)],
            'download_classification_codes' => ['nullable', 'array'],
            'download_classification_codes.*' => ['string', Rule::in($classificationCodes)],
        ];
    }
}
