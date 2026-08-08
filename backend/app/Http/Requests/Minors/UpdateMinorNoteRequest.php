<?php

namespace App\Http\Requests\Minors;

class UpdateMinorNoteRequest extends StoreMinorNoteRequest
{
    public function rules(): array
    {
        $rules = parent::rules();
        $rules['body'] = ['sometimes', 'string'];
        $rules['classification_code'] = ['sometimes', ...array_slice($rules['classification_code'], 1)];
        $rules['title'] = ['sometimes', 'nullable', 'string', 'max:150'];

        return $rules;
    }
}
