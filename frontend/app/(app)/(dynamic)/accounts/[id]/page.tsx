'use client';

export const dynamic = 'force-dynamic';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import { useAccount, useAccountTransactions } from '@/hooks/useAccounts';
import { formatRM, formatDate } from '@/lib/formatters';
import { useUiStore } from '@/store/uiStore';
import { PageLoader } from '@/components/common/LoadingSpinner';
import StatusBadge from '@/components/common/StatusBadge';
import BalanceMask from '@/components/common/BalanceMask';
import { Transaction } from '@/types/transaction';

const TYPE_ICONS: Record<string, string> = {
  savings: '🏦', current: '🏛️', credit_card: '💳', e_wallet: '📱', digital_bank: '🔷',
};

const TxTypeIcon = ({ type }: { type: string }) => {
  if (type === 'income') return <TrendingUp size={14} className="text-emerald-400" />;
  if (type === 'expense') return <TrendingDown size={14} className="text-red-400" />;
  return <ArrowLeftRight size={14} className="text-blue-400" />;
};

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const accountId = parseInt(id);
  const { balanceVisible } = useUiStore();

  const { data: account, isLoading: loadingAccount } = useAccount(accountId);
  const { data: txData, isLoading: loadingTx } = useAccountTransactions(accountId);

  if (loadingAccount) return <PageLoader />;
  if (!account) return (
    <div className="text-center py-20 text-slate-400">Account not found.</div>
  );

  const transactions: Transaction[] = txData?.data ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/accounts" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
        <ArrowLeft size={14} /> Back to Accounts
      </Link>

      {/* Account Header Card */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="h-2 w-full" style={{ background: account.color ?? '#6366f1' }} />
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{TYPE_ICONS[account.account_type] ?? '🏦'}</span>
                <h1 className="text-xl font-bold text-white">{account.nickname}</h1>
              </div>
              <p className="text-slate-400 text-sm">{account.bank_name}</p>
              {account.last_four_digits && (
                <p className="text-slate-500 text-xs mt-0.5">•••• {account.last_four_digits}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Current Balance</p>
              <p className="text-3xl font-bold text-white">
                <BalanceMask value={account.current_balance} />
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Initial: {balanceVisible ? formatRM(account.initial_balance) : 'RM •••••'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="text-white font-semibold mb-3">Transaction History</h2>

        {loadingTx ? (
          <PageLoader />
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 text-slate-500 bg-slate-900 rounded-xl border border-slate-800">
            No transactions for this account yet.
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx: Transaction) => (
              <div
                key={tx.id}
                className="flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
              >
                {/* Type icon */}
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                  <TxTypeIcon type={tx.type} />
                </div>

                {/* Name + category */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{tx.name}</p>
                  <p className="text-slate-500 text-xs">
                    {tx.category?.parent ? `${tx.category.parent.name} › ` : ''}
                    {tx.category?.name ?? '—'}
                    {' · '}{formatDate(tx.actual_date)}
                  </p>
                </div>

                {/* Status */}
                <StatusBadge status={tx.status as any} />

                {/* Amount */}
                <div className="text-right shrink-0">
                  <p className={`font-semibold text-sm ${
                    tx.type === 'income' ? 'text-emerald-400' : tx.type === 'expense' ? 'text-red-400' : 'text-blue-400'
                  }`}>
                    {tx.type === 'income' ? '+' : tx.type === 'expense' ? '−' : ''}
                    {balanceVisible ? formatRM(tx.amount) : 'RM •••••'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
