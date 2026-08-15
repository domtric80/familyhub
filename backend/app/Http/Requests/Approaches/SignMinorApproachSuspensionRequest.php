<?php

namespace App\Http\Requests\Approaches;

use Illuminate\Foundation\Http\FormRequest;

class SignMinorApproachSuspensionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'suspension_reason' => ['nullable', 'string'],
            'suspended_at' => ['nullable', 'date'],
        ];
    }
}
