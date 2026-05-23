<?php

namespace App\Services;

use App\Models\BankAccount;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class BankAccountService
{
    public function listActive(User $user): Collection
    {
        return $user->bankAccounts()->active()->orderBy('created_at')->get();
    }

    public function listArchived(User $user): Collection
    {
        return $user->bankAccounts()->archived()->orderBy('created_at')->get();
    }

    public function create(User $user, array $data): BankAccount
    {
        $data['current_balance'] = $data['initial_balance'] ?? 0;
        return $user->bankAccounts()->create($data);
    }

    public function update(BankAccount $account, array $data): BankAccount
    {
        $account->update($data);
        return $account->fresh();
    }

    public function archive(BankAccount $account): BankAccount
    {
        $account->update(['status' => 'archived']);
        return $account->fresh();
    }

    public function restore(BankAccount $account): BankAccount
    {
        $account->update(['status' => 'active']);
        return $account->fresh();
    }

    public function recalculateBalance(BankAccount $account): void
    {
        $income = $account->transactions()
            ->where('type', 'income')
            ->where('status', 'confirmed')
            ->sum('amount');

        $expense = $account->transactions()
            ->where('type', 'expense')
            ->where('status', 'confirmed')
            ->sum('amount');

        $transferOut = $account->transactions()
            ->where('type', 'transfer')
            ->where('status', 'confirmed')
            ->sum('amount');

        $transferIn = $account->incomingTransfers()
            ->where('type', 'transfer')
            ->where('status', 'confirmed')
            ->sum('amount');

        $account->current_balance = $account->initial_balance + $income - $expense - $transferOut + $transferIn;
        $account->save();
    }
}
