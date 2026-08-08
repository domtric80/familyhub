<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class DatabaseBackupRestoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'confirm_text' => ['required', 'string'],
            'backup_filename' => ['nullable', 'string', 'max:255'],
            'sql_file' => ['nullable', 'file', 'mimes:sql,txt', 'max:'.(int) config('familyhub_backup.max_upload_kb', 512000)],
            'create_pre_restore_backup' => ['nullable', 'boolean'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $hasFilename = $this->filled('backup_filename');
            $hasFile = $this->hasFile('sql_file');

            if ($hasFilename === $hasFile) {
                $validator->errors()->add('source', 'Specificare un backup esistente oppure caricare un file SQL.');
            }

            if ((string) $this->input('confirm_text') !== (string) config('familyhub_backup.confirm_restore_text', 'RIPRISTINA DATABASE')) {
                $validator->errors()->add('confirm_text', 'Testo di conferma non valido.');
            }
        });
    }
}
