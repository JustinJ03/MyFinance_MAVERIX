'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatRM, formatDate } from '@/lib/formatters';
import { useUiStore } from '@/store/uiStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function EpfPage() {
  const { balanceVisible } = useUiStore();
  const balance = (v: number) => balanceVisible ? formatRM(v) : 'RM •••••';

  const { data: overview } = useQuery({
    queryKey: ['epf'],
    queryFn: () => api.get('/epf').then((r) => r.data.data),
  });

  const { data: txs = [] } = useQuery({
    queryKey: ['epf-transactions'],
    queryFn: () => api.get('/epf/transactions').then((r) => r.data.data),
  });

  const EPF_ACCOUNTS = [
    { num: 1, label: 'Akaun Persaraan',  pct: '75%', color: 'text-indigo-400' },
    { num: 2, label: 'Akaun Sejahtera',  pct: '15%', color: 'text-purple-400'  },
    { num: 3, label: 'Akaun Fleksibel',  pct: '10%', color: 'text-cyan-400'    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-white">EPF Tracker</h2>

      <Tabs defaultValue="overview">
        <TabsList className="bg-slate-800 border border-slate-700">
          {['overview', 'transactions', 'calculators'].map((t) => (
            <TabsTrigger key={t} value={t} className="capitalize data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              {t}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border-indigo-500/20">
            <CardContent className="pt-6">
              <p className="text-slate-400 text-sm mb-1">Total EPF Balance</p>
              <p className="text-3xl font-bold text-white">{balance(overview?.total ?? 0)}</p>
              {overview?.last_contribution && (
                <p className="text-xs text-slate-500 mt-2">Last contribution: {overview.last_contribution}</p>
              )}
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {EPF_ACCOUNTS.map(({ num, label, pct, color }) => (
              <Card key={num} className="bg-slate-900 border-slate-800">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-slate-400">Account {num}</p>
                    <Badge variant="outline" className="text-xs border-slate-700 text-slate-500">{pct}</Badge>
                  </div>
                  <p className={`text-xl font-bold ${color}`}>{balance(overview?.balances?.[num] ?? 0)}</p>
                  <p className="text-xs text-slate-500 mt-1">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-4 divide-y divide-slate-800">
              {txs.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No EPF transactions yet</div>
              ) : txs.map((tx: any) => (
                <div key={tx.id} className="flex justify-between items-center py-3">
                  <div>
                    <p className="text-sm text-slate-200 capitalize">{tx.transaction_type} · Acc {tx.epf_account_number}</p>
                    <p className="text-xs text-slate-500">{formatDate(tx.date)} · {tx.contribution_type ?? ''}</p>
                  </div>
                  <p className="text-sm font-bold text-indigo-400">+{balance(tx.total_amount)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculators" className="mt-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-6 text-center py-12">
              <p className="text-4xl mb-4">📈</p>
              <p className="text-slate-400 font-medium">Retirement & Sustainability Calculators</p>
              <p className="text-slate-500 text-sm mt-2">Plan your retirement with the EPF calculator tools</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
