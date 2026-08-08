<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCountryGeographyProviderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $routeCountry = $this->route('country');
        $routeCountryId = is_object($routeCountry) ? $routeCountry->getKey() : $routeCountry;

        $providerId = $this->input('provider_id');
        $geographyProviderId = $this->input('geography_provider_id');

        $this->merge([
            'country_id' => $this->input('country_id') ?? $routeCountryId,
            'provider_id' => $providerId ?? $geographyProviderId,
            'geography_provider_id' => $geographyProviderId ?? $providerId,
        ]);
    }

    public function rules(): array
    {
        return [
            'country_id' => ['required', 'integer', 'exists:countries,id'],
            'geography_provider_id' => ['nullable', 'integer', 'exists:geography_providers,id', 'required_without:provider_id'],
            'provider_id' => ['nullable', 'integer', 'exists:geography_providers,id', 'required_without:geography_provider_id'],
            'is_default' => ['nullable', 'boolean'],
            'priority' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'country_id.required' => 'Seleziona una nazione prima di associare il provider.',
            'country_id.exists' => 'La nazione selezionata non è valida.',
            'provider_id.required_without' => 'Seleziona un provider da associare.',
            'provider_id.exists' => 'Il provider selezionato non è valido.',
            'geography_provider_id.required_without' => 'Seleziona un provider da associare.',
            'geography_provider_id.exists' => 'Il provider selezionato non è valido.',
        ];
    }
}
