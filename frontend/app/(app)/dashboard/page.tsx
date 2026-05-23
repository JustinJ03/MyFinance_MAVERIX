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
import { TrendingUp, TrendingDown, Wallet, AlertTriangle, ArrowRight } from 'lucide-react';

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
            <AlertTriangle size={18} className="shrink-0" />
            <span className="text-sm font-medium">
              You have <strong>{data.pending_count}</strong> pending transaction{data.pending_count !== 1 ? 's' : ''} awaiting confirmation
            </span>
            <ArrowRight size={16} className="ml-auto shrink-0" />
          </div>
        </Link>
      )}

      {/* Net Worth */}
      <Card className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border-indigo-500/20">
        <CardContent className="pt-6">
          <p className="text-slate-400 text-sm mb-1">Total Net Worth</p>
          <p className="text-4xl font-bold text-white tracking-tight">
            {balance(data?.net_worth?.total ?? 0)}
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            {Object.entries(data?.net_worth?.by_type ?? {}).map(([type, info]: [string, any]) => (
              <div key={type} className="flex items-center gap-2 bg-slate-800/60 rounded-lg px-3 py-1.5">
                <span className="text-xs text-slate-400 capitalize">{type.replace('_', ' ')}</span>
                <span className="text-xs font-semibold text-slate-200">{balance(info.balance)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cashflow Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Income This Month',   value: data?.cashflow_summary?.income,  icon: TrendingUp,   color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
          { label: 'Expenses This Month', value: data?.cashflow_summary?.expense, icon: TrendingDown, color: 'text-red-400',   bg: 'bg-red-500/10 border-red-500/20'   },
          { label: 'Net Cashflow',        value: data?.cashflow_summary?.net,     icon: Wallet,       color: data?.cashflow_summary?.net >= 0 ? 'text-indigo-400' : 'text-red-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className={`border ${bg} bg-slate-900/60`}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-xs mb-1">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{balance(value ?? 0)}</p>
                </div>
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon size={20} className={color} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cashflow Bar Chart */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm text-slate-300">Cashflow — Last 6 Months</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.cashflow_chart ?? []} barSize={14}>
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(v: any) => formatRM(v)}
                />
                <Bar dataKey="income"  fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 justify-center">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-3 h-3 rounded-sm bg-green-500" /> Income
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-3 h-3 rounded-sm bg-red-500" /> Expense
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spending Donut */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm text-slate-300">Spending by Category — This Month</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.spending_breakdown?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.spending_breakdown} dataKey="total" nameKey="category_name" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
                    {data.spending_breakdown.map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                    formatter={(v: any) => formatRM(v)}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">
                No expenses this month yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Health + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Health */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-slate-300">Budget Health</CardTitle>
            <Link href="/budgets" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.budget_health?.slice(0, 5).map((b: any) => (
              <div key={b.budget_id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">{b.category}</span>
                  <span style={{ color: STATUS_COLORS[b.status as keyof typeof STATUS_COLORS] }}>
                    {balance(b.spent)} / {balance(b.limit)}
                  </span>
                </div>
                <Progress value={Math.min(b.percentage, 100)} className="h-1.5"
                  style={{ '--progress-color': STATUS_COLORS[b.status as keyof typeof STATUS_COLORS] } as any}
                />
              </div>
            )) ?? <p className="text-slate-500 text-sm">No budgets set</p>}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-slate-300">Recent Transactions</CardTitle>
            <Link href="/transactions" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {data?.recent_transactions?.slice(0, 8).map((tx: any, i: number) => (
              <div key={tx.id}>
                {i > 0 && <Separator className="bg-slate-800 my-2" />}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-200 font-medium">{tx.name}</p>
                    <p className="text-xs text-slate-500">{tx.category?.name} · {formatDate(tx.actual_date)}</p>
                  </div>
                  <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.type === 'income' ? '+' : '-'}{balance(tx.amount)}
                  </span>
                </div>
              </div>
            )) ?? <p className="text-slate-500 text-sm">No transactions yet</p>}
          </CardContent>
        </Card>
      </div>

      {/* EPF + ASB Snapshot */}
      {(data?.epf_snapshot?.total > 0 || data?.asb_snapshot?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* EPF */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-slate-300">EPF Snapshot</CardTitle>
              <Link href="/epf" className="text-xs text-indigo-400 hover:text-indigo-300">View tracker →</Link>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white mb-3">{balance(data?.epf_snapshot?.total ?? 0)}</p>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((acc) => (
                  <div key={acc} className="bg-slate-800/60 rounded-lg p-2 text-center">
                    <p className="text-xs text-slate-500">Acc {acc}</p>
                    <p className="text-sm font-semibold text-slate-200">{balance(data?.epf_snapshot?.balances?.[acc] ?? 0)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ASB */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-slate-300">ASB Snapshot</CardTitle>
              <Link href="/asb" className="text-xs text-indigo-400 hover:text-indigo-300">View tracker →</Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {data?.asb_snapshot?.length > 0
                ? data.asb_snapshot.map((fund: any) => (
                    <div key={fund.fund_name} className="flex justify-between items-center bg-slate-800/60 rounded-lg px-3 py-2">
                      <span className="text-sm text-slate-300">{fund.fund_name}</span>
                      <span className="text-sm font-semibold text-slate-100">{balance(fund.balance)}</span>
                    </div>
                  ))
                : <p className="text-slate-500 text-sm">No ASB funds registered</p>
              }
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
