<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BudgetPeriod extends Model
{
    use HasFactory;

    protected $fillable = [
        'budget_id', 'period_start', 'period_end', 'amount_limit', 'amount_spent',
    ];

    protected $casts = [
        'amount_limit'  => 'decimal:2',
        'amount_spent'  => 'decimal:2',
        'period_start'  => 'date',
        'period_end'    => 'date',
    ];

    public function budget(): BelongsTo
    {
        return $this->belongsTo(Budget::class);
    }

    public function getPercentageAttribute(): float
    {
        if ($this->amount_limit <= 0) return 0;
        return round(($this->amount_spent / $this->amount_limit) * 100, 1);
    }

    public function getStatusAttribute(): string
    {
        $pct = $this->percentage;
        if ($pct >= 100) return 'exceeded';
        if ($pct >= 70) return 'approaching';
        return 'on_track';
    }
}
