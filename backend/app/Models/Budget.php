<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Budget extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'category_id', 'period_type', 'amount_limit', 'rollover', 'is_active',
    ];

    protected $casts = [
        'amount_limit' => 'decimal:2',
        'rollover'     => 'boolean',
        'is_active'    => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function periods(): HasMany
    {
        return $this->hasMany(BudgetPeriod::class);
    }

    public function currentPeriod()
    {
        $today = now()->toDateString();
        return $this->periods()
            ->where('period_start', '<=', $today)
            ->where('period_end', '>=', $today)
            ->first();
    }
}

