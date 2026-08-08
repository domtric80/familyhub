<?php

namespace App\Http\Requests\Minors;

use App\Models\DocumentClassification;
use App\Models\DocumentIssuer;
use Illuminate\Foundation\Http\FormRequest;

class StoreMinorDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $classificationCodes = DocumentClassification::query()
            ->where('is_active', true)
            ->pluck('code')
            ->filter()
            ->all();

        if ($classificationCodes === []) {
            $classificationCodes = collect(config('document_classifications', []))
                ->pluck('code')
                ->filter()
                ->all();
        }

        return [
            'document_type_id' => ['required', 'integer', 'exists:document_types,id'],
            'file' => ['required', 'file', 'max:15360'],
            'label' => ['nullable', 'string', 'max:255'],
            'document_issuer_id' => ['nullable', 'integer', 'exists:document_issuers,id'],
            'issued_by' => ['nullable', 'string', 'max:150'],
            'issue_date' => ['nullable', 'date'],
            'expiry_date' => ['nullable', 'date'],
            'classification_code' => ['nullable', 'string', 'max:50', 'in:'.implode(',', $classificationCodes), 'required_without:classification'],
            'classification' => ['nullable', 'string', 'max:30', 'in:'.implode(',', $classificationCodes), 'required_without:classification_code'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('classification_code') && ! $this->filled('classification')) {
            $this->merge([
                'classification' => $this->input('classification_code'),
            ]);
        }

        if ($this->filled('document_issuer_id') && ! $this->filled('issued_by')) {
            $issuerName = DocumentIssuer::query()->whereKey($this->integer('document_issuer_id'))->value('name');

            if ($issuerName) {
                $this->merge([
                    'issued_by' => $issuerName,
                ]);
            }
        }

        if ($this->hasFile('file') && ! $this->filled('label')) {
            $originalName = (string) $this->file('file')->getClientOriginalName();
            $baseName = pathinfo($originalName, PATHINFO_FILENAME);

            if ($baseName !== '') {
                $this->merge([
                    'label' => $baseName,
                ]);
            }
        }
    }
}
