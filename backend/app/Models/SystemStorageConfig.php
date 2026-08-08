<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class SystemStorageConfig extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'provider_type',
        'bucket',
        'region',
        'endpoint',
        'use_path_style_endpoint',
        'access_key_encrypted',
        'secret_key_encrypted',
        'prefix',
        'is_active',
        'is_default',
        'last_tested_at',
        'last_test_status',
        'last_test_message',
        'created_by_user_id',
        'updated_by_user_id',
    ];

    protected $casts = [
        'use_path_style_endpoint' => 'boolean',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'last_tested_at' => 'datetime',
    ];

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }

    public function decryptAccessKey(): ?string
    {
        if (! $this->access_key_encrypted) {
            return null;
        }

        return Crypt::decryptString($this->access_key_encrypted);
    }

    public function decryptSecretKey(): ?string
    {
        if (! $this->secret_key_encrypted) {
            return null;
        }

        return Crypt::decryptString($this->secret_key_encrypted);
    }

    public function maskAccessKey(): ?string
    {
        return $this->maskValue($this->decryptAccessKey());
    }

    public function maskSecretKey(): ?string
    {
        return $this->maskValue($this->decryptSecretKey());
    }

    private function maskValue(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $suffix = substr($value, -4);

        return sprintf('****%s', $suffix ?: '****');
    }
}
