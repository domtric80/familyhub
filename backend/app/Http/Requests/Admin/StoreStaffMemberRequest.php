<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStaffMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $staffMemberId = $this->route('staff_member')?->id;

        return [
            'facility_id' => ['required', 'integer', 'exists:facilities,id'],
            'user_id' => [
                'nullable',
                'integer',
                'exists:users,id',
                Rule::unique('staff_members', 'user_id')
                    ->where(fn ($query) => $query->whereNull('deleted_at'))
                    ->ignore($staffMemberId),
            ],
            'employee_code' => [
                'required',
                'string',
                'max:30',
                Rule::unique('staff_members', 'employee_code')
                    ->where(fn ($query) => $query->where('facility_id', (int) $this->input('facility_id')))
                    ->ignore($staffMemberId),
            ],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'birth_date' => ['nullable', 'date'],
            'birth_city_id' => ['nullable', 'integer', 'exists:cities,id'],
            'tax_code' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:150'],
            'phone' => ['nullable', 'string', 'max:30'],
            'qualification_code' => ['nullable', 'string', 'max:50', 'exists:staff_qualifications,code', 'required_without:qualification'],
            'qualification' => ['nullable', 'string', 'max:100', 'required_without:qualification_code'],
            'status_code' => ['nullable', 'string', 'max:50', 'exists:staff_statuses,code', 'required_without:status'],
            'status' => ['nullable', 'string', 'max:30', 'required_without:status_code'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('qualification_code') && ! $this->filled('qualification')) {
            $this->merge([
                'qualification' => $this->input('qualification_code'),
            ]);
        }

        if ($this->filled('status_code') && ! $this->filled('status')) {
            $this->merge([
                'status' => $this->input('status_code'),
            ]);
        }
    }
}
