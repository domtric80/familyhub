<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LinkStaffMemberUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $staffMemberId = $this->route('staff_member')?->id;

        return [
            'user_id' => [
                'required',
                'integer',
                'exists:users,id',
                Rule::unique('staff_members', 'user_id')
                    ->where(fn ($query) => $query->whereNull('deleted_at'))
                    ->ignore($staffMemberId),
            ],
        ];
    }
}
