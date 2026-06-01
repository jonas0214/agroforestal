<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ServiceRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'name', 'email', 'phone',
        'equipment_brand', 'equipment_model',
        'problem_description', 'service_type',
        'status', 'admin_notes',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
