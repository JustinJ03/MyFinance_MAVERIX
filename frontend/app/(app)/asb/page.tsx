'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatRM } from '@/lib/formatters';
import { useUiStore } from '@/store/uiStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const FUND_LABELS: Record<string, string> = {
  ASB: 'Amanah Saham Bumiputera',
  ASB2: 'Amanah Saham Bumiputera 2',
  ASM: 'Amanah Saham Malaysia',
  ASM2_Wawasan: 'ASM 2 Wawasan',
  ASM3: 'Amanah Saham Malaysia 3',
};

export default function AsbPage() {
  const { balanceVisible } = useUiStore();
  const balance = (v: number) => balanceVisible ? formatRM(v) : 'RM •••••';

  const { data: funds = [] } = useQuery({
    queryKey: ['asb'],
    queryFn: () => api.get('/asb').then((r) => r.data.data),
  });

  if (funds.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-white mb-6">ASB / ASNB Tracker</h2>
        <div className="text-center py-20 text-slate-500">
          <p className="text-4xl mb-4">🏦</p>
          <p className="font-medium text-slate-400">No ASB funds registered</p>
          <p className="text-sm mt-1">Add your ASNB funds to start tracking your unit trust investments.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-white">ASB / ASNB Tracker</h2>

      <Tabs defaultValue={funds[0]?.fund_name}>
        <TabsList className="bg-slate-800 border border-slate-700">
          {funds.map((f: any) => (
            <TabsTrigger key={f.fund_name} value={f.fund_name}
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              {f.fund_name}
            </TabsTrigger>
          ))}
        </TabsList>

        {funds.map((fund: any) => (
          <TabsContent key={fund.fund_name} value={fund.fund_name} className="mt-4 space-y-4">
            <Card className="bg-gradient-to-br from-purple-900/30 to-slate-900 border-purple-500/20">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">{FUND_LABELS[fund.fund_name]}</p>
                    <p className="text-3xl font-bold text-white mt-1">{balance(fund.units_held)}</p>
                    <p className="text-xs text-slate-500 mt-1">{fund.units_held.toLocaleString()} units @ RM 1.00/unit</p>
                  </div>
                  {fund.is_near_ceiling && (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Near ceiling</Badge>
                  )}
                </div>
                <div className="mt-4 bg-slate-800/60 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-400">Remaining capacity</p>
                  <p className="text-sm font-semibold text-slate-200">{balance(fund.remaining_units ?? 0)}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
