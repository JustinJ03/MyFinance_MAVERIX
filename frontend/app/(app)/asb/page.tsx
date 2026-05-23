'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useUiStore } from '@/store/uiStore';
import { formatRM, formatDate } from '@/lib/formatters';
import {
  useAsbFunds, useCreateAsbFund, useDeleteAsbFund,
  useAsbTransactions, useCreateAsbTransaction, useDeleteAsbTransaction,
  useAsbDividends, useCreateAsbDividend, useDeleteAsbDividend,
  useAsbCalculator,
} from '@/hooks/useAsb';
import type { AsbFund, AsbFundName } from '@/types/asb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Plus, Trash2, PiggyBank } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const FUND_LABELS: Record<string, string> = {
  ASB: 'Amanah Saham Bumiputera',
  ASB2: 'Amanah Saham Bumiputera 2',
  ASM: 'Amanah Saham Malaysia',
  ASM2_Wawasan: 'ASM 2 Wawasan',
  ASM3: 'Amanah Saham Malaysia 3',
};

const ALL_FUNDS: AsbFundName[] = ['ASB', 'ASB2', 'ASM', 'ASM2_Wawasan', 'ASM3'];

// ─── Calculator sub-components ────────────────────────────────────────────────

type CalcParams = { current_balance: number; monthly_topup: number; annual_dividend_rate: number; years: number };

