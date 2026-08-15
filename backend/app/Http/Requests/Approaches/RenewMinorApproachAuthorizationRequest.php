<?php

namespace App\Http\Requests\Approaches;

use App\Models\MinorApproach;
use App\Models\MinorDocument;
use Illuminate\Foundation\Http\FormRequest;

class RenewMinorApproachAuthorizationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'authorization_reference' => ['nullable', 'string', 'max:100'],
            'authorization_minor_document_id' => ['nullable', 'integer', 'exists:minor_documents,id'],
            'authorization_issued_at' => ['nullable', 'date'],
            'authorization_expires_at' => ['required', 'date', 'after_or_equal:authorization_issued_at'],
            'authorization_renewal_alert_days' => ['nullable', 'integer', 'min:1', 'max:365'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $approach = $this->route('approach');

            if (! $approach instanceof MinorApproach) {
                return;
            }

            $documentId = $this->integer('authorization_minor_document_id');

            if ($documentId > 0) {
                $belongsToMinor = MinorDocument::query()
                    ->whereKey($documentId)
                    ->where('minor_id', $approach->minor_id)
                    ->exists();

                if (! $belongsToMinor) {
                    $validator->errors()->add('authorization_minor_document_id', 'Il documento autorizzativo selezionato non appartiene a questo minore.');
                }
            }
        });
    }
}
