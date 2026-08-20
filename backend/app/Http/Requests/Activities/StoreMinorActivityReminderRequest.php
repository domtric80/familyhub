<?php

namespace App\Http\Requests\Activities;

use Illuminate\Foundation\Http\FormRequest;

class StoreMinorActivityReminderRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array { return ['recipient_user_id' => ['required', 'integer', 'exists:users,id'], 'remind_at' => ['required', 'date', 'after:now']]; }
}
