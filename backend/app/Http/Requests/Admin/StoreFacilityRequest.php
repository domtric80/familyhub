<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFacilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $facilityId = $this->route('facility')?->id;

        return [
            'organization_id' => ['required', 'integer', 'exists:organizations,id'],
            'code' => [
                'required',
                'string',
                'max:30',
                Rule::unique('facilities', 'code')
                    ->where(fn ($query) => $query->where('organization_id', (int) $this->input('organization_id')))
                    ->ignore($facilityId),
            ],
            'name' => ['required', 'string', 'max:150'],
            'address_line' => ['required', 'string', 'max:200'],
            'city_id' => ['required', 'integer', 'exists:cities,id'],
            'postal_code' => ['nullable', 'string', 'max:10'],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'status_code' => ['nullable', 'string', 'max:50', 'exists:facility_statuses,code', 'required_without:status'],
            'status' => ['nullable', 'string', 'max:30', 'required_without:status_code'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('status_code') && ! $this->filled('status')) {
            $this->merge([
                'status' => $this->input('status_code'),
            ]);
        }
    }
}
