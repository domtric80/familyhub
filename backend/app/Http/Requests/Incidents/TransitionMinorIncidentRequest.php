<?php

namespace App\Http\Requests\Incidents;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TransitionMinorIncidentRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return [
            'to_status_code' => ['required', 'string', Rule::exists('incident_statuses', 'code')],
            'notes' => ['nullable', 'string', 'max:4000'],
        ];
    }
}
