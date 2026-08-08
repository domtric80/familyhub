<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSystemStorageConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:50', 'regex:/^[A-Z0-9_\\-]+$/', 'unique:system_storage_configs,code'],
            'name' => ['required', 'string', 'max:120'],
            'provider_type' => ['required', Rule::in(['minio', 'aws_s3', 's3_compatible'])],
            'bucket' => ['required', 'string', 'max:150'],
            'region' => ['nullable', 'string', 'max:80'],
            'endpoint' => ['nullable', 'url', 'max:255'],
            'use_path_style_endpoint' => ['required', 'boolean'],
            'access_key' => ['nullable', 'string', 'max:255'],
            'secret_key' => ['nullable', 'string', 'max:255'],
            'prefix' => ['nullable', 'string', 'max:150'],
            'is_active' => ['sometimes', 'boolean'],
            'is_default' => ['sometimes', 'boolean'],
        ];
    }
}
