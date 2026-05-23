<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function __construct(private EpfService $epfService) {}

    public function fullDashboard(User $user): array
    {
        return [
            'net_worth'          => $this->netWorth($user),
            'cashflow_summary'   => $this->cashflowSummary($user),
            'cashflow_chart'     => $this->cashflowChart($user),
            'spending_breakdown' => $this->spendingBreakdown($user),
            'budget_health'      => $this->budgetHealth($user),
            'epf_snapshot'       => $this->epfService->overview($user),
            'asb_snapshot'       => $this->asbSnapshot($user),
            'recent_transactions'=> $this->recentTransactions($user),
            'pending_count'      => $user->transactions()->where('status', 'pending')->count(),
        ];
    }

    public function netWorth(User $user): array
    {
        $accounts = $user->bankAccounts()->active()->get();

        $total = $accounts->sum('current_balance');
        $byType = $accounts->groupBy('account_type')->map(fn ($group) => [
            'count'   => $group->count(),
            'balance' => $group->sum('current_balance'),
        ]);

        return [
            'total'    => (float) $total,
            'by_type'  => $byType,
        ];
    }

    public function cashflowSummary(User $user, ?int $year = null, ?int $month = null): array
    {
        $year  = $year  ?? now()->year;
        $month = $month ?? now()->month;
        $start = "$year-" . str_pad($month, 2, '0', STR_PAD_LEFT) . "-01";
        $end   = date('Y-m-t', strtotime($start));

        $income = $user->transactions()
            ->where('type', 'income')->where('status', 'confirmed')
            ->whereBetween('actual_date', [$start, $end])->sum('amount');

        $expense = $user->transactions()
            ->where('type', 'expense')->where('status', 'confirmed')
            ->whereBetween('actual_date', [$start, $end])->sum('amount');

        return [
            'year'    => $year,
            'month'   => $month,
            'income'  => (float) $income,
            'expense' => (float) $expense,
            'net'     => (float) ($income - $expense),
        ];
    }

    public function cashflowChart(User $user): array
    {
        $months = [];
        for ($i = 5; $i >= 0; $i--) {
            $date  = now()->subMonths($i);
            $start = $date->copy()->startOfMonth()->toDateString();
            $end   = $date->copy()->endOfMonth()->toDateString();

            $income = $user->transactions()
                ->where('type', 'income')->where('status', 'confirmed')
                ->whereBetween('actual_date', [$start, $end])->sum('amount');

            $expense = $user->transactions()
                ->where('type', 'expense')->where('status', 'confirmed')
                ->whereBetween('actual_date', [$start, $end])->sum('amount');

            $months[] = [
                'month'   => $date->format('M Y'),
                'income'  => (float) $income,
                'expense' => (float) $expense,
            ];
        }

        return $months;
    }

    public function spendingBreakdown(User $user): array
    {
        $start = now()->startOfMonth()->toDateString();
        $end   = now()->endOfMonth()->toDateString();

        return $user->transactions()
            ->join('categories', 'transactions.category_id', '=', 'categories.id')
            ->join('categories as parents', 'categories.parent_id', '=', 'parents.id')
            ->where('transactions.type', 'expense')
            ->where('transactions.status', 'confirmed')
            ->whereBetween('transactions.actual_date', [$start, $end])
            ->where('transactions.user_id', $user->id)
            ->selectRaw('parents.id, parents.name, SUM(transactions.amount) as total')
            ->groupBy('parents.id', 'parents.name')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'category_id'   => $row->id,
                'category_name' => $row->name,
                'total'         => (float) $row->total,
            ])
            ->toArray();
    }

    public function budgetHealth(User $user): array
    {
        $today = now()->toDateString();

        return $user->budgets()
            ->where('is_active', true)
            ->with(['category', 'periods' => fn ($q) => $q
                ->where('period_start', '<=', $today)
                ->where('period_end', '>=', $today)
            ])
            ->get()
            ->map(function ($budget) {
                $period = $budget->periods->first();
                return [
                    'budget_id'    => $budget->id,
                    'category'     => $budget->category->name ?? 'Unknown',
                    'limit'        => (float) $budget->amount_limit,
                    'spent'        => (float) ($period->amount_spent ?? 0),
                    'percentage'   => $period?->percentage ?? 0,
                    'status'       => $period?->status ?? 'on_track',
                ];
            })
            ->sortByDesc('percentage')
            ->values()
            ->toArray();
    }

    private function asbSnapshot(User $user): array
    {
        return $user->asbFunds()
            ->with(['dividends' => fn ($q) => $q->latest('year')->limit(1)])
            ->get()
            ->map(fn ($fund) => [
                'fund_name'      => $fund->fund_name,
                'balance'        => (float) $fund->units_held,
                'last_dividend'  => $fund->dividends->first()?->total_payout,
            ])
            ->toArray();
    }

    private function recentTransactions(User $user): array
    {
        return $user->transactions()
            ->with(['category', 'account'])
            ->where('status', 'confirmed')
            ->whereIn('type', ['expense', 'income'])
            ->orderByDesc('actual_date')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->toArray();
    }
}
