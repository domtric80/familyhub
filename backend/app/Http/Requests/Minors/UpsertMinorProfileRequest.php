<?php

namespace App\Http\Requests\Minors;

use Illuminate\Foundation\Http\FormRequest;

class UpsertMinorProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'family_background' => ['nullable', 'string'],
            'life_history' => ['nullable', 'string'],
            'learning_styles' => ['nullable', 'string'],
            'interests' => ['nullable', 'string'],
            'hobbies' => ['nullable', 'string'],
            'strengths' => ['nullable', 'string'],
            'risk_factors' => ['nullable', 'string'],
            'crisis_indicators' => ['nullable', 'string'],
            'clinical_notes_encrypted' => ['nullable', 'string'],
        ];
    }
}
