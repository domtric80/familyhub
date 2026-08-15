<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStaffDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'document_type_id' => ['required', 'integer', 'exists:document_types,id'],
            'file' => ['required', 'file', 'max:15360'],
            'issue_date' => ['nullable', 'date'],
            'expiry_date' => ['nullable', 'date', 'after_or_equal:issue_date'],
            'status_code' => ['nullable', 'string', 'max:50', Rule::exists('staff_document_statuses', 'code')->where('is_active', true)],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (! $this->filled('status_code')) {
            $this->merge(['status_code' => 'VALID']);
        }
    }
}
