<?php

namespace App\Http\Requests\Incidents;

use Illuminate\Foundation\Http\FormRequest;

class UpsertMinorIncidentAnalysisRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return [
            'root_cause' => ['required', 'string', 'max:10000'],
            'corrective_measures' => ['required', 'string', 'max:10000'],
            'responsible_staff_member_id' => ['nullable', 'integer', 'exists:staff_members,id'],
            'due_date' => ['nullable', 'date'],
            'completed_at' => ['nullable', 'date', 'before_or_equal:now'],
        ];
    }
}
