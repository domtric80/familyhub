<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGeographyProviderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $driver = $this->input('driver');
        $authType = $this->input('auth_type');

        $this->merge([
            'driver' => is_string($driver) ? strtolower(trim($driver)) : $driver,
            'auth_type' => $authType ?: 'none',
        ]);
    }

    public function rules(): array
    {
        $providerId = $this->route('provider')?->id;

        return [
            'code' => ['required', 'string', 'max:50', Rule::unique('geography_providers', 'code')->ignore($providerId)],
            'name' => ['required', 'string', 'max:150'],
            'type' => ['required', 'string', Rule::in(['generic', 'country_specific'])],
            'driver' => ['required', 'string', Rule::in(['istat', 'geonames'])],
            'mode' => ['required', 'string', Rule::in(['local_file', 'remote_file', 'api'])],
            'format' => ['nullable', 'string', Rule::in(['csv', 'zip', 'json', 'xml', 'txt'])],
            'source_path' => ['nullable', 'string', 'max:1000'],
            'source_url' => ['nullable', 'url', 'max:2000'],
            'auth_type' => ['required', 'string', Rule::in(['none', 'api_key', 'basic'])],
            'auth_config_json' => ['nullable', 'array'],
            'priority' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'is_active' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $mode = $this->input('mode');

            if ($mode === 'local_file' && ! $this->filled('source_path')) {
                $validator->errors()->add('source_path', 'Il campo source_path è obbligatorio per mode=local_file.');
            }

            if (in_array($mode, ['remote_file', 'api'], true) && ! $this->filled('source_url')) {
                $validator->errors()->add('source_url', 'Il campo source_url è obbligatorio per mode=remote_file o mode=api.');
            }

            if ($this->input('driver') === 'istat' && $this->input('type') !== 'country_specific') {
                $validator->errors()->add('type', 'Il driver ISTAT può essere usato solo con provider di tipo paese specifico.');
            }

            if ($this->input('driver') === 'geonames' && $this->filled('format') && $this->input('format') !== 'txt') {
                $validator->errors()->add('format', 'Il driver GeoNames usa il formato txt.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'driver.in' => 'Seleziona un driver supportato.',
            'source_url.url' => 'Inserisci una URL valida e completa, ad esempio https://www.istat.it/....',
            'auth_type.in' => 'Seleziona un tipo autenticazione valido.',
        ];
    }
}
