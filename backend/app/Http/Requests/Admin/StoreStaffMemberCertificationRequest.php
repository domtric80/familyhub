<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStaffMemberCertificationRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'staff_certification_type_id' => ['required', 'integer', 'exists:staff_certification_types,id'],
            'staff_document_id' => ['nullable', 'integer', 'exists:staff_documents,id'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'issued_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:issued_at'],
            'status_code' => ['nullable', 'string', 'max:50', Rule::exists('staff_document_statuses', 'code')->where('is_active', true)],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $aliases = [
            'certification_type_id' => 'staff_certification_type_id',
            'document_id' => 'staff_document_id',
            'issue_date' => 'issued_at',
            'expiry_date' => 'expires_at',
            'reference' => 'reference_number',
        ];

        foreach ($aliases as $source => $target) {
            if ($this->has($source) && ! $this->has($target)) {
                $this->merge([$target => $this->input($source)]);
            }
        }
    }
}
