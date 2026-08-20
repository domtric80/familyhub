<?php

namespace App\Http\Requests\Incidents;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMinorIncidentRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return [
            'minor_id' => ['required', 'integer', 'exists:minors,id'],
            'incident_type_id' => ['required', 'integer', Rule::exists('incident_types', 'id')->where('is_active', true)],
            'severity_code' => ['required', 'string', Rule::exists('incident_severity_levels', 'code')->where('is_active', true)],
            'occurred_at' => ['required', 'date', 'before_or_equal:now'],
            'location' => ['nullable', 'string', 'max:1000'],
            'description' => ['required', 'string', 'max:10000'],
            'immediate_actions' => ['nullable', 'string', 'max:10000'],
            'requires_external_notification' => ['sometimes', 'boolean'],
        ];
    }
}
