<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExecuteGeoLoadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'run_id' => ['required', 'integer', 'exists:geo_import_runs,id'],
            'source' => ['required', 'string', Rule::in(['geonames', 'seed', 'istat'])],
            'level' => ['required', 'string', Rule::in(['countries', 'regions', 'provinces', 'cities'])],
            'recursive' => ['nullable', 'boolean'],
            'continent_code' => ['nullable', 'string', 'size:2'],
            'country_key' => ['nullable', 'string', 'max:255'],
            'region_key' => ['nullable', 'string', 'max:255'],
            'province_key' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $level = $this->input('level');

            if ($level === 'regions' && ! $this->filled('country_key')) {
                $validator->errors()->add('country_key', 'Il campo country_key è obbligatorio per level=regions.');
            }

            if ($level === 'provinces' && ! $this->filled('region_key')) {
                $validator->errors()->add('region_key', 'Il campo region_key è obbligatorio per level=provinces.');
            }

            if ($level === 'cities' && ! $this->filled('province_key')) {
                $validator->errors()->add('province_key', 'Il campo province_key è obbligatorio per level=cities.');
            }
        });
    }
}
