<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreEducatorAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:150', 'unique:users,email'],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'password' => ['required', 'string', Password::min(12)],
            'is_active' => ['sometimes', 'boolean'],
            'mfa_required' => ['sometimes', 'boolean'],
            'facility_id' => ['required', 'integer', 'exists:facilities,id'],
            'role_id' => ['nullable', 'integer', 'exists:roles,id'],
            'role_code' => ['nullable', 'string', 'max:100', 'exists:roles,code'],
            'valid_from' => ['nullable', 'date'],
            'valid_to' => ['nullable', 'date', 'after_or_equal:valid_from'],
            'staff_member_id' => ['nullable', 'integer', 'exists:staff_members,id'],
            'create_staff_member' => ['sometimes', 'boolean'],
            'staff_member.employee_code' => [
                Rule::requiredIf(! $this->filled('staff_member_id')),
                'string',
                'max:30',
            ],
            'staff_member.birth_date' => ['nullable', 'date'],
            'staff_member.birth_city_id' => ['nullable', 'integer', 'exists:cities,id'],
            'staff_member.tax_code' => ['nullable', 'string', 'max:20'],
            'staff_member.phone' => ['nullable', 'string', 'max:30'],
            'staff_member.email' => ['nullable', 'email', 'max:150'],
            'staff_member.qualification_code' => ['nullable', 'string', 'max:50', 'exists:staff_qualifications,code', 'required_without:staff_member.qualification'],
            'staff_member.qualification' => ['nullable', 'string', 'max:100', 'required_without:staff_member.qualification_code'],
            'staff_member.status_code' => ['nullable', 'string', 'max:50', 'exists:staff_statuses,code', 'required_without:staff_member.status'],
            'staff_member.status' => ['nullable', 'string', 'max:30', 'required_without:staff_member.status_code'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if (! $this->filled('staff_member_id') && ! $this->boolean('create_staff_member', true)) {
                $validator->errors()->add('create_staff_member', 'Specificare un educatore esistente oppure autorizzare la creazione contestuale.');
            }
        });
    }

    protected function prepareForValidation(): void
    {
        if (! $this->filled('role_id') && ! $this->filled('role_code')) {
            $this->merge(['role_code' => 'EDUCATORE']);
        }

        if (! $this->has('create_staff_member')) {
            $this->merge(['create_staff_member' => true]);
        }

        if ($this->filled('staff_member.qualification_code') && ! $this->filled('staff_member.qualification')) {
            $staffMember = (array) $this->input('staff_member', []);
            $staffMember['qualification'] = $staffMember['qualification_code'];
            $this->merge(['staff_member' => $staffMember]);
        }

        if ($this->filled('staff_member.status_code') && ! $this->filled('staff_member.status')) {
            $staffMember = (array) $this->input('staff_member', []);
            $staffMember['status'] = $staffMember['status_code'];
            $this->merge(['staff_member' => $staffMember]);
        }
    }
}
