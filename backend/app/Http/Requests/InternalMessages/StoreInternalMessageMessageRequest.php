<?php

namespace App\Http\Requests\InternalMessages;

use Illuminate\Foundation\Http\FormRequest;

class StoreInternalMessageMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'body' => ['required', 'string'],
        ];
    }
}
