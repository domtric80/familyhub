<?php

namespace App\Http\Requests\Minors;

class UpdateMinorNeedRequest extends StoreMinorNeedRequest
{
    public function rules(): array
    {
        $rules = parent::rules();
        $rules['category_code'][0] = 'sometimes';
        $rules['title'][0] = 'sometimes';

        return $rules;
    }
}
