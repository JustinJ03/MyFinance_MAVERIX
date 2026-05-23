<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'type', 'name', 'amount', 'category_id',
        'account_id', 'to_account_id', 'recurring_template_id', 'asb_fund_id',
        'scheduled_date', 'actual_date', 'status', 'remarks',
        'attachment_path', 'epf_account_number',
    ];

    protected $casts = [
        'amount'         => 'decimal:2',
        'scheduled_date' => 'date',
        'actual_date'    => 'date',
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

    public function toAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class, 'to_account_id');
    }

    public function recurringTemplate(): BelongsTo
    {
        return $this->belongsTo(RecurringTemplate::class, 'recurring_template_id');
    }

    public function asbFund(): BelongsTo
    {
        return $this->belongsTo(AsbFund::class, 'asb_fund_id');
    }

    public function epfTransactions(): HasMany
    {
        return $this->hasMany(EpfTransaction::class, 'linked_transaction_id');
    }

    public function asbTransactions(): HasMany
    {
        return $this->hasMany(AsbTransaction::class, 'linked_transaction_id');
    }

    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeExpenses($query)
    {
        return $query->where('type', 'expense');
    }

    public function scopeIncomes($query)
    {
        return $query->where('type', 'income');
    }
}
