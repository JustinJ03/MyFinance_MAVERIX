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
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard',    group: 'main'        },
  { href: '/accounts',     icon: Landmark,         label: 'Accounts',     group: 'main'        },
  { href: '/transactions', icon: ArrowLeftRight,   label: 'Transactions', group: 'main'        },
  { href: '/recurring',    icon: RefreshCcw,       label: 'Recurring',    group: 'main'        },
  { href: '/budgets',      icon: Target,           label: 'Budgets',      group: 'main'        },
  { href: '/epf',          icon: TrendingUp,       label: 'EPF Tracker',  group: 'investments' },
  { href: '/asb',          icon: PiggyBank,        label: 'ASB Tracker',  group: 'investments' },
  { href: '/settings',     icon: Settings,         label: 'Settings',     group: 'settings'    },
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

  const mainNav = NAV.filter(n => n.group === 'main');
  const investNav = NAV.filter(n => n.group === 'investments');
  const settingsNav = NAV.filter(n => n.group === 'settings');

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
    const active = pathname === href || pathname.startsWith(href + '/');
    return (
      <Link
        href={href}
        title={label}
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
          ${active
            ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
          }
          ${sidebarCollapsed ? 'justify-center' : ''}
        `}
      >
        <Icon size={17} className="shrink-0" />
        {!sidebarCollapsed && <span>{label}</span>}
      </Link>
    );
  };

  return (
    <aside className={`
      fixed top-0 left-0 h-full bg-slate-950 border-r border-slate-800/60 z-30
      flex flex-col transition-all duration-300
      ${sidebarCollapsed ? 'w-16' : 'w-64'}
    `}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-slate-800/40 ${sidebarCollapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shrink-0 ring-1 ring-inset ring-indigo-400/20 shadow-lg shadow-indigo-500/20">
          M
        </div>
        {!sidebarCollapsed && (
          <span className="font-bold text-white tracking-tight text-sm">MyFinance</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {mainNav.map((item) => <NavItem key={item.href} {...item} />)}

        {/* Investments group */}
        <div className="pt-3 pb-1">
          {!sidebarCollapsed && (
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Investments</p>
          )}
          {sidebarCollapsed && <div className="border-t border-slate-800/60 mb-2" />}
          {investNav.map((item) => <NavItem key={item.href} {...item} />)}
        </div>

        <div className="pt-1">
          {settingsNav.map((item) => <NavItem key={item.href} {...item} />)}
        </div>
      </nav>

      {/* Logout + collapse */}
      <div className="px-2 py-4 border-t border-slate-800/60 space-y-1">
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
