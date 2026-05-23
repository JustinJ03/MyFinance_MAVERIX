<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AsbFund extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'fund_name', 'units_held', 'unit_ceiling'];

    protected $casts = [
        'units_held'   => 'decimal:2',
        'unit_ceiling' => 'decimal:2',
    ];

    // Unit ceiling per fund (RM 1 = 1 unit)
    public const UNIT_CEILINGS = [
        'ASB'          => 200000,
        'ASB2'         => 200000,
        'ASM'          => 200000,
        'ASM2_Wawasan' => 200000,
        'ASM3'         => 200000,
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(AsbTransaction::class, 'asb_fund_id');
    }

    public function dividends(): HasMany
    {
        return $this->hasMany(AsbDividend::class, 'asb_fund_id');
    }

    public function getIsNearCeilingAttribute(): bool
    {
        return $this->units_held >= ($this->unit_ceiling * 0.95);
    }

    public function getRemainingUnitsAttribute(): float
    {
        return max(0, $this->unit_ceiling - $this->units_held);
    }
}