function AsbCalcResults({ fundId, params }: { fundId: number; params: CalcParams }) {
  const { data, isLoading } = useAsbCalculator(fundId, params);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Projected Balance', value: data.projected_balance, color: 'text-indigo-400' },
          { label: 'Total Top-ups', value: data.total_topups, color: 'text-green-400' },
          { label: 'Total Dividends', value: data.total_dividends, color: 'text-purple-400' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="bg-slate-900 border-slate-800">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className={`text-base font-bold ${color}`}>{formatRM(value ?? 0)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {data.yearly_projections?.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300">Growth Over {params.years} Years</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.yearly_projections}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => formatRM(v)}
                />
                <Line type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AsbCalculatorPanel({ fund }: { fund: AsbFund }) {
  const [submitted, setSubmitted] = useState(false);
  const [calcParams, setCalcParams] = useState<CalcParams>({ current_balance: 0, monthly_topup: 0, annual_dividend_rate: 0, years: 0 });
  const [form, setForm] = useState<CalcParams>({
    current_balance: fund.units_held,
    monthly_topup: 100,
    annual_dividend_rate: 5.5,
    years: 10,
  });

  const handleCalculate = () => {
    if (!form.current_balance && form.current_balance !== 0) return;
    setCalcParams({ ...form });
    setSubmitted(true);
  };

  const field = (key: keyof CalcParams, label: string, step = '1') => (
    <div className="space-y-1.5">
      <Label className="text-slate-400 text-xs">{label}</Label>
      <Input
        type="number"
        step={step}
        value={form[key]}
        onChange={(e) => setForm((prev) => ({ ...prev, [key]: +e.target.value }))}
        className="bg-slate-800 border-slate-700 text-white h-9"
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-300">Growth Projection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {field('current_balance', 'Current Balance (RM)', '0.01')}
            {field('monthly_topup', 'Monthly Top-up (RM)', '0.01')}
            {field('annual_dividend_rate', 'Annual Dividend Rate (%)', '0.01')}
            {field('years', 'Projection (Years)')}
          </div>
          <Button onClick={handleCalculate} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-10">
            Calculate Projection
          </Button>
        </CardContent>
      </Card>
      {submitted && <AsbCalcResults fundId={fund.id} params={calcParams} />}
    </div>
  );
}

// ─── Dividends sub-component ──────────────────────────────────────────────────

const divSchema = z.object({
  year: z.number().int().min(2000).max(2099),
  dividend_rate: z.number().min(0).max(100),
  dividend_amount: z.number().min(0),
  bonus_rate: z.number().min(0).max(100).optional(),
  bonus_amount: z.number().min(0).optional(),
});
type DivForm = z.infer<typeof divSchema>;

function AsbDividendsTab({ fund }: { fund: AsbFund }) {
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: dividends = [] } = useAsbDividends(fund.id);
  const createDividend = useCreateAsbDividend(fund.id);
  const deleteDividend = useDeleteAsbDividend(fund.id);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DivForm>({
    resolver: zodResolver(divSchema),
    defaultValues: { year: new Date().getFullYear() - 1, dividend_rate: 5.5, dividend_amount: 0 },
  });

  const onAdd = (data: DivForm) => {
    createDividend.mutate(data, {
      onSuccess: () => { toast.success('Dividend added'); reset(); setAddOpen(false); },
      onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to add dividend'),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAddOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white">
          <Plus size={15} className="mr-1.5" /> Add Dividend
        </Button>
      </div>

      {dividends.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-sm">No dividends recorded yet</div>
      ) : (
        <Card className="bg-slate-900 border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Year', 'Div Rate', 'Dividend', 'Bonus', 'Total Payout', ''].map((h) => (
                    <th key={h} className={`px-4 py-3 text-xs text-slate-500 font-medium ${h === '' || h === 'Year' ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {(dividends as any[]).map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-slate-200 font-medium">{d.year}</td>
                    <td className="px-4 py-3 text-right text-indigo-400">{d.dividend_rate}%</td>
                    <td className="px-4 py-3 text-right text-slate-300">{formatRM(d.dividend_amount)}</td>
                    <td className="px-4 py-3 text-right text-slate-400">
                      {d.bonus_amount ? `${formatRM(d.bonus_amount)} (${d.bonus_rate}%)` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-green-400 font-semibold">{formatRM(d.total_payout)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(d.id)}
                        className="w-7 h-7 text-slate-500 hover:text-red-400 hover:bg-red-500/10">
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="bg-slate-900 border-slate-800 text-white w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-white">Add Dividend — {fund.fund_name}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit(onAdd)} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-400 text-sm">Year</Label>
                <Input type="number" {...register('year', { valueAsNumber: true })}
                  className="bg-slate-800 border-slate-700 text-white" />
                {errors.year && <p className="text-red-400 text-xs">{errors.year.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-400 text-sm">Dividend Rate (%)</Label>
                <Input type="number" step="0.0001" {...register('dividend_rate', { valueAsNumber: true })}
                  className="bg-slate-800 border-slate-700 text-white" />
                {errors.dividend_rate && <p className="text-red-400 text-xs">{errors.dividend_rate.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-400 text-sm">Dividend Amount (RM)</Label>
              <Input type="number" step="0.01" {...register('dividend_amount', { valueAsNumber: true })}
                className="bg-slate-800 border-slate-700 text-white" />
              {errors.dividend_amount && <p className="text-red-400 text-xs">{errors.dividend_amount.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-400 text-sm">Bonus Rate <span className="text-slate-600 text-xs">(optional)</span></Label>
                <Input type="number" step="0.0001" {...register('bonus_rate', { valueAsNumber: true })}
                  className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-400 text-sm">Bonus Amount <span className="text-slate-600 text-xs">(optional)</span></Label>
                <Input type="number" step="0.01" {...register('bonus_amount', { valueAsNumber: true })}
                  className="bg-slate-800 border-slate-700 text-white" />
              </div>
            </div>
            <Button type="submit" disabled={createDividend.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-10 mt-2">
              {createDividend.isPending ? 'Saving...' : 'Add Dividend'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Dividend"
        description="This will permanently remove this dividend record."
        onConfirm={() => {
          if (deleteId === null) return;
          deleteDividend.mutate(deleteId, {
            onSuccess: () => { toast.success('Dividend deleted'); setDeleteId(null); },
            onError: () => { toast.error('Failed to delete'); setDeleteId(null); },
          });
        }}
        onCancel={() => setDeleteId(null)}
        loading={deleteDividend.isPending}
      />
    </div>
  );
}

// ─── Transactions sub-component ───────────────────────────────────────────────

const txSchema = z.object({
  transaction_type: z.enum(['deposit', 'withdrawal']),
  date: z.string().min(1, 'Date is required'),
  amount: z.number().min(0.01, 'Amount must be positive'),
  remarks: z.string().optional(),
});
type TxForm = z.infer<typeof txSchema>;

function AsbTransactionsTab({ fund }: { fund: AsbFund }) {
  const { balanceVisible } = useUiStore();
  const bal = (v: number) => balanceVisible ? formatRM(v) : 'RM •••••';
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: transactions = [] } = useAsbTransactions(fund.id);
  const createTx = useCreateAsbTransaction(fund.id);
  const deleteTx = useDeleteAsbTransaction(fund.id);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TxForm>({
    resolver: zodResolver(txSchema),
    defaultValues: {
      transaction_type: 'deposit',
      date: new Date().toISOString().slice(0, 10),
      amount: 0,
    },
  });

  const onAdd = (data: TxForm) => {
    createTx.mutate(data, {
      onSuccess: () => { toast.success('Transaction added'); reset(); setAddOpen(false); },
      onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to add transaction'),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAddOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white">
          <Plus size={15} className="mr-1.5" /> Add Transaction
        </Button>
      </div>

      {transactions.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-sm">No transactions recorded yet</div>
      ) : (
        <Card className="bg-slate-900 border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Date', 'Type', 'Amount', 'Remarks', ''].map((h, i) => (
                    <th key={i} className={`px-4 py-3 text-xs text-slate-500 font-medium ${h === 'Amount' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {(transactions as any[]).map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(tx.date)}</td>
                    <td className="px-4 py-3">
                      <Badge className={tx.transaction_type === 'deposit'
                        ? 'bg-green-500/15 text-green-400 border-green-500/30 text-xs'
                        : 'bg-red-500/15 text-red-400 border-red-500/30 text-xs'}>
                        {tx.transaction_type}
                      </Badge>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold tabular-nums ${tx.transaction_type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.transaction_type === 'deposit' ? '+' : '-'}{bal(tx.amount)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{tx.remarks ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(tx.id)}
                        className="w-7 h-7 text-slate-500 hover:text-red-400 hover:bg-red-500/10">
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="bg-slate-900 border-slate-800 text-white w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-white">Add Transaction — {fund.fund_name}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit(onAdd)} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-slate-400 text-sm">Type</Label>
              <select {...register('transaction_type')}
                className="w-full h-10 rounded-lg bg-slate-800 border border-slate-700 text-white px-3 text-sm focus:border-indigo-500 focus:outline-none">
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-400 text-sm">Date</Label>
              <Input type="date" {...register('date')}
                className="bg-slate-800 border-slate-700 text-white" />
              {errors.date && <p className="text-red-400 text-xs">{errors.date.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-400 text-sm">Amount (RM)</Label>
              <Input type="number" step="0.01" {...register('amount', { valueAsNumber: true })}
                className="bg-slate-800 border-slate-700 text-white" />
              {errors.amount && <p className="text-red-400 text-xs">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-400 text-sm">Remarks <span className="text-slate-600 text-xs">(optional)</span></Label>
              <Input {...register('remarks')} placeholder="e.g. Annual top-up"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600" />
            </div>
            <Button type="submit" disabled={createTx.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-10 mt-2">
              {createTx.isPending ? 'Saving...' : 'Add Transaction'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Transaction"
        description="This will permanently remove this transaction."
        onConfirm={() => {
          if (deleteId === null) return;
          deleteTx.mutate(deleteId, {
            onSuccess: () => { toast.success('Transaction deleted'); setDeleteId(null); },
            onError: () => { toast.error('Failed to delete'); setDeleteId(null); },
          });
        }}
        onCancel={() => setDeleteId(null)}
        loading={deleteTx.isPending}
      />
    </div>
  );
}

// ─── Per-fund panel (inner tabs) ──────────────────────────────────────────────

function AsbFundPanel({ fund, onDeleteFund }: { fund: AsbFund & { is_near_ceiling?: boolean; remaining_units?: number }; onDeleteFund: (id: number) => void }) {
  const { balanceVisible } = useUiStore();
  const bal = (v: number) => balanceVisible ? formatRM(v) : 'RM •••••';

  return (
    <div className="space-y-4">
      {/* Hero card */}
      <div className="rounded-2xl border border-purple-500/20 p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(147,51,234,0.15) 0%, rgba(15,23,42,0.95) 60%)' }}>
        <div className="pointer-events-none absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #9333ea 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-widest font-medium mb-1">
              {FUND_LABELS[fund.fund_name] ?? fund.fund_name}
            </p>
            <p className="text-4xl font-black text-white tracking-tight">{bal(fund.units_held)}</p>
            <p className="text-xs text-slate-500 mt-1">{fund.units_held.toLocaleString()} units @ RM 1.00/unit</p>
          </div>
          <div className="flex items-center gap-2">
            {fund.is_near_ceiling && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 shrink-0">Near ceiling</Badge>
            )}
            <Button variant="ghost" size="icon" onClick={() => onDeleteFund(fund.id)}
              className="w-8 h-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10 shrink-0">
              <Trash2 size={15} />
            </Button>
          </div>
        </div>
        {fund.remaining_units !== undefined && (
          <div className="mt-4 bg-slate-800/60 rounded-xl px-4 py-2.5 inline-flex items-center gap-3">
            <span className="text-xs text-slate-500">Remaining capacity</span>
            <span className="text-sm font-semibold text-slate-200">{bal(fund.remaining_units)}</span>
          </div>
        )}
      </div>

      {/* Inner tabs */}
      <Tabs defaultValue="transactions">
        <TabsList className="bg-slate-800/60 border border-slate-700/60">
          <TabsTrigger value="transactions"
            className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 text-xs">
            Transactions
          </TabsTrigger>
          <TabsTrigger value="dividends"
            className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 text-xs">
            Dividends
          </TabsTrigger>
          <TabsTrigger value="calculator"
            className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 text-xs">
            Calculator
          </TabsTrigger>
        </TabsList>
        <TabsContent value="transactions" className="mt-4">
          <AsbTransactionsTab fund={fund} />
        </TabsContent>
        <TabsContent value="dividends" className="mt-4">
          <AsbDividendsTab fund={fund} />
        </TabsContent>
        <TabsContent value="calculator" className="mt-4">
          <AsbCalculatorPanel fund={fund} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const fundSchema = z.object({
  fund_name: z.enum(['ASB', 'ASB2', 'ASM', 'ASM2_Wawasan', 'ASM3']),
  units_held: z.number().min(0).optional(),
});
type FundForm = z.infer<typeof fundSchema>;

export default function AsbPage() {
  const [addFundOpen, setAddFundOpen] = useState(false);
  const [deleteFundId, setDeleteFundId] = useState<number | null>(null);

  const { data: funds = [], isLoading } = useAsbFunds();
  const createFund = useCreateAsbFund();
  const deleteFund = useDeleteAsbFund();

  const registeredNames = (funds as AsbFund[]).map((f) => f.fund_name);
  const availableFunds = ALL_FUNDS.filter((f) => !registeredNames.includes(f));

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FundForm>({
    resolver: zodResolver(fundSchema),
    defaultValues: { units_held: 0 },
  });

  const onAddFund = (data: FundForm) => {
    createFund.mutate(data, {
      onSuccess: () => { toast.success(`${data.fund_name} fund added`); reset(); setAddFundOpen(false); },
      onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to add fund'),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">ASB / ASNB Tracker</h2>
        {availableFunds.length > 0 && (
          <Button size="sm" onClick={() => setAddFundOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white">
            <Plus size={15} className="mr-1.5" /> Add Fund
          </Button>
        )}
      </div>

      {funds.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <PiggyBank size={28} className="text-purple-400" />
          </div>
          <p className="font-semibold text-slate-300 mb-1">No ASB funds registered</p>
          <p className="text-sm text-slate-500 mb-6">Add your ASNB funds to start tracking your unit trust investments.</p>
          <Button onClick={() => setAddFundOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white">
            <Plus size={15} className="mr-1.5" /> Add Your First Fund
          </Button>
        </div>
      ) : (
        <Tabs defaultValue={(funds as AsbFund[])[0]?.fund_name}>
          <TabsList className="bg-slate-800 border border-slate-700 h-auto flex-wrap">
            {(funds as AsbFund[]).map((f) => (
              <TabsTrigger key={f.fund_name} value={f.fund_name}
                className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400">
                {f.fund_name}
              </TabsTrigger>
            ))}
          </TabsList>
          {(funds as AsbFund[]).map((fund) => (
            <TabsContent key={fund.fund_name} value={fund.fund_name} className="mt-4">
              <AsbFundPanel
                fund={fund as any}
                onDeleteFund={(id) => setDeleteFundId(id)}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Add Fund Sheet */}
      <Sheet open={addFundOpen} onOpenChange={setAddFundOpen}>
        <SheetContent className="bg-slate-900 border-slate-800 text-white w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-white">Add ASB / ASNB Fund</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit(onAddFund)} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-slate-400 text-sm">Fund</Label>
              <select {...register('fund_name')}
                className="w-full h-10 rounded-lg bg-slate-800 border border-slate-700 text-white px-3 text-sm focus:border-indigo-500 focus:outline-none">
                {availableFunds.map((f) => (
                  <option key={f} value={f}>{f} — {FUND_LABELS[f]}</option>
                ))}
              </select>
              {errors.fund_name && <p className="text-red-400 text-xs">{errors.fund_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-400 text-sm">Current Units Held <span className="text-slate-600 text-xs">(optional)</span></Label>
              <Input type="number" step="0.01" {...register('units_held', { valueAsNumber: true })} placeholder="0"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600" />
              <p className="text-xs text-slate-600">For ASB/ASB2: 1 unit = RM 1.00</p>
            </div>
            <Button type="submit" disabled={createFund.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-10 mt-2">
              {createFund.isPending ? 'Adding...' : 'Add Fund'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Fund Confirm */}
      <ConfirmDialog
        open={deleteFundId !== null}
        title="Delete Fund"
        description="This will permanently delete the fund and all its transactions and dividends."
        onConfirm={() => {
          if (deleteFundId === null) return;
          deleteFund.mutate(deleteFundId, {
            onSuccess: () => { toast.success('Fund deleted'); setDeleteFundId(null); },
            onError: () => { toast.error('Failed to delete fund'); setDeleteFundId(null); },
          });
        }}
        onCancel={() => setDeleteFundId(null)}
        loading={deleteFund.isPending}
      />
    </div>
  );
}
