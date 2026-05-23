'use client';

export const dynamic = 'force-dynamic';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api';
import { formatRM, formatDate } from '@/lib/formatters';
import { useUiStore } from '@/store/uiStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { Plus, Play, Pause, Calendar, PowerOff, Pencil } from 'lucide-react';
import ConfirmDialog from '@/components/common/ConfirmDialog';

export default function RecurringPage() {
  const qc = useQueryClient();
  const { balanceVisible } = useUiStore();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const { register, handleSubmit, control, reset, watch } = useForm({
    defaultValues: {
      type: 'expense', name: '', default_amount: '', category_id: '', account_id: '',
      frequency: 'monthly', scheduled_day: '', start_date: new Date().toISOString().split('T')[0],
      end_date: '', remarks: '',
    }
  });

  const { register: editReg, handleSubmit: editSubmit, control: editCtrl, reset: editReset, watch: editWatch } = useForm();
  const editFrequency = editWatch('frequency');

  const frequency = watch('frequency');
  const type = watch('type');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['recurring-templates'],
    queryFn: () => api.get('/recurring').then((r) => r.data.data ?? []),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts').then((r) => r.data.data),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data.data ?? []),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/recurring', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring-templates'] });
      setOpen(false); reset();
      toast.success('Recurring template created!');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: (d: any) => api.put(`/recurring/${selectedTemplate?.id}`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring-templates'] });
      setEditOpen(false);
      toast.success('Template updated');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
  });

  const pauseMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/recurring/${id}/pause`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recurring-templates'] }); toast.success('Template paused'); },
  });

  const resumeMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/recurring/${id}/resume`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recurring-templates'] }); toast.success('Template activated'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/recurring/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring-templates'] });
      setDeleteOpen(false);
      toast.success('Template ended');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
  });

  const openEdit = (t: any) => {
    setSelectedTemplate(t);
    editReset({
      name: t.name, default_amount: t.default_amount,
      category_id: t.category_id?.toString() ?? '', account_id: t.account_id?.toString() ?? '',
      frequency: t.frequency, scheduled_day: t.scheduled_day?.toString() ?? '',
      end_date: t.end_date ?? '', remarks: t.remarks ?? '',
    });
    setEditOpen(true);
  };

  const balance = (v: number) => balanceVisible ? formatRM(v) : 'RM •••••';

  const onSubmit = (d: any) => {
    const payload: any = {
      ...d, default_amount: parseFloat(d.default_amount),
      account_id: parseInt(d.account_id), next_due_date: d.start_date,
    };
    if (d.category_id) payload.category_id = parseInt(d.category_id);
    if (d.frequency === 'monthly' && d.scheduled_day) payload.scheduled_day = parseInt(d.scheduled_day);
    else delete payload.scheduled_day;
    if (!d.end_date) delete payload.end_date;
    createMutation.mutate(payload);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Recurring Transactions</h2>
          <p className="text-slate-400 text-sm mt-1">Manage templates for bills, subscriptions, or salaries</p>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
              <Plus size={16} /> Add Template
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-slate-900 border-slate-800 text-white w-full sm:max-w-md overflow-y-auto">
            <SheetHeader><SheetTitle className="text-white">Create Recurring Template</SheetTitle></SheetHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Transaction Type</Label>
                <Controller name="type" control={control} rules={{ required: true }} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Template Name</Label>
                <Input {...register('name', { required: true })} placeholder="e.g. TNB Electricity Bill" className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Default Amount (RM)</Label>
                <Input {...register('default_amount', { required: true })} type="number" step="0.01" placeholder="0.00" className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Category</Label>
                <Controller name="category_id" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value?.toString()}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      {categories.filter((c: any) => c.type === type).map((c: any) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.parent ? `${c.parent.name} → ` : ''}{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Bank Account</Label>
                <Controller name="account_id" control={control} rules={{ required: true }} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value?.toString()}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select bank account" /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      {accounts.map((a: any) => <SelectItem key={a.id} value={a.id.toString()}>{a.nickname}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Frequency</Label>
                  <Controller name="frequency" control={control} rules={{ required: true }} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                </div>
                {frequency === 'monthly' && (
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Scheduled Day</Label>
                    <Input {...register('scheduled_day', { min: 1, max: 31 })} type="number" placeholder="e.g. 25" className="bg-slate-800 border-slate-700 text-white" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Start Date</Label>
                  <Input {...register('start_date', { required: true })} type="date" className="bg-slate-800 border-slate-700 text-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">End Date (optional)</Label>
                  <Input {...register('end_date')} type="date" className="bg-slate-800 border-slate-700 text-white" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Remarks (optional)</Label>
                <Textarea {...register('remarks')} placeholder="Add notes here..." className="bg-slate-800 border-slate-700 text-white" rows={2} />
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create Template'}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800 py-16 text-center">
            <CardContent>
              <p className="font-semibold text-slate-300">No recurring templates yet</p>
              <p className="text-sm text-slate-500 mt-1">Add templates to automate pending transactions generation</p>
            </CardContent>
          </Card>
        ) : (
          templates.map((t: any) => (
            <Card key={t.id} className="bg-slate-900 border-slate-800 hover:border-slate-700/60 transition-all">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg shrink-0 ${t.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {t.type === 'income' ? '💰' : '💸'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-white text-sm sm:text-base">{t.name}</h4>
                      <Badge variant="outline" className={`text-[10px] uppercase font-semibold border-slate-700 ${
                        t.status === 'active' ? 'text-green-400 border-green-500/20 bg-green-500/5' :
                        t.status === 'paused' ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5' : 'text-slate-500'
                      }`}>{t.status}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {t.category?.name ?? 'No Category'} · {t.account?.nickname} · <span className="capitalize">{t.frequency}</span>
                      {t.scheduled_day ? ` (day ${t.scheduled_day})` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800/80">
                  <div>
                    <span className="text-lg sm:text-xl font-black text-white">{balance(t.default_amount)}</span>
                    <span className="text-[10px] text-slate-500 capitalize block text-right">{t.frequency}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <div className="text-xs text-slate-500 flex items-center gap-1 bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-800">
                    <Calendar size={13} />
                    <span>Next: {formatDate(t.next_due_date)}</span>
                  </div>

                  <button
                    onClick={() => openEdit(t)}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
                    title="Edit template"
                  >
                    <Pencil size={14} />
                  </button>

                  {t.status === 'active' ? (
                    <button onClick={() => pauseMutation.mutate(t.id)} className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-yellow-400 hover:border-yellow-500/30 transition-all" title="Pause template">
                      <Pause size={14} />
                    </button>
                  ) : t.status === 'paused' ? (
                    <button onClick={() => resumeMutation.mutate(t.id)} className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-green-400 hover:border-green-500/30 transition-all" title="Activate template">
                      <Play size={14} />
                    </button>
                  ) : null}

                  {t.status !== 'ended' && (
                    <button
                      onClick={() => { setSelectedTemplate(t); setDeleteOpen(true); }}
                      className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all"
                      title="End template"
                    >
                      <PowerOff size={14} />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Template Sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="bg-slate-900 border-slate-800 text-white w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle className="text-white">Edit Template</SheetTitle></SheetHeader>
          <form onSubmit={editSubmit((d) => {
            const payload: any = { ...d, default_amount: parseFloat(d.default_amount), account_id: parseInt(d.account_id) };
            if (d.category_id) payload.category_id = parseInt(d.category_id);
            if (d.frequency === 'monthly' && d.scheduled_day) payload.scheduled_day = parseInt(d.scheduled_day);
            if (!d.end_date) delete payload.end_date;
            updateMutation.mutate(payload);
          })} className="space-y-4 mt-6">
            <div className="space-y-1.5">
              <Label className="text-slate-300">Name</Label>
              <Input {...editReg('name', { required: true })} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Default Amount (RM)</Label>
              <Input {...editReg('default_amount', { required: true })} type="number" step="0.01" className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Account</Label>
              <Controller name="account_id" control={editCtrl} rules={{ required: true }} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value?.toString()}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    {accounts.map((a: any) => <SelectItem key={a.id} value={a.id.toString()}>{a.nickname}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Frequency</Label>
                <Controller name="frequency" control={editCtrl} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
              {editFrequency === 'monthly' && (
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Day of Month</Label>
                  <Input {...editReg('scheduled_day')} type="number" min={1} max={31} className="bg-slate-800 border-slate-700 text-white" />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">End Date (optional)</Label>
              <Input {...editReg('end_date')} type="date" className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Remarks</Label>
              <Textarea {...editReg('remarks')} className="bg-slate-800 border-slate-700 text-white" rows={2} />
            </div>
            <p className="text-xs text-slate-500">Type: <span className="capitalize text-slate-400">{selectedTemplate?.type}</span> (cannot change)</p>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleteOpen}
        title="End recurring template?"
        description="This will permanently stop future transactions from being generated."
        onConfirm={() => deleteMutation.mutate(selectedTemplate?.id)}
        onCancel={() => setDeleteOpen(false)}
        confirmLabel="End Template"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
