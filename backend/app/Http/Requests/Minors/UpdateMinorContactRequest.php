<?php

namespace App\Http\Requests\Minors;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMinorContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'contact_type_id' => ['sometimes', 'integer', 'exists:contact_types,id'],
            'first_name' => ['sometimes', 'string', 'max:100'],
            'last_name' => ['sometimes', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:150'],
            'city_id' => ['nullable', 'integer', 'exists:cities,id'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
