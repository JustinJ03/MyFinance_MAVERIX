<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AsbDividend extends Model
{
    use HasFactory;

    protected $fillable = [
        'asb_fund_id', 'user_id', 'year', 'dividend_rate', 'dividend_amount',
        'bonus_rate', 'bonus_amount', 'total_payout',
    ];

    protected $casts = [
        'dividend_rate'   => 'decimal:4',
        'dividend_amount' => 'decimal:2',
        'bonus_rate'      => 'decimal:4',
        'bonus_amount'    => 'decimal:2',
        'total_payout'    => 'decimal:2',
    ];

    public function fund(): BelongsTo
    {
        return $this->belongsTo(AsbFund::class, 'asb_fund_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
