<?php

namespace App\Http\Requests\Minors;

use App\Models\DocumentClassification;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMinorNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $classificationCodes = DocumentClassification::query()
            ->where('is_active', true)
            ->orderBy('code')
            ->pluck('code')
            ->all();

        return [
            'classification_code' => ['required', 'string', Rule::in($classificationCodes)],
            'title' => ['nullable', 'string', 'max:150'],
            'body' => ['required', 'string'],
        ];
    }
}
