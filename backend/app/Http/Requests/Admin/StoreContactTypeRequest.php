<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreContactTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $contactTypeId = $this->route('contact_type')?->id;

        return [
            'code' => ['required', 'string', 'max:50', Rule::unique('contact_types', 'code')->ignore($contactTypeId)],
            'name' => ['required', 'string', 'max:100'],
        ];
    }
}
