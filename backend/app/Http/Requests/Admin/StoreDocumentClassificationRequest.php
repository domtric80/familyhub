<?php

namespace App\Http\Requests\Admin;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDocumentClassificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $classificationId = $this->route('document_classification')?->id;
        $roleCodes = Role::query()->pluck('code')->all();

        return [
            'code' => ['required', 'string', 'max:50', Rule::unique('document_classifications', 'code')->ignore($classificationId)],
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'allowed_role_codes' => ['nullable', 'array'],
            'allowed_role_codes.*' => ['string', Rule::in($roleCodes)],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
