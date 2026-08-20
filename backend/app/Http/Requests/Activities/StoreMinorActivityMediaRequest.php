<?php

namespace App\Http\Requests\Activities;

use Illuminate\Foundation\Http\FormRequest;

class StoreMinorActivityMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'media_document_id' => ['required', 'integer', 'different:consent_document_id', 'exists:minor_documents,id'],
            'consent_document_id' => ['required', 'integer', 'different:media_document_id', 'exists:minor_documents,id'],
            'captured_at' => ['nullable', 'date', 'before_or_equal:now'],
        ];
    }
}
