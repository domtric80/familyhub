<?php

namespace App\Http\Requests\Journals;

use Illuminate\Foundation\Http\FormRequest;

class CloseMinorJournalShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ended_at' => ['required', 'date'],
            'closing_notes' => ['nullable', 'string'],
        ];
    }
}
