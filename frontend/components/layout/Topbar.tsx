'use client';

import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { usePendingStore } from '@/store/pendingStore';
import { Bell, Eye, EyeOff } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/accounts':     'Bank Accounts',
  '/transactions': 'Transactions',
  '/recurring':    'Recurring',
  '/budgets':      'Budgets',
  '/epf':          'EPF Tracker',
  '/asb':          'ASB Tracker',
  '/settings':     'Settings',
};

export default function Topbar() {
  const pathname = usePathname();
  const user     = useAuthStore((s) => s.user);
  const { balanceVisible, toggleBalanceVisibility } = useUiStore();
  const pendingCount = usePendingStore((s) => s.count);

  const title = Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k))?.[1] ?? 'MyFinance';
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'MF';

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-20">
      <h1 className="text-lg font-semibold text-white">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Balance visibility toggle */}
        <button
          onClick={toggleBalanceVisibility}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all"
          title={balanceVisible ? 'Hide balances' : 'Show balances'}
        >
          {balanceVisible ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>

        {/* Pending transactions bell */}
        <Link
          href="/transactions?status=pending"
          className="relative p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all"
          title="Pending transactions"
        >
          <Bell size={18} />
          {pendingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
        </Link>

        {/* User avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-indigo-600 text-white text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-100 leading-tight">{user?.name}</p>
            <p className="text-xs text-slate-500 leading-tight">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
