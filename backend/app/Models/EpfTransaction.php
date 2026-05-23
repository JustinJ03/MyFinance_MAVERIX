<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EpfTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'epf_account_number', 'transaction_type', 'contribution_type',
        'date', 'employee_amount', 'employer_amount', 'total_amount',
        'linked_transaction_id', 'remarks', 'attachment_path',
    ];

    protected $casts = [
        'date'            => 'date',
        'employee_amount' => 'decimal:2',
        'employer_amount' => 'decimal:2',
        'total_amount'    => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function linkedTransaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class, 'linked_transaction_id');
    }
}
