'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatRM, formatDate } from '@/lib/formatters';
import { useUiStore } from '@/store/uiStore';
import { useCreateEpfTransaction, useDeleteEpfTransaction, useEpfAnalytics } from '@/hooks/useEpf';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const EPF_ACCOUNTS = [
  { num: 1, label: 'Akaun Persaraan', pct: '75%', color: 'text-indigo-400' },
  { num: 2, label: 'Akaun Sejahtera', pct: '15%', color: 'text-purple-400' },
  { num: 3, label: 'Akaun Fleksibel', pct: '10%', color: 'text-cyan-400'   },
];

export default function EpfPage() {
  const qc = useQueryClient();
  const { balanceVisible } = useUiStore();
  const balance = (v: number) => balanceVisible ? formatRM(v) : 'RM •••••';

  // Overview
  const { data: overview } = useQuery({
    queryKey: ['epf', 'overview'],
    queryFn: () => api.get('/epf').then((r) => r.data.data),
  });

  // Transactions (non-dividend)
  const { data: allTxs = [] } = useQuery({
    queryKey: ['epf', 'transactions', 'all'],
    queryFn: () => api.get('/epf/transactions').then((r) => r.data.data ?? []),
  });
  const contributions = (allTxs as any[]).filter((t) => t.transaction_type !== 'dividend');
  const dividendEntries = (allTxs as any[]).filter((t) => t.transaction_type === 'dividend');

  const groupedContributions = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const tx of contributions) {
      const d = tx.date ? new Date(tx.date) : new Date();
      const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(tx);
    }
    return Array.from(map.entries()).map(([month, items]) => ({ month, items }));
  }, [contributions]);

  const groupedDividends = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const tx of dividendEntries) {
      const year = tx.date ? String(new Date(tx.date).getFullYear()) : 'Unknown';
      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push(tx);
    }
    return Array.from(map.entries()).map(([year, items]) => ({ year, items }));
  }, [dividendEntries]);

  // Analytics
  const { data: analytics } = useEpfAnalytics();

  // --- Computed analytics data ---
  const balanceOverTime = useMemo(() => {
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const dateStr = (rawDate: string) => {
      const s = typeof rawDate === 'string' ? rawDate : String(rawDate ?? '');
      const [yyyy, mm] = s.slice(0, 7).split('-');
      if (!yyyy || !mm) return null;
      return { key: `${yyyy}-${mm}`, label: `${MONTHS[parseInt(mm) - 1]} '${yyyy.slice(2)}` };
    };

    const sorted = [...(allTxs as any[])].sort((a, b) => {
      const da = typeof a.date === 'string' ? a.date : String(a.date ?? '');
      const db = typeof b.date === 'string' ? b.date : String(b.date ?? '');
      return da.localeCompare(db);
    });

    const bal: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    const points: { date: string; account_1: number; account_2: number; account_3: number }[] = [];

    for (const tx of sorted) {
      const acc = Number(tx.epf_account_number);
      if (!acc || ![1, 2, 3].includes(acc)) continue;
      const amt = parseFloat(tx.total_amount) || 0;
      if (tx.transaction_type === 'contribution' || tx.transaction_type === 'dividend') {
        bal[acc] += amt;
      } else if (tx.transaction_type === 'withdrawal') {
        bal[acc] -= amt;
      }
      const parsed = dateStr(tx.date);
      if (!parsed) continue;
      const last = points[points.length - 1];
      if (last && last.date === parsed.label) {
        last.account_1 = Math.round(bal[1]);
        last.account_2 = Math.round(bal[2]);
        last.account_3 = Math.round(bal[3]);
      } else {
        points.push({ date: parsed.label, account_1: Math.round(bal[1]), account_2: Math.round(bal[2]), account_3: Math.round(bal[3]) });
      }
    }
    return points;
  }, [allTxs]);

  const monthlyContribData = useMemo(() => {
    const raw = (analytics as any)?.monthly_contributions ?? [];
    const map: Record<string, any> = {};
    for (const item of raw) {
      if (!map[item.month]) map[item.month] = { month: item.month, account_1: 0, account_2: 0, account_3: 0 };
      map[item.month][`account_${item.epf_account_number}`] = item.total;
    }
    return Object.values(map).sort((a: any, b: any) => a.month.localeCompare(b.month));
  }, [analytics]);

  // Mutations
  const createTxMutation = useCreateEpfTransaction();
  const deleteTxMutation = useDeleteEpfTransaction();

  // Transaction form state
  const [addTxOpen, setAddTxOpen] = useState(false);
  const [deleteTxId, setDeleteTxId] = useState<number | null>(null);
  const { register: txReg, handleSubmit: txSubmit, control: txCtrl, reset: txReset, watch: txWatch } = useForm({
    defaultValues: {
      transaction_type: 'contribution', contribution_type: 'mandatory',
      epf_account_number: '', date: new Date().toISOString().split('T')[0],
      employee_amount: '', employer_amount: '', total_amount: '', remarks: '',
    }
  });
  const txType = txWatch('transaction_type');
  const contribType = txWatch('contribution_type');

  // Dividend form state
  const [addDivOpen, setAddDivOpen] = useState(false);
  const [deleteDivId, setDeleteDivId] = useState<number | null>(null);
  const {
    register: divReg, handleSubmit: divSubmit, reset: divReset,
    watch: divWatch, setValue: divSetValue,
  } = useForm({
    defaultValues: { epf_account_number: '', year: new Date().getFullYear().toString(), dividend_rate: '', total_amount: '', remarks: '' }
  });

  const divAccount = divWatch('epf_account_number');
  const divRate = divWatch('dividend_rate');

  // Auto-calculate dividend total_amount from account balance × rate
  useEffect(() => {
    if (!divAccount || !divRate) return;
    const accBal = overview?.balances?.[parseInt(divAccount)] ?? 0;
    const computed = (parseFloat(divRate) / 100) * accBal;
    if (computed > 0) divSetValue('total_amount', computed.toFixed(2));
  }, [divAccount, divRate, overview, divSetValue]);

  // Calculator state
  const [retCalc, setRetCalc] = useState({ current_age: 0, retirement_age: 55, current_balance: 0, monthly_contribution: 0, annual_dividend_rate: 5.5 });
  const [retSubmitted, setRetSubmitted] = useState(false);

  const { data: retResult, isFetching: retFetching } = useQuery({
    queryKey: ['epf', 'calc', 'retirement', retCalc],
    queryFn: () => api.get('/epf/calculator/retirement', {
      params: {
        current_balance: retCalc.current_balance,
        monthly_contribution: retCalc.monthly_contribution,
        current_age: retCalc.current_age,
        retirement_age: retCalc.retirement_age,
        annual_rate: retCalc.annual_dividend_rate / 100,
      }
    }).then(r => r.data.data),
    enabled: retSubmitted && retCalc.current_age > 0 && retCalc.monthly_contribution > 0,
  });

  // Generate year-by-year projection data for the chart
  const retChartData = useMemo(() => {
    if (!retSubmitted || !retCalc.current_age || !retCalc.monthly_contribution) return [];
    const years = Math.max(0, retCalc.retirement_age - retCalc.current_age);
    const annualRate = retCalc.annual_dividend_rate / 100;
    const monthlyRate = annualRate / 12;
    const rows: { age: number; balance: number }[] = [];
    let bal = retCalc.current_balance;
    for (let y = 1; y <= years; y++) {
      for (let m = 0; m < 12; m++) {
        bal = bal * (1 + monthlyRate) + retCalc.monthly_contribution;
      }
      rows.push({ age: retCalc.current_age + y, balance: Math.round(bal) });
    }
    return rows;
  }, [retSubmitted, retCalc]);

  const onAddTx = (d: any) => {
    const payload: any = { transaction_type: d.transaction_type, date: d.date, remarks: d.remarks || undefined };
    if (d.transaction_type === 'contribution') {
      payload.contribution_type = d.contribution_type;
      if (d.contribution_type === 'mandatory') {
        payload.employee_amount = parseFloat(d.employee_amount);
        payload.employer_amount = parseFloat(d.employer_amount);
      } else {
        payload.epf_account_number = parseInt(d.epf_account_number);
        payload.total_amount = parseFloat(d.total_amount);
      }
    } else {
      payload.epf_account_number = parseInt(d.epf_account_number);
      payload.total_amount = parseFloat(d.total_amount);
    }
    createTxMutation.mutate(payload, {
      onSuccess: () => { setAddTxOpen(false); txReset(); toast.success('Entry added'); qc.invalidateQueries({ queryKey: ['epf', 'transactions', 'all'] }); },
      onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
    });
  };

  const onAddDiv = (d: any) => {
    createTxMutation.mutate({
      transaction_type: 'dividend',
      epf_account_number: parseInt(d.epf_account_number) as 1 | 2 | 3,
      date: `${d.year}-12-31`,
      total_amount: parseFloat(d.total_amount),
      remarks: d.remarks ? `Rate: ${d.dividend_rate}% · ${d.remarks}` : `Rate: ${d.dividend_rate}%`,
    }, {
      onSuccess: () => { setAddDivOpen(false); divReset(); toast.success('Dividend added'); qc.invalidateQueries({ queryKey: ['epf', 'transactions', 'all'] }); },
      onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">EPF Tracker</h2>
        <p className="text-slate-400 text-sm mt-1">Employees Provident Fund — retirement savings tracker</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-slate-800 border border-slate-700">
          {['overview', 'transactions', 'dividends', 'analytics', 'calculators'].map((t) => (
            <TabsTrigger key={t} value={t} className="capitalize data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs sm:text-sm">
              {t}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="rounded-2xl border border-indigo-500/20 p-6 relative overflow-hidden" style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(15,23,42,0.95) 60%)'
          }}>
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Total EPF Balance</p>
            <p className="text-4xl font-black text-white">{balance(overview?.total ?? 0)}</p>
            {overview?.last_contribution && (
              <p className="text-xs text-slate-500 mt-2">Last contribution: {overview.last_contribution}</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {EPF_ACCOUNTS.map(({ num, label, pct, color }) => (
              <Card key={num} className="bg-slate-900 border-slate-800 rounded-2xl">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-slate-400">Account {num}</p>
                    <Badge variant="outline" className="text-xs border-slate-700 text-slate-500">{pct}</Badge>
                  </div>
                  <p className={`text-2xl font-black ${color}`}>{balance(overview?.balances?.[num] ?? 0)}</p>
                  <p className="text-xs text-slate-500 mt-1">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { txReset(); setAddTxOpen(true); }} className="bg-indigo-600 hover:bg-indigo-500 gap-2">
              <Plus size={16} /> Add Entry
            </Button>
          </div>
          {contributions.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="text-center py-12 text-slate-500">No contribution or withdrawal entries yet</CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {groupedContributions.map(({ month, items }) => (
                <div key={month}>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">{month}</p>
                  <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="pt-2 divide-y divide-slate-800">
                      {items.map((tx: any) => (
                        <div key={tx.id} className="flex justify-between items-center py-3">
                          <div>
                            <p className="text-sm text-slate-200 capitalize">
                              {tx.transaction_type}{tx.contribution_type ? ` · ${tx.contribution_type}` : ''}{tx.epf_account_number ? ` · Acc ${tx.epf_account_number}` : ' · All Accounts'}
                            </p>
                            <p className="text-xs text-slate-500">{formatDate(tx.date)}</p>
                            {tx.remarks && <p className="text-xs text-slate-600 mt-0.5">{tx.remarks}</p>}
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-bold text-indigo-400">+{balance(tx.total_amount)}</p>
                            <button onClick={() => setDeleteTxId(tx.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}

          <Sheet open={addTxOpen} onOpenChange={setAddTxOpen}>
            <SheetContent className="bg-slate-900 border-slate-800 text-white w-full sm:max-w-md overflow-y-auto">
              <SheetHeader><SheetTitle className="text-white">Add EPF Entry</SheetTitle></SheetHeader>
              <form onSubmit={txSubmit(onAddTx)} className="space-y-4 mt-6">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Entry Type</Label>
                  <Controller name="transaction_type" control={txCtrl} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="contribution">Contribution</SelectItem>
                        <SelectItem value="withdrawal">Withdrawal</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                </div>

                {txType === 'contribution' && (
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Contribution Type</Label>
                    <Controller name="contribution_type" control={txCtrl} render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                          <SelectItem value="mandatory">Mandatory (auto-splits 75/15/10)</SelectItem>
                          <SelectItem value="voluntary">Voluntary</SelectItem>
                        </SelectContent>
                      </Select>
                    )} />
                  </div>
                )}

                {txType === 'contribution' && contribType === 'mandatory' ? (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-slate-300">Employee Amount (RM)</Label>
                      <Input {...txReg('employee_amount', { required: true })} type="number" step="0.01" className="bg-slate-800 border-slate-700 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-300">Employer Amount (RM)</Label>
                      <Input {...txReg('employer_amount', { required: true })} type="number" step="0.01" className="bg-slate-800 border-slate-700 text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-slate-300">EPF Account</Label>
                      <Controller name="epf_account_number" control={txCtrl} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select account" /></SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            <SelectItem value="1">Account 1 — Akaun Persaraan</SelectItem>
                            <SelectItem value="2">Account 2 — Akaun Sejahtera</SelectItem>
                            <SelectItem value="3">Account 3 — Akaun Fleksibel</SelectItem>
                          </SelectContent>
                        </Select>
                      )} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-300">Amount (RM)</Label>
                      <Input {...txReg('total_amount', { required: true })} type="number" step="0.01" className="bg-slate-800 border-slate-700 text-white" />
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <Label className="text-slate-300">Date</Label>
                  <Input {...txReg('date', { required: true })} type="date" className="bg-slate-800 border-slate-700 text-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Remarks (optional)</Label>
                  <Textarea {...txReg('remarks')} className="bg-slate-800 border-slate-700 text-white" rows={2} />
                </div>
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500" disabled={createTxMutation.isPending}>
                  {createTxMutation.isPending ? 'Adding…' : 'Add Entry'}
                </Button>
              </form>
            </SheetContent>
          </Sheet>

          <ConfirmDialog
            open={!!deleteTxId}
            title="Delete entry?"
            description="This will remove the EPF entry and adjust balances."
            onConfirm={() => deleteTxMutation.mutate(deleteTxId!, {
              onSuccess: () => { setDeleteTxId(null); toast.success('Entry deleted'); qc.invalidateQueries({ queryKey: ['epf', 'transactions', 'all'] }); },
            })}
            onCancel={() => setDeleteTxId(null)}
            loading={deleteTxMutation.isPending}
          />
        </TabsContent>

        {/* Dividends Tab */}
        <TabsContent value="dividends" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { divReset(); setAddDivOpen(true); }} className="bg-indigo-600 hover:bg-indigo-500 gap-2">
              <Plus size={16} /> Add Dividend
            </Button>
          </div>
          {dividendEntries.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="text-center py-12 text-slate-500">No dividend entries yet. Add your annual EPF dividend.</CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {groupedDividends.map(({ year, items }) => (
                <div key={year}>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">{year}</p>
                  <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="pt-2 divide-y divide-slate-800">
                      {items.map((tx: any) => {
                        const rateMatch = tx.remarks?.match(/Rate:\s*([\d.]+)%/);
                        const rate = rateMatch ? rateMatch[1] : null;
                        const cleanRemarks = tx.remarks?.replace(/Rate:[\s\d.%]+·?\s*/, '').trim();
                        return (
                          <div key={tx.id} className="flex justify-between items-center py-3">
                            <div>
                              <p className="text-sm text-slate-200">Account {tx.epf_account_number} Dividend</p>
                              <p className="text-xs text-slate-500">
                                {cleanRemarks || formatDate(tx.date)}
                                {rate && <span className="ml-2 text-indigo-400 font-medium">{rate}% p.a.</span>}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="text-sm font-bold text-green-400">+{balance(tx.total_amount)}</p>
                              <button onClick={() => setDeleteDivId(tx.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}

          <Sheet open={addDivOpen} onOpenChange={setAddDivOpen}>
            <SheetContent className="bg-slate-900 border-slate-800 text-white w-full sm:max-w-md">
              <SheetHeader><SheetTitle className="text-white">Add EPF Dividend</SheetTitle></SheetHeader>
              <form onSubmit={divSubmit(onAddDiv)} className="space-y-4 mt-6">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">EPF Account</Label>
                  <select {...divReg('epf_account_number', { required: true })} className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm">
                    <option value="">Select account</option>
                    <option value="1">Account 1 — Akaun Persaraan ({balance(overview?.balances?.[1] ?? 0)})</option>
                    <option value="2">Account 2 — Akaun Sejahtera ({balance(overview?.balances?.[2] ?? 0)})</option>
                    <option value="3">Account 3 — Akaun Fleksibel ({balance(overview?.balances?.[3] ?? 0)})</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Year</Label>
                    <Input {...divReg('year', { required: true })} type="number" min={2000} max={2099} className="bg-slate-800 border-slate-700 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Dividend Rate (%)</Label>
                    <Input {...divReg('dividend_rate', { required: true })} type="number" step="0.01" placeholder="5.50" className="bg-slate-800 border-slate-700 text-white" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Dividend Amount (RM)</Label>
                  <Input {...divReg('total_amount', { required: true })} type="number" step="0.01" className="bg-slate-800 border-slate-700 text-white" />
                  <p className="text-xs text-slate-500">Auto-calculated from balance × rate. You can override.</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Remarks (optional)</Label>
                  <Input {...divReg('remarks')} placeholder="e.g. FY2024 annual dividend" className="bg-slate-800 border-slate-700 text-white" />
                </div>
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500" disabled={createTxMutation.isPending}>
                  {createTxMutation.isPending ? 'Adding…' : 'Add Dividend'}
                </Button>
              </form>
            </SheetContent>
          </Sheet>

          <ConfirmDialog
            open={!!deleteDivId}
            title="Delete dividend entry?"
            onConfirm={() => deleteTxMutation.mutate(deleteDivId!, {
              onSuccess: () => { setDeleteDivId(null); toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['epf', 'transactions', 'all'] }); },
            })}
            onCancel={() => setDeleteDivId(null)}
            loading={deleteTxMutation.isPending}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-4 space-y-4">
          <Card className="bg-slate-900 border-slate-800 rounded-2xl">
            <CardHeader><CardTitle className="text-sm text-slate-300">Balance Over Time</CardTitle></CardHeader>
            <CardContent>
              {balanceOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={balanceOverTime}>
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} formatter={(v: any) => formatRM(v)} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
                    <Line type="monotone" dataKey="account_1" stroke="#6366f1" strokeWidth={2} dot={false} name="Account 1" />
                    <Line type="monotone" dataKey="account_2" stroke="#a855f7" strokeWidth={2} dot={false} name="Account 2" />
                    <Line type="monotone" dataKey="account_3" stroke="#06b6d4" strokeWidth={2} dot={false} name="Account 3" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-slate-600 text-sm">
                  Add contributions to see balance trends
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 rounded-2xl">
            <CardHeader><CardTitle className="text-sm text-slate-300">Monthly Contributions by Account</CardTitle></CardHeader>
            <CardContent>
              {monthlyContribData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyContribData} barSize={10}>
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} formatter={(v: any) => formatRM(v)} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
                    <Bar dataKey="account_1" fill="#6366f1" radius={[3, 3, 0, 0]} name="Account 1" />
                    <Bar dataKey="account_2" fill="#a855f7" radius={[3, 3, 0, 0]} name="Account 2" />
                    <Bar dataKey="account_3" fill="#06b6d4" radius={[3, 3, 0, 0]} name="Account 3" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-slate-600 text-sm">
                  No contribution data yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calculators Tab */}
        <TabsContent value="calculators" className="mt-4 space-y-4">
          <Card className="bg-slate-900 border-slate-800 rounded-2xl">
            <CardHeader><CardTitle className="text-sm text-slate-300">Retirement Projection</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-400 text-xs">Current Age</Label>
                  <Input type="number" value={retCalc.current_age || ''} onChange={e => setRetCalc(p => ({ ...p, current_age: +e.target.value, }))} className="bg-slate-800 border-slate-700 text-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-400 text-xs">Retirement Age</Label>
                  <Input type="number" value={retCalc.retirement_age} onChange={e => setRetCalc(p => ({ ...p, retirement_age: +e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-400 text-xs">Current Balance (RM)</Label>
                  <Input type="number" step="0.01" value={retCalc.current_balance || ''} onChange={e => setRetCalc(p => ({ ...p, current_balance: +e.target.value }))} className="bg-slate-800 border-slate-700 text-white" placeholder={String(overview?.total ?? 0)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-400 text-xs">Monthly Contribution (RM)</Label>
                  <Input type="number" step="0.01" value={retCalc.monthly_contribution || ''} onChange={e => setRetCalc(p => ({ ...p, monthly_contribution: +e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-slate-400 text-xs">Annual Dividend Rate (%)</Label>
                  <Input type="number" step="0.1" value={retCalc.annual_dividend_rate} onChange={e => setRetCalc(p => ({ ...p, annual_dividend_rate: +e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
                </div>
              </div>
              <Button onClick={() => setRetSubmitted(true)} className="bg-indigo-600 hover:bg-indigo-500 w-full" disabled={retFetching}>
                {retFetching ? 'Calculating…' : 'Calculate'}
              </Button>

              {(retResult || retChartData.length > 0) && (
                <div className="space-y-4">
                  <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-4 space-y-2">
                    <p className="text-xs text-slate-400">Projected EPF at retirement</p>
                    <p className="text-3xl font-black text-white">{formatRM((retResult as any)?.projected_balance ?? retChartData[retChartData.length - 1]?.balance ?? 0)}</p>
                    <p className="text-xs text-slate-500">
                      {(retResult as any)?.years_to_retirement ?? (retCalc.retirement_age - retCalc.current_age)} years to retirement
                    </p>
                  </div>

                  {retChartData.length > 1 && (
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400">Balance Growth Projection</CardTitle></CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={180}>
                          <LineChart data={retChartData}>
                            <XAxis dataKey="age" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Age', position: 'insideRight', fill: '#64748b', fontSize: 10 }} />
                            <YAxis hide />
                            <Tooltip
                              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                              formatter={(v: any) => formatRM(v)}
                              labelFormatter={(v) => `Age ${v}`}
                            />
                            <Line type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
