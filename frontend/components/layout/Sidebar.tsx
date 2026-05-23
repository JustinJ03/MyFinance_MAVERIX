'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import api from '@/lib/api';
import {
  LayoutDashboard, Landmark, ArrowLeftRight, RefreshCcw,
  Target, TrendingUp, PiggyBank, Settings, LogOut, ChevronLeft,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'    },
  { href: '/accounts',     icon: Landmark,         label: 'Accounts'     },
  { href: '/transactions', icon: ArrowLeftRight,   label: 'Transactions' },
  { href: '/recurring',    icon: RefreshCcw,       label: 'Recurring'    },
  { href: '/budgets',      icon: Target,           label: 'Budgets'      },
  { href: '/epf',          icon: TrendingUp,       label: 'EPF Tracker'  },
  { href: '/asb',          icon: PiggyBank,        label: 'ASB Tracker'  },
  { href: '/settings',     icon: Settings,         label: 'Settings'     },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    clearAuth();
    toast.success('Signed out');
    router.push('/login');
  };

  return (
    <aside className={`
      fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-800 z-30
      flex flex-col transition-all duration-300
      ${sidebarCollapsed ? 'w-16' : 'w-64'}
    `}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-slate-800 ${sidebarCollapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-white text-sm shrink-0">
          M
        </div>
        {!sidebarCollapsed && (
          <span className="font-bold text-white tracking-tight">MyFinance</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${active
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }
                ${sidebarCollapsed ? 'justify-center' : ''}
              `}
            >
              <Icon size={18} className="shrink-0" />
              {!sidebarCollapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout + collapse */}
      <div className="px-2 py-4 border-t border-slate-800 space-y-1">
        <button
          onClick={handleLogout}
          title="Logout"
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
            text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all
            ${sidebarCollapsed ? 'justify-center' : ''}
          `}
        >
          <LogOut size={18} className="shrink-0" />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>

        <button
          onClick={toggleSidebar}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
            text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-all
            ${sidebarCollapsed ? 'justify-center' : ''}
          `}
        >
          <ChevronLeft size={18} className={`shrink-0 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
