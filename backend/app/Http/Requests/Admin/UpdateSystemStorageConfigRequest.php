<?php

namespace App\Http\Requests\Admin;

use App\Models\SystemStorageConfig;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSystemStorageConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var SystemStorageConfig|null $config */
        $config = $this->route('storageConfig');

        return [
            'code' => ['sometimes', 'required', 'string', 'max:50', 'regex:/^[A-Z0-9_\\-]+$/', Rule::unique('system_storage_configs', 'code')->ignore($config?->id)],
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'provider_type' => ['sometimes', 'required', Rule::in(['minio', 'aws_s3', 's3_compatible'])],
            'bucket' => ['sometimes', 'required', 'string', 'max:150'],
            'region' => ['nullable', 'string', 'max:80'],
            'endpoint' => ['nullable', 'url', 'max:255'],
            'use_path_style_endpoint' => ['sometimes', 'boolean'],
            'access_key' => ['sometimes', 'nullable', 'string', 'max:255'],
            'secret_key' => ['sometimes', 'nullable', 'string', 'max:255'],
            'prefix' => ['nullable', 'string', 'max:150'],
            'is_active' => ['sometimes', 'boolean'],
            'is_default' => ['sometimes', 'boolean'],
        ];
    }
}
