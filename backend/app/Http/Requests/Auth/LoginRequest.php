<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:150'],
            'password' => ['required', 'string'],
            'otp' => ['nullable', 'string', 'size:6'],
            'device_name' => ['nullable', 'string', 'max:100'],
            'login_context_token' => ['nullable', 'string', 'size:64'],
        ];
    }
}
