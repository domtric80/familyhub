<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $cityId = $this->route('city')?->id;
        $provinceId = (int) $this->input('province_id');

        return [
            'province_id' => ['required', 'integer', 'exists:provinces,id'],
            'name' => [
                'required', 'string', 'max:150',
                Rule::unique('cities', 'name')->ignore($cityId)->where(fn ($query) => $query->where('province_id', $provinceId)),
            ],
            'cadastre_code' => ['nullable', 'string', 'max:10'],
            'postal_code' => ['nullable', 'string', 'max:10'],
        ];
    }
}
