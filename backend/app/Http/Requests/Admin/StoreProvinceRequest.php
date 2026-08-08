<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProvinceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $provinceId = $this->route('province')?->id;
        $regionId = (int) $this->input('region_id');

        return [
            'region_id' => ['required', 'integer', 'exists:regions,id'],
            'code' => [
                'required', 'string', 'max:10',
                Rule::unique('provinces', 'code')->ignore($provinceId)->where(fn ($query) => $query->where('region_id', $regionId)),
            ],
            'name' => [
                'required', 'string', 'max:100',
                Rule::unique('provinces', 'name')->ignore($provinceId)->where(fn ($query) => $query->where('region_id', $regionId)),
            ],
        ];
    }
}
