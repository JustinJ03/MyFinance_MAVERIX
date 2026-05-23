<?php

namespace App\Services;

use App\Models\BankAccount;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class TransactionService
{
    public function __construct(private SyncService $syncService) {}

    public function paginate(User $user, array $filters): LengthAwarePaginator
    {
        $query = $user->transactions()
            ->with(['category.parent', 'account', 'toAccount'])
            ->orderBy('actual_date', 'desc')
            ->orderBy('created_at', 'desc');

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }
        if (!empty($filters['account_id'])) {
            $query->where('account_id', $filters['account_id']);
        }
        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (!empty($filters['from'])) {
            $query->whereDate('actual_date', '>=', $filters['from']);
        }
        if (!empty($filters['to'])) {
            $query->whereDate('actual_date', '<=', $filters['to']);
        }

        return $query->paginate(15);
    }

    public function create(User $user, array $data): Transaction
    {
        return DB::transaction(function () use ($user, $data) {
            $transaction = $user->transactions()->create($data);

            if ($transaction->status === 'confirmed') {
                $this->applyBalanceChange($transaction);
                $this->syncService->syncOnConfirm($transaction);
                $this->updateBudgetSpending($transaction);
            }

            return $transaction->load(['category.parent', 'account', 'toAccount']);
        });
    }

    public function confirm(Transaction $transaction): Transaction
    {
        return DB::transaction(function () use ($transaction) {
            $transaction->update([
                'status'      => 'confirmed',
                'actual_date' => $transaction->actual_date ?? now()->toDateString(),
            ]);

            $this->applyBalanceChange($transaction);
            $this->syncService->syncOnConfirm($transaction);
            $this->updateBudgetSpending($transaction);

            return $transaction->fresh(['category.parent', 'account']);
        });
    }

    public function skip(Transaction $transaction): Transaction
    {
        $transaction->update(['status' => 'skipped']);
        return $transaction->fresh();
    }

    public function update(Transaction $transaction, array $data): Transaction
    {
        return DB::transaction(function () use ($transaction, $data) {
            $wasConfirmed = $transaction->status === 'confirmed';

            if ($wasConfirmed) {
                $this->reverseBalanceChange($transaction);
                $this->syncService->removeSyncedRecords($transaction);
                $this->reverseBudgetSpending($transaction);
            }

            $transaction->update($data);
            $transaction->refresh();

            if ($transaction->status === 'confirmed') {
                $this->applyBalanceChange($transaction);
                $this->syncService->syncOnConfirm($transaction);
                $this->updateBudgetSpending($transaction);
            }

            return $transaction->fresh(['category.parent', 'account', 'toAccount']);
        });
    }

    public function delete(Transaction $transaction): void
    {
        DB::transaction(function () use ($transaction) {
            if ($transaction->status === 'confirmed') {
                $this->reverseBalanceChange($transaction);
                $this->syncService->removeSyncedRecords($transaction);
                $this->reverseBudgetSpending($transaction);
            }
            $transaction->delete();
        });
    }

    private function applyBalanceChange(Transaction $transaction): void
    {
        $account = $transaction->account;

        match ($transaction->type) {
            'income'   => $account->increment('current_balance', $transaction->amount),
            'expense'  => $account->decrement('current_balance', $transaction->amount),
            'transfer' => $this->applyTransfer($transaction, +1),
        };
    }

    private function reverseBalanceChange(Transaction $transaction): void
    {
        $account = $transaction->account;

        match ($transaction->type) {
            'income'   => $account->decrement('current_balance', $transaction->amount),
            'expense'  => $account->increment('current_balance', $transaction->amount),
            'transfer' => $this->applyTransfer($transaction, -1),
        };
    }

    private function applyTransfer(Transaction $transaction, int $direction): void
    {
        $transaction->account->decrement('current_balance', $transaction->amount * $direction * -1);
        if ($transaction->toAccount) {
            $transaction->toAccount->increment('current_balance', $transaction->amount * $direction);
        }
    }

    private function updateBudgetSpending(Transaction $transaction): void
    {
        if ($transaction->type !== 'expense' || !$transaction->category_id) return;

        $period = $this->getCurrentBudgetPeriod($transaction);
        if ($period) {
            $period->increment('amount_spent', $transaction->amount);
        }
    }

    private function reverseBudgetSpending(Transaction $transaction): void
    {
        if ($transaction->type !== 'expense' || !$transaction->category_id) return;

        $period = $this->getCurrentBudgetPeriod($transaction);
        if ($period) {
            $period->decrement('amount_spent', $transaction->amount);
        }
    }

    private function getCurrentBudgetPeriod(Transaction $transaction)
    {
        $date = $transaction->actual_date->toDateString();

        return \App\Models\BudgetPeriod::query()
            ->join('budgets', 'budget_periods.budget_id', '=', 'budgets.id')
            ->where('budgets.user_id', $transaction->user_id)
            ->where('budgets.category_id', $transaction->category_id)
            ->where('budgets.is_active', true)
            ->where('budget_periods.period_start', '<=', $date)
            ->where('budget_periods.period_end', '>=', $date)
            ->select('budget_periods.*')
            ->first();
    }

    public function monthlySummary(User $user, int $year, int $month): array
    {
        $start = "$year-$month-01";
        $end   = date('Y-m-t', strtotime($start));

        $income = $user->transactions()
            ->where('type', 'income')->where('status', 'confirmed')
            ->whereBetween('actual_date', [$start, $end])
            ->sum('amount');

        $expense = $user->transactions()
            ->where('type', 'expense')->where('status', 'confirmed')
            ->whereBetween('actual_date', [$start, $end])
            ->sum('amount');

        return [
            'year'       => $year,
            'month'      => $month,
            'income'     => (float) $income,
            'expense'    => (float) $expense,
            'net'        => (float) ($income - $expense),
        ];
    }
}
