'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatRM, formatDate } from '@/lib/formatters';
import { useUiStore } from '@/store/uiStore';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { Plus, Archive, RotateCcw, CreditCard, ExternalLink, Pencil } from 'lucide-react';
import Link from 'next/link';
import { BANK_NAMES, ACCOUNT_TYPES, ACCOUNT_COLORS } from '@/lib/constants';

const TYPE_ICONS: Record<string, string> = {
  savings: '🏦', current: '🏛️', credit_card: '💳', e_wallet: '📱', digital_bank: '🔷',
};

export default function AccountsPage() {
  const qc = useQueryClient();
  const { balanceVisible } = useUiStore();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const { register, handleSubmit, control, reset } = useForm();
  const { register: editReg, handleSubmit: editSubmit, control: editCtrl, reset: editReset } = useForm();

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts').then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/accounts', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setOpen(false); reset();
      toast.success('Account added!');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: any) => api.put(`/accounts/${id}`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setEditOpen(false);
      toast.success('Account updated');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/accounts/${id}/archive`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Account archived');
    },
  });

  const openEdit = (acc: any) => {
    setSelectedAccount(acc);
    editReset({
      nickname: acc.nickname,
      bank_name: acc.bank_name,
      account_type: acc.account_type,
      last_four_digits: acc.last_four_digits ?? '',
      color: acc.color ?? '#6366f1',
    });
    setEditOpen(true);
  };

  const balance = (v: number) => balanceVisible ? formatRM(v) : 'RM •••••';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Bank Accounts</h2>
          <p className="text-slate-400 text-sm mt-1">{accounts.length} account{accounts.length !== 1 ? 's' : ''} active</p>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
              <Plus size={16} /> Add Account
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-slate-900 border-slate-800 text-white w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="text-white">Add Bank Account</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4 mt-6">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Nickname</Label>
                <Input {...register('nickname', { required: true })} placeholder='e.g. "Maybank Savings"'
                  className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Bank Name</Label>
                <Controller name="bank_name" control={control} rules={{ required: true }} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      {BANK_NAMES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Account Type</Label>
                <Controller name="account_type" control={control} rules={{ required: true }} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      {ACCOUNT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Last 4 Digits (optional)</Label>
                <Input {...register('last_four_digits')} placeholder="1234" maxLength={4}
                  className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Initial Balance (RM)</Label>
                <Input {...register('initial_balance', { required: true, valueAsNumber: true })} type="number" step="0.01" placeholder="0.00"
                  className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Color Tag</Label>
                <div className="flex flex-wrap gap-2">
                  {ACCOUNT_COLORS.map((c) => (
                    <label key={c} className="cursor-pointer">
                      <input type="radio" {...register('color')} value={c} className="sr-only peer" />
                      <span className="w-7 h-7 rounded-full block border-2 border-transparent peer-checked:border-white peer-checked:scale-110 hover:scale-105 active:scale-95 transition-all duration-200" style={{ background: c }} />
                    </label>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Adding…' : 'Add Account'}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-20">
          <CreditCard size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 text-lg font-medium">No accounts yet</p>
          <p className="text-slate-500 text-sm mt-1">Add your first bank account to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc: any) => (
            <Card key={acc.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all overflow-hidden group">
              <div className="h-1.5" style={{ background: acc.color ?? '#6366f1' }} />
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-lg font-bold text-white">{acc.nickname}</p>
                    <p className="text-xs text-slate-400">{acc.bank_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{TYPE_ICONS[acc.account_type] ?? '🏦'}</span>
                    <Link href={`/accounts/${acc.id}`} className="text-slate-500 hover:text-indigo-400 transition-colors" title="View details">
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                </div>
                <p className="text-2xl font-bold text-white mb-1">{balance(acc.current_balance)}</p>
                {acc.last_four_digits && (
                  <p className="text-xs text-slate-500">•••• {acc.last_four_digits}</p>
                )}
                <div className="flex gap-2 mt-4 items-center">
                  <Badge variant="outline" className="text-slate-400 border-slate-700 text-xs capitalize">
                    {acc.account_type.replace('_', ' ')}
                  </Badge>
                  <button
                    onClick={() => openEdit(acc)}
                    className="ml-auto text-slate-500 hover:text-indigo-400 transition-colors"
                    title="Edit account"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => archiveMutation.mutate(acc.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                    title="Archive account"
                  >
                    <Archive size={14} />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Account Sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="bg-slate-900 border-slate-800 text-white w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-white">Edit Account</SheetTitle>
          </SheetHeader>
          <form onSubmit={editSubmit((d) => updateMutation.mutate({ id: selectedAccount?.id, ...d }))} className="space-y-4 mt-6">
            <div className="space-y-1.5">
              <Label className="text-slate-300">Nickname</Label>
              <Input {...editReg('nickname', { required: true })} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Bank Name</Label>
              <Controller name="bank_name" control={editCtrl} rules={{ required: true }} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    {BANK_NAMES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Account Type</Label>
              <Controller name="account_type" control={editCtrl} rules={{ required: true }} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    {ACCOUNT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Last 4 Digits (optional)</Label>
              <Input {...editReg('last_four_digits')} maxLength={4} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Color Tag</Label>
              <div className="flex flex-wrap gap-2">
                {ACCOUNT_COLORS.map((c) => (
                  <label key={c} className="cursor-pointer">
                    <input type="radio" {...editReg('color')} value={c} className="sr-only peer" />
                    <span className="w-7 h-7 rounded-full block border-2 border-transparent peer-checked:border-white peer-checked:scale-110 transition-all" style={{ background: c }} />
                  </label>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
