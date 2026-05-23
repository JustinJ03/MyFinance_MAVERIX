'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api';
import { formatRM, formatDate } from '@/lib/formatters';
import { useUiStore } from '@/store/uiStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { Plus, CheckCircle, XCircle, ArrowLeftRight, TrendingDown, TrendingUp } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function TransactionsPage() {
  const qc = useQueryClient();
  const { balanceVisible } = useUiStore();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get('status') === 'pending' ? 'pending' : 'all');
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, control, reset, watch } = useForm();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', filter],
    queryFn: () => {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      return api.get(`/transactions${params}`).then((r) => r.data.data ?? []);
    },
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts').then((r) => r.data.data),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/transactions', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      setOpen(false); reset();
      toast.success('Transaction added!');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/transactions/${id}/confirm`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Transaction confirmed');
    },
  });

  const skipMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/transactions/${id}/skip`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction skipped');
    },
  });

  const txType = watch('type');
  const balance = (v: number) => balanceVisible ? formatRM(v) : 'RM •••••';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Transactions</h2>
          <p className="text-slate-400 text-sm mt-1">Track your income and expenses</p>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
              <Plus size={16} /> Add Transaction
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-slate-900 border-slate-800 text-white w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-white">Add Transaction</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleSubmit((d) => createMutation.mutate({ ...d, amount: parseFloat(d.amount) }))} className="space-y-4 mt-6">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Type</Label>
                <Controller name="type" control={control} rules={{ required: true }} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="expense / income / transfer" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="expense">💸 Expense</SelectItem>
                      <SelectItem value="income">💰 Income</SelectItem>
                      <SelectItem value="transfer">↔️ Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Description</Label>
                <Input {...register('name', { required: true })} placeholder="e.g. Grocery shopping"
                  className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Amount (RM)</Label>
                <Input {...register('amount', { required: true })} type="number" step="0.01" placeholder="0.00"
                  className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Account</Label>
                <Controller name="account_id" control={control} rules={{ required: true }} render={({ field }) => (
                  <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      {accounts.map((a: any) => <SelectItem key={a.id} value={a.id.toString()}>{a.nickname}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Date</Label>
                <Input {...register('actual_date', { required: true })} type="date"
                  className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Remarks (optional)</Label>
                <Textarea {...register('remarks')} placeholder="Any notes..."
                  className="bg-slate-800 border-slate-700 text-white" rows={2} />
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Adding…' : 'Add Transaction'}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="bg-slate-800 border border-slate-700">
          {['all', 'pending', 'expense', 'income'].map((f) => (
            <TabsTrigger key={f} value={f} className="capitalize data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              {f}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Transaction List */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-4 divide-y divide-slate-800">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No transactions found</div>
          ) : transactions.map((tx: any) => (
            <div key={tx.id} className="flex items-center gap-3 py-3">
              <div className={`p-2 rounded-lg ${tx.type === 'income' ? 'bg-green-500/10' : tx.type === 'transfer' ? 'bg-blue-500/10' : 'bg-red-500/10'}`}>
                {tx.type === 'income' ? <TrendingUp size={16} className="text-green-400" /> :
                 tx.type === 'transfer' ? <ArrowLeftRight size={16} className="text-blue-400" /> :
                 <TrendingDown size={16} className="text-red-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-100 truncate">{tx.name}</p>
                <p className="text-xs text-slate-500">{tx.category?.name ?? '—'} · {formatDate(tx.actual_date)}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.type === 'income' ? '+' : '-'}{balance(tx.amount)}
                </p>
                {tx.status === 'pending' && (
                  <div className="flex gap-1 mt-1 justify-end">
                    <button onClick={() => confirmMutation.mutate(tx.id)} className="text-green-500 hover:text-green-400">
                      <CheckCircle size={14} />
                    </button>
                    <button onClick={() => skipMutation.mutate(tx.id)} className="text-slate-500 hover:text-slate-300">
                      <XCircle size={14} />
                    </button>
                  </div>
                )}
                {tx.status !== 'pending' && (
                  <Badge variant="outline" className={`text-[10px] mt-1 ${tx.status === 'confirmed' ? 'border-green-700 text-green-500' : 'border-slate-700 text-slate-500'}`}>
                    {tx.status}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
