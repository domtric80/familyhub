<?php

namespace App\Http\Requests\Minors;

use Illuminate\Foundation\Http\FormRequest;

class StoreMinorDiagnosisRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'diagnosis_code' => ['nullable', 'string', 'max:100'],
            'diagnosis_label' => ['required', 'string', 'max:255'],
            'dsm_code' => ['nullable', 'string', 'max:50'],
            'diagnosis_notes_encrypted' => ['nullable', 'string'],
            'diagnosed_at' => ['nullable', 'date'],
            'review_due_at' => ['nullable', 'date'],
            'is_primary' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
