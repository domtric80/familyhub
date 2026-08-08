<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCountryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $countryId = $this->route('country')?->id;

        return [
            'iso_code' => ['required', 'string', 'size:2', Rule::unique('countries', 'iso_code')->ignore($countryId)],
            'name' => ['required', 'string', 'max:100', Rule::unique('countries', 'name')->ignore($countryId)],
        ];
    }
}
