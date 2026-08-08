<?php

namespace App\Http\Requests\Admin;

use App\Models\Minor;
use Illuminate\Foundation\Http\FormRequest;

class StoreMinorUserAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'minor_id' => ['required', 'integer', 'exists:minors,id'],
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'facility_id' => ['required', 'integer', 'exists:facilities,id'],
            'valid_from' => ['required', 'date'],
            'valid_to' => ['nullable', 'date', 'after_or_equal:valid_from'],
            'is_active' => ['sometimes', 'boolean'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $minor = Minor::query()->find($this->integer('minor_id'));

            if (! $minor) {
                return;
            }

            if ($minor->facility_id !== $this->integer('facility_id')) {
                $validator->errors()->add('facility_id', 'La struttura deve coincidere con quella del minore.');
            }
        });
    }
}
