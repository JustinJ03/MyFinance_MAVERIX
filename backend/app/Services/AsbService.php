<?php

namespace App\Services;

use App\Models\AsbDividend;
use App\Models\AsbFund;
use App\Models\AsbTransaction;
use App\Models\User;

class AsbService
{
    public function addDeposit(AsbFund $fund, array $data): AsbTransaction
    {
        $tx = AsbTransaction::create([
            'asb_fund_id'    => $fund->id,
            'user_id'        => $fund->user_id,
            'transaction_type' => 'deposit',
            'date'           => $data['date'],
            'amount'         => $data['amount'],
            'remarks'        => $data['remarks'] ?? null,
        ]);

        $fund->increment('units_held', $data['amount']);
        return $tx;
    }

    public function addWithdrawal(AsbFund $fund, array $data): AsbTransaction
    {
        $tx = AsbTransaction::create([
            'asb_fund_id'    => $fund->id,
            'user_id'        => $fund->user_id,
            'transaction_type' => 'withdrawal',
            'date'           => $data['date'],
            'amount'         => $data['amount'],
            'remarks'        => $data['remarks'] ?? null,
        ]);

        $fund->decrement('units_held', $data['amount']);
        return $tx;
    }

    public function deleteTransaction(AsbTransaction $tx): void
    {
        $fund = $tx->fund;
        if ($tx->transaction_type === 'deposit') {
            $fund->decrement('units_held', $tx->amount);
        } else {
            $fund->increment('units_held', $tx->amount);
        }
        $tx->delete();
    }

    public function addDividend(AsbFund $fund, array $data): AsbDividend
    {
        $dividend = AsbDividend::create([
            'asb_fund_id'    => $fund->id,
            'user_id'        => $fund->user_id,
            'year'           => $data['year'],
            'dividend_rate'  => $data['dividend_rate'],
            'dividend_amount'=> $data['dividend_amount'],
            'bonus_rate'     => $data['bonus_rate'] ?? null,
            'bonus_amount'   => $data['bonus_amount'] ?? null,
            'total_payout'   => $data['total_payout'],
        ]);

        // Dividends increase units held
        $fund->increment('units_held', $data['total_payout']);
        return $dividend;
    }

    public function growthProjection(AsbFund $fund, array $params): array
    {
        $currentBalance   = (float) $fund->units_held;
        $monthlyTopUp     = (float) ($params['monthly_top_up'] ?? 0);
        $annualRate       = (float) ($params['annual_rate'] ?? 0.045);
        $years            = (int) ($params['years'] ?? 10);

        $rows            = [];
        $balance         = $currentBalance;
        $totalPrincipal  = $currentBalance;
        $totalDividends  = 0;

        for ($y = 1; $y <= $years; $y++) {
            $principalAdded  = $monthlyTopUp * 12;
            $dividendEarned  = ($balance + $principalAdded / 2) * $annualRate;
            $balance        += $principalAdded + $dividendEarned;
            $totalPrincipal += $principalAdded;
            $totalDividends += $dividendEarned;

            $rows[] = [
                'year'            => $y,
                'balance'         => round($balance, 2),
                'dividend_earned' => round($dividendEarned, 2),
                'total_principal' => round($totalPrincipal, 2),
            ];
        }

        return [
            'projected_balance'   => round($balance, 2),
            'total_dividends'     => round($totalDividends, 2),
            'total_principal'     => round($totalPrincipal, 2),
            'yearly_projections'  => $rows,
        ];
    }
}
