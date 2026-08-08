<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StartGeoSyncRunRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'scope' => ['nullable', 'string', 'max:50'],
            'source' => ['nullable', 'string', Rule::in(['geonames', 'seed', 'istat', 'anpr_history'])],
            'dry_run' => ['nullable', 'boolean'],
        ];
    }
}
