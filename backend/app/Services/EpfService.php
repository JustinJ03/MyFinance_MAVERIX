<?php

namespace App\Services;

use App\Models\EpfTransaction;
use App\Models\User;
use Illuminate\Support\Collection;

class EpfService
{
    // EPF mandatory split ratios
    const SPLIT = [1 => 0.75, 2 => 0.15, 3 => 0.10];

    public function overview(User $user): array
    {
        $balances = [1 => 0.0, 2 => 0.0, 3 => 0.0];

        $user->epfTransactions()->each(function (EpfTransaction $tx) use (&$balances) {
            $amt = (float) $tx->total_amount;
            if ($tx->transaction_type === 'contribution') {
                $balances[$tx->epf_account_number] += $amt;
            } elseif ($tx->transaction_type === 'withdrawal') {
                $balances[$tx->epf_account_number] -= $amt;
            } elseif ($tx->transaction_type === 'dividend') {
                $balances[$tx->epf_account_number] += $amt;
            }
        });

        $lastContribution = $user->epfTransactions()
            ->where('transaction_type', 'contribution')
            ->latest('date')
            ->first();

        return [
            'balances'         => $balances,
            'total'            => array_sum($balances),
            'last_contribution'=> $lastContribution?->date?->format('d/m/Y'),
        ];
    }

    /**
     * When adding a mandatory contribution, auto-split into accounts 1, 2, 3.
     */
    public function createMandatoryContribution(User $user, array $data): Collection
    {
        $totalEmployee = (float) $data['employee_amount'];
        $totalEmployer = (float) $data['employer_amount'];
        $grandTotal    = $totalEmployee + $totalEmployer;

        $created = collect();

        foreach (self::SPLIT as $account => $ratio) {
            $empAmount   = round($totalEmployee * $ratio, 2);
            $erAmount    = round($totalEmployer * $ratio, 2);
            $totalAmount = $empAmount + $erAmount;

            $tx = EpfTransaction::create([
                'user_id'            => $user->id,
                'epf_account_number' => $account,
                'transaction_type'   => 'contribution',
                'contribution_type'  => 'mandatory',
                'date'               => $data['date'],
                'employee_amount'    => $empAmount,
                'employer_amount'    => $erAmount,
                'total_amount'       => $totalAmount,
                'remarks'            => $data['remarks'] ?? null,
                'attachment_path'    => $data['attachment_path'] ?? null,
            ]);

            $created->push($tx);
        }

        return $created;
    }

    // --- Calculators ---

    public function retirementProjection(array $params): array
    {
        $currentBalance     = (float) $params['current_balance'];
        $monthlyContribution= (float) $params['monthly_contribution'];
        $annualRate         = (float) ($params['annual_rate'] ?? 0.055);
        $currentAge         = (int) $params['current_age'];
        $retirementAge      = (int) ($params['retirement_age'] ?? 55);

        $years        = max(0, $retirementAge - $currentAge);
        $monthlyRate  = $annualRate / 12;
        $months       = $years * 12;

        // FV = PV*(1+r)^n + PMT*[((1+r)^n - 1)/r]
        $fvCurrent = $currentBalance * pow(1 + $annualRate, $years);
        $fvContrib = $monthlyRate > 0
            ? $monthlyContribution * ((pow(1 + $monthlyRate, $months) - 1) / $monthlyRate)
            : $monthlyContribution * $months;

        return [
            'years_to_retirement' => $years,
            'projected_balance'   => round($fvCurrent + $fvContrib, 2),
        ];
    }

    public function withdrawalSustainability(array $params): array
    {
        $balance    = (float) $params['account3_balance'];
        $monthly    = (float) $params['monthly_withdrawal'];

        if ($monthly <= 0) return ['months' => null, 'years' => null];

        $months = (int) floor($balance / $monthly);
        return [
            'months' => $months,
            'years'  => round($months / 12, 1),
        ];
    }

    public function retirementComfort(array $params): array
    {
        $projectedBalance = (float) $params['projected_balance'];
        $monthlyExpenses  = (float) $params['monthly_expenses'];
        $annualRate       = (float) ($params['annual_rate'] ?? 0.055);

        // Annual passive income from EPF balance
        $annualPassive = $projectedBalance * $annualRate;
        $monthlyPassive = $annualPassive / 12;

        $shortfall = $monthlyExpenses - $monthlyPassive;
        $months    = $shortfall > 0 ? 0 : (int) floor($projectedBalance / $monthlyExpenses);

        return [
            'monthly_passive_income' => round($monthlyPassive, 2),
            'monthly_expenses'       => $monthlyExpenses,
            'monthly_shortfall'      => round(max(0, $shortfall), 2),
            'monthly_surplus'        => round(max(0, -$shortfall), 2),
            'is_sufficient'          => $shortfall <= 0,
            'months_sustainable'     => $months,
        ];
    }
}
