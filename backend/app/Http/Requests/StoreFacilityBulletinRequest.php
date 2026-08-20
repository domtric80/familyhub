<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFacilityBulletinRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return ['facility_id' => ['required', 'integer', 'exists:facilities,id'], 'title' => ['required', 'string', 'max:200'], 'body' => ['required', 'string', 'max:20000'], 'expires_at' => ['nullable', 'date', 'after:now'], 'target_role_ids' => ['nullable', 'array'], 'target_role_ids.*' => ['integer', 'distinct', 'exists:roles,id']];
    }
}
