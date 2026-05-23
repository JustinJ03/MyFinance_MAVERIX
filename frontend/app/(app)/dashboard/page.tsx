'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatRM, formatDate } from '@/lib/formatters';
import { useUiStore } from '@/store/uiStore';
import { usePendingStore } from '@/store/pendingStore';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Bell, ArrowRight, ArrowUpRight } from 'lucide-react';

const STATUS_COLORS = { on_track: '#22c55e', approaching: '#eab308', exceeded: '#ef4444' };
const PIE_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#14b8a6','#06b6d4','#3b82f6'];

export default function DashboardPage() {
  const { balanceVisible } = useUiStore();
  const setCount = usePendingStore((s) => s.setCount);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data.data),
  });

  useEffect(() => {
    if (data?.pending_count !== undefined) setCount(data.pending_count);
  }, [data, setCount]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const balance = (v: number) => balanceVisible ? formatRM(v) : 'RM •••••';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Pending Banner */}
      {data?.pending_count > 0 && (
        <Link href="/transactions?status=pending" className="block">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/15 transition-all">
            <Bell size={16} className="shrink-0 animate-pulse" />
            <span className="text-sm font-medium">
              <strong>{data.pending_count}</strong> pending transaction{data.pending_count !== 1 ? 's' : ''} awaiting confirmation
            </span>
            <ArrowRight size={15} className="ml-auto shrink-0" />
          </div>
        </Link>
      )}

      {/* Net Worth Hero */}
      <div className="rounded-2xl border border-indigo-500/20 p-6 relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(15,23,42,0.95) 60%)'
      }}>
        <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <p className="text-slate-400 text-xs uppercase tracking-widest font-medium mb-2">Total Net Worth</p>
        <p className="text-5xl font-black text-white tracking-tight mb-4">
          {balance(data?.net_worth?.total ?? 0)}
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(data?.net_worth?.by_type ?? {}).map(([type, info]: [string, any]) => (
            <div key={type} className="flex items-center gap-2 bg-slate-800/70 border border-slate-700/50 rounded-lg px-3 py-1.5">
              <span className="text-xs text-slate-400 capitalize">{type.replace('_', ' ')}</span>
              <span className="text-xs font-semibold text-slate-100">{balance(info.balance)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cashflow Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Income',    value: data?.cashflow_summary?.income,  icon: TrendingUp,   color: 'text-green-400', iconBg: 'bg-green-500/10', border: 'border-t-green-500/50' },
          { label: 'Expenses',  value: data?.cashflow_summary?.expense, icon: TrendingDown, color: 'text-red-400',   iconBg: 'bg-red-500/10',   border: 'border-t-red-500/50'   },
          { label: 'Net Flow',  value: data?.cashflow_summary?.net,     icon: Wallet,       color: (data?.cashflow_summary?.net ?? 0) >= 0 ? 'text-indigo-400' : 'text-red-400', iconBg: 'bg-indigo-500/10', border: 'border-t-indigo-500/50' },
        ].map(({ label, value, icon: Icon, color, iconBg, border }) => (
          <Card key={label} className={`bg-slate-900 border-slate-800 border-t-2 ${border} rounded-2xl overflow-hidden`}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-400 text-xs font-medium">{label} — This Month</p>
                <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
                  <Icon size={16} className={color} />
                </div>
              </div>
              <p className={`text-2xl font-black ${color}`}>{balance(value ?? 0)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300 font-semibold">Cashflow — Last 6 Months</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.cashflow_chart ?? []} barSize={12} barGap={3}>
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(v: any) => formatRM(v)}
                />
                <Bar dataKey="income"  fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-1 justify-center">
              <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-green-500" /> Income</span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Expense</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300 font-semibold">Spending by Category — This Month</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.spending_breakdown?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.spending_breakdown} dataKey="total" nameKey="category_name" cx="50%" cy="50%" outerRadius={80} innerRadius={52} paddingAngle={2}>
                    {data.spending_breakdown.map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} formatter={(v: any) => formatRM(v)} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-600 text-sm">No expenses this month yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Health + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm text-slate-300 font-semibold">Budget Health</CardTitle>
            <Link href="/budgets" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 transition-colors">
              View all <ArrowUpRight size={12} />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.budget_health?.length > 0
              ? data.budget_health.slice(0, 5).map((b: any) => (
                <div key={b.budget_id}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">{b.category}</span>
                    <span style={{ color: STATUS_COLORS[b.status as keyof typeof STATUS_COLORS] }}>
                      {balance(b.spent)} / {balance(b.limit)}
                    </span>
                  </div>
                  <Progress value={Math.min(b.percentage, 100)} className="h-1.5 bg-slate-800"
                    style={{ '--progress-color': STATUS_COLORS[b.status as keyof typeof STATUS_COLORS] } as any} />
                </div>
              ))
              : <p className="text-slate-600 text-sm py-4 text-center">No budgets set</p>
            }
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm text-slate-300 font-semibold">Recent Transactions</CardTitle>
            <Link href="/transactions" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 transition-colors">
              View all <ArrowUpRight size={12} />
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-slate-800">
            {data?.recent_transactions?.length > 0
              ? data.recent_transactions.slice(0, 7).map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-200 font-medium truncate">{tx.name}</p>
                    <p className="text-xs text-slate-500">{tx.category?.name ?? '—'} · {formatDate(tx.actual_date)}</p>
                  </div>
                  <span className={`text-sm font-bold ml-3 tabular-nums ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.type === 'income' ? '+' : '-'}{balance(tx.amount)}
                  </span>
                </div>
              ))
              : <p className="text-slate-600 text-sm py-4 text-center">No transactions yet</p>
            }
          </CardContent>
        </Card>
      </div>

      {/* EPF + ASB Snapshot */}
      {(data?.epf_snapshot?.total > 0 || data?.asb_snapshot?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-900 border-slate-800 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm text-slate-300 font-semibold">EPF Snapshot</CardTitle>
              <Link href="/epf" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 transition-colors">View tracker <ArrowUpRight size={12} /></Link>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-black text-white mb-3">{balance(data?.epf_snapshot?.total ?? 0)}</p>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((acc) => (
                  <div key={acc} className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">Account {acc}</p>
                    <p className="text-sm font-semibold text-slate-200">{balance(data?.epf_snapshot?.balances?.[acc] ?? 0)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm text-slate-300 font-semibold">ASB Snapshot</CardTitle>
              <Link href="/asb" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 transition-colors">View tracker <ArrowUpRight size={12} /></Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {data?.asb_snapshot?.length > 0
                ? data.asb_snapshot.map((fund: any) => (
                    <div key={fund.fund_name} className="flex justify-between items-center bg-slate-800/60 border border-slate-700/40 rounded-xl px-3 py-2.5">
                      <span className="text-sm text-slate-300">{fund.fund_name}</span>
                      <span className="text-sm font-bold text-slate-100">{balance(fund.balance)}</span>
                    </div>
                  ))
                : <p className="text-slate-600 text-sm py-4 text-center">No ASB funds registered</p>
              }
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
