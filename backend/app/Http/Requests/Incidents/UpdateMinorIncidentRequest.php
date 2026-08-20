<?php

namespace App\Http\Requests\Incidents;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMinorIncidentRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return [
            'incident_type_id' => ['sometimes', 'integer', Rule::exists('incident_types', 'id')->where('is_active', true)],
            'severity_code' => ['sometimes', 'string', Rule::exists('incident_severity_levels', 'code')->where('is_active', true)],
            'occurred_at' => ['sometimes', 'date', 'before_or_equal:now'],
            'location' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'description' => ['sometimes', 'required', 'string', 'max:10000'],
            'immediate_actions' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'requires_external_notification' => ['sometimes', 'boolean'],
        ];
    }
}
