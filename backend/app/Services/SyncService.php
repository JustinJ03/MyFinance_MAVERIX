<?php

namespace App\Services;

use App\Models\AsbFund;
use App\Models\AsbTransaction;
use App\Models\EpfTransaction;
use App\Models\Transaction;

class SyncService
{
    /**
     * After a transaction is confirmed, check if it should auto-sync
     * to EPF or ASB trackers.
     */
    public function syncOnConfirm(Transaction $transaction): void
    {
        if ($transaction->type !== 'expense') return;
        if (!$transaction->category) return;

        $categoryName = strtolower($transaction->category->name ?? '');
        $parentName   = strtolower($transaction->category->parent->name ?? '');

        // Only Investment/Savings children trigger sync
        if ($parentName !== 'investment/savings' && $parentName !== 'investment & savings') return;

        if ($categoryName === 'epf (voluntary)' && $transaction->epf_account_number) {
            $this->syncToEpf($transaction);
        }

        if ($categoryName === 'asb' && $transaction->asb_fund_id) {
            $this->syncToAsb($transaction);
        }
    }

    private function syncToEpf(Transaction $transaction): void
    {
        // Avoid double-sync
        if ($transaction->epfTransactions()->where('contribution_type', 'voluntary')->exists()) {
            return;
        }

        EpfTransaction::create([
            'user_id'              => $transaction->user_id,
            'epf_account_number'   => $transaction->epf_account_number,
            'transaction_type'     => 'contribution',
            'contribution_type'    => 'voluntary',
            'date'                 => $transaction->actual_date,
            'employee_amount'      => $transaction->amount,
            'employer_amount'      => 0,
            'total_amount'         => $transaction->amount,
            'linked_transaction_id'=> $transaction->id,
            'remarks'              => 'Auto-synced from expense: ' . $transaction->name,
        ]);
    }

    private function syncToAsb(Transaction $transaction): void
    {
        if (!$transaction->asb_fund_id) return;

        // Avoid double-sync
        if ($transaction->asbTransactions()->exists()) return;

        $asbFund = AsbFund::find($transaction->asb_fund_id);
        if (!$asbFund) return;

        AsbTransaction::create([
            'asb_fund_id'           => $transaction->asb_fund_id,
            'user_id'               => $transaction->user_id,
            'transaction_type'      => 'deposit',
            'date'                  => $transaction->actual_date,
            'amount'                => $transaction->amount,
            'linked_transaction_id' => $transaction->id,
            'remarks'               => 'Auto-synced from expense: ' . $transaction->name,
        ]);

        // Update ASB fund units
        $asbFund->increment('units_held', $transaction->amount);
    }

    /**
     * When a synced transaction is deleted, remove the linked EPF/ASB records.
     */
    public function removeSyncedRecords(Transaction $transaction): void
    {
        $transaction->epfTransactions()->where('contribution_type', 'voluntary')->delete();

        foreach ($transaction->asbTransactions as $asbTx) {
            $asbFund = $asbTx->fund;
            if ($asbFund) {
                $asbFund->decrement('units_held', $asbTx->amount);
            }
            $asbTx->delete();
        }
    }
}
