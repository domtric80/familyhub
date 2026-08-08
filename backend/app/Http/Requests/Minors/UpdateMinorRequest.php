<?php

namespace App\Http\Requests\Minors;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMinorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'facility_id' => ['sometimes', 'integer', 'exists:facilities,id'],
            'internal_code' => ['sometimes', 'string', 'max:30'],
            'first_name' => ['sometimes', 'string', 'max:100'],
            'last_name' => ['sometimes', 'string', 'max:100'],
            'preferred_name' => ['nullable', 'string', 'max:100'],
            'birth_date' => ['sometimes', 'date'],
            'birth_city_id' => ['nullable', 'integer', 'exists:cities,id'],
            'biological_sex_id' => ['nullable', 'integer', 'exists:biological_sexes,id'],
            'gender_identity_id' => ['nullable', 'integer', 'exists:gender_identities,id'],
            'tax_code' => ['nullable', 'string', 'max:20'],
            'entry_date' => ['sometimes', 'date'],
            'minor_status_id' => ['sometimes', 'integer', 'exists:minor_statuses,id'],
        ];
    }
}
