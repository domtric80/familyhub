<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFacilityCertificationRequirementRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $requirementId = $this->route('requirement')?->id;

        return [
            'staff_certification_type_id' => [
                'required', 'integer', 'exists:staff_certification_types,id',
                Rule::unique('facility_certification_requirements', 'staff_certification_type_id')
                    ->where(fn ($query) => $query
                        ->where('facility_id', $this->route('facility')?->id)
                        ->where('qualification_code', $this->input('qualification_code')))
                    ->ignore($requirementId),
            ],
            'qualification_code' => ['nullable', 'string', 'max:50', 'exists:staff_qualifications,code'],
            'is_required' => ['nullable', 'boolean'],
            'alert_days' => ['nullable', 'integer', 'min:1', 'max:365'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    protected function prepareForValidation(): void
    {
        foreach (['certification_type_id' => 'staff_certification_type_id', 'is_mandatory' => 'is_required', 'advance_notice_days' => 'alert_days'] as $source => $target) {
            if ($this->has($source) && ! $this->has($target)) {
                $this->merge([$target => $this->input($source)]);
            }
        }
    }
}
