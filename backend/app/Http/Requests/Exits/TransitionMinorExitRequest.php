<?php

namespace App\Http\Requests\Exits;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TransitionMinorExitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'actual_exit_at' => ['nullable', 'date'],
            'actual_return_at' => ['nullable', 'date'],
            'return_condition' => ['nullable', 'string', Rule::in(config('exits.return_conditions', []))],
            'follow_up_required' => ['nullable', 'boolean'],
            'follow_up_notes' => ['nullable', 'string'],
            'outcome_notes' => ['nullable', 'string'],
            'cancellation_reason' => ['nullable', 'string'],
        ];
    }
}
