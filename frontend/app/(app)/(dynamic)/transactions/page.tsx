'use client';

export const dynamic = 'force-dynamic';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import api from '@/lib/api';
import { formatRM, formatDate } from '@/lib/formatters';
import { useUiStore } from '@/store/uiStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { Plus, CheckCircle, XCircle, ArrowLeftRight, TrendingDown, TrendingUp, Pencil, Trash2, Paperclip, Eye, ExternalLink } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import ConfirmDialog from '@/components/common/ConfirmDialog';

async function openAuthFile(url: string) {
  try {
    const res = await api.get(url, { responseType: 'blob' });
    const blobUrl = URL.createObjectURL(res.data);
    window.open(blobUrl, '_blank');
  } catch {
    // handled by caller
    throw new Error('Failed to open file');
  }
}

function groupByMonth(txs: any[]) {
  const map = new Map<string, any[]>();
  for (const tx of txs) {
    const d = tx.actual_date ? new Date(tx.actual_date) : new Date();
    const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(tx);
  }
  return Array.from(map.entries()).map(([month, items]) => ({ month, items }));
}

export default function TransactionsPage() {
  const qc = useQueryClient();
  const { balanceVisible } = useUiStore();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get('status') === 'pending' ? 'pending' : 'all');
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const { register, handleSubmit, control, reset, watch } = useForm();
  const { register: editReg, handleSubmit: editSubmit, control: editCtrl, reset: editReset } = useForm();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', filter],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (filter === 'pending') params.status = 'pending';
      else if (filter === 'expense' || filter === 'income') params.type = filter;
      return api.get('/transactions', { params }).then((r) => r.data.data ?? []);
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

  const { data: asbFunds = [] } = useQuery({
    queryKey: ['asb'],
    queryFn: () => api.get('/asb').then((r) => r.data.data ?? []),
  });

  const txType = watch('type');

  const groupedCategories = useMemo(() => {
    if (!txType || txType === 'transfer') return [];
    const parents = categories.filter((c: any) => c.type === txType && !c.parent_id);
    const children = categories.filter((c: any) => c.type === txType && c.parent_id);
    return parents
      .map((p: any) => ({
        parent: p,
        children: children.filter((c: any) => c.parent?.id === p.id || c.parent_id === p.id),
      }))
      .filter((g: any) => g.children.length > 0);
  }, [categories, txType]);

  const watchedCategoryId = watch('category_id');
  const selectedCategory = categories.find((c: any) => c.id === parseInt(watchedCategoryId));
  const isEpfCategory = selectedCategory?.name?.toLowerCase().includes('epf');
  const isAsbCategory = selectedCategory?.name?.toLowerCase().includes('asb');

  const grouped = useMemo(() => groupByMonth(transactions), [transactions]);

  const createMutation = useMutation({
    mutationFn: (d: any) => {
      if (d.receipt instanceof File) {
        const fd = new FormData();
        Object.entries(d).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            fd.append(k, v instanceof File ? v : String(v));
          }
        });
        return api.post('/transactions', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      return api.post('/transactions', d);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['budgets'] });
      setOpen(false); reset();
      toast.success('Transaction added!');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, receipt, ...d }: any) => {
      const res = await api.put(`/transactions/${id}`, d);
      if (receipt instanceof File) {
        const fd = new FormData();
        fd.append('receipt', receipt);
        await api.post(`/transactions/${id}/receipt`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['budgets'] });
      setEditOpen(false);
      toast.success('Transaction updated');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/transactions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['budgets'] });
      setDeleteOpen(false);
      toast.success('Transaction deleted');
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

  const openEdit = (tx: any) => {
    setSelectedTx(tx);
    editReset({
      name: tx.name,
      amount: tx.amount,
      category_id: tx.category_id ?? '',
      account_id: tx.account_id,
      actual_date: tx.actual_date,
      remarks: tx.remarks ?? '',
    });
    setEditOpen(true);
  };

  const openView = (tx: any) => {
    setSelectedTx(tx);
    setViewOpen(true);
  };

  const balance = (v: number) => balanceVisible ? formatRM(v) : 'RM •••••';

  const typeIcon = (tx: any) => {
    if (tx.type === 'income') return <TrendingUp size={16} className="text-green-400" />;
    if (tx.type === 'transfer') return <ArrowLeftRight size={16} className="text-blue-400" />;
    return <TrendingDown size={16} className="text-red-400" />;
  };

  const typeBg = (tx: any) => {
    if (tx.type === 'income') return 'bg-green-500/10';
    if (tx.type === 'transfer') return 'bg-blue-500/10';
    return 'bg-red-500/10';
  };

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
            <form onSubmit={handleSubmit((d) => {
              const payload: any = { ...d, amount: parseFloat(d.amount) };
              if (d.receipt instanceof FileList && d.receipt.length > 0) {
                payload.receipt = d.receipt[0];
              } else {
                delete payload.receipt;
              }
              createMutation.mutate(payload);
            })} className="space-y-4 mt-6">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Type</Label>
                <Controller name="type" control={control} rules={{ required: true }} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="expense / income / transfer" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
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

              {txType !== 'transfer' && (
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Category</Label>
                  <Controller name="category_id" control={control} render={({ field }) => (
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Select category (optional)" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white max-h-60 overflow-y-auto">
                        {groupedCategories.map((g: any) => (
                          <SelectGroup key={g.parent.id}>
                            <SelectLabel className="text-slate-500 text-xs px-2">{g.parent.name}</SelectLabel>
                            {g.children.map((c: any) => (
                              <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
              )}

              {txType === 'transfer' && (
                <div className="space-y-1.5">
                  <Label className="text-slate-300">To Account</Label>
                  <Controller name="to_account_id" control={control} rules={{ required: txType === 'transfer' }} render={({ field }) => (
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Destination account" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        {accounts.map((a: any) => <SelectItem key={a.id} value={a.id.toString()}>{a.nickname}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
              )}

              {isEpfCategory && (
                <div className="space-y-1.5">
                  <Label className="text-slate-300">EPF Account</Label>
                  <Controller name="epf_account_number" control={control} render={({ field }) => (
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Select EPF account" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="1">Account 1 — Akaun Persaraan</SelectItem>
                        <SelectItem value="2">Account 2 — Akaun Sejahtera</SelectItem>
                        <SelectItem value="3">Account 3 — Akaun Fleksibel</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                </div>
              )}

              {isAsbCategory && asbFunds.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-slate-300">ASB Fund</Label>
                  <Controller name="asb_fund_id" control={control} render={({ field }) => (
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Select ASB fund" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        {asbFunds.map((f: any) => <SelectItem key={f.id} value={f.id.toString()}>{f.fund_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-slate-300">Remarks (optional)</Label>
                <Textarea {...register('remarks')} placeholder="Any notes..."
                  className="bg-slate-800 border-slate-700 text-white" rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 flex items-center gap-1.5"><Paperclip size={13} /> Receipt (optional, max 15 MB)</Label>
                <input
                  {...register('receipt')}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="w-full text-sm text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                />
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

      {/* Transaction List — grouped by month */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="text-center py-12 text-slate-500">No transactions found</CardContent>
          </Card>
        ) : grouped.map(({ month, items }) => (
          <div key={month}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">{month}</p>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-2 divide-y divide-slate-800">
                {items.map((tx: any) => (
                  <div key={tx.id} className="flex items-center gap-3 py-3">
                    <div className={`p-2 rounded-lg ${typeBg(tx)}`}>
                      {typeIcon(tx)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-100 truncate">{tx.name}</p>
                      <p className="text-xs text-slate-500">{tx.category?.name ?? '—'} · {formatDate(tx.actual_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${tx.type === 'income' ? 'text-green-400' : tx.type === 'transfer' ? 'text-blue-400' : 'text-red-400'}`}>
                        {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '' : '-'}{balance(tx.amount)}
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
                      <div className="flex gap-1 mt-1 justify-end">
                        <button onClick={() => openView(tx)} className="text-slate-500 hover:text-indigo-400 transition-colors" title="View details">
                          <Eye size={13} />
                        </button>
                        <button onClick={() => openEdit(tx)} className="text-slate-500 hover:text-indigo-400 transition-colors" title="Edit">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => { setSelectedTx(tx); setDeleteOpen(true); }} className="text-slate-500 hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* View Transaction Detail Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTx && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${typeBg(selectedTx)}`}>
                  {typeIcon(selectedTx)}
                </div>
                <div>
                  <p className="font-semibold text-slate-100">{selectedTx.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{selectedTx.type}</p>
                </div>
              </div>
              <Separator className="bg-slate-800" />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500 text-xs mb-0.5">Amount</p>
                  <p className={`font-bold text-base ${selectedTx.type === 'income' ? 'text-green-400' : selectedTx.type === 'transfer' ? 'text-blue-400' : 'text-red-400'}`}>
                    {selectedTx.type === 'income' ? '+' : selectedTx.type === 'transfer' ? '' : '-'}{balance(selectedTx.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-0.5">Date</p>
                  <p className="text-slate-200">{formatDate(selectedTx.actual_date)}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-0.5">Status</p>
                  <Badge variant="outline" className={`text-[11px] ${selectedTx.status === 'confirmed' ? 'border-green-700 text-green-500' : selectedTx.status === 'pending' ? 'border-yellow-700 text-yellow-400' : 'border-slate-700 text-slate-400'}`}>
                    {selectedTx.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-0.5">Category</p>
                  <p className="text-slate-200">{selectedTx.category?.name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-0.5">Account</p>
                  <p className="text-slate-200">{selectedTx.account?.nickname ?? '—'}</p>
                </div>
                {selectedTx.to_account && (
                  <div>
                    <p className="text-slate-500 text-xs mb-0.5">To Account</p>
                    <p className="text-slate-200">{selectedTx.to_account?.nickname ?? '—'}</p>
                  </div>
                )}
              </div>
              {selectedTx.remarks && (
                <div>
                  <p className="text-slate-500 text-xs mb-0.5">Remarks</p>
                  <p className="text-slate-300 text-sm bg-slate-800 rounded-lg px-3 py-2">{selectedTx.remarks}</p>
                </div>
              )}
              {selectedTx.attachment_path && (
                <div>
                  <p className="text-slate-500 text-xs mb-1.5">Receipt</p>
                  <button
                    onClick={async () => {
                      try {
                        await openAuthFile(`/transactions/${selectedTx.id}/receipt`);
                      } catch {
                        toast.error('Failed to open receipt');
                      }
                    }}
                    className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2 transition-colors"
                  >
                    <Paperclip size={14} />
                    View Receipt
                    <ExternalLink size={12} />
                  </button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="bg-slate-900 border-slate-800 text-white w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white">Edit Transaction</SheetTitle>
          </SheetHeader>
          <form onSubmit={editSubmit((d) => {
            const payload: any = { id: selectedTx?.id, ...d, amount: parseFloat(d.amount) };
            if (d.editReceipt instanceof FileList && d.editReceipt.length > 0) {
              payload.receipt = d.editReceipt[0];
            }
            delete payload.editReceipt;
            updateMutation.mutate(payload);
          })} className="space-y-4 mt-6">
            <div className="space-y-1.5">
              <Label className="text-slate-300">Description</Label>
              <Input {...editReg('name', { required: true })} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Amount (RM)</Label>
              <Input {...editReg('amount', { required: true })} type="number" step="0.01" className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Date</Label>
              <Input {...editReg('actual_date', { required: true })} type="date" className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Remarks</Label>
              <Textarea {...editReg('remarks')} className="bg-slate-800 border-slate-700 text-white" rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 flex items-center gap-1.5">
                <Paperclip size={13} /> Replace Receipt <span className="text-slate-600 text-xs">(optional)</span>
              </Label>
              {selectedTx?.attachment_path && (
                <p className="text-xs text-slate-500">Current receipt attached — select a new file to replace it</p>
              )}
              <input
                {...editReg('editReceipt')}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="w-full text-sm text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-700 file:text-white hover:file:bg-slate-600 cursor-pointer bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
              />
            </div>
            <p className="text-xs text-slate-500">Type: <span className="capitalize text-slate-400">{selectedTx?.type}</span> (cannot change)</p>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete transaction?"
        description="This will reverse any balance effect on your account."
        onConfirm={() => deleteMutation.mutate(selectedTx?.id)}
        onCancel={() => setDeleteOpen(false)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
