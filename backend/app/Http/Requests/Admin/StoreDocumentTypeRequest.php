<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDocumentTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $documentTypeId = $this->route('document_type')?->id;

        return [
            'code' => ['required', 'string', 'max:50', Rule::unique('document_types', 'code')->ignore($documentTypeId)],
            'name' => ['required', 'string', 'max:100'],
            'document_scope_code' => ['nullable', 'string', 'max:50', 'exists:document_scopes,code', 'required_without:scope'],
            'scope' => ['nullable', 'string', 'max:50', 'exists:document_scopes,code', 'required_without:document_scope_code'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('document_scope_code') && ! $this->filled('scope')) {
            $this->merge([
                'scope' => $this->input('document_scope_code'),
            ]);
        }
    }
}
