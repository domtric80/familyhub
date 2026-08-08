<?php

namespace App\Http\Requests\Shifts;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStaffShiftTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $templateId = $this->route('shift_template')?->id;

        return [
            'facility_id' => ['required', 'integer', 'exists:facilities,id'],
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('staff_shift_templates', 'code')
                    ->where('facility_id', $this->integer('facility_id'))
                    ->ignore($templateId),
            ],
            'name' => ['required', 'string', 'max:100'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i'],
            'minimum_staff_required' => ['required', 'integer', 'min:1', 'max:99'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if ($this->input('start_time') === $this->input('end_time')) {
                $validator->errors()->add('end_time', 'La fine turno deve essere diversa dall inizio turno.');
            }
        });
    }
}
