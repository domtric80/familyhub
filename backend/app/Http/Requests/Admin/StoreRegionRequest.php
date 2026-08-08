<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRegionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $regionId = $this->route('region')?->id;
        $countryId = (int) $this->input('country_id');

        return [
            'country_id' => ['required', 'integer', 'exists:countries,id'],
            'code' => [
                'required', 'string', 'max:10',
                Rule::unique('regions', 'code')->ignore($regionId)->where(fn ($query) => $query->where('country_id', $countryId)),
            ],
            'name' => [
                'required', 'string', 'max:100',
                Rule::unique('regions', 'name')->ignore($regionId)->where(fn ($query) => $query->where('country_id', $countryId)),
            ],
        ];
    }
}
