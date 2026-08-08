<?php

namespace App\Http\Requests\Minors;

use App\Models\StaffMember;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMinorPeiObjectiveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $pei = $this->route('pei');
        $facilityId = $pei?->minor?->facility_id;

        return [
            'code' => ['nullable', 'string', 'max:100'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'due_date' => ['nullable', 'date'],
            'status' => ['sometimes', 'string', 'max:50'],
            'progress_percent' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'responsible_staff_member_id' => [
                'nullable',
                'integer',
                Rule::exists(StaffMember::class, 'id')->where(fn ($query) => $facilityId ? $query->where('facility_id', $facilityId) : $query),
            ],
        ];
    }
}
