<?php

namespace App\Http\Requests\Minors;

use Illuminate\Foundation\Http\FormRequest;

class StoreMinorPeiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'summary' => ['nullable', 'string'],
            'start_date' => ['nullable', 'date'],
            'review_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'status' => ['sometimes', 'string', 'max:50'],
            'digital_signature_status' => ['sometimes', 'string', 'max:50'],
            'signed_at' => ['nullable', 'date'],
        ];
    }
}
