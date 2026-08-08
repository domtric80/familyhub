<?php

namespace App\Http\Requests\Minors;

use Illuminate\Foundation\Http\FormRequest;

class StoreMinorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'facility_id' => ['required', 'integer', 'exists:facilities,id'],
            'internal_code' => ['required', 'string', 'max:30'],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'preferred_name' => ['nullable', 'string', 'max:100'],
            'birth_date' => ['required', 'date'],
            'birth_city_id' => ['nullable', 'integer', 'exists:cities,id'],
            'biological_sex_id' => ['nullable', 'integer', 'exists:biological_sexes,id'],
            'gender_identity_id' => ['nullable', 'integer', 'exists:gender_identities,id'],
            'tax_code' => ['nullable', 'string', 'max:20'],
            'entry_date' => ['required', 'date'],
            'minor_status_id' => ['required', 'integer', 'exists:minor_statuses,id'],
        ];
    }
}
