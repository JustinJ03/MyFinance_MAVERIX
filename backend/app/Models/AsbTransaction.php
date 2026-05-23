<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AsbTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'asb_fund_id', 'user_id', 'transaction_type', 'date', 'amount',
        'linked_transaction_id', 'remarks',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'date'   => 'date',
    ];

    public function fund(): BelongsTo
    {
        return $this->belongsTo(AsbFund::class, 'asb_fund_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function linkedTransaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class, 'linked_transaction_id');
    }
}
