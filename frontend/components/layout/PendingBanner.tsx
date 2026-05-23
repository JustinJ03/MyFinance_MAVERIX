'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { usePendingTransactions } from '@/hooks/useTransactions';

export default function PendingBanner() {
  const { data: pending = [] } = usePendingTransactions();

  if (pending.length === 0) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
      <AlertCircle size={20} className="text-amber-400 shrink-0" />
      <div className="flex-1">
        <p className="text-amber-300 font-medium text-sm">
          You have {pending.length} pending transaction{pending.length > 1 ? 's' : ''} to review
        </p>
        <p className="text-amber-400/70 text-xs mt-0.5">
          Confirm or skip to keep your balances accurate.
        </p>
      </div>
      <Link
        href="/transactions?status=pending"
        className="shrink-0 text-xs font-medium text-amber-300 hover:text-amber-200 underline underline-offset-2 transition-colors"
      >
        Review →
      </Link>
    </div>
  );
}
