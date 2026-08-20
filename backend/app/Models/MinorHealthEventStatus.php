<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MinorHealthEventStatus extends Model
{
    protected $fillable = ['code', 'name', 'sort_order'];
}
