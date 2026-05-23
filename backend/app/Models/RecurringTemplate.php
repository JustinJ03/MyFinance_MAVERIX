<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RecurringTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'type', 'name', 'default_amount', 'category_id',
        'account_id', 'frequency', 'scheduled_day', 'next_due_date',
        'start_date', 'end_date', 'status', 'remarks',
    ];

    protected $casts = [
        'default_amount' => 'decimal:2',
        'next_due_date'  => 'date',
        'start_date'     => 'date',
        'end_date'       => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class, 'account_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'recurring_template_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
