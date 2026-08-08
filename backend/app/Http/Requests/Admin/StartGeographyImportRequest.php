<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StartGeographyImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'country_id' => ['nullable', 'integer', 'exists:countries,id', 'required_without:country_iso_code'],
            'country_iso_code' => ['nullable', 'string', 'size:2', 'required_without:country_id'],
            'provider_id' => ['nullable', 'integer', 'exists:geography_providers,id'],
            'import_mode' => ['nullable', 'string', Rule::in(['auto'])],
        ];
    }
}
